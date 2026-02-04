import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryService } from '../services/categoryService';
import './CategoryManagement.css';

// Base color palette for categories
const baseColors = [
  { h: 262, s: 83, l: 58 },  // Purple
  { h: 217, s: 91, l: 60 },  // Blue
  { h: 142, s: 71, l: 45 },  // Green
  { h: 25, s: 95, l: 53 },   // Orange
  { h: 330, s: 81, l: 60 },  // Pink
  { h: 199, s: 89, l: 48 },  // Cyan
  { h: 271, s: 91, l: 65 },  // Violet
  { h: 48, s: 96, l: 53 },   // Yellow
  { h: 0, s: 84, l: 60 },    // Red
  { h: 174, s: 84, l: 40 },  // Teal
];

// Generate color based on category id
const getCategoryColor = (category) => {
  const base = baseColors[category.id % baseColors.length];
  const h = base.h;
  const s = base.s;
  const l = base.l;
  
  return {
    bg: `hsla(${h}, ${s}%, ${l}%, 0.2)`,
    border: `hsla(${h}, ${s}%, ${l}%, 0.5)`,
    text: `hsl(${h}, ${Math.min(100, s + 20)}%, ${Math.min(85, l + 15)}%)`
  };
};

function CategoryManagement() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({ name: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setFormData({ name: '' });
    setFormError('');
    setShowAddModal(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({ name: category.name });
    setFormError('');
    setShowEditModal(true);
  };

  const handleDelete = async (category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;
    
    try {
      await categoryService.delete(category.id);
      await fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Category name is required');
      return;
    }

    try {
      setSubmitting(true);
      await categoryService.create({
        name: formData.name
      });
      setShowAddModal(false);
      await fetchCategories();
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
      setFormError('Category name is required');
      return;
    }

    try {
      setSubmitting(true);
      await categoryService.update(selectedCategory.id, {
        name: formData.name
      });
      setShowEditModal(false);
      await fetchCategories();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // Render category item
  const renderCategoryItem = (category) => {
    const color = getCategoryColor(category);

    return (
      <div key={category.id} className="category-tree-item">
        <div 
          className="category-row"
          style={{ 
            background: color.bg,
            borderColor: color.border
          }}
        >
          <div className="category-left">
            <span 
              className="category-color-dot"
              style={{ background: color.text }}
            ></span>
            <span className="category-name" style={{ color: color.text }}>
              {category.name}
            </span>
          </div>
          <div className="category-actions">
            <button 
              className="edit-button"
              onClick={() => handleEdit(category)}
            >
              Edit
            </button>
            <button 
              className="delete-button"
              onClick={() => handleDelete(category)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="category-management-container">
        <div className="loading-state">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="category-management-container">
      <div className="category-management-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h1>Category Management</h1>
        </div>
        <button className="add-category-button" onClick={handleAdd}>
          + Add Category
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Search and Controls */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <span className="search-icon"></span>
          <input
            type="text"
            className="search-input"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={clearSearch}>×</button>
          )}
        </div>
        <span className="search-results-count">
          {filteredCategories.length} categories
        </span>
      </div>

      {/* Category List */}
      <div className="categories-tree-container">
        {filteredCategories.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? 'No categories match your search' : 'No categories found. Add your first category!'}
          </div>
        ) : (
          <div className="category-tree">
            {filteredCategories.map(category => renderCategoryItem(category))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Category</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form className="category-form" onSubmit={handleSubmitAdd}>
              {formError && <div className="form-error">{formError}</div>}

              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter category name"
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
                  {submitting ? 'Creating...' : 'Create Category'}
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
              <h2>Edit Category</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form className="category-form" onSubmit={handleSubmitEdit}>
              {formError && <div className="form-error">{formError}</div>}
              
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter category name"
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

export default CategoryManagement;
