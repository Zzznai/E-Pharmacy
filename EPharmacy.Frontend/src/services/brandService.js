const API_BASE_URL = 'http://localhost:5292/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'accept': '*/*',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const brandService = {
  async getAll() {
    const response = await fetch(`${API_BASE_URL}/Brands`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to fetch brands');
    }

    return await response.json();
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/Brands/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to fetch brand');
    }

    return await response.json();
  },

  async create(brandData) {
    const response = await fetch(`${API_BASE_URL}/Brands`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: brandData.name
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create brand');
    }

    return await response.json();
  },

  async update(id, brandData) {
    const response = await fetch(`${API_BASE_URL}/Brands/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: brandData.name
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to update brand');
    }

    return true;
  },

  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/Brands/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to delete brand');
    }

    return true;
  }
};
