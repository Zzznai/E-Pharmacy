import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryService } from '../services/categoryService';
import './CategoryManagement.css';

// Base color palette for root categories
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

// Generate color based on root ancestor and depth level
const getCategoryColor = (category, categories, level = 0) => {
  // Find root ancestor
  let rootId = category.id;
  let current = category;
  let depth = 0;
  
  while (current.parentCategoryId) {
    const parent = categories.find(c => c.id === current.parentCategoryId);
    if (!parent) break;
    current = parent;
    rootId = parent.id;
    depth++;
  }
  
  // Get base color from root's ID
  const base = baseColors[rootId % baseColors.length];
  
  // Adjust lightness and saturation based on depth
  // Children get progressively lighter and slightly less saturated
  const lightnessAdjust = depth * 8;  // Each level gets 8% lighter
  const saturationAdjust = depth * 5; // Each level gets 5% less saturated
  
  const h = base.h;
  const s = Math.max(30, base.s - saturationAdjust);
  const l = Math.min(75, base.l + lightnessAdjust);
  
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
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({ name: '', parentCategoryId: '' });
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
      // Expand all root categories by default
      const rootIds = data.filter(c => !c.parentCategoryId).map(c => c.id);
      setExpandedCategories(new Set(rootIds));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Build hierarchical structure
  const buildTree = (cats, parentId = null) => {
    return cats
      .filter(c => c.parentCategoryId === parentId)
      .map(c => ({
        ...c,
        children: buildTree(cats, c.id)
      }));
  };

  const categoryTree = buildTree(categories);

  // Filter categories based on search
  const filterCategories = (tree, term) => {
    if (!term) return tree;
    
    const matchesSearch = (cat) => 
      cat.name.toLowerCase().includes(term.toLowerCase());
    
    const filterNode = (node) => {
      const childMatches = node.children.map(filterNode).filter(Boolean);
      if (matchesSearch(node) || childMatches.length > 0) {
        return { ...node, children: childMatches };
      }
      return null;
    };
    
    return tree.map(filterNode).filter(Boolean);
  };

  const filteredTree = filterCategories(categoryTree, searchTerm);

  const toggleExpand = (id) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = categories.map(c => c.id);
    setExpandedCategories(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const handleAdd = (parentId = null) => {
    setFormData({ name: '', parentCategoryId: parentId || '' });
    setFormError('');
    setShowAddModal(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({ 
      name: category.name, 
      parentCategoryId: category.parentCategoryId || ''
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleDelete = async (category) => {
    const hasChildren = categories.some(c => c.parentCategoryId === category.id);
    if (hasChildren) {
      alert('Cannot delete category with subcategories. Delete subcategories first.');
      return;
    }
    
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
        name: formData.name,
        parentCategoryId: formData.parentCategoryId || null
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

    // Prevent setting self as parent
    if (formData.parentCategoryId && parseInt(formData.parentCategoryId) === selectedCategory.id) {
      setFormError('Category cannot be its own parent');
      return;
    }

    try {
      setSubmitting(true);
      await categoryService.update(selectedCategory.id, {
        name: formData.name,
        parentCategoryId: formData.parentCategoryId || null
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

  // Get parent categories for dropdown (exclude current category and its descendants)
  const getAvailableParents = (excludeId = null) => {
    if (!excludeId) return categories;
    
    const getDescendantIds = (id) => {
      const descendants = [id];
      categories.filter(c => c.parentCategoryId === id).forEach(child => {
        descendants.push(...getDescendantIds(child.id));
      });
      return descendants;
    };
    
    const excludeIds = getDescendantIds(excludeId);
    return categories.filter(c => !excludeIds.includes(c.id));
  };

  // Render category tree item
  const renderCategoryItem = (category, level = 0) => {
    const color = getCategoryColor(category, categories, level);
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id} className="category-tree-item">
        <div 
          className="category-row"
          style={{ 
            marginLeft: `${level * 24}px`,
            background: color.bg,
            borderColor: color.border
          }}
        >
          <div className="category-left">
            {hasChildren ? (
              <button 
                className="expand-button"
                onClick={() => toggleExpand(category.id)}
                style={{ color: color.text }}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            ) : (
              <span className="expand-placeholder"></span>
            )}
            <span 
              className="category-color-dot"
              style={{ background: color.text }}
            ></span>
            <span className="category-name" style={{ color: color.text }}>
              {category.name}
            </span>
            {hasChildren && (
              <span className="child-count" style={{ color: color.text }}>
                ({category.children.length})
              </span>
            )}
          </div>
          <div className="category-actions">
            <button 
              className="add-child-button"
              onClick={() => handleAdd(category.id)}
              title="Add subcategory"
            >
              + Sub
            </button>
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
        {hasChildren && isExpanded && (
          <div className="category-children">
            {category.children.map(child => renderCategoryItem(child, level + 1))}
          </div>
        )}
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
        <button className="add-category-button" onClick={() => handleAdd()}>
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
        <div className="tree-controls">
          <button className="control-button" onClick={expandAll}>Expand All</button>
          <button className="control-button" onClick={collapseAll}>Collapse All</button>
        </div>
        <span className="search-results-count">
          {categories.length} categories
        </span>
      </div>

      {/* Category Tree */}
      <div className="categories-tree-container">
        {filteredTree.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? 'No categories match your search' : 'No categories found. Add your first category!'}
          </div>
        ) : (
          <div className="category-tree">
            {filteredTree.map(category => renderCategoryItem(category))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{formData.parentCategoryId ? 'Add Subcategory' : 'Add New Category'}</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form className="category-form" onSubmit={handleSubmitAdd}>
              {formError && <div className="form-error">{formError}</div>}
              
              {formData.parentCategoryId && (
                <div className="parent-info">
                  <span className="parent-label">Parent:</span>
                  <span className="parent-name">
                    {categories.find(c => c.id === formData.parentCategoryId)?.name}
                  </span>
                </div>
              )}

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

              {!formData.parentCategoryId && (
                <div className="form-group">
                  <label>Parent Category (Optional)</label>
                  <select
                    value={formData.parentCategoryId}
                    onChange={(e) => setFormData({ ...formData, parentCategoryId: e.target.value })}
                  >
                    <option value="">None (Root Category)</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

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

              <div className="form-group">
                <label>Parent Category</label>
                <select
                  value={formData.parentCategoryId}
                  onChange={(e) => setFormData({ ...formData, parentCategoryId: e.target.value })}
                >
                  <option value="">None (Root Category)</option>
                  {getAvailableParents(selectedCategory?.id).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
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
