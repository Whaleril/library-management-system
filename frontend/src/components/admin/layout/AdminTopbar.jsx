import React from 'react'
import { getAdminPageMeta } from '../config/adminPages'

const AdminTopbar = ({ user, activePage, onLogout }) => {
  const meta = getAdminPageMeta(activePage)

  return (
    <header className="top-nav">
      <span className="breadcrumb">{meta.breadcrumb}</span>
      <div className="top-user">
        <span className="top-user-name">{user.name}</span>
        <span className="role-badge">ADMIN</span>
        <button type="button" className="btn-secondary admin-topbar-logout" onClick={onLogout}>Logout</button>
      </div>
    </header>
  )
}

export default AdminTopbar
