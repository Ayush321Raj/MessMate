import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const MEAL_ICONS = { breakfast: '☀️', lunch: '🌤️', dinner: '🌙' };

export default function KitchenDashboard() {
  const { user, token } = useSelector((s) => s.auth);
  const [todayMeals, setTodayMeals] = useState([]);
  const [headcounts, setHeadcounts] = useState({});
  const [forecasts, setForecasts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    api.get('/meals', { params: { startDate: today, endDate: today } })
      .then((r) => {
        const meals = r.data.meals || [];
        setTodayMeals(meals);
        const hc = {};
        meals.forEach((m) => { hc[m._id] = m.actualHeadcount || 0; });
        setHeadcounts(hc);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!token) return;
    const socket = io('/', { auth: { token } });
    socket.emit('join:kitchen', 'all');
    socket.on('headcount:update', ({ mealId, actualHeadcount }) => {
      setHeadcounts((prev) => ({ ...prev, [mealId]: actualHeadcount }));
      toast.success(`Headcount updated: ${actualHeadcount}`, { id: 'hc' });
    });
    return () => socket.disconnect();
  }, [token]);

  const fetchForecast = async (mealId) => {
    try {
      const { data } = await api.get(`/forecast/${mealId}`);
      setForecasts((prev) => ({ ...prev, [mealId]: data }));
    } catch {
      toast.error('Forecast unavailable');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Kitchen Dashboard</h1>
        <p className="text-gray-500 text-sm">
          {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <Link to="/kitchen/scanner" className="card bg-brand-600 text-white border-0 flex items-center justify-between hover:bg-brand-700 transition-colors">
        <div>
          <p className="font-bold text-lg">📷 Open Scanner</p>
          <p className="text-brand-100 text-sm">Scan QR codes & RFID cards</p>
        </div>
        <span className="text-3xl">→</span>
      </Link>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card animate-pulse h-28 bg-gray-100"/>)}</div>
      ) : todayMeals.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">🍽️</p>
          <p>No meals scheduled for today.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todayMeals.map((meal) => {
            const fc = forecasts[meal._id];
            const headcount = headcounts[meal._id] || 0;
            return (
              <div key={meal._id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{MEAL_ICONS[meal.mealType]}</span>
                    <div>
                      <p className="font-semibold capitalize text-gray-800">{meal.mealType}</p>
                      <p className="text-xs text-gray-500">
                        {meal.menuItems?.slice(0,3).map(i=>i.name).join(', ')}
                      </p>
                    </div>
                  </div>
                  {meal.specialDay?.isSpecial && (
                    <span className="badge-amber">🎉 Special</span>
                  )}
                </div>

                {/* Live headcount */}
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="bg-brand-50 rounded-lg py-2">
                    <p className="text-xl font-bold text-brand-600">{headcount}</p>
                    <p className="text-xs text-gray-500">Served</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg py-2">
                    <p className="text-xl font-bold text-blue-600">{fc?.forecastedHeadcount ?? meal.forecastedHeadcount ?? '—'}</p>
                    <p className="text-xs text-gray-500">Forecast</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg py-2">
                    <p className="text-xl font-bold text-gray-600">
                      {fc ? Math.max(0, fc.forecastedHeadcount - headcount) : '—'}
                    </p>
                    <p className="text-xs text-gray-500">Remaining</p>
                  </div>
                </div>

                {!fc && (
                  <button
                    onClick={() => fetchForecast(meal._id)}
                    className="btn-secondary w-full text-sm py-1.5"
                  >
                    🤖 Get AI Forecast
                  </button>
                )}
                {fc && (
                  <div className="text-xs text-gray-400 text-center">
                    AI Confidence: {(fc.confidence * 100).toFixed(0)}% · Model: {fc.model}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
