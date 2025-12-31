import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import SignUp from './components/SignUp'
import AdminDashboard from './components/AdminDashboard'
import UserManagement from './components/UserManagement'
import BrandManagement from './components/BrandManagement'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/brands" element={<BrandManagement />} />
      </Routes>
    </Router>
  )
}

export default App
