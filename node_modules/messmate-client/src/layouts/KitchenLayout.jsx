import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const NAV = [
  { to: '/kitchen', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/kitchen/scanner', label: 'Scanner', icon: '📷' },
  { to: '/kitchen/inventory', label: 'Stock', icon: '📦' },
  { to: '/kitchen/insights', label: 'Insights', icon: '📈' },
  { to: '/kitchen/waste', label: 'Waste', icon: '♻️' },
];

export default function KitchenLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <span className="text-brand-700 font-bold text-lg">🌿 MessMate</span>
            <span className="badge-amber">Kitchen</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.name}</span>
            <button
              onClick={() => { dispatch(logout()); navigate('/login'); }}
              className="text-xs text-red-500 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5">
        <Outlet />
      </main>

      <nav className="bg-white border-t border-gray-100 sticky bottom-0">
        <div className="max-w-2xl mx-auto flex justify-around">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-5 text-xs font-medium ${
                  isActive ? 'text-brand-600' : 'text-gray-500 hover:text-brand-600'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
