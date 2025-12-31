const API_BASE_URL = 'http://localhost:5292/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'accept': '*/*',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const ingredientService = {
  async getAll() {
    const response = await fetch(`${API_BASE_URL}/Ingredients`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to fetch ingredients');
    }

    return await response.json();
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/Ingredients/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to fetch ingredient');
    }

    return await response.json();
  },

  async create(ingredientData) {
    const response = await fetch(`${API_BASE_URL}/Ingredients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: ingredientData.name,
        description: ingredientData.description,
        isActiveSubstance: ingredientData.isActiveSubstance
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create ingredient');
    }

    return await response.json();
  },

  async update(id, ingredientData) {
    const response = await fetch(`${API_BASE_URL}/Ingredients/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: ingredientData.name,
        description: ingredientData.description,
        isActiveSubstance: ingredientData.isActiveSubstance
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to update ingredient');
    }

    return true;
  },

  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/Ingredients/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to delete ingredient');
    }

    return true;
  }
};
