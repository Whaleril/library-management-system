import React, { useEffect, useState } from 'react'
import { listLibrarians, listUsers } from '../services/adminUserApi'

const AdminOverviewPage = ({ onNavigate, notify }) => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ librarians: 0, users: 0, students: 0, admins: 0 })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [librarianData, userData] = await Promise.all([
          listLibrarians({ page: 1, size: 1 }),
          listUsers({ page: 1, size: 200 }),
        ])

        const users = userData?.list || []
        setStats({
          librarians: librarianData?.total || 0,
          users: userData?.total || 0,
          students: users.filter((item) => item.role === 'STUDENT').length,
          admins: users.filter((item) => item.role === 'ADMIN').length,
        })
      } catch (error) {
        notify('error', error.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [notify])

  return (
    <>
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2>Admin Overview</h2>
          <p>Manage librarians, user roles, and password security from one place.</p>
        </div>
        <div className="banner-icon">🛠️</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">🧑‍💼</div>
          <div className="stat-content">
            <h3>{loading ? '...' : stats.librarians}</h3>
            <p>Librarians</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">👥</div>
          <div className="stat-content">
            <h3>{loading ? '...' : stats.users}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">🎓</div>
          <div className="stat-content">
            <h3>{loading ? '...' : stats.students}</h3>
            <p>Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">🛡️</div>
          <div className="stat-content">
            <h3>{loading ? '...' : stats.admins}</h3>
            <p>Admins</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="quick-actions-grid admin-quick-actions-grid">
          <button className="quick-action-btn blue" onClick={() => onNavigate('admin-librarians')}>🧑‍💼 Manage Librarians</button>
          <button className="quick-action-btn green" onClick={() => onNavigate('admin-users')}>🛡️ Manage Roles</button>
          <button className="quick-action-btn orange" onClick={() => onNavigate('admin-password-reset')}>🔐 Reset Password</button>
        </div>
      </div>
    </>
  )
}

export default AdminOverviewPage
