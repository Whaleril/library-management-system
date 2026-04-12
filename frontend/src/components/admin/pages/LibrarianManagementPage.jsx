import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ConfirmDialog from '../common/ConfirmDialog'
import Pagination from '../common/Pagination'
import LibrarianFormModal from '../components/LibrarianFormModal'
import {
  createLibrarian,
  deleteLibrarian,
  listLibrarians,
  updateLibrarian,
} from '../services/adminUserApi'

const defaultQuery = {
  page: 1,
  size: 10,
  keyword: '',
}

const LibrarianManagementPage = ({ notify }) => {
  const [query, setQuery] = useState(defaultQuery)
  const [keywordInput, setKeywordInput] = useState('')
  const [data, setData] = useState({ total: 0, page: 1, size: 10, list: [] })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [editingLibrarian, setEditingLibrarian] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const loadList = useCallback(async () => {
    try {
      setLoading(true)
      const result = await listLibrarians(query)
      setData(result)
    } catch (error) {
      notify('error', error.message)
    } finally {
      setLoading(false)
    }
  }, [notify, query])

  useEffect(() => {
    loadList()
  }, [loadList])

  const createFormKey = useMemo(() => `create-${showCreate ? 'open' : 'close'}`, [showCreate])
  const editFormKey = useMemo(() => `edit-${editingLibrarian?.id || 'none'}`, [editingLibrarian])

  const handleSearch = (event) => {
    event.preventDefault()
    setQuery((prev) => ({ ...prev, page: 1, keyword: keywordInput.trim() }))
  }

  const handleCreate = async (payload) => {
    try {
      setSubmitting(true)
      await createLibrarian(payload)
      setShowCreate(false)
      notify('success', 'Librarian created successfully')
      await loadList()
    } catch (error) {
      notify('error', error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (payload) => {
    if (!editingLibrarian) return
    try {
      setSubmitting(true)
      await updateLibrarian(editingLibrarian.id, payload)
      setEditingLibrarian(null)
      notify('success', 'Librarian updated successfully')
      await loadList()
    } catch (error) {
      notify('error', error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setSubmitting(true)
      await deleteLibrarian(deleteTarget.id)
      notify('success', 'Librarian deleted successfully')
      setDeleteTarget(null)
      await loadList()
    } catch (error) {
      notify('error', error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="page-header admin-page-header-row">
        <h2>🧑‍💼 Librarian Management</h2>
        <button type="button" className="btn-primary" onClick={() => setShowCreate(true)}>+ Add Librarian</button>
      </div>

      <div className="table-section">
        <form className="admin-toolbar" onSubmit={handleSearch}>
          <input
            className="admin-search-input"
            placeholder="Search by name / email / staffId"
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
                  <th>Staff ID</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.list?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>{item.staffId || '-'}</td>
                    <td>{item.createdAt}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button type="button" className="btn-sm" onClick={() => setEditingLibrarian(item)}>Edit</button>
                        <button type="button" className="btn-sm danger" onClick={() => setDeleteTarget(item)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!data.list || data.list.length === 0) && <div className="no-data">No librarian data</div>}
            <Pagination
              page={data.page || 1}
              size={data.size || query.size}
              total={data.total || 0}
              onPageChange={(nextPage) => setQuery((prev) => ({ ...prev, page: nextPage }))}
            />
          </>
        )}
      </div>

      <LibrarianFormModal
        key={createFormKey}
        open={showCreate}
        mode="create"
        loading={submitting}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />

      <LibrarianFormModal
        key={editFormKey}
        open={Boolean(editingLibrarian)}
        mode="edit"
        initialValue={editingLibrarian}
        loading={submitting}
        onClose={() => setEditingLibrarian(null)}
        onSubmit={handleEdit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Librarian"
        message={`Are you sure to delete ${deleteTarget?.name || ''}? This action cannot be undone.`}
        confirmText="Delete"
        loading={submitting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default LibrarianManagementPage
