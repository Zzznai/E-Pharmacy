import { parseApiError } from './errorHelper';

const API_BASE_URL = 'http://localhost:5292/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'accept': '*/*',
    'Authorization': `Bearer ${token}`
  };
};

const getAuthHeadersJson = () => {
  const token = localStorage.getItem('token');
  return {
    'accept': '*/*',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const productService = {
  async getAll() {
    const response = await fetch(`${API_BASE_URL}/Products`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to fetch products');
      throw new Error(error);
    }

    return await response.json();
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/Products/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to fetch product');
      throw new Error(error);
    }

    return await response.json();
  },

  async create(productData) {
    const body = {
      name: productData.name,
      price: productData.price,
      availableQuantity: productData.availableQuantity,
      description: productData.description || '',
      isPrescriptionRequired: productData.isPrescriptionRequired,
      brandId: productData.brandId || null,
      categoryIds: productData.categoryIds || [],
      ingredientsJson: JSON.stringify(productData.ingredients || []),
      imageUrl: productData.imageUrl || null
    };

    const response = await fetch(`${API_BASE_URL}/Products`, {
      method: 'POST',
      headers: getAuthHeadersJson(),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to create product');
      throw new Error(error);
    }

    return await response.json();
  },

  async update(id, productData) {
    const body = {
      name: productData.name,
      price: productData.price,
      availableQuantity: productData.availableQuantity,
      description: productData.description || '',
      isPrescriptionRequired: productData.isPrescriptionRequired,
      brandId: productData.brandId || null,
      categoryIds: productData.categoryIds || [],
      ingredientsJson: JSON.stringify(productData.ingredients || []),
      imageUrl: productData.imageUrl || null
    };

    const response = await fetch(`${API_BASE_URL}/Products/${id}`, {
      method: 'PUT',
      headers: getAuthHeadersJson(),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to update product');
      throw new Error(error);
    }

    return true;
  },

  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/Products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to delete product');
      throw new Error(error);
    }

    return true;
  },

  async updateQuantity(id, quantity) {
    const response = await fetch(`${API_BASE_URL}/Products/${id}/quantity`, {
      method: 'PATCH',
      headers: getAuthHeadersJson(),
      body: JSON.stringify(quantity)
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to update quantity');
      throw new Error(error);
    }

    return true;
  }
};
