import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function StudentFeedback() {
  const [pastMeals, setPastMeals] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [ratings, setRatings] = useState({});
  const [overallRating, setOverallRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    api.get('/meals', { params: { startDate: start, endDate: end } })
      .then((r) => {
        const past = (r.data.meals || []).filter(
          (m) => new Date(m.date) < new Date() && m.optin?.status === 'opted-in'
        );
        setPastMeals(past);
      })
      .finally(() => setLoading(false));

    api.get('/feedback/my').then((r) => {
      const ids = (r.data.feedbacks || []).map((f) => f.meal?._id || f.meal);
      setSubmitted(new Set(ids));
    });
  }, []);

  const handleRating = (dish, rating) => setRatings((prev) => ({ ...prev, [dish]: rating }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMeal) return;
    setSubmitting(true);
    try {
      const dishRatings = selectedMeal.menuItems.map((d) => ({
        dishName: d.name,
        rating: ratings[d.name] || overallRating,
      }));
      await api.post('/feedback', {
        mealId: selectedMeal._id,
        dishRatings,
        overallRating,
        comment,
      });
      toast.success('Thanks for your feedback! ⭐');
      setSubmitted((prev) => new Set([...prev, selectedMeal._id]));
      setSelectedMeal(null);
      setRatings({});
      setComment('');
      setOverallRating(5);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`text-xl transition-transform hover:scale-110 ${s <= value ? 'text-amber-400' : 'text-gray-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  );

  if (loading) return <div className="space-y-2">{[1,2].map(i => <div key={i} className="card animate-pulse h-16 bg-gray-100"/>)}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-900">Meal Feedback</h1>

      {selectedMeal ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <button type="button" onClick={() => setSelectedMeal(null)} className="text-brand-600 text-sm font-medium">← Back</button>
            <h2 className="font-semibold capitalize text-gray-800">
              {selectedMeal.mealType} — {new Date(selectedMeal.date).toDateString()}
            </h2>
          </div>

          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Rate each dish</h3>
            {selectedMeal.menuItems.map((dish) => (
              <div key={dish.name} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{dish.name}</span>
                <StarRating value={ratings[dish.name] || 0} onChange={(v) => handleRating(dish.name, v)} />
              </div>
            ))}
          </div>

          <div className="card">
            <label className="label">Overall Rating</label>
            <StarRating value={overallRating} onChange={setOverallRating} />
          </div>

          <div className="card">
            <label className="label">Comment (optional)</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Anything you'd like to share..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
            />
          </div>

          <button className="btn-primary w-full" type="submit" disabled={submitting || overallRating === 0}>
            {submitting ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </form>
      ) : pastMeals.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">⭐</p>
          <p>No recent opted-in meals to rate.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pastMeals.map((meal) => {
            const done = submitted.has(meal._id);
            return (
              <button
                key={meal._id}
                onClick={() => !done && setSelectedMeal(meal)}
                disabled={done}
                className={`card w-full text-left flex items-center justify-between ${done ? 'opacity-60 cursor-default' : 'hover:border-brand-200 cursor-pointer'}`}
              >
                <div>
                  <p className="font-medium capitalize text-gray-800">{meal.mealType}</p>
                  <p className="text-xs text-gray-500">{new Date(meal.date).toDateString()}</p>
                </div>
                {done ? <span className="badge-green">Submitted ✓</span> : <span className="btn-primary text-xs py-1 px-3">Rate</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
