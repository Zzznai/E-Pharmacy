import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { orderService } from '../services/orderService';
import { userService } from '../services/userService';
import { ingredientService } from '../services/ingredientService';
import { authService } from '../services/authService';
import './UserDashboard.css';

// Base color palette for categories (same as CategoryManagement)
const baseColors = [
  { h: 262, s: 83, l: 58 },  // Purple
  { h: 217, s: 91, l: 60 },  // Blue
  { h: 142, s: 71, l: 45 },  // Green
  { h: 25, s: 95, l: 53 },   // Orange
  { h: 330, s: 81, l: 60 },  // Pink
  { h: 199, s: 89, l: 48 },  // Cyan
  { h: 271, s: 91, l: 65 },  // Violet
  { h: 48, s: 96, l: 53 },   // Yellow
  { h: 0, s: 84, l: 60 },    // Red
  { h: 174, s: 84, l: 40 },  // Teal
];

// Generate color based on category id
const getCategoryColor = (category) => {
  const base = baseColors[category.id % baseColors.length];
  return `hsl(${base.h}, ${base.s}%, ${base.l}%)`;
};

function UserDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState([]);
  
  // Basket
  const [basket, setBasket] = useState([]);
  const [showBasket, setShowBasket] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  
  // Profile
  const [showProfile, setShowProfile] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  
  // Product Detail Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Ingredient Detail Modal
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [loadingIngredient, setLoadingIngredient] = useState(false);
  
  // Forms
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [deliveryForm, setDeliveryForm] = useState({
    address: '',
    city: '',
    province: '',
    postalCode: '',
    phoneNumber: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
    loadBasketFromStorage();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        productService.getAll(),
        categoryService.getAll()
      ]);
      // Show all products (including prescription-required ones)
      setProducts(productsData);
      setCategories(categoriesData);
      
      // Get user info only if authenticated (token valid and not expired)
      const token = authService.getToken();
      if (token) {
        try {
          const userData = await userService.getProfile();
          setUserInfo(userData);
          setProfileForm({ firstName: userData.firstName || '', lastName: userData.lastName || '' });
        } catch (err) {
          console.error('Failed to get user info:', err);
          // If API call fails (e.g., 401), clear auth state
          authService.logout();
          setUserInfo(null);
        }
      } else {
        // No valid token, ensure user info is cleared
        setUserInfo(null);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBasketFromStorage = () => {
    const saved = localStorage.getItem('basket');
    if (saved) {
      setBasket(JSON.parse(saved));
    }
  };

  const saveBasketToStorage = (newBasket) => {
    localStorage.setItem('basket', JSON.stringify(newBasket));
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = !selectedCategory;
    if (selectedCategory && product.categoryIds) {
      matchesCategory = product.categoryIds.includes(parseInt(selectedCategory));
    }
    
    return matchesSearch && matchesCategory;
  });

  const addToBasket = (product) => {
    const existing = basket.find(item => item.productId === product.id);
    const currentQty = existing ? existing.quantity : 0;
    
    // Check if we have enough stock
    if (currentQty >= product.availableQuantity) {
      showToast(`Sorry, only ${product.availableQuantity} available in stock!`, 'error');
      return;
    }
    
    let newBasket;
    
    if (existing) {
      newBasket = basket.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newBasket = [...basket, {
        productId: product.id,
        name: product.name,
        price: product.price,
        photoUrl: product.photoUrl,
        quantity: 1,
        availableQuantity: product.availableQuantity
      }];
    }
    
    setBasket(newBasket);
    saveBasketToStorage(newBasket);
    showToast(`${product.name} added to basket!`);
  };

  const updateQuantity = (productId, delta) => {
    const item = basket.find(i => i.productId === productId);
    if (!item) return;
    
    const newQty = item.quantity + delta;
    
    // Check stock limit when increasing
    if (delta > 0) {
      const product = products.find(p => p.id === productId);
      if (product && newQty > product.availableQuantity) {
        showToast(`Sorry, only ${product.availableQuantity} available in stock!`, 'error');
        return;
      }
    }
    
    const newBasket = basket.map(basketItem => {
      if (basketItem.productId === productId) {
        return newQty > 0 ? { ...basketItem, quantity: newQty } : null;
      }
      return basketItem;
    }).filter(Boolean);
    
    setBasket(newBasket);
    saveBasketToStorage(newBasket);
  };

  const removeFromBasket = (productId) => {
    const newBasket = basket.filter(item => item.productId !== productId);
    setBasket(newBasket);
    saveBasketToStorage(newBasket);
  };

  const clearBasket = () => {
    setBasket([]);
    localStorage.removeItem('basket');
  };

  const basketTotal = basket.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const basketCount = basket.reduce((sum, item) => sum + item.quantity, 0);

  const showToast = (text, type = 'success') => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const fetchUserOrders = async () => {
    try {
      const orders = await orderService.getMyOrders();
      setUserOrders(orders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await userService.updateProfile(profileForm);
      setUserInfo({ ...userInfo, ...profileForm });
      showToast('Profile updated successfully!');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }
    try {
      setSubmitting(true);
      await userService.changeMyPassword(passwordForm.currentPassword, passwordForm.newPassword);
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password changed successfully!');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (basket.length === 0) return;
    
    try {
      setSubmitting(true);
      const orderData = {
        items: basket.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        deliveryAddress: deliveryForm.address,
        city: deliveryForm.city,
        province: deliveryForm.province,
        postalCode: deliveryForm.postalCode,
        phoneNumber: deliveryForm.phoneNumber
      };
      
      await orderService.create(orderData);
      clearBasket();
      setShowCheckout(false);
      setShowBasket(false);
      setDeliveryForm({ address: '', city: '', province: '', postalCode: '', phoneNumber: '' });
      showToast('Order placed successfully! 🎉');
      
      // Refresh products to get updated stock quantities
      const updatedProducts = await productService.getAll();
      setProducts(updatedProducts);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUserInfo(null);
    setBasket([]);
    setShowProfile(false);
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#fde047';
      case 'processing': return '#60a5fa';
      case 'shipped': return '#c084fc';
      case 'delivered': return '#4ade80';
      case 'cancelled': return '#f87171';
      default: return '#9ca3af';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get category name
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === parseInt(categoryId));
    return category ? category.name : '';
  };

  // Handle ingredient click to show details
  const handleIngredientClick = async (ingredientId) => {
    try {
      setLoadingIngredient(true);
      const ingredient = await ingredientService.getById(ingredientId);
      setSelectedIngredient(ingredient);
    } catch (err) {
      showToast('Failed to load ingredient details', 'error');
    } finally {
      setLoadingIngredient(false);
    }
  };

  if (loading) {
    return (
      <div className="user-dashboard">
        <div className="loading-screen">
          <div className="loader"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      {/* Toast Message */}
      {message.text && (
        <div className={`toast ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="logo">
            <span className="logo-icon"></span>
            E-Pharma
          </h1>
        </div>
        
        <div className="header-center">
          <div className="search-box">
            <span className="search-icon"></span>
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-btn" onClick={() => setSearchTerm('')}>×</button>
            )}
          </div>
          
          <div className="category-dropdown">
            <button 
              className="category-btn"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <span className="folder-icon"></span>
              {selectedCategory ? categories.find(c => c.id === parseInt(selectedCategory))?.name : 'All Categories'}
              <span className="arrow">▼</span>
            </button>
            {showCategoryDropdown && (
              <div className="dropdown-menu">
                <div 
                  className={`dropdown-item ${!selectedCategory ? 'active' : ''}`}
                  onClick={() => { setSelectedCategory(''); setShowCategoryDropdown(false); }}
                >
                  <span className="category-dot" style={{ background: '#a78bfa' }}></span>
                  All Categories
                </div>
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    className={`dropdown-item ${selectedCategory === cat.id.toString() ? 'active' : ''}`}
                    onClick={() => { setSelectedCategory(cat.id.toString()); setShowCategoryDropdown(false); }}
                  >
                    <span 
                      className="category-dot" 
                      style={{ background: getCategoryColor(cat) }}
                    ></span>
                    {cat.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="header-right">
          {userInfo && (
            <button className="icon-btn basket-btn" onClick={() => setShowBasket(true)}>
              <span className="cart-icon"></span>
              {basketCount > 0 && <span className="badge">{basketCount}</span>}
            </button>
          )}
          
          {userInfo ? (
            <button className="icon-btn profile-btn" onClick={() => { setShowProfile(true); fetchUserOrders(); }}>
              <span className="profile-icon"></span>
            </button>
          ) : (
            <button className="login-btn" onClick={() => navigate('/login')}>
              Login
            </button>
          )}
        </div>
      </header>

      {/* Category Banner - Show when category is selected */}
      {selectedCategory && (
        <div className="category-banner">
          <div className="category-path">
            <span className="current-category">{getCategoryName(selectedCategory)}</span>
          </div>
          <button 
            className="clear-filter-btn"
            onClick={() => setSelectedCategory('')}
          >
            ✕ Clear Filter
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="products-header">
          <h2>{selectedCategory ? `Products in ${categories.find(c => c.id === parseInt(selectedCategory))?.name}` : 'Available Products'}</h2>
          <span className="product-count">{filteredProducts.length} products found</span>
        </div>
        
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className={`product-card ${product.isPrescriptionRequired ? 'prescription-product' : ''} ${product.availableQuantity === 0 ? 'out-of-stock' : ''} clickable`}
              onClick={() => setSelectedProduct(product)}
            >
              <div className="product-image">
                {product.photoUrl ? (
                  <img src={product.photoUrl} alt={product.name} />
                ) : (
                  <div className="no-image"><div className="pill-icon"></div></div>
                )}
                {product.isPrescriptionRequired && (
                  <div className="prescription-badge">Pr</div>
                )}
                {product.availableQuantity === 0 && !product.isPrescriptionRequired && (
                  <div className="out-of-stock-badge">Out of Stock</div>
                )}
                <div className="view-details-hint">Click for details</div>
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description?.substring(0, 60)}...</p>
                <div className="product-footer">
                  <span className="product-price">{formatCurrency(product.price)}</span>
                  {userInfo && (
                    <button 
                      className={`add-to-cart-btn ${product.isPrescriptionRequired || product.availableQuantity === 0 ? 'disabled' : ''}`}
                      onClick={(e) => { e.stopPropagation(); addToBasket(product); }}
                      disabled={product.isPrescriptionRequired || product.availableQuantity === 0}
                      title={product.isPrescriptionRequired ? 'Prescription required - cannot order online' : product.availableQuantity === 0 ? 'Out of stock' : 'Add to basket'}
                    >
                      {product.isPrescriptionRequired ? 'Pr Only' : product.availableQuantity === 0 ? 'Out of Stock' : '+ Add'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="no-products">
            <div className="search-empty-icon"></div>
            <p>No products found</p>
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Product Details</h2>
              <button className="modal-close" onClick={() => setSelectedProduct(null)}>×</button>
            </div>
            <div className="modal-body detail-body">
              <div className="detail-image-section">
                {selectedProduct.photoUrl ? (
                  <img src={selectedProduct.photoUrl} alt={selectedProduct.name} className="detail-image" />
                ) : (
                  <div className="detail-no-image">
                    <span>💊</span>
                  </div>
                )}
              </div>
              <div className="detail-info-section">
                <h3 className="detail-name">{selectedProduct.name}</h3>
                {selectedProduct.brandName && (
                  <p className="detail-brand">Brand: {selectedProduct.brandName}</p>
                )}
                <div className="detail-price">{formatCurrency(selectedProduct.price)}</div>
                
                {selectedProduct.isPrescriptionRequired && (
                  <div className="detail-prescription">
                    <span className="rx-badge">Pr</span> Prescription Required
                  </div>
                )}

                {selectedProduct.description && (
                  <div className="detail-description">
                    <h4>Description</h4>
                    <p>{selectedProduct.description}</p>
                  </div>
                )}

                {selectedProduct.categoryIds && selectedProduct.categoryIds.length > 0 && (
                  <div className="detail-categories">
                    <h4>Categories</h4>
                    <div className="category-tags">
                      {selectedProduct.categoryIds.map(catId => {
                        const cat = categories.find(c => c.id === catId);
                        return cat ? (
                          <span key={catId} className="category-tag">{cat.name}</span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 && (
                  <div className="detail-ingredients">
                    <h4>Ingredients</h4>
                    <div className="ingredient-tags">
                      {selectedProduct.ingredients.map((ing, index) => (
                        <span 
                          key={index} 
                          className="ingredient-detail-tag clickable"
                          onClick={(e) => { e.stopPropagation(); handleIngredientClick(ing.ingredientId); }}
                          title="Click to see ingredient details"
                        >
                          {ing.name} - {ing.amount} {ing.unit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              {selectedProduct.isPrescriptionRequired ? (
                <div className="prescription-notice">
                  <span className="notice-icon">⚕️</span>
                  This product requires a prescription. Please visit our pharmacy in person.
                </div>
              ) : userInfo ? (
                <button 
                  className="submit-btn"
                  onClick={() => { addToBasket(selectedProduct); setSelectedProduct(null); }}
                >
                  + Add to Basket
                </button>
              ) : (
                <div className="login-notice">
                  <span className="notice-icon">🔐</span>
                  Please log in to add items to your basket.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ingredient Detail Modal */}
      {selectedIngredient && (
        <div className="modal-overlay" onClick={() => setSelectedIngredient(null)}>
          <div className="modal-content ingredient-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ingredient Details</h2>
              <button className="modal-close" onClick={() => setSelectedIngredient(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="ingredient-detail-content">
                <div className="ingredient-icon">💊</div>
                <h3 className="ingredient-name">{selectedIngredient.name}</h3>
                
                {selectedIngredient.isActiveSubstance && (
                  <div className="active-substance-badge">
                    <span className="badge-icon">⚡</span>
                    Active Substance
                  </div>
                )}
                
                <div className="ingredient-description-section">
                  <h4>Description</h4>
                  <p>{selectedIngredient.description || 'No description available for this ingredient.'}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setSelectedIngredient(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay for ingredient */}
      {loadingIngredient && (
        <div className="modal-overlay">
          <div className="loading-ingredient">
            <div className="loader"></div>
            <p>Loading ingredient details...</p>
          </div>
        </div>
      )}

      {/* Basket Sidebar */}
      {showBasket && (
        <div className="sidebar-overlay" onClick={() => setShowBasket(false)}>
          <div className="sidebar basket-sidebar" onClick={e => e.stopPropagation()}>
            <div className="sidebar-header">
              <h2><span className="header-cart-icon"></span> Your Basket</h2>
              <button className="close-btn" onClick={() => setShowBasket(false)}>×</button>
            </div>
            
            {basket.length === 0 ? (
              <div className="empty-basket">
                <div className="empty-cart-icon"></div>
                <p>Your basket is empty</p>
              </div>
            ) : (
              <>
                <div className="basket-items">
                  {basket.map(item => (
                    <div key={item.productId} className="basket-item">
                      <div className="item-image">
                        {item.photoUrl ? (
                          <img src={item.photoUrl} alt={item.name} />
                        ) : (
                          <div className="no-image-small"></div>
                        )}
                      </div>
                      <div className="item-details">
                        <h4>{item.name}</h4>
                        <p className="item-price">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="item-quantity">
                        <button onClick={() => updateQuantity(item.productId, -1)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, 1)}>+</button>
                      </div>
                      <button className="remove-btn" onClick={() => removeFromBasket(item.productId)}></button>
                    </div>
                  ))}
                </div>
                
                <div className="basket-footer">
                  <div className="basket-total">
                    <span>Total:</span>
                    <span className="total-amount">{formatCurrency(basketTotal)}</span>
                  </div>
                  <button className="checkout-btn" onClick={() => setShowCheckout(true)}>
                    Proceed to Checkout →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="modal checkout-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><span className="package-icon"></span> Delivery Details</h2>
              <button className="close-btn" onClick={() => setShowCheckout(false)}>×</button>
            </div>
            
            <form onSubmit={handleCheckout}>
              <div className="form-group">
                <label>Delivery Address</label>
                <input
                  type="text"
                  value={deliveryForm.address}
                  onChange={(e) => setDeliveryForm({...deliveryForm, address: e.target.value})}
                  placeholder="Street address"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={deliveryForm.city}
                    onChange={(e) => setDeliveryForm({...deliveryForm, city: e.target.value})}
                    placeholder="City"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Province</label>
                  <input
                    type="text"
                    value={deliveryForm.province}
                    onChange={(e) => setDeliveryForm({...deliveryForm, province: e.target.value})}
                    placeholder="Province"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    value={deliveryForm.postalCode}
                    onChange={(e) => setDeliveryForm({...deliveryForm, postalCode: e.target.value})}
                    placeholder="Postal code"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={deliveryForm.phoneNumber}
                    onChange={(e) => setDeliveryForm({...deliveryForm, phoneNumber: e.target.value})}
                    placeholder="Phone number"
                    required
                  />
                </div>
              </div>
              
              <div className="order-summary">
                <h3>Order Summary</h3>
                {basket.map(item => (
                  <div key={item.productId} className="summary-item">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="summary-total">
                  <span>Total</span>
                  <span>{formatCurrency(basketTotal)}</span>
                </div>
              </div>
              
              <button type="submit" className="place-order-btn" disabled={submitting}>
                {submitting ? 'Placing Order...' : `Place Order - ${formatCurrency(basketTotal)}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Profile Sidebar */}
      {showProfile && (
        <div className="sidebar-overlay" onClick={() => setShowProfile(false)}>
          <div className="sidebar profile-sidebar" onClick={e => e.stopPropagation()}>
            <div className="sidebar-header">
              <h2><span className="header-profile-icon"></span> My Profile</h2>
              <button className="close-btn" onClick={() => setShowProfile(false)}>×</button>
            </div>
            
            <div className="profile-content">
              {/* User Info */}
              <div className="profile-section">
                <h3>Personal Information</h3>
                <form onSubmit={handleProfileUpdate}>
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                      placeholder="First name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                      placeholder="Last name"
                    />
                  </div>
                  <button type="submit" className="save-btn" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
                
                <button className="change-password-btn" onClick={() => setShowPasswordModal(true)}>
                  <span className="lock-icon"></span> Change Password
                </button>
              </div>
              
              {/* Order History */}
              <div className="profile-section orders-section">
                <h3><span className="package-icon"></span> Order History</h3>
                {userOrders.length === 0 ? (
                  <p className="no-orders">No orders yet</p>
                ) : (
                  <div className="orders-list">
                    {userOrders.map(order => (
                      <div key={order.id} className="order-card">
                        <div className="order-header">
                          <span className="order-id">Order #{order.id}</span>
                          <span 
                            className="order-status"
                            style={{ color: getStatusColor(order.status) }}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="order-details">
                          <span className="order-date">{formatDate(order.orderDate)}</span>
                          <span className="order-total">{formatCurrency(order.totalPrice)}</span>
                        </div>
                        <div className="order-tracking">
                          <div className="tracking-bar">
                            <div 
                              className={`tracking-step ${['Pending', 'Processing', 'Shipped', 'Delivered'].indexOf(order.status) >= 0 ? 'active' : ''}`}
                            >
                              <span className="step-dot"></span>
                              <span className="step-label">Pending</span>
                            </div>
                            <div 
                              className={`tracking-step ${['Processing', 'Shipped', 'Delivered'].indexOf(order.status) >= 0 ? 'active' : ''}`}
                            >
                              <span className="step-dot"></span>
                              <span className="step-label">Processing</span>
                            </div>
                            <div 
                              className={`tracking-step ${['Shipped', 'Delivered'].indexOf(order.status) >= 0 ? 'active' : ''}`}
                            >
                              <span className="step-dot"></span>
                              <span className="step-label">Shipped</span>
                            </div>
                            <div 
                              className={`tracking-step ${order.status === 'Delivered' ? 'active' : ''}`}
                            >
                              <span className="step-dot"></span>
                              <span className="step-label">Delivered</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button className="logout-btn" onClick={handleLogout}>
                <span className="logout-icon"></span> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal password-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><span className="lock-icon" style={{ background: 'white' }}></span> Change Password</h2>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  placeholder="Current password"
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  placeholder="New password"
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <button type="submit" className="save-btn" disabled={submitting}>
                {submitting ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
