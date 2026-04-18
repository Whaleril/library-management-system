import React, { useEffect, useState } from 'react'

const API_BASE = '/api/librarian'
const DEFAULT_STATS = { totalBooks: 0, availableBooks: 0, myLoans: 0, pendingHolds: 0 }
const GENRES = ['Technology', 'Fiction', 'Science', 'History', 'Management']
const LANGUAGES = ['Chinese', 'English', 'Others']

const formatDateLabel = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 16)
}

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`

const LibrarianDashboard = ({
  user,
  stats: initialStats = DEFAULT_STATS,
  books: initialBooks = [],
  currentPage,
  setCurrentPage
}) => {
  const [books, setBooks] = useState(initialBooks)
  const [stats, setStats] = useState({
    ...DEFAULT_STATS,
    ...initialStats,
    totalBooks: initialBooks.length || initialStats.totalBooks || 0,
    availableBooks: initialBooks.length
      ? initialBooks.filter(book => book.available).length
      : initialStats.availableBooks || 0
  })
  const [loading, setLoading] = useState(false)
  const [loanLoading, setLoanLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [returningLoanId, setReturningLoanId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [filterGenre, setFilterGenre] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loanRecords, setLoanRecords] = useState([])
  const [checkoutForm, setCheckoutForm] = useState({ userId: '', bookIdentifier: '' })
  const [checkoutErrors, setCheckoutErrors] = useState({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [returnTarget, setReturnTarget] = useState(null)
  const [selectedBook, setSelectedBook] = useState(null)
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

  const getToken = () => localStorage.getItem('token')

  const notify = (type, message) => {
    if (type === 'error') {
      setSuccess('')
      setError(message)
      return
    }

    setError('')
    setSuccess(message)
  }

  const applyBookStats = (list, total) => {
    setStats(prev => ({
      ...prev,
      totalBooks: total ?? list.length,
      availableBooks: list.filter(book => book.available).length
    }))
  }

  const fetchBooks = async (page = 1, size = 50, options = {}) => {
    const { silent = false } = options

    if (!silent) {
      setLoading(true)
    }

    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/books?page=${page}&size=${size}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()

      if (result.code === 200) {
        const list = result.data.list || []
        setBooks(list)
        applyBookStats(list, result.data.total || 0)
      } else {
        notify('error', result.message || 'Failed to fetch books')
      }
    } catch (err) {
      notify('error', 'Network error: ' + err.message)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  const fetchLoanRecords = async (options = {}) => {
    const { silent = false } = options

    if (!silent) {
      setLoanLoading(true)
    }

    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/loans?page=1&size=100`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()

      if (result.code === 200) {
        const list = result.data.list || []
        setLoanRecords(list)
        setStats(prev => ({
          ...prev,
          myLoans: result.data.total || list.length
        }))
      } else {
        notify('error', result.message || 'Failed to fetch loan records')
      }
    } catch (err) {
      notify('error', 'Network error: ' + err.message)
    } finally {
      if (!silent) {
        setLoanLoading(false)
      }
    }
  }

  const refreshLoanManagement = async (options = {}) => {
    await Promise.all([
      fetchBooks(1, 50, options),
      fetchLoanRecords(options)
    ])
  }

  const handleSearch = async (e) => {
    e?.preventDefault()

    if (!searchKeyword.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/books?keyword=${encodeURIComponent(searchKeyword.trim())}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()

      if (result.code === 200) {
        setSearchResults(result.data.list || [])
      } else {
        notify('error', result.message || 'Search failed')
      }
    } catch (err) {
      notify('error', 'Network error: ' + err.message)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    if (initialBooks.length > 0) {
      setBooks(initialBooks)
      applyBookStats(initialBooks, initialStats.totalBooks || initialBooks.length)
    }
  }, [initialBooks, initialStats.totalBooks])

  useEffect(() => {
    const loadPageData = async () => {
      if (currentPage === 'loans-manage') {
        await refreshLoanManagement()
        return
      }

      await fetchBooks()
    }

    loadPageData()
  }, [currentPage])

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('')
        setSuccess('')
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  const handleAddBook = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(addForm)
      })
      const result = await res.json()
      if (result.code === 200) {
        notify('success', 'Book added successfully!')
        setShowAddModal(false)
        resetAddForm()
        await fetchBooks()
      } else {
        notify('error', result.message || 'Failed to add book')
      }
    } catch (err) {
      notify('error', 'Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditBook = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/books/${selectedBook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      })
      const result = await res.json()
      if (result.code === 200) {
        notify('success', 'Book updated successfully!')
        setShowEditModal(false)
        setSelectedBook(null)
        await fetchBooks()
      } else {
        notify('error', result.message || 'Failed to update book')
      }
    } catch (err) {
      notify('error', 'Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBook = async () => {
    setLoading(true)
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/books/${selectedBook.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.code === 200) {
        notify('success', 'Book deleted successfully!')
        setShowDeleteConfirm(false)
        setSelectedBook(null)
        await fetchBooks()
      } else {
        notify('error', result.message || 'Failed to delete book')
      }
    } catch (err) {
      notify('error', 'Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

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

  const validateCheckoutForm = () => {
    const nextErrors = {}

    if (!checkoutForm.userId.trim()) {
      nextErrors.userId = 'User ID is required'
    }

    if (!checkoutForm.bookIdentifier.trim()) {
      nextErrors.bookIdentifier = 'Book ID or ISBN is required'
    }

    setCheckoutErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault()

    if (!validateCheckoutForm()) {
      return
    }

    setCheckoutLoading(true)
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/loans/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: checkoutForm.userId.trim(),
          bookIdOrIsbn: checkoutForm.bookIdentifier.trim()
        })
      })
      const result = await res.json()

      if (result.code === 200) {
        notify(
          'success',
          `Checkout completed. ${result.data?.bookTitle || 'Book'} is due on ${formatDateLabel(result.data?.dueDate)}. Remaining copies: ${result.data?.availableCopies ?? 0}.`
        )
        setCheckoutForm({ userId: '', bookIdentifier: '' })
        setCheckoutErrors({})
        await refreshLoanManagement({ silent: true })
      } else {
        notify('error', result.message || 'Checkout failed')
      }
    } catch (err) {
      notify('error', 'Network error: ' + err.message)
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleConfirmReturn = async () => {
    if (!returnTarget) {
      return
    }

    setReturningLoanId(returnTarget.id)
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/loans/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          loanId: returnTarget.id
        })
      })
      const result = await res.json()

      if (result.code === 200) {
        const fineAmount = Number(result.data?.fineAmount || 0)
        const fineText = fineAmount > 0 ? ` Overdue fine: ${formatMoney(fineAmount)}.` : ' No overdue fine.'

        notify(
          'success',
          `Return completed for ${result.data?.bookTitle || 'the selected book'}.${fineText}`
        )
        setReturnTarget(null)
        await refreshLoanManagement({ silent: true })
      } else {
        notify('error', result.message || 'Return failed')
      }
    } catch (err) {
      notify('error', 'Network error: ' + err.message)
    } finally {
      setReturningLoanId('')
    }
  }

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

  // Sort functionality
  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Get sorted and filtered books
  const getProcessedBooks = () => {
    let processed = [...books]

    // Apply filters
    if (filterGenre) {
      processed = processed.filter(book => book.genre === filterGenre)
    }
    if (filterStatus) {
      const isAvailable = filterStatus === 'available'
      processed = processed.filter(book => book.available === isAvailable)
    }

    // Apply sorting
    if (sortConfig.key) {
      processed.sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        // Handle string comparison
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return processed
  }

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return ' ↕'
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
  }

  const renderMessages = () => (
    <>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </>
  )

  const renderDashboard = () => (
    <div className="content">
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2>Welcome, {user.name}!</h2>
          <p>Today is {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
        </div>
        <div className="banner-icon">📚</div>
      </div>

      {renderMessages()}

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
          <div className="stat-icon red">🕒</div>
          <div className="stat-content">
            <h3>{loanRecords.filter(loan => loan.status === 'Overdue').length}</h3>
            <p>Overdue Loans</p>
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

  // Render Books view with search
  const renderBooks = () => {
    const displayBooks = searchResults.length > 0 ? searchResults : books

    return (
      <div className="content">
        <div className="page-header">
          <h2>📖 Books</h2>
        </div>

        {/* Search Box */}
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              className="search-input"
              placeholder="Search by title, author, or ISBN..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <button type="submit" className="search-btn" disabled={isSearching}>
              {isSearching ? 'Searching...' : '🔍 Search'}
            </button>
            {searchKeyword && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSearchKeyword('')
                  setSearchResults([])
                }}
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {loading && <div className="loading">Loading...</div>}
        {renderMessages()}

        <div className="books-grid">
          {displayBooks.map((book) => (
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
        {displayBooks.length === 0 && !loading && (
          <div className="no-data">
            {searchKeyword ? 'No books found matching your search' : 'No books found'}
          </div>
        )}
      </div>
    )
  }

  // Render Manage Books view
  const renderManageBooks = () => {
    const processedBooks = getProcessedBooks()

    return (
      <div className="content">
        <div className="page-header">
          <h2>⚙️ Book Management</h2>
        </div>
        {loading && <div className="loading">Loading...</div>}
        {renderMessages()}
        <div className="management-section">
          <div className="action-buttons">
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add New Book</button>
            <button className="btn-secondary" onClick={() => fetchBooks()}>🔄 Refresh</button>
          </div>

          {/* Filters */}
          <div className="filter-section">
            <div className="filter-group">
              <label>Genre:</label>
              <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)}>
                <option value="">All Genres</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Status:</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="borrowed">Borrowed</option>
              </select>
            </div>
          </div>

          <div className="table-section">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>
                    Title{getSortIcon('title')}
                  </th>
                  <th onClick={() => handleSort('author')} style={{ cursor: 'pointer' }}>
                    Author{getSortIcon('author')}
                  </th>
                  <th onClick={() => handleSort('isbn')} style={{ cursor: 'pointer' }}>
                    ISBN{getSortIcon('isbn')}
                  </th>
                  <th onClick={() => handleSort('genre')} style={{ cursor: 'pointer' }}>
                    Genre{getSortIcon('genre')}
                  </th>
                  <th onClick={() => handleSort('available')} style={{ cursor: 'pointer' }}>
                    Available{getSortIcon('available')}
                  </th>
                  <th onClick={() => handleSort('availableCopies')} style={{ cursor: 'pointer' }}>
                    Copies{getSortIcon('availableCopies')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedBooks.map((book) => (
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
                    <td className="action-buttons-cell">
                      <button className="btn-sm btn-edit" onClick={() => openEditModal(book)}>Edit</button>
                      <button className="btn-sm btn-delete" onClick={() => openDeleteConfirm(book)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {processedBooks.length === 0 && !loading && <div className="no-data">No books found</div>}
          </div>
        </div>

        {/* Modals */}
        {showAddModal && renderAddModal()}
        {showEditModal && renderEditModal()}
        {showDeleteConfirm && renderDeleteConfirm()}
      </div>
    )
  }

  const renderLoanManagement = () => (
    <div className="content">
      <div className="page-header">
        <h2>🔄 Loan Management</h2>
      </div>

      {renderMessages()}

      <div className="loan-management-grid">
        <div className="loan-form-card">
          <div className="loan-card-header">
            <h3>Manual Checkout</h3>
            <p>Enter the borrower and the target book to create a loan immediately.</p>
          </div>

          <form onSubmit={handleCheckoutSubmit} noValidate>
            <div className="form-group">
              <label>User ID *</label>
              <input
                type="text"
                value={checkoutForm.userId}
                onChange={(e) => {
                  setCheckoutForm(prev => ({ ...prev, userId: e.target.value }))
                  setCheckoutErrors(prev => ({ ...prev, userId: '' }))
                }}
                placeholder="Enter user ID"
              />
              {checkoutErrors.userId && <div className="field-error">{checkoutErrors.userId}</div>}
            </div>

            <div className="form-group">
              <label>Book ISBN / Book ID *</label>
              <input
                type="text"
                value={checkoutForm.bookIdentifier}
                onChange={(e) => {
                  setCheckoutForm(prev => ({ ...prev, bookIdentifier: e.target.value }))
                  setCheckoutErrors(prev => ({ ...prev, bookIdentifier: '' }))
                }}
                placeholder="Enter ISBN or book ID"
              />
              {checkoutErrors.bookIdentifier && (
                <div className="field-error">{checkoutErrors.bookIdentifier}</div>
              )}
            </div>

            <p className="loan-form-hint">
              The system validates the borrower, checks inventory, and blocks checkout when unpaid fines exist.
            </p>

            <div className="loan-actions-row">
              <button type="submit" className="btn-primary" disabled={checkoutLoading}>
                {checkoutLoading ? 'Checking out...' : 'Create Loan'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={checkoutLoading}
                onClick={() => {
                  setCheckoutForm({ userId: '', bookIdentifier: '' })
                  setCheckoutErrors({})
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        <div className="loan-summary-card">
          <div className="loan-card-header">
            <h3>Live Status</h3>
            <p>Inventory and active-loan totals refresh automatically after each operation.</p>
          </div>

          <div className="loan-metric-grid">
            <div className="loan-metric-item">
              <span>Available Books</span>
              <strong>{stats.availableBooks}</strong>
            </div>
            <div className="loan-metric-item">
              <span>Active Loans</span>
              <strong>{stats.myLoans}</strong>
            </div>
            <div className="loan-metric-item">
              <span>Overdue</span>
              <strong>{loanRecords.filter(loan => loan.status === 'Overdue').length}</strong>
            </div>
            <div className="loan-metric-item">
              <span>Total Books</span>
              <strong>{stats.totalBooks}</strong>
            </div>
          </div>

          <button
            className="btn-secondary loan-refresh-btn"
            onClick={() => refreshLoanManagement()}
            disabled={loanLoading || checkoutLoading || !!returningLoanId}
          >
            {loanLoading ? 'Refreshing...' : 'Refresh Status'}
          </button>
        </div>
      </div>

      <div className="table-section loan-records-section">
        <div className="loan-records-header">
          <h3>Active Loan Records</h3>
          <p>Return a book here and the system will calculate any overdue fine automatically.</p>
        </div>

        {loanLoading ? (
          <div className="loading">Loading loan records...</div>
        ) : loanRecords.length === 0 ? (
          <div className="no-data">No active loan records</div>
        ) : (
          <div className="loan-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Borrower</th>
                  <th>Checkout Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loanRecords.map((loan) => (
                  <tr key={loan.id}>
                    <td>
                      <div className="loan-record-title">{loan.bookTitle}</div>
                      <div className="loan-record-meta">ISBN: {loan.isbn}</div>
                    </td>
                    <td>
                      <div className="loan-record-title">{loan.userName}</div>
                      <div className="loan-record-meta">{loan.userId}</div>
                    </td>
                    <td>{formatDateLabel(loan.checkoutDate)}</td>
                    <td>{formatDateLabel(loan.dueDate)}</td>
                    <td>
                      <span className={`status-badge ${
                        loan.status === 'Overdue'
                          ? 'warning'
                          : loan.status === 'Returned'
                            ? 'info'
                            : 'success'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="action-buttons-cell">
                      <button
                        className="btn-sm btn-edit"
                        disabled={returningLoanId === loan.id}
                        onClick={() => setReturnTarget(loan)}
                      >
                        {returningLoanId === loan.id ? 'Returning...' : 'Return'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {returnTarget && renderReturnConfirm()}
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
                <option value="">Select Genre</option>
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
                <option value="">Select Language</option>
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

  const renderReturnConfirm = () => (
    <div className="modal-overlay" onClick={() => setReturnTarget(null)}>
      <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Confirm Return</h3>
          <button className="modal-close" onClick={() => setReturnTarget(null)}>×</button>
        </div>
        <div className="modal-body">
          <p>Confirm returning this book?</p>
          <p className="book-title-highlight">{returnTarget?.bookTitle}</p>
          <div className="return-confirm-detail">Borrower: {returnTarget?.userName}</div>
          <div className="return-confirm-detail">User ID: {returnTarget?.userId}</div>
          <div className="return-confirm-detail">Due Date: {formatDateLabel(returnTarget?.dueDate)}</div>
          {returnTarget?.status === 'Overdue' && (
            <p className="warning-text">This loan is overdue. The system will calculate the fine automatically.</p>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={() => setReturnTarget(null)}>Cancel</button>
          <button className="btn-primary" onClick={handleConfirmReturn} disabled={returningLoanId === returnTarget?.id}>
            {returningLoanId === returnTarget?.id ? 'Returning...' : 'Confirm Return'}
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
