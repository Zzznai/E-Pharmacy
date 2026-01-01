const API_BASE_URL = 'http://localhost:5292/api';

// Helper to parse error responses from the API
function parseErrorResponse(errorText) {
  try {
    const parsed = JSON.parse(errorText);
    // Handle validation errors from FluentValidation
    if (parsed.errors) {
      const messages = Object.values(parsed.errors).flat();
      return messages.join('. ');
    }
    // Handle standard problem details
    if (parsed.title) {
      return parsed.title;
    }
    return parsed.message || errorText;
  } catch {
    return errorText;
  }
}

export const authService = {
  async login(username, password) {
    const response = await fetch(`${API_BASE_URL}/Auth/token`, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Username or password is incorrect');
      }
      const error = await response.text();
      throw new Error(parseErrorResponse(error) || 'Login failed');
    }

    const data = await response.json();
    
    // Store token and user info in localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('tokenExpiry', data.expiresAt);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userId', data.userId);
    }
    
    return data;
  },

  async signup(userData) {
    const response = await fetch(`${API_BASE_URL}/User`, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.username,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(parseErrorResponse(error) || 'Signup failed');
    }

    return await response.json();
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('basket');
  },

  getToken() {
    // Check if token is expired before returning it
    const token = localStorage.getItem('token');
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (!token || !expiry) {
      return null;
    }

    // Check if token is expired
    const expiryDate = new Date(expiry);
    if (expiryDate <= new Date()) {
      // Token expired, clear all auth data
      this.logout();
      return null;
    }
    
    return token;
  },

  isAuthenticated() {
    return this.getToken() !== null;
  },

  getUserInfo() {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      // Decode JWT token (base64 decode the payload)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);
      
      return {
        id: payload.nameid || payload.sub,
        username: payload.unique_name || payload.name,
        firstName: payload.given_name || payload.firstName || '',
        lastName: payload.family_name || payload.lastName || '',
        role: payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'User'
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
};
