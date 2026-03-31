import { useState, useEffect } from 'react'
import './App.css'

const API_BASE = '/api'

function App() {
  //未登录
  const [user, setUser] = useState(null)
  //管理员测试
  // const [user, setUser] = useState({ name: 'Admin', role: 'ADMIN', email: 'admin@library.com' })
  // Librarian Test
  // const [user, setUser] = useState({ name: 'Librarian', role: 'LIBRARIAN', email: 'book_admin@library.com' })
  // Reader Test
  // const [user, setUser] = useState({ name: 'Reader', role: 'READER', email: 'reader@library.com' })

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
      console.error('获取统计数据失败:', err)
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
      console.error('获取用户失败:', err)
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
        setError(data.message || '登录失败')
      }
    } catch (err) {
      setError('登录失败：' + err.message)
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

  // 获取角色中文名称
  const getRoleName = (role) => {
    const roles = { 'ADMIN': 'Admin', 'LIBRARIAN': 'Librarian', 'STUDENT': 'Student' }
    return roles[role] || role
  }

  if (!user) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h1>📚 library management system</h1>
            <p>Library Management System</p>
          </div>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="text"
              placeholder="邮箱"
              value={loginForm.userName}
              onChange={(e) => setLoginForm({ ...loginForm, userName: e.target.value })}
              className="login-input"
              required
            />
            <input
              type="password"
              placeholder="密码"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="login-input"
              required
            />
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          <div className="test-accounts">
            <strong>测试账号:</strong>
            <div>管理员：admin@library.com (密码：admin123)</div>
            <div>读者：student1@library.com (密码：student123)</div>
          </div>
        </div>
      </div>
    )
  }

  // 仪表板页面
  const renderDashboard = () => (
    <div className="content">
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2>welcome,{user.name}！</h2>
          {/* 显示电脑日期 */}
          <p>today is {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
        </div>
        <div className="banner-icon">📚</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📖</div>
          <div className="stat-content">
            <h3>{stats.totalBooks}</h3>
            <p>Total Books</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-content">
            <h3>{stats.availableBooks}</h3>
            <p>Available</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">📋</div>
          <div className="stat-content">
            <h3>{stats.myLoans}</h3>
            <p>我的借阅</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingHolds}</h3>
            <p>待处理预约</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>快速操作</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-btn blue" onClick={() => setCurrentPage('books')}>🔍 搜索图书</button>
          <button className="quick-action-btn green" onClick={() => setCurrentPage('loans')}>📋 我的借阅</button>
          {user.role === 'LIBRARIAN' || user.role === 'ADMIN' ? (
            <button className="quick-action-btn orange" onClick={() => setCurrentPage('manage')}>⚙️ 图书管理</button>
          ) : null}
          {user.role === 'ADMIN' ? (
            <button className="quick-action-btn gray" onClick={() => setCurrentPage('users')}>👥 用户管理</button>
          ) : null}
        </div>
      </div>

      <div className="table-section">
        <h3>最近新增图书</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>书名</th>
              <th>作者</th>
              <th>ISBN</th>
              <th>分类</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {books.slice(0, 5).map((book) => (
              <tr key={book.id}>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>{book.isbn}</td>
                <td>{book.genre}</td>
                <td>
                  <span className={`status-badge ${book.available ? 'success' : 'danger'}`}>
                    {book.available ? '可借' : '已借出'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {books.length === 0 && <div className="no-data">暂无数据</div>}
      </div>
    </div>
  )

  // 图书浏览页面
  const renderBooks = () => (
    <div className="content">
      <div className="page-header">
        <h2>📖 图书浏览</h2>
      </div>
      <div className="books-grid">
        {books.map((book) => (
          <div key={book.id} className="book-card">
            <div className="book-cover">📚</div>
            <div className="book-info">
              <h3>{book.title}</h3>
              <p className="book-author">{book.author}</p>
              <p className="book-detail">ISBN: {book.isbn}</p>
              <p className="book-detail">分类：{book.genre} | 语言：{book.language}</p>
              <div className="book-status">
                <span className={`status-badge ${book.available ? 'success' : 'danger'}`}>
                  {book.available ? '可借' : '已借出'}
                </span>
              </div>
              {book.available && <button className="borrow-btn">立即借阅</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // 借阅页面
  const renderLoans = () => (
    <div className="content">
      <div className="page-header">
        <h2>📋 我的借阅</h2>
      </div>
      <div className="table-section">
        <table className="data-table">
          <thead>
            <tr>
              <th>书名</th>
              <th>借出日期</th>
              <th>应还日期</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="5" className="no-data">暂无借阅记录</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="dashboard-container">
      {/* 侧边栏 */}
      <aside className="sidebar">
        
        <nav className="sidebar-menu">
          <div className={`menu-item ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('dashboard')}>
            <span className="icon">🏠</span>
            <span>dashboard</span>
          </div>
          <div className={`menu-item ${currentPage === 'books' ? 'active' : ''}`} onClick={() => setCurrentPage('books')}>
            <span className="icon">📖</span>
            <span>图书浏览</span>
          </div>
          <div className={`menu-item ${currentPage === 'loans' ? 'active' : ''}`} onClick={() => setCurrentPage('loans')}>
            <span className="icon">📋</span>
            <span>我的借阅</span>
          </div>
          {user.role === 'STUDENT' && (
            <div className={`menu-item ${currentPage === 'holds' ? 'active' : ''}`} onClick={() => setCurrentPage('holds')}>
              <span className="icon">⏳</span>
              <span>我的预约</span>
            </div>
          )}
          {(user.role === 'LIBRARIAN' || user.role === 'ADMIN') && (
            <>
              <div className="menu-section">管理员功能</div>
              <div className={`menu-item ${currentPage === 'manage' ? 'active' : ''}`} onClick={() => setCurrentPage('manage')}>
                <span className="icon">📚</span>
                <span>图书管理</span>
              </div>
              <div className={`menu-item ${currentPage === 'loans-manage' ? 'active' : ''}`} onClick={() => setCurrentPage('loans-manage')}>
                <span className="icon">🔄</span>
                <span>借阅管理</span>
              </div>
            </>
          )}
          {user.role === 'ADMIN' && (
            <>
              <div className="menu-section">系统管理</div>
              <div className={`menu-item ${currentPage === 'users' ? 'active' : ''}`} onClick={() => setCurrentPage('users')}>
                <span className="icon">👥</span>
                <span>用户管理</span>
              </div>
              <div className={`menu-item ${currentPage === 'settings' ? 'active' : ''}`} onClick={() => setCurrentPage('settings')}>
                <span className="icon">⚙️</span>
                <span>系统设置</span>
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
        <button className="logout-btn" onClick={handleLogout}>退出登录</button>
      </aside>

      {/* 主内容 */}
      <main className="main-content">
        <header className="top-nav">
          <span className="breadcrumb">首页</span>
          <div className="top-user">
            <span className="top-user-name">{user.name}</span>
            <span className="role-badge">{getRoleName(user.role)}</span>
          </div>
        </header>
        {currentPage === 'dashboard' && renderDashboard()}
        {currentPage === 'books' && renderBooks()}
        {currentPage === 'loans' && renderLoans()}
        {currentPage !== 'dashboard' && currentPage !== 'books' && currentPage !== 'loans' && (
          <div className="content"><div className="page-header"><h2>开发中...</h2></div></div>
        )}
      </main>
    </div>
  )
}

export default App
