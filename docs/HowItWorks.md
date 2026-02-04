# Как работи E-Pharma приложението

## 1. Стартиране на приложението

Когато изпълниш `dotnet run`, се случва следното:

**Program.cs** се изпълнява:
```
1. Създава се WebApplicationBuilder
2. Регистрират се услугите (Services) в DI контейнера
3. Конфигурира се JWT автентикация
4. Конфигурира се базата данни с Entity Framework Core
5. Стартира се уеб сървърът
```

---

## 2. Потребител праща заявка (HTTP Request)

Например: `POST /api/Auth/token` с тяло:
```json
{
  "username": "admin",
  "password": "123456"
}
```

---

## 3. Маршрутизация (Routing)

ASP.NET Core вижда URL-а и намира съответния контролер:

```
/api/Auth/token  →  AuthController  →  метод GetToken()
```

Атрибутите определят маршрута:
- `[Route("api/[controller]")]` → `/api/Auth`
- `[HttpPost("token")]` → `/api/Auth/token`

---

## 4. DTO (Data Transfer Object)

**Какво е DTO?** - Обект за пренос на данни между клиент и сървър.

Заявката се десериализира в DTO:
```csharp
// Dtos/Auth/UserLoginDto.cs
public record UserLoginDto(string Username, string Password);
```

**Защо DTO, а не директно Entity?**
- Скриваме вътрешната структура на базата
- Валидираме входните данни
- Изпращаме само нужните полета

---

## 5. FluentValidation

Преди контролерът да получи данните, **валидаторът** ги проверява:

```csharp
public class CreateUserDtoValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserDtoValidator()
    {
        RuleFor(x => x.Username).NotEmpty().WithMessage("Username is required");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
    }
}
```

Ако валидацията не мине → връща се **400 Bad Request** с грешките.

---

## 6. Controller (Контролер)

Контролерът обработва заявката:

```csharp
[HttpPost("token")]
public async Task<IActionResult> GetToken([FromBody] UserLoginDto dto)
{
    // 1. Извиква Service за да вземе потребителя
    var user = await _userService.GetByUsername(dto.Username);
    
    // 2. Проверява паролата
    var hasher = new PasswordHasher<User>();
    var verify = hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
    
    // 3. Генерира JWT токен
    var token = _tokenService.CreateToken(user);
    
    // 4. Връща отговор
    return Ok(new AuthResponseDto { Token = token, ... });
}
```

---

## 7. Service (Услуга)

**Услугата** съдържа бизнес логиката и работи с базата:

```csharp
public class UserService
{
    private readonly ApplicationDbContext _db;

    public async Task<User?> GetByUsername(string username)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task Save(User user)
    {
        if (user.Id == 0)
        {
            _db.Users.Add(user);      // INSERT
        }
        else
        {
            _db.Users.Update(user);   // UPDATE
        }
        await _db.SaveChangesAsync();
    }
}
```

---

## 8. Entity Framework Core & Database

**Entity** - представлява таблица в базата:

```csharp
// Entities/User.cs
public class User : BaseEntity
{
    public string Username { get; set; }
    public string PasswordHash { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public UserRoles Role { get; set; }
}
```

**DbContext** - връзката с базата данни:

```csharp
public class ApplicationDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Order> Orders { get; set; }
    // ...
}
```

**Как работи EF Core:**
```
C# код                    →    SQL заявка
─────────────────────────────────────────────
_db.Users.FindAsync(1)    →    SELECT * FROM Users WHERE Id = 1
_db.Users.Add(user)       →    INSERT INTO Users VALUES (...)
_db.SaveChangesAsync()    →    Изпълнява всички промени в базата
```

---

## 9. JWT (JSON Web Token)

**Какво е JWT?** - Токен за автентикация, който клиентът изпраща с всяка заявка.

```
JWT структура:
┌─────────────────────────────────────────────────┐
│ Header.Payload.Signature                        │
│                                                 │
│ Header:    { "alg": "HS256", "typ": "JWT" }    │
│ Payload:   { "sub": "5", "role": "Admin", ... }│
│ Signature: HMACSHA256(header + payload, secret)│
└─────────────────────────────────────────────────┘
```

**TokenService** генерира токена:

```csharp
public string CreateToken(User user)
{
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Role, user.Role.ToString())
    };
    
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
    var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    
    var token = new JwtSecurityToken(
        issuer: "epharmacy",
        audience: "epharmacy_clients",
        claims: claims,
        expires: DateTime.UtcNow.AddHours(1),
        signingCredentials: credentials
    );
    
    return new JwtSecurityTokenHandler().WriteToken(token);
}
```

---

## 10. Пълен поток (Full Flow)

```
┌──────────────────────────────────────────────────────────────────────┐
│                         КЛИЕНТ (Frontend)                            │
│  POST /api/User  { username: "ivan", password: "123456", ... }      │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         ВАЛИДАЦИЯ                                    │
│  FluentValidation проверява: Username не е празен? Password >= 6?   │
│  ❌ Грешка → 400 Bad Request                                        │
│  ✅ Успех → продължава                                              │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         CONTROLLER                                   │
│  UserController.Create(CreateUserDto dto)                           │
│  - Проверява дали username съществува                               │
│  - Хешира паролата                                                  │
│  - Извиква Service                                                  │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         SERVICE                                      │
│  UserService.Save(user)                                             │
│  - Добавя user в DbContext                                          │
│  - Извиква SaveChangesAsync()                                       │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    ENTITY FRAMEWORK CORE                             │
│  Превежда C# в SQL:                                                 │
│  INSERT INTO Users (Username, PasswordHash, ...) VALUES (...)       │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         DATABASE                                     │
│  SQL Server изпълнява заявката                                      │
│  Записва нов ред в таблица Users                                    │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         RESPONSE                                     │
│  201 Created                                                        │
│  { "id": 5, "username": "ivan", "firstName": "Иван", ... }         │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 11. Защитени ендпойнти (Authorization)

```csharp
[HttpGet]
[Authorize(Roles = "Administrator")]  // Само админи!
public async Task<IActionResult> GetAll()
{
    // ...
}
```

Клиентът трябва да прати токена в header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

ASP.NET Core:
1. Декодира токена
2. Проверява подписа (валиден ли е?)
3. Проверява изтичането (не е ли изтекъл?)
4. Проверява ролята (Administrator ли е?)
5. ✅ Пуска заявката или ❌ връща 401/403

---

## 12. Структура на проекта

```
E-Pharma/
├── EPharmacy.Common/           # Споделен код
│   ├── Entities/               # Модели на базата данни
│   │   ├── User.cs
│   │   ├── Product.cs
│   │   ├── Order.cs
│   │   └── ...
│   ├── Enums/                  # Изброими типове
│   │   ├── UserRoles.cs
│   │   └── OrderStatus.cs
│   ├── Persistence/            # База данни
│   │   └── ApplicationDbContext.cs
│   └── Services/               # Бизнес логика
│       ├── UserService.cs
│       ├── ProductService.cs
│       └── ...
│
├── EPharmacyAPI/               # Web API
│   ├── Controllers/            # HTTP ендпойнти
│   │   ├── AuthController.cs
│   │   ├── UserController.cs
│   │   ├── ProductsController.cs
│   │   └── ...
│   ├── Dtos/                   # Data Transfer Objects
│   │   ├── Auth/
│   │   ├── Users/
│   │   └── ...
│   ├── Validators/             # FluentValidation
│   │   ├── UserValidators.cs
│   │   └── ...
│   ├── Services/               # JWT услуги
│   │   ├── ITokenService.cs
│   │   └── TokenService.cs
│   └── Program.cs              # Входна точка
│
└── EPharmacy.Frontend/         # React приложение
    └── src/
        ├── components/
        └── services/
```

---

## 13. Връзки между Entities (Relations)

```
User (1) ←──────── (N) Order
                        │
                        │ (1)
                        ▼
                   OrderItem (N)
                        │
                        │ (1)
                        ▼
                    Product (N)
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    Brand (1)    Category (N:N)   ProductIngredient (N)
                                        │
                                        │ (1)
                                        ▼
                                   Ingredient
```

---

## 14. Полезни команди

```bash
# Стартиране на API
cd EPharmacyAPI
dotnet run

# Стартиране на Frontend
cd EPharmacy.Frontend
npm run dev

# Миграции на базата
dotnet ef migrations add MigrationName
dotnet ef database update

# Build
dotnet build
```
