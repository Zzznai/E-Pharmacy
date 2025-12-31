const API_BASE_URL = 'http://localhost:5292/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'accept': '*/*',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const categoryService = {
  async getAll() {
    const response = await fetch(`${API_BASE_URL}/Categories`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to fetch categories');
    }

    return await response.json();
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/Categories/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to fetch category');
    }

    return await response.json();
  },

  async create(categoryData) {
    const response = await fetch(`${API_BASE_URL}/Categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: categoryData.name,
        parentCategoryId: categoryData.parentCategoryId || null
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create category');
    }

    return await response.json();
  },

  async update(id, categoryData) {
    const response = await fetch(`${API_BASE_URL}/Categories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: categoryData.name,
        parentCategoryId: categoryData.parentCategoryId || null
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to update category');
    }

    return true;
  },

  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/Categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to delete category');
    }

    return true;
  }
};
