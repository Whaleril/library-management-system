export const ADMIN_PAGES = {
  OVERVIEW: 'admin-overview',
  LIBRARIANS: 'admin-librarians',
  USERS: 'admin-users',
  PASSWORD: 'admin-password-reset',
}

export const ADMIN_MENU = [
  { key: ADMIN_PAGES.OVERVIEW, label: 'Overview', icon: '🏠' },
  { key: ADMIN_PAGES.LIBRARIANS, label: 'Librarian Management', icon: '🧑‍💼' },
  { key: ADMIN_PAGES.USERS, label: 'User Role Management', icon: '🛡️' },
  { key: ADMIN_PAGES.PASSWORD, label: 'Password Reset', icon: '🔐' },
]

const PAGE_META = {
  [ADMIN_PAGES.OVERVIEW]: { title: 'Overview', breadcrumb: 'Admin / Overview' },
  [ADMIN_PAGES.LIBRARIANS]: { title: 'Librarian Management', breadcrumb: 'Admin / Librarians' },
  [ADMIN_PAGES.USERS]: { title: 'User Role Management', breadcrumb: 'Admin / Users' },
  [ADMIN_PAGES.PASSWORD]: { title: 'Password Reset', breadcrumb: 'Admin / Password Reset' },
}

export function getAdminPageMeta(pageKey) {
  return PAGE_META[pageKey] || PAGE_META[ADMIN_PAGES.OVERVIEW]
}
