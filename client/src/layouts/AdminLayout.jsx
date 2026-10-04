import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/meals', label: 'Meals', icon: '🍽️' },
  { to: '/admin/inventory', label: 'Inventory', icon: '📦' },
  { to: '/admin/waste', label: 'Waste', icon: '♻️' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/billing', label: 'Billing', icon: '💳' },
  { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { to: '/admin/announcements', label: 'Announcements', icon: '📣' },
];

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:flex`}
      >
        <div className="h-14 flex items-center px-5 border-b border-gray-100">
          <span className="text-brand-700 font-bold text-lg">🌿 MessMate</span>
          <span className="ml-2 badge-green">Admin</span>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 border-r-2 border-brand-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1">{user?.name}</p>
          <p className="text-xs text-gray-400 mb-3">{user?.email}</p>
          <button onClick={handleLogout} className="btn-danger w-full text-xs py-1.5">
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-4 sticky top-0 z-30">
          <button
            className="lg:hidden text-gray-500"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <span className="text-sm text-gray-500">Admin Panel</span>
        </header>
        <main className="flex-1 p-5 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
