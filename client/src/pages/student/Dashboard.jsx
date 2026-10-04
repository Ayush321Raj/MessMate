import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMeals } from '../../store/slices/mealsSlice';

const MEAL_ICONS = { breakfast: '☀️', lunch: '🌤️', dinner: '🌙' };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function StudentDashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { items: meals, loading } = useSelector((s) => s.meals);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    dispatch(fetchMeals({ startDate: today, endDate: today }));
  }, [dispatch, today]);

  const todayMeals = meals.filter((m) => m.date?.startsWith(today));
  const optedInCount = todayMeals.filter((m) => m.optin?.status === 'opted-in').length;

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="card bg-gradient-to-r from-brand-600 to-brand-700 text-white border-0">
        <p className="text-brand-100 text-sm">{greeting()},</p>
        <h1 className="text-xl font-bold mt-1">{user?.name} 👋</h1>
        <p className="text-brand-100 text-sm mt-1">
          Room {user?.roomNumber || '—'} · {user?.department || '—'}
        </p>
      </div>

      {/* Today's summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-brand-600">{optedInCount}</p>
          <p className="text-xs text-gray-500 mt-1">Opted In</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-amber-500">{todayMeals.length}</p>
          <p className="text-xs text-gray-500 mt-1">Today's Meals</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-gray-700">{todayMeals.length - optedInCount}</p>
          <p className="text-xs text-gray-500 mt-1">Skipped</p>
        </div>
      </div>

      {/* Today's meals */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Today's Menu</h2>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse h-20 bg-gray-100" />
            ))}
          </div>
        ) : todayMeals.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">🍽️</p>
            <p>No meals scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayMeals.map((meal) => (
              <Link
                key={meal._id}
                to="/student/menu"
                className="card flex items-center justify-between hover:border-brand-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{MEAL_ICONS[meal.mealType]}</span>
                  <div>
                    <p className="font-medium capitalize text-gray-800">{meal.mealType}</p>
                    <p className="text-xs text-gray-500">
                      {meal.menuItems?.slice(0, 2).map((i) => i.name).join(', ')}
                      {meal.menuItems?.length > 2 ? ` +${meal.menuItems.length - 2}` : ''}
                    </p>
                  </div>
                </div>
                <span
                  className={
                    meal.optin?.status === 'opted-in' ? 'badge-green' : 'badge-gray'
                  }
                >
                  {meal.optin?.status === 'opted-in' ? 'Opted In' : 'Not opted'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/student/passes" className="card flex items-center gap-3 hover:border-brand-200">
          <span className="text-2xl">🎫</span>
          <div>
            <p className="font-medium text-sm">My Passes</p>
            <p className="text-xs text-gray-500">View QR codes</p>
          </div>
        </Link>
        <Link to="/student/billing" className="card flex items-center gap-3 hover:border-brand-200">
          <span className="text-2xl">💳</span>
          <div>
            <p className="font-medium text-sm">Billing</p>
            <p className="text-xs text-gray-500">View & download</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
