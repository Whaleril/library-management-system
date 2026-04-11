import React, { useState, useEffect } from 'react'

const API_BASE = '/api/librarian'

const LibrarianDashboard = ({ user, stats: initialStats, books: initialBooks, currentPage, setCurrentPage, handleLogout, getRoleName, getPageName }) => {
  const [books, setBooks] = useState([])
  const [stats, setStats] = useState({ totalBooks: 0, availableBooks: 0, myLoans: 0, pendingHolds: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)

  // Form states
  const [addForm, setAddForm] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: 'Technology',
    language: 'English',
    shelfLocation: '',
    availableCopies: 1,
    description: '',
    cover: ''
  })

  const [editForm, setEditForm] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    language: '',
    shelfLocation: '',
    availableCopies: 1,
    description: '',
    cover: ''
  })

  const GENRES = ['Technology', 'Fiction', 'Science', 'History', 'Management']
  const LANGUAGES = ['Chinese', 'English', 'Others']

  // Get auth token
  const getToken = () => localStorage.getItem('token')

  // Fetch books from API
  const fetchBooks = async (page = 1, size = 20) => {
    setLoading(true)
    setError('')
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/books?page=${page}&size=${size}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.code === 200) {
        setBooks(result.data.list || [])
        setStats(prev => ({
          ...prev,
          totalBooks: result.data.total || 0,
          availableBooks: (result.data.list || []).filter(b => b.available).length
        }))
      } else {
        setError(result.message || 'Failed to fetch books')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    if (currentPage !== 'dashboard') {
      fetchBooks()
    }
  }, [currentPage])

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('')
        setSuccess('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  // Handle add book
  const handleAddBook = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addForm)
      })
      const result = await res.json()
      if (result.code === 200) {
        setSuccess('Book added successfully')
        setShowAddModal(false)
        resetAddForm()
        fetchBooks()
      } else {
        setError(result.message || 'Failed to add book')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle edit book
  const handleEditBook = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/books/${selectedBook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      })
      const result = await res.json()
      if (result.code === 200) {
        setSuccess('Book updated successfully')
        setShowEditModal(false)
        setSelectedBook(null)
        fetchBooks()
      } else {
        setError(result.message || 'Failed to update book')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle delete book
  const handleDeleteBook = async () => {
    setLoading(true)
    setError('')
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/books/${selectedBook.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.code === 200) {
        setSuccess('Book deleted successfully')
        setShowDeleteConfirm(false)
        setSelectedBook(null)
        fetchBooks()
      } else {
        setError(result.message || 'Failed to delete book')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Reset forms
  const resetAddForm = () => {
    setAddForm({
      title: '',
      author: '',
      isbn: '',
      genre: 'Technology',
      language: 'English',
      shelfLocation: '',
      availableCopies: 1,
      description: '',
      cover: ''
    })
  }

  // Open edit modal with book data
  const openEditModal = (book) => {
    setSelectedBook(book)
    setEditForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      genre: book.genre,
      language: book.language,
      shelfLocation: book.shelfLocation || '',
      availableCopies: book.availableCopies,
      description: book.description || '',
      cover: book.cover || ''
    })
    setShowEditModal(true)
  }

  // Open delete confirmation
  const openDeleteConfirm = (book) => {
    setSelectedBook(book)
    setShowDeleteConfirm(true)
  }

  // Render Dashboard view
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
            <p>Active Loans</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">⏳</div>
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
          <button className="quick-action-btn green" onClick={() => setCurrentPage('loans-manage')}>📋 Manage Loans</button>
          <button className="quick-action-btn orange" onClick={() => setCurrentPage('manage')}>⚙️ Book Management</button>
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

  // Render Books view
  const renderBooks = () => (
    <div className="content">
      <div className="page-header">
        <h2>📖 Books</h2>
      </div>
      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <div className="books-grid">
        {books.map((book) => (
          <div key={book.id} className="book-card">
            <div className="book-cover">📚</div>
            <div className="book-info">
              <h3>{book.title}</h3>
              <p className="book-author">{book.author}</p>
              <p className="book-detail">ISBN: {book.isbn}</p>
              <p className="book-detail">Genre: {book.genre} | Language: {book.language}</p>
              <p className="book-detail">Location: {book.shelfLocation || 'N/A'}</p>
              <p className="book-detail">Copies: {book.availableCopies}</p>
              <div className="book-status">
                <span className={`status-badge ${book.available ? 'success' : 'danger'}`}>
                  {book.available ? 'Available' : 'Borrowed'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {books.length === 0 && !loading && <div className="no-data">No books found</div>}
    </div>
  )

  // Render Manage Books view
  const renderManageBooks = () => (
    <div className="content">
      <div className="page-header">
        <h2>⚙️ Book Management</h2>
      </div>
      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <div className="management-section">
        <div className="action-buttons">
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add New Book</button>
          <button className="btn-secondary" onClick={() => fetchBooks()}>🔄 Refresh</button>
        </div>
        <div className="table-section">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>ISBN</th>
                <th>Genre</th>
                <th>Available</th>
                <th>Copies</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id}>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.isbn}</td>
                  <td>{book.genre}</td>
                  <td>
                    <span className={`status-badge ${book.available ? 'success' : 'danger'}`}>
                      {book.available ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>{book.availableCopies}</td>
                  <td>
                    <button className="btn-sm" onClick={() => openEditModal(book)}>Edit</button>
                    <button className="btn-sm danger" onClick={() => openDeleteConfirm(book)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {books.length === 0 && !loading && <div className="no-data">No books found</div>}
        </div>
      </div>
    </div>
  )

  // Render Loan Management view
  const renderLoanManagement = () => (
    <div className="content">
      <div className="page-header">
        <h2>🔄 Loan Management</h2>
      </div>
      <div className="table-section">
        <table className="data-table">
          <thead>
            <tr>
              <th>Book Title</th>
              <th>User</th>
              <th>Checkout Date</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="6" className="no-data">No loan records</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )

  // Add Book Modal
  const renderAddModal = () => (
    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Book</h3>
          <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
        </div>
        <form onSubmit={handleAddBook}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              required
              value={addForm.title}
              onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
              placeholder="Enter book title"
            />
          </div>
          <div className="form-group">
            <label>Author *</label>
            <input
              type="text"
              required
              value={addForm.author}
              onChange={(e) => setAddForm({ ...addForm, author: e.target.value })}
              placeholder="Enter author name"
            />
          </div>
          <div className="form-group">
            <label>ISBN *</label>
            <input
              type="text"
              required
              value={addForm.isbn}
              onChange={(e) => setAddForm({ ...addForm, isbn: e.target.value })}
              placeholder="Enter ISBN"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Genre *</label>
              <select
                required
                value={addForm.genre}
                onChange={(e) => setAddForm({ ...addForm, genre: e.target.value })}
              >
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Language *</label>
              <select
                required
                value={addForm.language}
                onChange={(e) => setAddForm({ ...addForm, language: e.target.value })}
              >
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Shelf Location</label>
              <input
                type="text"
                value={addForm.shelfLocation}
                onChange={(e) => setAddForm({ ...addForm, shelfLocation: e.target.value })}
                placeholder="e.g., TECH-001"
              />
            </div>
            <div className="form-group">
              <label>Available Copies</label>
              <input
                type="number"
                min="0"
                value={addForm.availableCopies}
                onChange={(e) => setAddForm({ ...addForm, availableCopies: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={addForm.description}
              onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
              placeholder="Book description"
              rows="3"
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  // Edit Book Modal
  const renderEditModal = () => (
    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Book</h3>
          <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
        </div>
        <form onSubmit={handleEditBook}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Author</label>
            <input
              type="text"
              value={editForm.author}
              onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>ISBN</label>
            <input
              type="text"
              value={editForm.isbn}
              onChange={(e) => setEditForm({ ...editForm, isbn: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Genre</label>
              <select
                value={editForm.genre}
                onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
              >
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Language</label>
              <select
                value={editForm.language}
                onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
              >
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Shelf Location</label>
              <input
                type="text"
                value={editForm.shelfLocation}
                onChange={(e) => setEditForm({ ...editForm, shelfLocation: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Available Copies</label>
              <input
                type="number"
                min="0"
                value={editForm.availableCopies}
                onChange={(e) => setEditForm({ ...editForm, availableCopies: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows="3"
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  // Delete Confirmation Modal
  const renderDeleteConfirm = () => (
    <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
      <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Confirm Delete</h3>
          <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>×</button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to delete this book?</p>
          <p className="book-title-highlight">{selectedBook?.title}</p>
          <p className="warning-text">This action cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
          <button className="btn-danger" onClick={handleDeleteBook} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )

  switch (currentPage) {
    case 'dashboard':
      return renderDashboard()
    case 'books':
      return renderBooks()
    case 'manage':
      return renderManageBooks()
    case 'loans-manage':
      return renderLoanManagement()
    default:
      return <div className="content"><div className="page-header"><h2>Under development...</h2></div></div>
  }
}

export default LibrarianDashboard
