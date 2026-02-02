import { authService } from './authService';
import { parseApiError } from './errorHelper';

const API_BASE_URL = 'http://localhost:5292/api';

const getAuthHeaders = () => {
  const token = authService.getToken();
  return {
    'accept': '*/*',
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const userService = {
  async getAll() {
    const response = await fetch(`${API_BASE_URL}/User`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to fetch users');
      throw new Error(error);
    }

    return await response.json();
  },

  async getProfile() {
    const response = await fetch(`${API_BASE_URL}/User/profile`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to fetch profile');
      throw new Error(error);
    }

    return await response.json();
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/User/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to fetch user');
      throw new Error(error);
    }

    return await response.json();
  },

  async create(userData, isAdmin = false) {
    const endpoint = isAdmin ? `${API_BASE_URL}/User/create-admin` : `${API_BASE_URL}/User`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        username: userData.username,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName
      })
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to create user');
      throw new Error(error);
    }

    return await response.json();
  },

  async update(id, userData) {
    const response = await fetch(`${API_BASE_URL}/User/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        firstName: userData.firstName,
        lastName: userData.lastName
      })
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to update user');
      throw new Error(error);
    }

    return true;
  },

  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/User/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to delete user');
      throw new Error(error);
    }

    return true;
  },

  async changePassword(id, currentPassword, newPassword) {
    const response = await fetch(`${API_BASE_URL}/User/${id}/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to change password');
      throw new Error(error);
    }

    return true;
  },

  async updateProfile(profileData) {
    const userId = localStorage.getItem('userId');
    const response = await fetch(`${API_BASE_URL}/User/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        firstName: profileData.firstName,
        lastName: profileData.lastName
      })
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to update profile');
      throw new Error(error);
    }

    return true;
  },

  async changeMyPassword(currentPassword, newPassword) {
    const userId = localStorage.getItem('userId');
    const response = await fetch(`${API_BASE_URL}/User/${userId}/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to change password');
      throw new Error(error);
    }

    return true;
  }
};
