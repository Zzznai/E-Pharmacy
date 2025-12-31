import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
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
