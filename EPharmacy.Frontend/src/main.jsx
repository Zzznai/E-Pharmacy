import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Clear expired tokens on app startup
const tokenExpiry = localStorage.getItem('tokenExpiry');
if (tokenExpiry) {
  const expiryDate = new Date(tokenExpiry);
  if (expiryDate <= new Date()) {
    // Token expired, clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
