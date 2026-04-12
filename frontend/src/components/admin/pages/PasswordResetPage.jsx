import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Pagination from '../common/Pagination'
import ResetPasswordModal from '../components/ResetPasswordModal'
import { listUsers, resetUserPassword } from '../services/adminUserApi'

const defaultQuery = {
  page: 1,
  size: 10,
  keyword: '',
  role: '',
}

const PasswordResetPage = ({ notify }) => {
  const [query, setQuery] = useState(defaultQuery)
  const [keywordInput, setKeywordInput] = useState('')
  const [data, setData] = useState({ total: 0, page: 1, size: 10, list: [] })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [targetUser, setTargetUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [manualMode, setManualMode] = useState(false)
  const [result, setResult] = useState(null)

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await listUsers(query)
      setData(response)
    } catch (error) {
      notify('error', error.message)
    } finally {
      setLoading(false)
    }
  }, [notify, query])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const tempPasswordText = useMemo(() => {
    if (!result) return ''
    return result.tempPassword ? `Temporary Password: ${result.tempPassword}` : 'Password updated by custom password.'
  }, [result])

  const handleSearch = (event) => {
    event.preventDefault()
    setQuery((prev) => ({ ...prev, page: 1, keyword: keywordInput.trim() }))
  }

  const submitReset = async () => {
    if (!targetUser) return
    try {
      setSubmitting(true)
      const payload = manualMode ? { newPassword } : {}
      const response = await resetUserPassword(targetUser.id, payload)
      setResult(response)
      notify('success', 'Password reset successful')
      setTargetUser(null)
      setManualMode(false)
      setNewPassword('')
    } catch (error) {
      notify('error', error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="page-header admin-page-header-row">
        <h2>🔐 Password Reset</h2>
      </div>

      {result && (
        <div className="admin-result-card">
          <h4>Reset Result</h4>
          <p>User ID: {result.userId}</p>
          <p>{tempPasswordText}</p>
        </div>
      )}

      <div className="table-section">
        <form className="admin-toolbar" onSubmit={handleSearch}>
          <input
            className="admin-search-input"
            placeholder="Search user by name / email / studentId"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
          />
          <button type="submit" className="btn-secondary">Search</button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setKeywordInput('')
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.list?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td><span className="status-badge info">{item.role}</span></td>
                    <td>{item.staffId || item.studentId || '-'}</td>
                    <td>
                      <button type="button" className="btn-sm" onClick={() => setTargetUser(item)}>
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
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

      <ResetPasswordModal
        open={Boolean(targetUser)}
        targetUser={targetUser}
        manualMode={manualMode}
        newPassword={newPassword}
        submitting={submitting}
        onToggleManualMode={(checked) => {
          setManualMode(checked)
          if (!checked) setNewPassword('')
        }}
        onPasswordChange={setNewPassword}
        onCancel={() => {
          setTargetUser(null)
          setManualMode(false)
          setNewPassword('')
        }}
        onConfirm={submitReset}
      />
    </div>
  )
}

export default PasswordResetPage
