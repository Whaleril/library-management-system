import { useState, useEffect } from 'react'

const API_BASE = '/api'

const ReaderDashboard = ({ user, stats, books, loans, currentPage, setCurrentPage, onRefreshStats }) => {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [bookDetail, setBookDetail] = useState(null)
  const [borrowLoading, setBorrowLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // 图书列表分页状态
  const [allBooks, setAllBooks] = useState([])
  const [allBooksLoading, setAllBooksLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0 })

  // 个人中心状态
  const [profile, setProfile] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', studentId: '' })
  const [profileLoading, setProfileLoading] = useState(false)

  // 获取所有图书列表（分页）
  const fetchAllBooks = async (page = 1, size = 10) => {
    setAllBooksLoading(true)
    try {
      const res = await fetch(`${API_BASE}/books?page=${page}&size=${size}`)
      const data = await res.json()
      if (res.ok) {
        setAllBooks(data.data?.list || [])
        setPagination({
          page: data.data?.page || page,
          size: data.data?.size || size,
          total: data.data?.total || 0
        })
      } else {
        showMessage('error', data.message || 'Failed to fetch book list')
      }
    } catch (err) {
      showMessage('error', 'Network error: ' + err.message)
    }
    setAllBooksLoading(false)
  }

  // 当进入图书页面时自动加载
  useEffect(() => {
    if (currentPage === 'books') {
      fetchAllBooks(pagination.page, pagination.size)
    }
  }, [currentPage])

  // Show message
  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  // Search books (1.3, 1.4)
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchKeyword.trim()) {
      // 如果搜索框为空，显示所有书籍
      fetchAllBooks(1, 10)
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    try {
      const params = new URLSearchParams({ keyword: searchKeyword, page: 1, size: 10 })

      const res = await fetch(`${API_BASE}/books/search?${params}`)
      const data = await res.json()
      if (res.ok) {
        setSearchResults(data.data?.list || data.list || [])
      } else {
        showMessage('error', data.message || 'Search failed')
      }
    } catch (err) {
      showMessage('error', 'Network error: ' + err.message)
    }
    setSearchLoading(false)
  }

  // 分页控制
  const handlePageChange = (newPage) => {
    if (newPage < 1) return
    const maxPage = Math.ceil(pagination.total / pagination.size)
    if (newPage > maxPage) return
    fetchAllBooks(newPage, pagination.size)
  }

  // View book detail (1.5)
  const handleViewDetail = async (bookId) => {
    try {
      const res = await fetch(`${API_BASE}/books/${bookId}`)
      const data = await res.json()
      if (res.ok) {
        setBookDetail(data.data)
        setSelectedBook(bookId)
      } else {
        showMessage('error', data.message || 'Failed to get book details')
      }
    } catch (err) {
      showMessage('error', 'Network error: ' + err.message)
    }
  }

  // Borrow book (1.9)
  const handleBorrow = async (bookId) => {
    setBorrowLoading(true)
    const token = localStorage.getItem('token')
    if (!token) {
      showMessage('error', 'Please login first')
      setBorrowLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE}/loans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookId })
      })
      const data = await res.json()
      if (res.ok) {
        showMessage('success', `Borrowed successfully! Due date: ${new Date(data.data.dueDate).toLocaleDateString('en-US')}`)
        onRefreshStats && onRefreshStats()
        // Refresh book detail
        if (bookDetail) handleViewDetail(bookId)
      } else {
        showMessage('error', data.message || 'Borrow failed')
      }
    } catch (err) {
      showMessage('error', 'Network error: ' + err.message)
    }
    setBorrowLoading(false)
  }

  // Get profile (1.8)
  const fetchProfile = async () => {
    setProfileLoading(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setProfile(data.data)
        setEditForm({ name: data.data.name, studentId: data.data.studentId || '' })
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    }
    setProfileLoading(false)
  }

  // Update profile (1.8)
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!editForm.name.trim()) {
      showMessage('error', 'Name is required')
      return
    }

    setProfileLoading(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      })
      const data = await res.json()
      if (res.ok) {
        setProfile(data.data)
        setEditMode(false)
        showMessage('success', 'Profile updated successfully')
      } else {
        showMessage('error', data.message || 'Update failed')
      }
    } catch (err) {
      showMessage('error', 'Network error: ' + err.message)
    }
    setProfileLoading(false)
  }

  // Render Dashboard
  const renderDashboard = () => (
    <div className="content">
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2>Welcome, {user.name}!</h2>
          <p>Today is {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
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
            <p>My Loans</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingHolds}</h3>
            <p>Pending Holds</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-btn blue" onClick={() => setCurrentPage('books')}>🔍 Search Books</button>
          <button className="quick-action-btn green" onClick={() => setCurrentPage('loans')}>📋 My Loans</button>
          <button className="quick-action-btn orange" onClick={() => setCurrentPage('profile')}>👤 My Profile</button>
        </div>
      </div>

      <div className="table-section">
        <h3>Recently Added Books</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>ISBN</th>
              <th>Genre</th>
              <th>Status</th>
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
                    {book.available ? 'Available' : 'Borrowed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {books.length === 0 && <div className="no-data">No data available</div>}
      </div>
    </div>
  )

  // Render Books Search (1.3, 1.4, 1.5)
  const renderBooks = () => (
    <div className="content">
      <div className="page-header">
        <h2>📖 Books</h2>
      </div>

      {/* Search Form */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Enter title or author..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn" disabled={searchLoading}>
            {searchLoading ? 'Searching...' : '🔍 Search'}
          </button>
        </form>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Book Detail Modal */}
      {bookDetail && selectedBook && (
        <div className="modal-overlay" onClick={() => { setSelectedBook(null); setBookDetail(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setSelectedBook(null); setBookDetail(null); }}>×</button>
            <div className="book-detail">
              <div className="book-detail-info">
                <h3>{bookDetail.title}</h3>
                <p className="book-detail-author">Author: {bookDetail.author}</p>
                <div className="book-detail-grid">
                  <div className="book-detail-item"><strong>ISBN:</strong> {bookDetail.isbn}</div>
                  <div className="book-detail-item"><strong>Genre:</strong> {bookDetail.genre}</div>
                  <div className="book-detail-item"><strong>Language:</strong> {bookDetail.language}</div>
                  <div className="book-detail-item"><strong>Location:</strong> {bookDetail.shelfLocation || 'N/A'}</div>
                  <div className="book-detail-item"><strong>Available Copies:</strong> {bookDetail.availableCopies}</div>
                  <div className="book-detail-item">
                    <strong>Status:</strong>
                    <span className={`status-badge ${bookDetail.available ? 'success' : 'danger'}`}>
                      {bookDetail.available ? 'Available' : 'Borrowed'}
                    </span>
                  </div>
                  {bookDetail.averageRating && (
                    <div className="book-detail-item"><strong>Avg Rating:</strong> ⭐ {bookDetail.averageRating.toFixed(1)}</div>
                  )}
                  {bookDetail.description && (
                    <div className="book-detail-item book-detail-desc"><strong>Description:</strong> {bookDetail.description}</div>
                  )}
                </div>
                {bookDetail.available && (
                  <button
                    className="borrow-btn"
                    onClick={() => handleBorrow(bookDetail.id)}
                    disabled={borrowLoading}
                  >
                    {borrowLoading ? 'Borrowing...' : '📖 Borrow Now'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results or All Books */}
      <div className="books-grid">
        {allBooksLoading || searchLoading ? (
          <div className="no-data">Loading...</div>
        ) : searchResults.length > 0 ? (
          // 显示搜索结果
          searchResults.map((book) => (
            <div key={book.id} className="book-card">
              <div className="book-cover" onClick={() => handleViewDetail(book.id)}>📚</div>
              <div className="book-info">
                <h3 onClick={() => handleViewDetail(book.id)} className="book-title-clickable">{book.title}</h3>
                <p className="book-author">{book.author}</p>
                <p className="book-detail">ISBN: {book.isbn}</p>
                <p className="book-detail">Genre: {book.genre}</p>
                <div className="book-status">
                  <span className={`status-badge ${book.available ? 'success' : 'danger'}`}>
                    {book.available ? 'Available' : 'Borrowed'}
                  </span>
                  {book.averageRating && <span className="rating">⭐ {book.averageRating.toFixed(1)}</span>}
                </div>
                {book.available && (
                  <button
                    className="borrow-btn"
                    onClick={() => handleBorrow(book.id)}
                    disabled={borrowLoading}
                  >
                    {borrowLoading ? 'Borrowing...' : 'Borrow'}
                  </button>
                )}
              </div>
            </div>
          ))
        ) : allBooks.length > 0 ? (
          // 显示所有书籍（默认）
          allBooks.map((book) => (
            <div key={book.id} className="book-card">
              <div className="book-cover" onClick={() => handleViewDetail(book.id)}>📚</div>
              <div className="book-info">
                <h3 onClick={() => handleViewDetail(book.id)} className="book-title-clickable">{book.title}</h3>
                <p className="book-author">{book.author}</p>
                <p className="book-detail">ISBN: {book.isbn}</p>
                <p className="book-detail">Genre: {book.genre}</p>
                <div className="book-status">
                  <span className={`status-badge ${book.available ? 'success' : 'danger'}`}>
                    {book.available ? 'Available' : 'Borrowed'}
                  </span>
                  {book.averageRating && <span className="rating">⭐ {book.averageRating.toFixed(1)}</span>}
                </div>
                {book.available && (
                  <button
                    className="borrow-btn"
                    onClick={() => handleBorrow(book.id)}
                    disabled={borrowLoading}
                  >
                    {borrowLoading ? 'Borrowing...' : 'Borrow'}
                  </button>
                )}
              </div>
            </div>
          ))
        ) : searchKeyword && !searchLoading ? (
          <div className="no-data">No books found</div>
        ) : (
          <div className="no-data">No books available</div>
        )}
      </div>

      {/* Pagination */}
      {searchResults.length === 0 && allBooks.length > 0 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.size)}
          </span>
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.size)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )

  // Render My Loans (1.6)
  const renderLoans = () => (
    <div className="content">
      <div className="page-header">
        <h2>📋 My Loans</h2>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="table-section">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Checkout Date</th>
              <th>Due Date</th>
              <th>Renewals</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loans && loans.length > 0 ? (
              loans.map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.bookTitle}</td>
                  <td>{loan.bookAuthor}</td>
                  <td>{new Date(loan.checkoutDate).toLocaleDateString('en-US')}</td>
                  <td>{new Date(loan.dueDate).toLocaleDateString('en-US')}</td>
                  <td>{loan.renewalCount || 0}</td>
                  <td>
                    <span className={`status-badge ${
                      loan.status === 'Borrowing' ? 'success' : 
                      loan.status === 'Overdue' ? 'danger' : 'info'
                    }`}>
                      {loan.status === 'Borrowing' ? 'Borrowing' : 
                       loan.status === 'Overdue' ? 'Overdue' : 'Returned'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">No loan records</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  // Render Profile (1.8)
  const renderProfile = () => {
    if (!profile && !profileLoading) {
      fetchProfile()
    }

    return (
      <div className="content">
        <div className="page-header">
          <h2>👤 My Profile</h2>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {profileLoading ? (
          <div className="loading">Loading...</div>
        ) : profile ? (
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">{profile.name[0].toUpperCase()}</div>
              <div className="profile-title">
                <h3>{profile.name}</h3>
                <p className="profile-role">Student</p>
              </div>
              {!editMode && (
                <button className="edit-btn" onClick={() => setEditMode(true)}>✏️ Edit</button>
              )}
            </div>

            {editMode ? (
              <form onSubmit={handleUpdateProfile} className="profile-form" noValidate>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="profile-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Student ID</label>
                  <input
                    type="text"
                    value={editForm.studentId || ''}
                    onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })}
                    className="profile-input"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="save-btn" disabled={profileLoading}>
                    {profileLoading ? 'Saving...' : '💾 Save'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={() => {
                    setEditMode(false)
                    setEditForm({ name: profile.name, studentId: profile.studentId || '' })
                  }}>
                    ❌ Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info">
                <div className="info-item">
                  <strong>Name:</strong> {profile.name}
                </div>
                <div className="info-item">
                  <strong>Email:</strong> {profile.email}
                </div>
                <div className="info-item">
                  <strong>Student ID:</strong> {profile.studentId || 'Not provided'}
                </div>
                <div className="info-item">
                  <strong>Role:</strong> Student
                </div>
                <div className="info-item">
                  <strong>Registered:</strong> {new Date(profile.createdAt).toLocaleDateString('en-US')}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="no-data">Unable to fetch profile</div>
        )}
      </div>
    )
  }

  switch (currentPage) {
    case 'dashboard':
      return renderDashboard()
    case 'books':
      return renderBooks()
    case 'loans':
      return renderLoans()
    case 'profile':
      return renderProfile()
    default:
      return <div className="content"><div className="page-header"><h2>Feature under development...</h2></div></div>
  }
}

export default ReaderDashboard
