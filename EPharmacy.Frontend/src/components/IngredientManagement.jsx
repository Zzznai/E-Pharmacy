import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ingredientService } from '../services/ingredientService';
import './IngredientManagement.css';

function IngredientManagement() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    isActiveSubstance: false 
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const data = await ingredientService.getAll();
      setIngredients(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ingredient.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setFormData({ name: '', description: '', isActiveSubstance: false });
    setFormError('');
    setShowAddModal(true);
  };

  const handleEdit = (ingredient) => {
    setSelectedIngredient(ingredient);
    setFormData({ 
      name: ingredient.name, 
      description: ingredient.description,
      isActiveSubstance: ingredient.isActiveSubstance
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleDelete = async (ingredient) => {
    if (!confirm(`Are you sure you want to delete "${ingredient.name}"?`)) return;
    
    try {
      await ingredientService.delete(ingredient.id);
      await fetchIngredients();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Ingredient name is required');
      return;
    }

    try {
      setSubmitting(true);
      await ingredientService.create(formData);
      setShowAddModal(false);
      await fetchIngredients();
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
      setFormError('Ingredient name is required');
      return;
    }

    try {
      setSubmitting(true);
      await ingredientService.update(selectedIngredient.id, formData);
      setShowEditModal(false);
      await fetchIngredients();
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
      <div className="ingredient-management-container">
        <div className="loading-state">Loading ingredients...</div>
      </div>
    );
  }

  return (
    <div className="ingredient-management-container">
      <div className="ingredient-management-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h1>Ingredient Management</h1>
        </div>
        <button className="add-ingredient-button" onClick={handleAdd}>
          + Add Ingredient
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
            placeholder="Search ingredients by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={clearSearch}>×</button>
          )}
        </div>
        <span className="search-results-count">
          {filteredIngredients.length} of {ingredients.length} ingredients
        </span>
      </div>

      <div className="ingredients-table-container">
        <table className="ingredients-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Active Substance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  {searchTerm ? 'No ingredients match your search' : 'No ingredients found'}
                </td>
              </tr>
            ) : (
              filteredIngredients.map(ingredient => (
                <tr key={ingredient.id}>
                  <td>{ingredient.id}</td>
                  <td className="ingredient-name">{ingredient.name}</td>
                  <td className="ingredient-description">{ingredient.description || '-'}</td>
                  <td>
                    <span className={`active-badge ${ingredient.isActiveSubstance ? 'yes' : 'no'}`}>
                      {ingredient.isActiveSubstance ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button 
                        className="edit-button"
                        onClick={() => handleEdit(ingredient)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDelete(ingredient)}
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
              <h2>Add New Ingredient</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form className="ingredient-form" onSubmit={handleSubmitAdd}>
              {formError && <div className="form-error">{formError}</div>}
              
              <div className="form-group">
                <label>Ingredient Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter ingredient name"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description (optional)"
                  rows="3"
                />
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActiveSubstance}
                    onChange={(e) => setFormData({ ...formData, isActiveSubstance: e.target.checked })}
                  />
                  <span className="toggle-switch"></span>
                  <span className="toggle-content">
                    <span className="toggle-title">
                      <span className="active-icon">⚗️</span>
                      Active Substance
                    </span>
                    <span className="toggle-description">Mark if this is an active pharmaceutical ingredient</span>
                  </span>
                </label>
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
                  {submitting ? 'Creating...' : 'Create Ingredient'}
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
              <h2>Edit Ingredient</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form className="ingredient-form" onSubmit={handleSubmitEdit}>
              {formError && <div className="form-error">{formError}</div>}
              
              <div className="form-group">
                <label>Ingredient Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter ingredient name"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description (optional)"
                  rows="3"
                />
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActiveSubstance}
                    onChange={(e) => setFormData({ ...formData, isActiveSubstance: e.target.checked })}
                  />
                  <span className="toggle-switch"></span>
                  <span className="toggle-content">
                    <span className="toggle-title">
                      <span className="active-icon">⚗️</span>
                      Active Substance
                    </span>
                    <span className="toggle-description">Mark if this is an active pharmaceutical ingredient</span>
                  </span>
                </label>
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

export default IngredientManagement;
