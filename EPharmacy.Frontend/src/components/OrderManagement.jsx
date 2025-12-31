import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import './OrderManagement.css';

const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return { bg: 'rgba(250, 204, 20, 0.2)', border: 'rgba(250, 204, 20, 0.5)', text: '#fde047' };
    case 'processing': return { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.5)', text: '#60a5fa' };
    case 'shipped': return { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.5)', text: '#c084fc' };
    case 'delivered': return { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.5)', text: '#4ade80' };
    case 'cancelled': return { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.5)', text: '#f87171' };
    default: return { bg: 'rgba(156, 163, 175, 0.2)', border: 'rgba(156, 163, 175, 0.5)', text: '#9ca3af' };
  }
};

function OrderManagement() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchTopProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAll();
      setOrders(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopProducts = async () => {
    try {
      const data = await orderService.getTopProducts();
      setTopProducts(data);
    } catch (err) {
      console.error('Failed to fetch top products:', err);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toString().includes(searchTerm) ||
      order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userUsername?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    try {
      const details = await orderService.getById(order.id);
      setOrderDetails(details);
      setShowDetailModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusClick = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    
    try {
      setSubmitting(true);
      await orderService.updateStatus(selectedOrder.id, newStatus);
      await fetchOrders();
      setShowStatusModal(false);
      setSelectedOrder(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (order) => {
    setSelectedOrder(order);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOrder) return;
    
    try {
      setSubmitting(true);
      await orderService.delete(selectedOrder.id);
      await fetchOrders();
      setShowDeleteModal(false);
      setSelectedOrder(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get orders per day for the last 7 days
  const getOrdersPerDay = () => {
    const days = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.orderDate).toISOString().split('T')[0];
        return orderDate === dateStr;
      });
      
      const dayRevenue = dayOrders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.totalPrice, 0);
      
      days.push({
        date: dateStr,
        day: dayName,
        count: dayOrders.length,
        revenue: dayRevenue
      });
    }
    return days;
  };

  const ordersPerDay = getOrdersPerDay();
  const maxOrders = Math.max(...ordersPerDay.map(d => d.count), 1);

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    processing: orders.filter(o => o.status === 'Processing').length,
    shipped: orders.filter(o => o.status === 'Shipped').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    cancelled: orders.filter(o => o.status === 'Cancelled').length,
    totalRevenue: orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.totalPrice, 0)
  };

  if (loading) {
    return (
      <div className="order-management-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-management-container">
      {/* Header */}
      <div className="order-management-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h1>Order Management</h1>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Orders</span>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-card processing">
          <div className="stat-icon">⚙️</div>
          <div className="stat-info">
            <span className="stat-value">{stats.processing}</span>
            <span className="stat-label">Processing</span>
          </div>
        </div>
        <div className="stat-card shipped">
          <div className="stat-icon">🚚</div>
          <div className="stat-info">
            <span className="stat-value">{stats.shipped}</span>
            <span className="stat-label">Shipped</span>
          </div>
        </div>
        <div className="stat-card delivered">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{stats.delivered}</span>
            <span className="stat-label">Delivered</span>
          </div>
        </div>
        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(stats.totalRevenue)}</span>
            <span className="stat-label">Total Revenue</span>
          </div>
        </div>
      </div>

      {/* Chart and Map Row */}
      <div className="chart-map-row">
        {/* Orders Per Day Chart */}
        <div className="chart-container">
          <h3 className="chart-title">📊 Orders This Week</h3>
          <div className="bar-chart">
            {ordersPerDay.map((day, index) => (
              <div key={index} className="bar-column">
                <div className="bar-value">{day.count}</div>
                <div 
                  className="bar" 
                  style={{ height: `${(day.count / maxOrders) * 100}%` }}
                >
                  <div className="bar-tooltip">
                    <span>{day.count} orders</span>
                    <span>{formatCurrency(day.revenue)}</span>
                  </div>
                </div>
                <div className="bar-label">{day.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="top-products-container">
          <h3 className="chart-title">🏆 Top Selling Products</h3>
          <div className="top-products-list">
            {topProducts.length === 0 ? (
              <div className="no-data">No product data yet</div>
            ) : (
              topProducts.map((product, index) => (
                <div key={product.productId} className="top-product-item">
                  <div className="product-rank">#{index + 1}</div>
                  <div className="product-info">
                    <span className="product-name">{product.productName}</span>
                    <span className="product-stats">
                      {product.totalQuantity} units • {product.orderCount} orders
                    </span>
                  </div>
                  <div className="product-revenue">{formatCurrency(product.totalRevenue)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="search-filter-container">
        <div className="search-input-wrapper">
          <span className="search-icon"></span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by order ID, customer name, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${!statusFilter ? 'active' : ''}`}
            onClick={() => setStatusFilter('')}
          >
            All
          </button>
          {ORDER_STATUSES.map(status => (
            <button
              key={status}
              className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
              style={statusFilter === status ? { 
                background: getStatusColor(status).bg,
                borderColor: getStatusColor(status).border
              } : {}}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <p>{searchTerm || statusFilter ? 'No orders match your filters' : 'No orders found'}</p>
          </div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Location</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const statusColor = getStatusColor(order.status);
                return (
                  <tr key={order.id}>
                    <td className="order-id">#{order.id}</td>
                    <td className="customer-info">
                      <span className="customer-name">{order.userName}</span>
                      <span className="customer-username">@{order.userUsername}</span>
                    </td>
                    <td className="location-info">
                      <span className="location-city">{order.city || 'N/A'}</span>
                      <span className="location-province">{order.province || ''}</span>
                    </td>
                    <td className="order-date">{formatDate(order.orderDate)}</td>
                    <td className="item-count">{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</td>
                    <td className="order-total">{formatCurrency(order.totalPrice)}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ 
                          background: statusColor.bg,
                          borderColor: statusColor.border,
                          color: statusColor.text
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button className="action-btn view-btn" onClick={() => handleViewDetails(order)} title="View Details">
                        👁️
                      </button>
                      <button className="action-btn status-btn" onClick={() => handleStatusClick(order)} title="Update Status">
                        ✏️
                      </button>
                      <button className="action-btn delete-btn" onClick={() => handleDeleteClick(order)} title="Delete Order">
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && orderDetails && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order #{orderDetails.id}</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="order-detail-header">
                <div className="detail-customer">
                  <h3>Customer Information</h3>
                  <p className="customer-name">{orderDetails.userName}</p>
                  <p className="customer-username">@{orderDetails.userUsername}</p>
                </div>
                <div className="detail-status">
                  <span 
                    className="status-badge large"
                    style={{ 
                      background: getStatusColor(orderDetails.status).bg,
                      borderColor: getStatusColor(orderDetails.status).border,
                      color: getStatusColor(orderDetails.status).text
                    }}
                  >
                    {orderDetails.status}
                  </span>
                  <p className="order-date">{formatDate(orderDetails.orderDate)}</p>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="delivery-info-section">
                <h3>📍 Delivery Information</h3>
                <div className="delivery-details">
                  <div className="delivery-row">
                    <span className="delivery-label">Address</span>
                    <span className="delivery-value">{orderDetails.deliveryAddress || 'N/A'}</span>
                  </div>
                  <div className="delivery-row">
                    <span className="delivery-label">City</span>
                    <span className="delivery-value">{orderDetails.city || 'N/A'}</span>
                  </div>
                  <div className="delivery-row">
                    <span className="delivery-label">Province</span>
                    <span className="delivery-value">{orderDetails.province || 'N/A'}</span>
                  </div>
                  <div className="delivery-row">
                    <span className="delivery-label">Postal Code</span>
                    <span className="delivery-value">{orderDetails.postalCode || 'N/A'}</span>
                  </div>
                  <div className="delivery-row">
                    <span className="delivery-label">Phone</span>
                    <span className="delivery-value">{orderDetails.phoneNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="order-items-section">
                <h3>Order Items</h3>
                <div className="order-items-list">
                  {orderDetails.items.map(item => (
                    <div key={item.id} className="order-item">
                      <div className="item-info">
                        <span className="item-name">{item.productName}</span>
                        <span className="item-quantity">x{item.quantity}</span>
                      </div>
                      <div className="item-prices">
                        <span className="unit-price">{formatCurrency(item.unitPrice)} each</span>
                        <span className="line-total">{formatCurrency(item.lineTotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="order-total-row">
                  <span>Total</span>
                  <span className="total-amount">{formatCurrency(orderDetails.totalPrice)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowDetailModal(false)}>Close</button>
              <button className="primary-btn" onClick={() => { setShowDetailModal(false); handleStatusClick(orderDetails); }}>
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content status-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Order Status</h2>
              <button className="modal-close" onClick={() => setShowStatusModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="status-order-info">Order #{selectedOrder.id}</p>
              <div className="status-options">
                {ORDER_STATUSES.map(status => {
                  const statusColor = getStatusColor(status);
                  return (
                    <button
                      key={status}
                      className={`status-option ${newStatus === status ? 'selected' : ''}`}
                      style={newStatus === status ? {
                        background: statusColor.bg,
                        borderColor: statusColor.border,
                        color: statusColor.text
                      } : {}}
                      onClick={() => setNewStatus(status)}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button 
                className="primary-btn" 
                onClick={handleStatusUpdate}
                disabled={submitting || newStatus === selectedOrder.status}
              >
                {submitting ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Order</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <span className="warning-icon">⚠️</span>
                <p>Are you sure you want to delete Order #{selectedOrder.id}?</p>
                <p className="warning-text">This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button 
                className="danger-btn" 
                onClick={handleDeleteConfirm}
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Delete Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderManagement;
