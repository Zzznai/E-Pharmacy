import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import './UserManagement.css';

function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    isAdmin: false
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/');
      return;
    }

    const userInfo = authService.getUserInfo();
    if (userInfo?.role !== 'Administrator') {
      navigate('/dashboard');
      return;
    }

    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      isAdmin: false
    });
    setFormError('');
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.role === 'Administrator'
    });
    setFormError('');
    setShowModal(true);
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      return;
    }

    try {
      await userService.delete(user.id);
      setUsers(users.filter(u => u.id !== user.id));
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleChangePassword = (user) => {
    setPasswordUser(user);
    setPasswordData({
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 4) {
      setPasswordError('Password must be at least 4 characters');
      return;
    }

    setPasswordLoading(true);

    try {
      await userService.changePassword(passwordUser.id, '', passwordData.newPassword);
      setShowPasswordModal(false);
      alert('Password changed successfully!');
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      if (editingUser) {
        await userService.update(editingUser.id, {
          firstName: formData.firstName,
          lastName: formData.lastName
        });
      } else {
        if (!formData.username || !formData.password) {
          throw new Error('Username and password are required');
        }
        await userService.create({
          username: formData.username,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        }, formData.isAdmin);
      }

      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="user-management-container">
        <div className="loading-state">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <div className="header-left">
          <button className="back-button" onClick={handleBack}>
            ← Back
          </button>
          <h1>User Management</h1>
        </div>
        <button className="add-user-button" onClick={handleAddUser}>
          + Add User
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="search-container">
        <div className="search-input-wrapper">
          <div className="search-icon">
            <div className="lens-glow"></div>
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="Search by username, name, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              ×
            </button>
          )}
        </div>
        <span className="search-results-count">
          {users.filter(user => {
            const query = searchQuery.toLowerCase();
            return (
              user.username.toLowerCase().includes(query) ||
              user.firstName.toLowerCase().includes(query) ||
              user.lastName.toLowerCase().includes(query) ||
              user.role.toLowerCase().includes(query)
            );
          }).length} users found
        </span>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter(user => {
                const query = searchQuery.toLowerCase();
                return (
                  user.username.toLowerCase().includes(query) ||
                  user.firstName.toLowerCase().includes(query) ||
                  user.lastName.toLowerCase().includes(query) ||
                  user.role.toLowerCase().includes(query)
                );
              })
              .map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.firstName}</td>
                <td>{user.lastName}</td>
                <td>
                  <span className={`role-badge ${user.role === 'Administrator' ? 'admin' : 'customer'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="edit-button" onClick={() => handleEditUser(user)}>
                    Edit
                  </button>
                  <button className="password-button" onClick={() => handleChangePassword(user)}>
                    Password
                  </button>
                  <button className="delete-button" onClick={() => handleDeleteUser(user)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="empty-state">No users found</div>
        )}
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="user-form">
              {formError && <div className="form-error">{formError}</div>}

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={!!editingUser}
                  placeholder="Enter username"
                  required={!editingUser}
                />
              </div>

              {!editingUser && (
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    required
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last name"
                  />
                </div>
              </div>

              {!editingUser && (
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isAdmin"
                      checked={formData.isAdmin}
                      onChange={handleInputChange}
                    />
                    <div className="toggle-switch"></div>
                    <div className="toggle-content">
                      <span className="toggle-title">
                        <span className="admin-icon">👑</span>
                        Administrator Access
                      </span>
                      <span className="toggle-description">
                        Grant full system privileges and management capabilities
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-button" disabled={formLoading}>
                  {formLoading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="user-form">
              {passwordError && <div className="form-error">{passwordError}</div>}

              <div className="password-user-info">
                <span className="label">Changing password for:</span>
                <span className="username">{passwordUser?.username}</span>
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-button" disabled={passwordLoading}>
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
