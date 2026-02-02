import { parseApiError } from './errorHelper';

const API_URL = 'http://localhost:5292/api/orders';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const orderService = {
  async getAll() {
    const response = await fetch(API_URL, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to fetch orders');
      throw new Error(error);
    }
    return response.json();
  },

  async getMyOrders() {
    const response = await fetch(`${API_URL}/my-orders`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to fetch your orders');
      throw new Error(error);
    }
    return response.json();
  },

  async getById(id) {
    const response = await fetch(`${API_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to fetch order');
      throw new Error(error);
    }
    return response.json();
  },

  async create(orderData) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData)
    });
    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to create order');
      throw new Error(error);
    }
    return response.json();
  },

  async updateStatus(id, status) {
    const response = await fetch(`${API_URL}/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to update order status');
      throw new Error(error);
    }
    return response.json();
  },

  async delete(id) {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to delete order');
      throw new Error(error);
    }
    return response.json();
  },

  async getTopProducts(count = 5) {
    const response = await fetch(`${API_URL}/top-products?count=${count}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to fetch top products');
      throw new Error(error);
    }
    return response.json();
  }
};
