import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { brandService } from '../services/brandService';
import { categoryService } from '../services/categoryService';
import { ingredientService } from '../services/ingredientService';
import './ProductManagement.css';

function ProductManagement() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    availableQuantity: 0,
    description: '',
    isPrescriptionRequired: false,
    brandId: '',
    categoryIds: [],
    ingredients: []
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Ingredient form states
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [showIngredientDropdown, setShowIngredientDropdown] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [selectedIngredientName, setSelectedIngredientName] = useState('');
  const [ingredientAmount, setIngredientAmount] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('mg');
  const ingredientInputRef = useRef(null);

  // Category search state
  const [categorySearch, setCategorySearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // Close ingredient dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ingredientInputRef.current && !ingredientInputRef.current.closest('.ingredient-search-container')?.contains(event.target)) {
        setShowIngredientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsData, brandsData, categoriesData, ingredientsData] = await Promise.all([
        productService.getAll(),
        brandService.getAll(),
        categoryService.getAll(),
        ingredientService.getAll()
      ]);
      setProducts(productsData);
      setBrands(brandsData);
      setCategories(categoriesData);
      setIngredients(ingredientsData);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.brandName && product.brandName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter ingredients based on search
  const filteredIngredients = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(ingredientSearch.toLowerCase()) &&
    !formData.ingredients.some(added => added.ingredientId === ing.id)
  );

  // Filter categories based on search
  const filterCategoryTree = (tree, search) => {
    if (!search) return tree;
    const searchLower = search.toLowerCase();
    return tree.filter(cat => {
      const matches = cat.name.toLowerCase().includes(searchLower);
      const hasMatchingChildren = cat.children && filterCategoryTree(cat.children, search).length > 0;
      return matches || hasMatchingChildren;
    }).map(cat => ({
      ...cat,
      children: cat.children ? filterCategoryTree(cat.children, search) : []
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      availableQuantity: 0,
      description: '',
      isPrescriptionRequired: false,
      brandId: '',
      categoryIds: [],
      ingredients: []
    });
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    setFormError('');
    setSelectedIngredientId('');
    setSelectedIngredientName('');
    setIngredientSearch('');
    setIngredientAmount('');
    setIngredientUnit('mg');
    setCategorySearch('');
    setShowIngredientDropdown(false);
  };

  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      availableQuantity: product.availableQuantity,
      description: product.description || '',
      isPrescriptionRequired: product.isPrescriptionRequired,
      brandId: product.brandId?.toString() || '',
      categoryIds: product.categoryIds || [],
      ingredients: product.ingredients?.map(i => ({
        ingredientId: i.ingredientId,
        amount: i.amount,
        unit: i.unit
      })) || []
    });
    setImageFile(null);
    setImagePreview(product.photoUrl);
    setRemoveImage(false);
    setFormError('');
    // Reset ingredient input fields
    setSelectedIngredientId('');
    setSelectedIngredientName('');
    setIngredientSearch('');
    setIngredientAmount('');
    setIngredientUnit('mg');
    setShowIngredientDropdown(false);
    setCategorySearch('');
    setShowEditModal(true);
  };

  const handleViewDetail = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleDelete = async (product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    
    try {
      await productService.delete(product.id);
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  const handleAddIngredient = () => {
    if (!selectedIngredientId || !ingredientAmount) return;
    
    const existing = formData.ingredients.find(i => i.ingredientId === parseInt(selectedIngredientId));
    if (existing) {
      setFormError('This ingredient is already added');
      return;
    }

    const newIngredient = {
      ingredientId: parseInt(selectedIngredientId),
      amount: parseFloat(ingredientAmount),
      unit: ingredientUnit
    };

    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }));

    setSelectedIngredientId('');
    setSelectedIngredientName('');
    setIngredientSearch('');
    setIngredientAmount('');
    setIngredientUnit('mg');
    setShowIngredientDropdown(false);
  };

  const handleSelectIngredient = (ing) => {
    setSelectedIngredientId(ing.id.toString());
    setSelectedIngredientName(ing.name);
    setIngredientSearch(ing.name);
    setShowIngredientDropdown(false);
  };

  const handleRemoveIngredient = (ingredientId) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(i => i.ingredientId !== ingredientId)
    }));
  };

  // Get all parent category IDs for a given category
  const getParentCategoryIds = (categoryId) => {
    const parentIds = [];
    let current = categories.find(c => c.id === categoryId);
    while (current && current.parentCategoryId) {
      parentIds.push(current.parentCategoryId);
      current = categories.find(c => c.id === current.parentCategoryId);
    }
    return parentIds;
  };

  // Get all child category IDs for a given category
  const getChildCategoryIds = (categoryId) => {
    const childIds = [];
    const findChildren = (parentId) => {
      categories.filter(c => c.parentCategoryId === parentId).forEach(child => {
        childIds.push(child.id);
        findChildren(child.id);
      });
    };
    findChildren(categoryId);
    return childIds;
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => {
      const isCurrentlySelected = prev.categoryIds.includes(categoryId);
      
      if (isCurrentlySelected) {
        // When deselecting, also deselect all children
        const childIds = getChildCategoryIds(categoryId);
        return {
          ...prev,
          categoryIds: prev.categoryIds.filter(id => id !== categoryId && !childIds.includes(id))
        };
      } else {
        // When selecting, also select all parents
        const parentIds = getParentCategoryIds(categoryId);
        const newIds = [...prev.categoryIds, categoryId, ...parentIds];
        return {
          ...prev,
          categoryIds: [...new Set(newIds)] // Remove duplicates
        };
      }
    });
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Product name is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setFormError('Price must be greater than zero');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Submitting product with ingredients:', formData.ingredients);
      await productService.create({
        name: formData.name,
        price: parseFloat(formData.price),
        availableQuantity: formData.isPrescriptionRequired ? 0 : parseInt(formData.availableQuantity) || 0,
        description: formData.description,
        isPrescriptionRequired: formData.isPrescriptionRequired,
        brandId: formData.brandId ? parseInt(formData.brandId) : null,
        categoryIds: formData.categoryIds,
        ingredients: formData.ingredients
      }, imageFile);
      setShowAddModal(false);
      await fetchData();
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
      setFormError('Product name is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setFormError('Price must be greater than zero');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Updating product with ingredients:', formData.ingredients);
      await productService.update(selectedProduct.id, {
        name: formData.name,
        price: parseFloat(formData.price),
        availableQuantity: formData.isPrescriptionRequired ? 0 : parseInt(formData.availableQuantity) || 0,
        description: formData.description,
        isPrescriptionRequired: formData.isPrescriptionRequired,
        brandId: formData.brandId ? parseInt(formData.brandId) : null,
        categoryIds: formData.categoryIds,
        ingredients: formData.ingredients
      }, imageFile, removeImage);
      setShowEditModal(false);
      await fetchData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getIngredientName = (ingredientId) => {
    const ingredient = ingredients.find(i => i.id === ingredientId);
    return ingredient?.name || 'Unknown';
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  // Build category tree for display
  const buildCategoryTree = (parentId = null, level = 0) => {
    return categories
      .filter(c => c.parentCategoryId === parentId)
      .map(category => ({
        ...category,
        level,
        children: buildCategoryTree(category.id, level + 1)
      }));
  };

  const flattenCategoryTree = (tree, result = []) => {
    tree.forEach(item => {
      result.push(item);
      if (item.children.length > 0) {
        flattenCategoryTree(item.children, result);
      }
    });
    return result;
  };

  const categoryTreeFlat = flattenCategoryTree(buildCategoryTree());
  const categoryTreeHierarchical = buildCategoryTree();

  // Render category tree recursively
  const renderCategoryTree = (tree, search = '') => {
    const filteredTree = search 
      ? tree.filter(cat => {
          const matches = cat.name.toLowerCase().includes(search.toLowerCase());
          const hasMatchingChildren = cat.children && cat.children.some(child => 
            child.name.toLowerCase().includes(search.toLowerCase()) ||
            (child.children && child.children.length > 0)
          );
          return matches || hasMatchingChildren;
        })
      : tree;

    return filteredTree.map(category => {
      const isSelected = formData.categoryIds.includes(category.id);
      const hasChildren = category.children && category.children.length > 0;
      const hasSelectedChildren = hasChildren && category.children.some(child => 
        formData.categoryIds.includes(child.id) || 
        (child.children && child.children.some(grandchild => formData.categoryIds.includes(grandchild.id)))
      );

      return (
        <div key={category.id} className="category-tree-node">
          <div 
            className={`category-card ${isSelected ? 'selected' : ''} ${hasSelectedChildren ? 'has-selected-children' : ''} level-${category.level}`}
            onClick={() => handleCategoryToggle(category.id)}
          >
            <div className="category-card-content">
              {hasChildren && <span className="category-expand-icon">📁</span>}
              {!hasChildren && <span className="category-leaf-icon">📄</span>}
              <span className="category-card-name">{category.name}</span>
            </div>
            <div className={`category-checkbox-indicator ${isSelected ? 'checked' : ''}`}>
              {isSelected && '✓'}
            </div>
          </div>
          {hasChildren && (
            <div className="category-children">
              {renderCategoryTree(category.children, search)}
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="product-management-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-management-container">
      {/* Header */}
      <div className="product-management-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>Product Management</h1>
        </div>
        <button className="add-product-button" onClick={handleAdd}>
          + Add Product
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Search */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <span className="search-icon"></span>
          <input
            type="text"
            className="search-input"
            placeholder="Search products by name or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>
        <div className="results-count">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {filteredProducts.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-image-container">
              {product.photoUrl ? (
                <img src={product.photoUrl} alt={product.name} className="product-image" />
              ) : (
                <div className="product-no-image">
                  <span>📦</span>
                </div>
              )}
              {product.isPrescriptionRequired && (
                <div className="prescription-badge">Pr</div>
              )}
            </div>
            <div className="product-info">
              <h3 className="product-name">{product.name}</h3>
              {product.brandName && (
                <p className="product-brand">{product.brandName}</p>
              )}
              <div className="product-price">${product.price.toFixed(2)}</div>
              {!product.isPrescriptionRequired && (
                <div className={`product-stock ${product.availableQuantity === 0 ? 'out-of-stock' : product.availableQuantity < 10 ? 'low-stock' : ''}`}>
                  {product.availableQuantity === 0 ? 'Out of Stock' : `${product.availableQuantity} in stock`}
                </div>
              )}
            </div>
            <div className="product-actions">
              <button className="action-btn view-btn" onClick={() => handleViewDetail(product)} title="View Details">
                👁
              </button>
              <button className="action-btn edit-btn" onClick={() => handleEdit(product)} title="Edit">
                ✏️
              </button>
              <button className="action-btn delete-btn" onClick={() => handleDelete(product)} title="Delete">
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <p>No products found</p>
          <button className="add-product-button" onClick={handleAdd}>Add Your First Product</button>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content product-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Product</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitAdd}>
              <div className="modal-body">
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Brand</label>
                    <select
                      value={formData.brandId}
                      onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                    >
                      <option value="">Select brand</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Available Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.availableQuantity}
                      onChange={(e) => setFormData({ ...formData, availableQuantity: e.target.value })}
                      disabled={formData.isPrescriptionRequired}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isPrescriptionRequired}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        isPrescriptionRequired: e.target.checked,
                        availableQuantity: e.target.checked ? 0 : formData.availableQuantity
                      })}
                    />
                    <span>Prescription Required</span>
                  </label>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter product description"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Product Image</label>
                  <div className="image-upload-area">
                    {imagePreview ? (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <button type="button" className="remove-image-btn" onClick={handleRemoveImage}>×</button>
                      </div>
                    ) : (
                      <label className="upload-label">
                        <input type="file" accept="image/*" onChange={handleImageChange} />
                        <span>📷 Click to upload image</span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Categories</label>
                  <div className="categories-selector-v2">
                    <div className="category-search-wrapper">
                      <input
                        type="text"
                        className="category-search-input"
                        placeholder="🔍 Search categories..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                      />
                      {categorySearch && (
                        <button type="button" className="clear-search" onClick={() => setCategorySearch('')}>×</button>
                      )}
                    </div>
                    {formData.categoryIds.length > 0 && (
                      <div className="selected-categories-summary">
                        <span className="selected-count">{formData.categoryIds.length} selected</span>
                        <button type="button" className="clear-all-btn" onClick={() => setFormData(prev => ({...prev, categoryIds: []}))}>Clear all</button>
                      </div>
                    )}
                    <div className="category-tree-container">
                      {categoryTreeHierarchical.length === 0 && (
                        <p className="no-categories">No categories available</p>
                      )}
                      {categoryTreeHierarchical.length > 0 && renderCategoryTree(categoryTreeHierarchical, categorySearch)}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Ingredients</label>
                  <div className="ingredients-selector">
                    {ingredients.length === 0 ? (
                      <p className="no-ingredients">No ingredients available. Please add ingredients first in the Ingredients Management page.</p>
                    ) : (
                      <>
                        <div className="ingredient-add-row">
                          <div className="ingredient-search-container">
                            <input
                              ref={ingredientInputRef}
                              type="text"
                              className="ingredient-search-input"
                              placeholder="🔍 Type to search ingredients..."
                              value={ingredientSearch}
                              onChange={(e) => {
                                setIngredientSearch(e.target.value);
                                setSelectedIngredientId('');
                                setSelectedIngredientName('');
                                setShowIngredientDropdown(true);
                              }}
                              onFocus={() => setShowIngredientDropdown(true)}
                            />
                            {showIngredientDropdown && ingredientSearch && filteredIngredients.length > 0 && (
                              <div className="ingredient-dropdown">
                                {filteredIngredients.slice(0, 8).map(ing => (
                                  <div
                                    key={ing.id}
                                    className="ingredient-option"
                                    onClick={() => handleSelectIngredient(ing)}
                                  >
                                    <span className="ingredient-name">{ing.name}</span>
                                    {ing.isActiveSubstance && <span className="active-badge">Active</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                            {showIngredientDropdown && ingredientSearch && filteredIngredients.length === 0 && (
                              <div className="ingredient-dropdown">
                                <div className="no-results">No matching ingredients</div>
                              </div>
                            )}
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Amount"
                            value={ingredientAmount}
                            onChange={(e) => setIngredientAmount(e.target.value)}
                          />
                          <select
                            value={ingredientUnit}
                            onChange={(e) => setIngredientUnit(e.target.value)}
                          >
                            <option value="mg">mg</option>
                            <option value="g">g</option>
                            <option value="ml">ml</option>
                            <option value="mcg">mcg</option>
                            <option value="%">%</option>
                            <option value="IU">IU</option>
                          </select>
                          <button 
                            type="button" 
                            className="add-ingredient-btn" 
                            onClick={handleAddIngredient}
                            disabled={!selectedIngredientId || !ingredientAmount}
                          >+</button>
                        </div>
                        <div className="ingredients-list">
                          {formData.ingredients.length === 0 && (
                            <p className="no-ingredients">No ingredients added yet</p>
                          )}
                          {formData.ingredients.map(ing => (
                            <div key={ing.ingredientId} className="ingredient-tag">
                              <span>{getIngredientName(ing.ingredientId)} - {ing.amount} {ing.unit}</span>
                              <button type="button" onClick={() => handleRemoveIngredient(ing.ingredientId)}>×</button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content product-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitEdit}>
              <div className="modal-body">
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Brand</label>
                    <select
                      value={formData.brandId}
                      onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                    >
                      <option value="">Select brand</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Available Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.availableQuantity}
                      onChange={(e) => setFormData({ ...formData, availableQuantity: e.target.value })}
                      disabled={formData.isPrescriptionRequired}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isPrescriptionRequired}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        isPrescriptionRequired: e.target.checked,
                        availableQuantity: e.target.checked ? 0 : formData.availableQuantity
                      })}
                    />
                    <span>Prescription Required</span>
                  </label>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter product description"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Product Image</label>
                  <div className="image-upload-area">
                    {imagePreview ? (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <button type="button" className="remove-image-btn" onClick={handleRemoveImage}>×</button>
                      </div>
                    ) : (
                      <label className="upload-label">
                        <input type="file" accept="image/*" onChange={handleImageChange} />
                        <span>📷 Click to upload image</span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Categories</label>
                  <div className="categories-selector-v2">
                    <div className="category-search-wrapper">
                      <input
                        type="text"
                        className="category-search-input"
                        placeholder="🔍 Search categories..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                      />
                      {categorySearch && (
                        <button type="button" className="clear-search" onClick={() => setCategorySearch('')}>×</button>
                      )}
                    </div>
                    {formData.categoryIds.length > 0 && (
                      <div className="selected-categories-summary">
                        <span className="selected-count">{formData.categoryIds.length} selected</span>
                        <button type="button" className="clear-all-btn" onClick={() => setFormData(prev => ({...prev, categoryIds: []}))}>Clear all</button>
                      </div>
                    )}
                    <div className="category-tree-container">
                      {categoryTreeHierarchical.length === 0 && (
                        <p className="no-categories">No categories available</p>
                      )}
                      {categoryTreeHierarchical.length > 0 && renderCategoryTree(categoryTreeHierarchical, categorySearch)}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Ingredients</label>
                  <div className="ingredients-selector">
                    {ingredients.length === 0 ? (
                      <p className="no-ingredients">No ingredients available. Please add ingredients first in the Ingredients Management page.</p>
                    ) : (
                      <>
                        <div className="ingredient-add-row">
                          <div className="ingredient-search-container">
                            <input
                              ref={ingredientInputRef}
                              type="text"
                              className="ingredient-search-input"
                              placeholder="🔍 Type to search ingredients..."
                              value={ingredientSearch}
                              onChange={(e) => {
                                setIngredientSearch(e.target.value);
                                setSelectedIngredientId('');
                                setSelectedIngredientName('');
                                setShowIngredientDropdown(true);
                              }}
                              onFocus={() => setShowIngredientDropdown(true)}
                            />
                            {showIngredientDropdown && ingredientSearch && filteredIngredients.length > 0 && (
                              <div className="ingredient-dropdown">
                                {filteredIngredients.slice(0, 8).map(ing => (
                                  <div
                                    key={ing.id}
                                    className="ingredient-option"
                                    onClick={() => handleSelectIngredient(ing)}
                                  >
                                    <span className="ingredient-name">{ing.name}</span>
                                    {ing.isActiveSubstance && <span className="active-badge">Active</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                            {showIngredientDropdown && ingredientSearch && filteredIngredients.length === 0 && (
                              <div className="ingredient-dropdown">
                                <div className="no-results">No matching ingredients</div>
                              </div>
                            )}
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Amount"
                            value={ingredientAmount}
                            onChange={(e) => setIngredientAmount(e.target.value)}
                          />
                          <select
                            value={ingredientUnit}
                            onChange={(e) => setIngredientUnit(e.target.value)}
                          >
                            <option value="mg">mg</option>
                            <option value="g">g</option>
                            <option value="ml">ml</option>
                            <option value="mcg">mcg</option>
                            <option value="%">%</option>
                            <option value="IU">IU</option>
                          </select>
                          <button 
                            type="button" 
                            className="add-ingredient-btn" 
                            onClick={handleAddIngredient}
                            disabled={!selectedIngredientId || !ingredientAmount}
                          >+</button>
                        </div>
                        <div className="ingredients-list">
                          {formData.ingredients.length === 0 && (
                            <p className="no-ingredients">No ingredients added yet</p>
                          )}
                          {formData.ingredients.map(ing => (
                            <div key={ing.ingredientId} className="ingredient-tag">
                              <span>{getIngredientName(ing.ingredientId)} - {ing.amount} {ing.unit}</span>
                              <button type="button" onClick={() => handleRemoveIngredient(ing.ingredientId)}>×</button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Product Details</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className="modal-body detail-body">
              <div className="detail-image-section">
                {selectedProduct.photoUrl ? (
                  <img src={selectedProduct.photoUrl} alt={selectedProduct.name} className="detail-image" />
                ) : (
                  <div className="detail-no-image">
                    <span>📦</span>
                  </div>
                )}
              </div>
              <div className="detail-info-section">
                <h3 className="detail-name">{selectedProduct.name}</h3>
                {selectedProduct.brandName && (
                  <p className="detail-brand">Brand: {selectedProduct.brandName}</p>
                )}
                <div className="detail-price">${selectedProduct.price.toFixed(2)}</div>
                
                {selectedProduct.isPrescriptionRequired ? (
                  <div className="detail-prescription">
                    <span className="rx-badge">Rx</span> Prescription Required
                  </div>
                ) : (
                  <div className="detail-stock">
                    Stock: {selectedProduct.availableQuantity} units
                  </div>
                )}

                {selectedProduct.description && (
                  <div className="detail-description">
                    <h4>Description</h4>
                    <p>{selectedProduct.description}</p>
                  </div>
                )}

                {selectedProduct.categoryIds && selectedProduct.categoryIds.length > 0 && (
                  <div className="detail-categories">
                    <h4>Categories</h4>
                    <div className="category-tags">
                      {selectedProduct.categoryIds.map(catId => (
                        <span key={catId} className="category-tag">{getCategoryName(catId)}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 && (
                  <div className="detail-ingredients">
                    <h4>Ingredients</h4>
                    <div className="ingredient-tags">
                      {selectedProduct.ingredients.map(ing => (
                        <span key={ing.ingredientId} className="ingredient-detail-tag">
                          {ing.name} - {ing.amount} {ing.unit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowDetailModal(false)}>Close</button>
              <button className="submit-btn" onClick={() => { setShowDetailModal(false); handleEdit(selectedProduct); }}>
                Edit Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductManagement;
