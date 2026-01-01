import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import SignUp from './components/SignUp'
import AdminDashboard from './components/AdminDashboard'
import UserManagement from './components/UserManagement'
import BrandManagement from './components/BrandManagement'
import IngredientManagement from './components/IngredientManagement'
import CategoryManagement from './components/CategoryManagement'
import ProductManagement from './components/ProductManagement'
import OrderManagement from './components/OrderManagement'
import UserDashboard from './components/UserDashboard'
import './App.css'

// Component to handle home route based on user role
function HomeRedirect() {
  const userRole = localStorage.getItem('userRole');
  const token = localStorage.getItem('token');
  
  // If admin is logged in, redirect to admin dashboard
  if (token && userRole === 'Administrator') {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Otherwise show user dashboard (shop)
  return <UserDashboard />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/shop" element={<UserDashboard />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/brands" element={<BrandManagement />} />
        <Route path="/ingredients" element={<IngredientManagement />} />
        <Route path="/categories" element={<CategoryManagement />} />
        <Route path="/products" element={<ProductManagement />} />
        <Route path="/orders" element={<OrderManagement />} />
      </Routes>
    </Router>
  )
}

export default App
