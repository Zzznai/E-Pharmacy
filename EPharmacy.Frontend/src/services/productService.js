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
      const error = await response.text();
      throw new Error(error || 'Failed to fetch products');
    }

    return await response.json();
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/Products/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to fetch product');
    }

    return await response.json();
  },

  async create(productData, imageFile) {
    const formData = new FormData();
    formData.append('Name', productData.name);
    formData.append('Price', productData.price.toString());
    formData.append('AvailableQuantity', productData.availableQuantity.toString());
    formData.append('Description', productData.description || '');
    formData.append('IsPrescriptionRequired', productData.isPrescriptionRequired.toString());
    
    if (productData.brandId) {
      formData.append('BrandId', productData.brandId.toString());
    }
    
    if (productData.categoryIds && productData.categoryIds.length > 0) {
      productData.categoryIds.forEach(id => {
        formData.append('CategoryIds', id.toString());
      });
    }
    
    if (productData.ingredients && productData.ingredients.length > 0) {
      formData.append('IngredientsJson', JSON.stringify(productData.ingredients));
    }
    
    if (imageFile) {
      formData.append('Image', imageFile);
    }

    const response = await fetch(`${API_BASE_URL}/Products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create product');
    }

    return await response.json();
  },

  async update(id, productData, imageFile, removeImage = false) {
    const formData = new FormData();
    formData.append('Name', productData.name);
    formData.append('Price', productData.price.toString());
    formData.append('AvailableQuantity', productData.availableQuantity.toString());
    formData.append('Description', productData.description || '');
    formData.append('IsPrescriptionRequired', productData.isPrescriptionRequired.toString());
    formData.append('RemoveImage', removeImage.toString());
    
    if (productData.brandId) {
      formData.append('BrandId', productData.brandId.toString());
    }
    
    if (productData.categoryIds && productData.categoryIds.length > 0) {
      productData.categoryIds.forEach(id => {
        formData.append('CategoryIds', id.toString());
      });
    }
    
    if (productData.ingredients && productData.ingredients.length > 0) {
      formData.append('IngredientsJson', JSON.stringify(productData.ingredients));
    }
    
    if (imageFile) {
      formData.append('Image', imageFile);
    }

    const response = await fetch(`${API_BASE_URL}/Products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to update product');
    }

    return true;
  },

  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/Products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to delete product');
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
      const error = await response.text();
      throw new Error(error || 'Failed to update quantity');
    }

    return true;
  }
};
