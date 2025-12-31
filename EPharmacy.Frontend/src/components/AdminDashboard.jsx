import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [userInfo] = useState(() => authService.getUserInfo());

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      navigate('/');
      return;
    }

    // Check if user is admin
    if (userInfo?.role !== 'Administrator') {
      alert('Access denied. Admin privileges required.');
      navigate('/');
    }
  }, [navigate, userInfo]);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  if (!userInfo) {
    navigate('/');
    return null;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="header-content">
          <h1>E-Pharmacy Admin Dashboard</h1>
          <div className="user-info">
            <span className="welcome-text">Welcome, {userInfo.firstName} {userInfo.lastName}</span>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="dashboard-grid">
          <div className="dashboard-card" onClick={() => navigate('/users')}>
            <div className="card-icon-wrapper">
              <div className="icon-users">
                <div className="id-card">
                  <div className="id-photo"></div>
                  <div className="id-lines"></div>
                  <div className="id-badge"></div>
                </div>
              </div>
            </div>
            <h3>Users</h3>
            <p>Manage user accounts and permissions</p>
            <button className="card-button" onClick={(e) => { e.stopPropagation(); navigate('/users'); }}>View Users</button>
          </div>

          <div className="dashboard-card" onClick={() => navigate('/products')}>
            <div className="card-icon-wrapper">
              <div className="icon-products">
                <div className="capsule-container">
                  <div className="pill-orbit">
                    <div className="mini-orbit-pill"></div>
                  </div>
                  <div className="pill-orbit">
                    <div className="mini-orbit-pill"></div>
                  </div>
                  <div className="pill-orbit">
                    <div className="mini-orbit-pill"></div>
                  </div>
                  <div className="capsule">
                    <div className="capsule-half left"></div>
                    <div className="capsule-half right"></div>
                    <div className="capsule-shine"></div>
                  </div>
                  <div className="product-sparkle product-sparkle-1"></div>
                  <div className="product-sparkle product-sparkle-2"></div>
                  <div className="product-sparkle product-sparkle-3"></div>
                  <div className="plus-symbol"></div>
                </div>
              </div>
            </div>
            <h3>Products</h3>
            <p>Manage pharmacy products and inventory</p>
            <button className="card-button" onClick={(e) => { e.stopPropagation(); navigate('/products'); }}>View Products</button>
          </div>

          <div className="dashboard-card" onClick={() => navigate('/orders')}>
            <div className="card-icon-wrapper">
              <div className="icon-orders">
                <div className="package">
                  <div className="package-top"></div>
                  <div className="package-flap left"></div>
                  <div className="package-flap right"></div>
                  <div className="package-body">
                    <div className="package-tape"></div>
                    <div className="package-shine"></div>
                    <div className="package-label"></div>
                  </div>
                </div>
              </div>
            </div>
            <h3>Orders</h3>
            <p>View and manage customer orders</p>
            <button className="card-button" onClick={(e) => { e.stopPropagation(); navigate('/orders'); }}>View Orders</button>
          </div>

          <div className="dashboard-card" onClick={() => navigate('/categories')}>
            <div className="card-icon-wrapper">
              <div className="icon-categories">
                <div className="folder">
                  <div className="folder-tab"></div>
                  <div className="folder-paper"></div>
                  <div className="folder-front"></div>
                </div>
              </div>
            </div>
            <h3>Categories</h3>
            <p>Manage product categories</p>
            <button className="card-button" onClick={(e) => { e.stopPropagation(); navigate('/categories'); }}>View Categories</button>
          </div>

          <div className="dashboard-card" onClick={() => navigate('/ingredients')}>
            <div className="card-icon-wrapper">
              <div className="icon-ingredients">
                <div className="beaker">
                  <div className="beaker-liquid">
                    <div className="bubble bubble-1"></div>
                    <div className="bubble bubble-2"></div>
                  </div>
                </div>
                <div className="flask">
                  <div className="flask-top"></div>
                  <div className="flask-body">
                    <div className="flask-liquid">
                      <div className="bubble bubble-3"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <h3>Ingredients</h3>
            <p>Manage product ingredients</p>
            <button className="card-button" onClick={(e) => { e.stopPropagation(); navigate('/ingredients'); }}>View Ingredients</button>
          </div>

          <div className="dashboard-card" onClick={() => navigate('/brands')}>
            <div className="card-icon-wrapper">
              <div className="icon-brands">
                <div className="brand-badge">
                  <div className="badge-ribbon-left"></div>
                  <div className="badge-ribbon-right"></div>
                  <div className="badge-circle">
                    <div className="badge-star"></div>
                  </div>
                  <div className="badge-sparkle sparkle-1"></div>
                  <div className="badge-sparkle sparkle-2"></div>
                  <div className="badge-sparkle sparkle-3"></div>
                </div>
              </div>
            </div>
            <h3>Brands</h3>
            <p>Manage product brands</p>
            <button className="card-button" onClick={(e) => { e.stopPropagation(); navigate('/brands'); }}>View Brands</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
