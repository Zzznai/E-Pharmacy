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
      const error = await response.text();
      throw new Error(error || 'Failed to fetch orders');
    }
    return response.json();
  },

  async getMyOrders() {
    const response = await fetch(`${API_URL}/my-orders`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to fetch your orders');
    }
    return response.json();
  },

  async getById(id) {
    const response = await fetch(`${API_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to fetch order');
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
      const error = await response.text();
      throw new Error(error || 'Failed to create order');
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
      const error = await response.text();
      throw new Error(error || 'Failed to update order status');
    }
    return response.json();
  },

  async delete(id) {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to delete order');
    }
    return response.json();
  },

  async getTopProducts(count = 5) {
    const response = await fetch(`${API_URL}/top-products?count=${count}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to fetch top products');
    }
    return response.json();
  }
};
