import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function KitchenInsights() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/analytics/caterer')
      .then(({ data }) => setReport(data))
      .catch(() => setError('Operational insights could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card animate-pulse h-40 bg-gray-100" />;
  if (error) return <div className="card text-sm text-red-600">{error}</div>;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold text-gray-900">Caterer Insights</h1>
        <p className="text-sm text-gray-500">Demand and dish feedback from recent meals</p>
      </header>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-800">Upcoming preparation</h2>
        {report.upcomingMeals.length === 0 ? (
          <div className="card text-sm text-gray-500">No meals are scheduled for the next seven days.</div>
        ) : report.upcomingMeals.map((meal) => (
          <article className="card" key={meal._id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold capitalize text-gray-900">{meal.mealType}</p>
                <p className="text-xs text-gray-500">
                  {new Date(meal.date).toLocaleDateString()} · {meal.menuItems.join(', ') || 'Menu not set'}
                </p>
              </div>
              <span className="badge-green">{meal.forecastedHeadcount || '—'} forecast</span>
            </div>
            <p className="mt-3 text-sm text-gray-700">{meal.quantityRecommendation}</p>
            <p className="mt-1 text-xs text-gray-500">Current opt-ins: {meal.optinCount}</p>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-800">Dish quality · last {report.periodDays} days</h2>
        {report.dishQuality.length === 0 ? (
          <div className="card text-sm text-gray-500">No dish feedback recorded in this period.</div>
        ) : (
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
            {report.dishQuality.map((dish) => (
              <div className="flex items-center justify-between gap-3 px-4 py-3" key={dish.dishName}>
                <span className="text-sm text-gray-800">{dish.dishName}</span>
                <span className={`text-sm font-semibold ${dish.avgRating < 3.5 ? 'text-amber-700' : 'text-green-700'}`}>
                  {dish.avgRating}/5 <span className="font-normal text-gray-500">({dish.responses})</span>
                </span>
              </div>
            ))}
          </div>
        )}
        {report.qualityRecommendations.map((recommendation) => (
          <p className="border-l-2 border-amber-400 px-3 py-2 text-sm text-amber-900" key={recommendation.dishName}>
            {recommendation.message}
          </p>
        ))}
      </section>
    </div>
  );
}