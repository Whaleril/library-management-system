import React from 'react'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'
import MessageBar from '../common/MessageBar'

const AdminShell = ({ user, activePage, onPageChange, onLogout, message, clearMessage, children }) => {
  return (
    <div className="dashboard-container">
      <AdminSidebar activePage={activePage} onSelectPage={onPageChange} />
      <main className="main-content">
        <AdminTopbar user={user} activePage={activePage} onLogout={onLogout} />
        <div className="content admin-content">
          <MessageBar type={message?.type} message={message?.text} onClose={clearMessage} />
          {children}
        </div>
      </main>
    </div>
  )
}

export default AdminShell
