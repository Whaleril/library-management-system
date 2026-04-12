import React, { useEffect, useMemo, useState } from 'react'
import AdminShell from './layout/AdminShell'
import { ADMIN_PAGES } from './config/adminPages'
import AdminOverviewPage from './pages/AdminOverviewPage'
import LibrarianManagementPage from './pages/LibrarianManagementPage'
import UserRoleManagementPage from './pages/UserRoleManagementPage'
import PasswordResetPage from './pages/PasswordResetPage'
import './styles/admin.css'

const pageMap = {
  [ADMIN_PAGES.OVERVIEW]: AdminOverviewPage,
  [ADMIN_PAGES.LIBRARIANS]: LibrarianManagementPage,
  [ADMIN_PAGES.USERS]: UserRoleManagementPage,
  [ADMIN_PAGES.PASSWORD]: PasswordResetPage,
}

const AdminModule = ({ user, currentPage, setCurrentPage, onLogout }) => {
  const [message, setMessage] = useState(null)

  const activePage = useMemo(() => {
    if (Object.values(ADMIN_PAGES).includes(currentPage)) {
      return currentPage
    }
    return ADMIN_PAGES.OVERVIEW
  }, [currentPage])

  const notify = (type, text) => {
    setMessage({ type, text })
  }

  useEffect(() => {
    if (!message?.text) return undefined
    const timer = setTimeout(() => setMessage(null), 3500)
    return () => clearTimeout(timer)
  }, [message])

  const PageComponent = pageMap[activePage] || AdminOverviewPage

  return (
    <AdminShell
      user={user}
      activePage={activePage}
      onPageChange={setCurrentPage}
      onLogout={onLogout}
      message={message}
      clearMessage={() => setMessage(null)}
    >
      <PageComponent
        notify={notify}
        onNavigate={setCurrentPage}
        currentUserId={user.id}
      />
    </AdminShell>
  )
}

export default AdminModule
