import { useState, useEffect } from 'react'
import './App.css'
import ReaderDashboard from './components/reader/ReaderDashboard'
import LibrarianDashboard from './components/librarian/LibrarianDashboard'
import AdminDashboard from './components/admin/AdminDashboard'

const API_BASE = '/api'

function App() {
  //未登录
  const [user, setUser] = useState(null)
  //管理员测试
  // const [user, setUser] = useState({ name: 'Admin', role: 'ADMIN', email: 'admin@library.com' })
  // Librarian Test
  // const [user, setUser] = useState({ name: 'Librarian', role: 'LIBRARIAN', email: 'book_admin@library.com' })
  // Reader Test
  // const [user, setUser] = useState({ name: 'Reader', role: 'STUDENT', email: 'reader@library.com' })

  const [currentPage, setCurrentPage] = useState('dashboard')
  const [loginForm, setLoginForm] = useState({ userName: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ totalBooks: 0, availableBooks: 0, myLoans: 0, pendingHolds: 0 })
  const [books, setBooks] = useState([])
  const [loans, setLoans] = useState([])

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const [booksRes, loansRes] = await Promise.all([
        fetch(`${API_BASE}/books`),
        token ? fetch(`${API_BASE}/loans/current`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }) : Promise.resolve(null)
      ])
      const booksData = await booksRes.json()
      const totalBooks = booksData.data?.books?.length || booksData.books?.length || 0
      const availableBooks = (booksData.data?.books || booksData.books || []).filter(b => b.available).length

      let myLoans = 0
      if (loansRes && loansRes.ok) {
        const loansData = await loansRes.json()
        myLoans = loansData.data?.loans?.length || 0
      }

      setStats({ totalBooks, availableBooks, myLoans, pendingHolds: 0 })
      setBooks(booksData.data?.books || booksData.books || [])
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  // 获取当前用户
  const fetchUser = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const result = await res.json()
        setUser(result.data)
        fetchStats()
      }
    } catch (err) {
      console.error('Failed to fetch user:', err)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  // 登录
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: loginForm.userName, password: loginForm.password })
      })
      const data = await res.json()
      if (res.ok) {
        const userData = { name: data.data.userName, role: data.data.role, email: data.data.userName }
        setUser(userData)
        localStorage.setItem('token', data.data.token)
        setLoginForm({ userName: '', password: '' })
        fetchStats()
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Login failed: ' + err.message)
    }
    setLoading(false)
  }

  // 登出
  const handleLogout = async () => {
    localStorage.removeItem('token')
    setUser(null)
    setStats({ totalBooks: 0, availableBooks: 0, myLoans: 0, pendingHolds: 0 })
    setCurrentPage('dashboard')
  }

  // Get role display name
  const getRoleName = (role) => {
    const roles = { 'ADMIN': 'Admin', 'LIBRARIAN': 'Librarian', 'STUDENT': 'Student' }
    return roles[role] || role
  }

  if (!user) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h1>📚 Library Management System</h1>
            <p>Welcome to the Library</p>
          </div>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="text"
              placeholder="Email"
              value={loginForm.userName}
              onChange={(e) => setLoginForm({ ...loginForm, userName: e.target.value })}
              className="login-input"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="login-input"
              required
            />
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="test-accounts">
            <strong>Test Accounts:</strong>
            <div>Admin: admin@library.com (Password: admin123)</div>
            <div>Librarian: librarian@library.com (Password: lib123)</div>
            <div>Student: student1@library.com (Password: student123)</div>
          </div>
        </div>
      </div>
    )
  }

  const renderRoleDashboard = () => {
    switch (user.role) {
      case 'ADMIN':
        return <AdminDashboard 
          user={user} 
          stats={stats} 
          books={books} 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
        />
      case 'LIBRARIAN':
        return <LibrarianDashboard 
          user={user} 
          stats={stats} 
          books={books} 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
        />
      case 'STUDENT':
        return <ReaderDashboard 
          user={user} 
          stats={stats} 
          books={books} 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
        />
      default:
        return <div className="content"><div className="page-header"><h2>Access denied</h2></div></div>
    }
  }

  return (
    <div className="dashboard-container">
      {/* 侧边栏 */}
      <aside className="sidebar">
        <nav className="sidebar-menu">
          <div className={`menu-item ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('dashboard')}>
            <span className="icon">🏠</span>
            <span>Dashboard</span>
          </div>
          <div className={`menu-item ${currentPage === 'books' ? 'active' : ''}`} onClick={() => setCurrentPage('books')}>
            <span className="icon">📖</span>
            <span>Books</span>
          </div>
          <div className={`menu-item ${currentPage === 'loans' ? 'active' : ''}`} onClick={() => setCurrentPage('loans')}>
            <span className="icon">📋</span>
            <span>My Loans</span>
          </div>
          {user.role === 'STUDENT' && (
            <div className={`menu-item ${currentPage === 'holds' ? 'active' : ''}`} onClick={() => setCurrentPage('holds')}>
              <span className="icon">⏳</span>
              <span>My Holds</span>
            </div>
          )}
          {(user.role === 'LIBRARIAN' || user.role === 'ADMIN') && (
            <>
              <div className="menu-section">Staff Functions</div>
              <div className={`menu-item ${currentPage === 'manage' ? 'active' : ''}`} onClick={() => setCurrentPage('manage')}>
                <span className="icon">📚</span>
                <span>Book Management</span>
              </div>
              <div className={`menu-item ${currentPage === 'loans-manage' ? 'active' : ''}`} onClick={() => setCurrentPage('loans-manage')}>
                <span className="icon">🔄</span>
                <span>Loan Management</span>
              </div>
            </>
          )}
          {user.role === 'ADMIN' && (
            <>
              <div className="menu-section">System Management</div>
              <div className={`menu-item ${currentPage === 'users' ? 'active' : ''}`} onClick={() => setCurrentPage('users')}>
                <span className="icon">👥</span>
                <span>User Management</span>
              </div>
              <div className={`menu-item ${currentPage === 'settings' ? 'active' : ''}`} onClick={() => setCurrentPage('settings')}>
                <span className="icon">⚙️</span>
                <span>System Settings</span>
              </div>
            </>
          )}
        </nav>
        <div className="user-info">
          <div className="user-avatar">{user.name[0].toUpperCase()}</div>
          <div className="user-details">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{getRoleName(user.role)}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </aside>

      {/* 主内容 */}
      <main className="main-content">
        <header className="top-nav">
          <span className="breadcrumb">Home</span>
          <div className="top-user">
            <span className="top-user-name">{user.name}</span>
            <span className="role-badge">{getRoleName(user.role)}</span>
          </div>
        </header>
        {renderRoleDashboard()}
      </main>
    </div>
  )
}

export default App
