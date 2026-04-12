import { useState, useEffect } from 'react'

const API_BASE = '/api'

const UserManagement = ({ onBack }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [view, setView] = useState('list')
  const [selectedUser, setSelectedUser] = useState(null)
  const [message, setMessage] = useState(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({ page, size })
      if (keyword) params.append('keyword', keyword)
      if (roleFilter) params.append('role', roleFilter)
      
      const res = await fetch(`${API_BASE}/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setUsers(data.data.list || [])
        setTotal(data.data.total || 0)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [page, size, roleFilter])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handleViewDetail = (user) => {
    setSelectedUser(user)
    setView('detail')
  }

  const handleChangeRole = async (newRole) => {
    if (!selectedUser) return
    
    setLoading(true)
    setMessage(null)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/admin/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ text: 'Role updated successfully!', type: 'success' })
        setSelectedUser(data.data)
        fetchUsers()
      } else {
        setMessage({ text: data.message || 'Failed to update role', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'Error: ' + err.message, type: 'error' })
    }
    setLoading(false)
  }

  const handleResetPassword = async () => {
    if (!selectedUser) return
    const newPassword = prompt('Enter new password (leave empty for auto-generate):')
    if (newPassword === null) return
    
    setLoading(true)
    setMessage(null)
    try {
      const token = localStorage.getItem('token')
      const body = newPassword ? { newPassword } : {}
      const res = await fetch(`${API_BASE}/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (res.ok) {
        const tempPwd = data.data.tempPassword
        if (tempPwd) {
          alert(`Password reset successfully! Temp password: ${tempPwd}`)
        } else {
          alert('Password reset successfully!')
        }
      } else {
        setMessage({ text: data.message || 'Failed to reset password', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'Error: ' + err.message, type: 'error' })
    }
    setLoading(false)
  }

  const totalPages = Math.ceil(total / size)

  if (view === 'detail') {
    return (
      <div className="content">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">👤 User Details</h2>
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

          <div className="space-y-4">
            <div><span className="font-medium">ID:</span> {selectedUser?.id}</div>
            <div><span className="font-medium">Name:</span> {selectedUser?.name}</div>
            <div><span className="font-medium">Email:</span> {selectedUser?.email}</div>
            <div><span className="font-medium">Role:</span> {selectedUser?.role}</div>
            <div><span className="font-medium">{selectedUser?.role === 'STUDENT' ? 'Student ID' : 'Staff ID'}:</span> {selectedUser?.studentId || selectedUser?.staffId}</div>
            <div><span className="font-medium">Created:</span> {selectedUser?.createdAt}</div>

            <div className="border-t pt-4 mt-4">
              <p className="font-medium mb-2">Change Role:</p>
              <div className="flex gap-2">
                {['STUDENT', 'LIBRARIAN', 'ADMIN'].map((role) => (
                  <button
                    key={role}
                    className={`px-3 py-1 rounded ${selectedUser?.role === role ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                    onClick={() => handleChangeRole(role)}
                    disabled={loading || selectedUser?.role === role}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="font-medium mb-2">Reset Password:</p>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={handleResetPassword}
                disabled={loading}
              >
                🔑 Reset Password
              </button>
              <p className="text-sm text-gray-500 mt-2">Leave empty to auto-generate temp password</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">👥 User Management</h2>
        {onBack && (
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            onClick={onBack}
          >
            ← Back
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex flex-wrap gap-2">
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
        >
          <option value="">All Roles</option>
          <option value="STUDENT">STUDENT</option>
          <option value="LIBRARIAN">LIBRARIAN</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <input
          type="text"
          placeholder="Search by name/email/studentId..."
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
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Student/Staff ID</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{user.name}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : user.role === 'LIBRARIAN' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-2">{user.studentId || user.staffId || '-'}</td>
                  <td className="px-4 py-2">{user.createdAt}</td>
                  <td className="px-4 py-2">
                    <button
                      className="text-blue-500 hover:underline"
                      onClick={() => handleViewDetail(user)}
                    >
                      View/Edit
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No users found
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

export default UserManagement