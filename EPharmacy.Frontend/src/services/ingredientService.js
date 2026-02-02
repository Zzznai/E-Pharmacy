import { parseApiError } from './errorHelper';

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
      const error = await parseApiError(response, 'Failed to fetch ingredients');
      throw new Error(error);
    }

    return await response.json();
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/Ingredients/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to fetch ingredient');
      throw new Error(error);
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
      const error = await parseApiError(response, 'Failed to create ingredient');
      throw new Error(error);
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
      const error = await parseApiError(response, 'Failed to update ingredient');
      throw new Error(error);
    }

    return true;
  },

  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/Ingredients/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to delete ingredient');
      throw new Error(error);
    }

    return true;
  }
};
