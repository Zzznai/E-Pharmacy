import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { brandService } from '../services/brandService';
import './BrandManagement.css';

function BrandManagement() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({ name: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const data = await brandService.getAll();
      setBrands(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setFormData({ name: '' });
    setFormError('');
    setShowAddModal(true);
  };

  const handleEdit = (brand) => {
    setSelectedBrand(brand);
    setFormData({ name: brand.name });
    setFormError('');
    setShowEditModal(true);
  };

  const handleDelete = async (brand) => {
    if (!confirm(`Are you sure you want to delete "${brand.name}"?`)) return;
    
    try {
      await brandService.delete(brand.id);
      await fetchBrands();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Brand name is required');
      return;
    }

    try {
      setSubmitting(true);
      await brandService.create(formData);
      setShowAddModal(false);
      await fetchBrands();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Brand name is required');
      return;
    }

    try {
      setSubmitting(true);
      await brandService.update(selectedBrand.id, formData);
      setShowEditModal(false);
      await fetchBrands();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="brand-management-container">
        <div className="loading-state">Loading brands...</div>
      </div>
    );
  }

  return (
    <div className="brand-management-container">
      <div className="brand-management-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h1>Brand Management</h1>
        </div>
        <button className="add-brand-button" onClick={handleAdd}>
          + Add Brand
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <span className="search-icon"></span>
          <input
            type="text"
            className="search-input"
            placeholder="Search brands by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={clearSearch}>×</button>
          )}
        </div>
        <span className="search-results-count">
          {filteredBrands.length} of {brands.length} brands
        </span>
      </div>

      <div className="brands-table-container">
        <table className="brands-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBrands.length === 0 ? (
              <tr>
                <td colSpan="3" className="empty-state">
                  {searchTerm ? 'No brands match your search' : 'No brands found'}
                </td>
              </tr>
            ) : (
              filteredBrands.map(brand => (
                <tr key={brand.id}>
                  <td>{brand.id}</td>
                  <td className="brand-name">{brand.name}</td>
                  <td>
                    <div className="actions-cell">
                      <button 
                        className="edit-button"
                        onClick={() => handleEdit(brand)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDelete(brand)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Brand</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form className="brand-form" onSubmit={handleSubmitAdd}>
              {formError && <div className="form-error">{formError}</div>}
              
              <div className="form-group">
                <label>Brand Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="Enter brand name"
                  autoFocus
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Brand</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form className="brand-form" onSubmit={handleSubmitEdit}>
              {formError && <div className="form-error">{formError}</div>}
              
              <div className="form-group">
                <label>Brand Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="Enter brand name"
                  autoFocus
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrandManagement;
