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
          <div className="stat-icon">
            <svg className="stat-svg total-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Orders</span>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">
            <svg className="stat-svg pending-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-card processing">
          <div className="stat-icon">
            <svg className="stat-svg processing-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.processing}</span>
            <span className="stat-label">Processing</span>
          </div>
        </div>
        <div className="stat-card shipped">
          <div className="stat-icon">
            <svg className="stat-svg shipped-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.shipped}</span>
            <span className="stat-label">Shipped</span>
          </div>
        </div>
        <div className="stat-card delivered">
          <div className="stat-icon">
            <svg className="stat-svg delivered-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.delivered}</span>
            <span className="stat-label">Delivered</span>
          </div>
        </div>
        <div className="stat-card revenue">
          <div className="stat-icon">
            <svg className="stat-svg revenue-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
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
          <h3 className="chart-title">
            <svg className="title-icon chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Orders This Week
          </h3>
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
          <h3 className="chart-title">
            <svg className="title-icon trophy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
            </svg>
            Top Selling Products
          </h3>
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
            <span className="empty-icon">
              <svg className="empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                <line x1="8" y1="10" x2="16" y2="10"/>
                <line x1="8" y1="14" x2="16" y2="14"/>
                <line x1="8" y1="18" x2="12" y2="18"/>
              </svg>
            </span>
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
                    <td>
                      <div className="customer-info">
                        <span className="customer-name">{order.userName}</span>
                        <span className="customer-username">@{order.userUsername}</span>
                      </div>
                    </td>
                    <td>
                      <div className="location-info">
                        <span className="location-city">{order.city || 'N/A'}</span>
                        <span className="location-province">{order.province || ''}</span>
                      </div>
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
                    <td>
                      <div className="actions-cell">
                        <button className="action-btn view-btn" onClick={() => handleViewDetails(order)} title="View Details">
                          <svg className="action-icon view-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        <button className="action-btn status-btn" onClick={() => handleStatusClick(order)} title="Update Status">
                          <svg className="action-icon edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button className="action-btn delete-btn" onClick={() => handleDeleteClick(order)} title="Delete Order">
                          <svg className="action-icon delete-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        </button>
                      </div>
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
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                <svg className="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
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
                <h3>
                  <svg className="section-icon location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Delivery Information
                </h3>
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
              <button className="modal-close" onClick={() => setShowStatusModal(false)}>
                <svg className="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
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
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <svg className="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <span className="warning-icon">
                  <svg className="warning-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </span>
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
