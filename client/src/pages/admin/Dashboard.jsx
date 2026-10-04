import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchOverview } from '../../store/slices/analyticsSlice';

const cards = [
  { key: 'todayAttendance', label: "Today's Attendance", icon: '👥', color: 'text-brand-600', link: '/admin/analytics' },
  { key: 'totalStudents', label: 'Total Students', icon: '🎓', color: 'text-blue-600', link: '/admin/users' },
  { key: 'lowStockCount', label: 'Low Stock Alerts', icon: '⚠️', color: 'text-amber-500', link: '/admin/inventory' },
  { key: 'pendingBills', label: 'Pending Bills', icon: '💳', color: 'text-red-500', link: '/admin/billing' },
];

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { overview, loading } = useSelector((s) => s.analytics);

  useEffect(() => {
    dispatch(fetchOverview());
    const interval = setInterval(() => dispatch(fetchOverview()), 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">MessMate control panel</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.key} to={c.link} className="card hover:border-brand-200 transition-colors">
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 w-12 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded w-24" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{c.icon}</span>
                  <span className={`text-2xl font-bold ${c.color}`}>{overview?.[c.key] ?? '—'}</span>
                </div>
                <p className="text-xs text-gray-500">{c.label}</p>
              </>
            )}
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { to: '/admin/meals', icon: '🍽️', label: 'Add Meal', desc: 'Create weekly menu' },
            { to: '/admin/inventory', icon: '📦', label: 'Manage Stock', desc: 'View & restock items' },
            { to: '/admin/billing', icon: '💳', label: 'Generate Bills', desc: 'Monthly billing' },
            { to: '/admin/analytics', icon: '📈', label: 'Analytics', desc: 'Charts & reports' },
            { to: '/admin/users', icon: '👥', label: 'Manage Users', desc: 'Students & staff' },
            { to: '/kitchen/scanner', icon: '📷', label: 'Scanner', desc: 'Open QR/RFID scanner' },
          ].map((item) => (
            <Link key={item.to} to={item.to} className="card flex items-center gap-3 hover:border-brand-200 transition-colors">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="font-medium text-sm text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
