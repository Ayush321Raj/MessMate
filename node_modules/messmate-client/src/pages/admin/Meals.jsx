import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMeals, createMeal } from '../../store/slices/mealsSlice';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const MEAL_ICONS = { breakfast: '☀️', lunch: '🌤️', dinner: '🌙' };

export default function AdminMeals() {
  const dispatch = useDispatch();
  const { items: meals, loading } = useSelector((s) => s.meals);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: '',
    mealType: 'lunch',
    menuItemsText: '',
    cutoffTime: '',
    pricePerHead: 60,
    isSpecial: false,
    specialLabel: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const start = new Date().toISOString().split('T')[0];
    const end = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    dispatch(fetchMeals({ startDate: start, endDate: end }));
  }, [dispatch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const menuItems = form.menuItemsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name, isVeg: true }));

    const result = await dispatch(createMeal({
      date: form.date,
      mealType: form.mealType,
      menuItems,
      cutoffTime: form.cutoffTime,
      pricePerHead: Number(form.pricePerHead),
      specialDay: { isSpecial: form.isSpecial, label: form.specialLabel },
    }));
    setSubmitting(false);
    if (createMeal.fulfilled.match(result)) {
      toast.success('Meal created!');
      setShowForm(false);
      setForm({ date: '', mealType: 'lunch', menuItemsText: '', cutoffTime: '', pricePerHead: 60, isSpecial: false, specialLabel: '' });
    } else {
      toast.error(result.payload || 'Failed to create meal');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this meal?')) return;
    await api.delete(`/meals/${id}`);
    toast.success('Meal deleted');
    dispatch(fetchMeals({ startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] }));
  };

  // Group by date
  const grouped = meals.reduce((acc, m) => {
    const d = m.date?.split('T')[0];
    if (!acc[d]) acc[d] = [];
    acc[d].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Meal Management</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Meal'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3 border-brand-200">
          <h2 className="font-semibold text-gray-800">New Meal</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.mealType}
                onChange={(e) => setForm({ ...form, mealType: e.target.value })}>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Menu Items (one per line)</label>
            <textarea className="input resize-none" rows={4} placeholder="Dal Tadka&#10;Jeera Rice&#10;Roti&#10;Salad"
              value={form.menuItemsText} onChange={(e) => setForm({ ...form, menuItemsText: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Cutoff Time</label>
              <input className="input" type="datetime-local" value={form.cutoffTime}
                onChange={(e) => setForm({ ...form, cutoffTime: e.target.value })} required />
            </div>
            <div>
              <label className="label">Price/Head (₹)</label>
              <input className="input" type="number" min={0} value={form.pricePerHead}
                onChange={(e) => setForm({ ...form, pricePerHead: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="special" checked={form.isSpecial}
              onChange={(e) => setForm({ ...form, isSpecial: e.target.checked })} />
            <label htmlFor="special" className="text-sm text-gray-700">Special Day</label>
            {form.isSpecial && (
              <input className="input ml-2 flex-1" placeholder="e.g. Diwali Celebration"
                value={form.specialLabel} onChange={(e) => setForm({ ...form, specialLabel: e.target.value })} />
            )}
          </div>
          <button className="btn-primary w-full" type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Meal'}
          </button>
        </form>
      )}

      {/* Meal list */}
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="card animate-pulse h-20 bg-gray-100"/>)}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">🍽️</p>
          <p>No upcoming meals. Add one above.</p>
        </div>
      ) : (
        Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, dayMeals]) => (
          <div key={date}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {new Date(date).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h2>
            <div className="space-y-2">
              {dayMeals.map((meal) => (
                <div key={meal._id} className="card flex items-start justify-between">
                  <div className="flex gap-3">
                    <span className="text-2xl">{MEAL_ICONS[meal.mealType]}</span>
                    <div>
                      <p className="font-medium capitalize text-gray-800">{meal.mealType}</p>
                      <p className="text-xs text-gray-500">
                        {meal.menuItems?.slice(0, 3).map(i => i.name).join(', ')}{meal.menuItems?.length > 3 ? ` +${meal.menuItems.length-3}` : ''}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">₹{meal.pricePerHead} · Cutoff: {new Date(meal.cutoffTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</p>
                      {meal.specialDay?.isSpecial && <span className="badge-amber mt-1">🎉 {meal.specialDay.label}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>👥 {meal.actualHeadcount}/{meal.forecastedHeadcount || '?'}</span>
                    <button onClick={() => handleDelete(meal._id)} className="text-red-400 hover:text-red-600">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
