import React, { useCallback, useEffect, useState } from 'react'
import Pagination from '../common/Pagination'
import { listUsers, updateUserRole } from '../services/adminUserApi'

const defaultQuery = {
  page: 1,
  size: 10,
  keyword: '',
  role: '',
}

const ROLES = ['STUDENT', 'LIBRARIAN', 'ADMIN']

const UserRoleManagementPage = ({ currentUserId, notify }) => {
  const [query, setQuery] = useState(defaultQuery)
  const [keywordInput, setKeywordInput] = useState('')
  const [roleInput, setRoleInput] = useState('')
  const [data, setData] = useState({ total: 0, page: 1, size: 10, list: [] })
  const [loading, setLoading] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState('')

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const result = await listUsers(query)
      setData(result)
    } catch (error) {
      notify('error', error.message)
    } finally {
      setLoading(false)
    }
  }, [notify, query])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleSearch = (event) => {
    event.preventDefault()
    setQuery((prev) => ({
      ...prev,
      page: 1,
      keyword: keywordInput.trim(),
      role: roleInput,
    }))
  }

  const handleChangeRole = async (targetUserId, role) => {
    try {
      setUpdatingUserId(targetUserId)
      await updateUserRole(targetUserId, role)
      notify('success', 'Role updated successfully')
      await loadUsers()
    } catch (error) {
      notify('error', error.message)
    } finally {
      setUpdatingUserId('')
    }
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>🛡️ User Role Management</h2>
      </div>

      <div className="table-section">
        <form className="admin-toolbar" onSubmit={handleSearch}>
          <input
            className="admin-search-input"
            placeholder="Search by name / email / studentId"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
          />
          <select className="admin-select" value={roleInput} onChange={(e) => setRoleInput(e.target.value)}>
            <option value="">All roles</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <button type="submit" className="btn-secondary">Search</button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setKeywordInput('')
              setRoleInput('')
              setQuery({ ...defaultQuery })
            }}
          >
            Reset
          </button>
        </form>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>ID</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.list?.map((item) => {
                  const identity = item.role === 'LIBRARIAN' ? item.staffId : item.studentId
                  const isSelf = item.id === currentUserId
                  return (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.email}</td>
                      <td><span className="status-badge info">{item.role}</span></td>
                      <td>{identity || '-'}</td>
                      <td>{item.createdAt}</td>
                      <td>
                        <select
                          className="admin-select"
                          value={item.role}
                          disabled={isSelf || updatingUserId === item.id}
                          onChange={(e) => handleChangeRole(item.id, e.target.value)}
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                        {isSelf && <div className="admin-inline-tip">Cannot change your own role</div>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {(!data.list || data.list.length === 0) && <div className="no-data">No user data</div>}
            <Pagination
              page={data.page || 1}
              size={data.size || query.size}
              total={data.total || 0}
              onPageChange={(nextPage) => setQuery((prev) => ({ ...prev, page: nextPage }))}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default UserRoleManagementPage
