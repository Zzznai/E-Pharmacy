import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(username, password);
      console.log('Login successful:', response);
      // Redirect based on user role
      if (response.role === 'Administrator') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Floating Medications */}
      <div className="floating-meds">
        <div className="med-item">💊</div>
        <div className="med-item">💉</div>
        <div className="med-item">🩹</div>
        <div className="med-item">💊</div>
        <div className="med-item">💉</div>
        <div className="med-item">🧴</div>
        <div className="med-item">💊</div>
        <div className="med-item">🩹</div>
        <div className="med-item">🧪</div>
        <div className="med-item">💊</div>
        <div className="med-item">🩼</div>
        <div className="med-item">💉</div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <h1>E-Pharmacy</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <button type="button" className="link-button" onClick={() => navigate('/signup')}>Sign Up</button></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
