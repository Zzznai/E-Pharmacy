const API_BASE_URL = 'http://localhost:5292/api';

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
      const error = await response.text();
      throw new Error(error || 'Login failed');
    }

    const data = await response.json();
    
    // Store token in localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('tokenExpiry', data.expiresAt);
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
      throw new Error(error || 'Signup failed');
    }

    return await response.json();
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    const token = this.getToken();
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (!token || !expiry) {
      return false;
    }

    // Check if token is expired
    const expiryDate = new Date(expiry);
    return expiryDate > new Date();
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
