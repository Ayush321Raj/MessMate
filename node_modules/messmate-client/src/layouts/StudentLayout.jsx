import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const NAV = [
  { to: '/student', label: 'Home', icon: '🏠', end: true },
  { to: '/student/menu', label: 'Menu', icon: '🍽️' },
  { to: '/student/passes', label: 'My Passes', icon: '🎫' },
  { to: '/student/billing', label: 'Billing', icon: '💳' },
  { to: '/student/feedback', label: 'Feedback', icon: '⭐' },
  { to: '/student/assistant', label: 'Assistant', icon: '💬' },
  { to: '/student/announcements', label: 'Updates', icon: '📣' },
];

export default function StudentLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
          <span className="text-brand-700 font-bold text-lg tracking-tight">🌿 MessMate</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">{user?.name}</span>
            <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-700 font-medium">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5">
        <Outlet />
      </main>

      {/* Bottom nav (mobile-first) */}
      <nav className="bg-white border-t border-gray-100 sticky bottom-0 z-40">
        <div className="max-w-lg mx-auto flex justify-around">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 text-xs font-medium transition-colors ${
                  isActive ? 'text-brand-600' : 'text-gray-500 hover:text-brand-600'
                }`
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="mt-0.5">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
