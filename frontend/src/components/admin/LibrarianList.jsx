import { useState, useEffect } from 'react'

const API_BASE = '/api'

const LibrarianList = ({ onBack }) => {
  const [librarians, setLibrarians] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [view, setView] = useState('list')
  const [selectedLibrarian, setSelectedLibrarian] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', staffId: '' })
  const [message, setMessage] = useState(null)

  const fetchLibrarians = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({ page, size })
      if (keyword) params.append('keyword', keyword)
      
      const res = await fetch(`${API_BASE}/admin/librarians?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setLibrarians(data.data.list || [])
        setTotal(data.data.total || 0)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLibrarians()
  }, [page, size])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchLibrarians()
  }

  const handleViewDetail = async (id) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/admin/librarians/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setSelectedLibrarian(data.data)
        setEditForm({ name: data.data.name, email: data.data.email, staffId: data.data.staffId })
        setView('detail')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this librarian?')) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/admin/librarians/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        alert('Librarian deleted successfully!')
        fetchLibrarians()
      } else {
        alert(data.message || 'Failed to delete librarian')
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setLoading(false)
  }

  const handleEdit = () => {
    setView('edit')
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/admin/librarians/${selectedLibrarian.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ text: 'Librarian updated successfully!', type: 'success' })
        setSelectedLibrarian(data.data)
        setView('detail')
      } else {
        setMessage({ text: data.message || 'Failed to update', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'Error: ' + err.message, type: 'error' })
    }
    setLoading(false)
  }

  const totalPages = Math.ceil(total / size)

  if (view === 'detail' || view === 'edit') {
    return (
      <div className="content">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {view === 'detail' ? '📋 Librarian Details' : '✏️ Edit Librarian'}
          </h2>
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            onClick={() => { setView('list'); setMessage(null); }}
          >
            ← Back
          </button>
        </div>

        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
          {message && (
            <div className={`p-3 rounded mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
              {message.text}
            </div>
          )}

          {view === 'detail' ? (
            <div className="space-y-4">
              <div><span className="font-medium">ID:</span> {selectedLibrarian?.id}</div>
              <div><span className="font-medium">Name:</span> {selectedLibrarian?.name}</div>
              <div><span className="font-medium">Email:</span> {selectedLibrarian?.email}</div>
              <div><span className="font-medium">Staff ID:</span> {selectedLibrarian?.staffId}</div>
              <div><span className="font-medium">Role:</span> {selectedLibrarian?.role}</div>
              <div><span className="font-medium">Created:</span> {selectedLibrarian?.createdAt}</div>
              <button
                className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleEdit}
              >
                ✏️ Edit
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1">Staff ID</label>
                <input
                  type="text"
                  value={editForm.staffId}
                  onChange={(e) => setEditForm({...editForm, staffId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : '💾 Save'}
                </button>
                <button
                  type="button"
                  className="flex-1 py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600"
                  onClick={() => setView('detail')}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="content">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">👥 Librarian Management</h2>
        {onBack && (
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            onClick={onBack}
          >
            ← Back
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search by name/email/staffId..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          🔍 Search
        </button>
      </form>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          <table className="w-full bg-white rounded-lg shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Staff ID</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {librarians.map((lib) => (
                <tr key={lib.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{lib.name}</td>
                  <td className="px-4 py-2">{lib.email}</td>
                  <td className="px-4 py-2">{lib.staffId}</td>
                  <td className="px-4 py-2">{lib.createdAt}</td>
                  <td className="px-4 py-2">
                    <button
                      className="text-blue-500 hover:underline mr-2"
                      onClick={() => handleViewDetail(lib.id)}
                    >
                      View
                    </button>
                    <button
                      className="text-red-500 hover:underline"
                      onClick={() => handleDelete(lib.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {librarians.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    No librarians found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default LibrarianList