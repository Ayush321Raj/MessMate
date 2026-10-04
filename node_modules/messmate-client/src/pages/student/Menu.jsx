import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMeals, optInMeal, optOutMeal } from '../../store/slices/mealsSlice';
import toast from 'react-hot-toast';

const MEAL_ICONS = { breakfast: '☀️', lunch: '🌤️', dinner: '🌙' };
const MEAL_COLORS = { breakfast: 'text-amber-500', lunch: 'text-brand-600', dinner: 'text-blue-600' };

function getDaysOfWeek() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function StudentMenu() {
  const dispatch = useDispatch();
  const { items: meals, loading } = useSelector((s) => s.meals);
  const days = getDaysOfWeek();
  const [selectedDay, setSelectedDay] = useState(days[0].toISOString().split('T')[0]);

  useEffect(() => {
    const start = days[0].toISOString().split('T')[0];
    const end = days[6].toISOString().split('T')[0];
    dispatch(fetchMeals({ startDate: start, endDate: end }));
  }, [dispatch]);

  const dayMeals = meals.filter((m) => m.date?.startsWith(selectedDay));

  const handleToggle = async (meal) => {
    const isOptedIn = meal.optin?.status === 'opted-in';
    const now = new Date();
    const cutoff = new Date(meal.cutoffTime);

    if (now > cutoff) {
      toast.error('Opt-in/out window has closed for this meal.');
      return;
    }

    const action = isOptedIn ? optOutMeal : optInMeal;
    const result = await dispatch(action(meal._id));
    if (action.fulfilled.match(result)) {
      toast.success(isOptedIn ? 'Opted out successfully.' : '🎫 Opted in! QR pass sent to your email.');
    } else {
      toast.error(result.payload || 'Action failed');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-900">Weekly Menu</h1>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {days.map((d) => {
          const key = d.toISOString().split('T')[0];
          const isToday = key === new Date().toISOString().split('T')[0];
          return (
            <button
              key={key}
              onClick={() => setSelectedDay(key)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                selectedDay === key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-brand-50'
              }`}
            >
              <span>{d.toLocaleDateString('en', { weekday: 'short' })}</span>
              <span className={`text-base font-bold ${isToday && selectedDay !== key ? 'text-brand-600' : ''}`}>
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Meals for selected day */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-32 bg-gray-100" />)}
        </div>
      ) : dayMeals.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">🗓️</p>
          <p>No meals scheduled for this day.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayMeals.map((meal) => {
            const isOptedIn = meal.optin?.status === 'opted-in';
            const cutoffPassed = new Date() > new Date(meal.cutoffTime);
            return (
              <div key={meal._id} className={`card border ${isOptedIn ? 'border-brand-200 bg-brand-50/30' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{MEAL_ICONS[meal.mealType]}</span>
                    <div>
                      <h3 className={`font-semibold capitalize ${MEAL_COLORS[meal.mealType]}`}>
                        {meal.mealType}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Cutoff: {new Date(meal.cutoffTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-700">₹{meal.pricePerHead}</p>
                    {cutoffPassed && <span className="badge-gray text-xs">Closed</span>}
                  </div>
                </div>

                {/* Menu items */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {meal.menuItems?.map((item, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                        item.isVeg ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      <span>{item.isVeg ? '🟢' : '🔴'}</span> {item.name}
                    </span>
                  ))}
                </div>

                {meal.specialDay?.isSpecial && (
                  <div className="badge-amber mb-3">🎉 {meal.specialDay.label}</div>
                )}

                <button
                  onClick={() => handleToggle(meal)}
                  disabled={cutoffPassed}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    cutoffPassed
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isOptedIn
                      ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                      : 'btn-primary'
                  }`}
                >
                  {cutoffPassed ? 'Window closed' : isOptedIn ? '✕ Opt Out' : '✓ Opt In'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
