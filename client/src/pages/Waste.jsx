import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const initialForm = { category: 'food', segregation: 'wet', quantity: '', unit: 'kg', mealId: '', notes: '' };

export default function Waste() {
  const [entries, setEntries] = useState([]);
  const [meals, setMeals] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - 7);
    const to = new Date(today);
    to.setDate(to.getDate() + 1);
    Promise.all([
      api.get('/waste'),
      api.get('/meals', {
        params: { startDate: from.toISOString().slice(0, 10), endDate: to.toISOString().slice(0, 10) },
      }),
    ])
      .then(([wasteResponse, mealResponse]) => {
        setEntries(wasteResponse.data.entries || []);
        setMeals(mealResponse.data.meals || []);
      })
      .catch(() => toast.error('Could not load waste records'))
      .finally(() => setLoading(false));
  }, []);

  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/waste', { ...form, quantity: Number(form.quantity) });
      setEntries((current) => [data.entry, ...current].slice(0, 100));
      setForm(initialForm);
      toast.success('Waste record added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save waste record');
    } finally {
      setSaving(false);
    }
  };

  const totalsBySegregation = entries.reduce((totals, entry) => {
    const key = `${entry.segregation} · ${entry.unit}`;
    totals[key] = (totals[key] || 0) + entry.quantity;
    return totals;
  }, {});

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold text-gray-900">Waste Log</h1>
        <p className="text-sm text-gray-500">Record measured waste separately from inventory stock.</p>
      </header>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <h2 className="font-semibold text-gray-800">Record waste</h2>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="label">Category</span>
            <select className="input" name="category" value={form.category} onChange={updateForm}>
              <option value="food">Food waste</option>
              <option value="preparation">Preparation scraps</option>
              <option value="packaging">Packaging</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            <span className="label">Segregation</span>
            <select className="input" name="segregation" value={form.segregation} onChange={updateForm}>
              <option value="wet">Wet</option>
              <option value="dry">Dry</option>
              <option value="recyclable">Recyclable</option>
            </select>
          </label>
          <label>
            <span className="label">Quantity</span>
            <input className="input" type="number" min="0.01" step="0.01" name="quantity" value={form.quantity} onChange={updateForm} required />
          </label>
          <label>
            <span className="label">Unit</span>
            <select className="input" name="unit" value={form.unit} onChange={updateForm}>
              {['kg', 'g', 'litre', 'ml', 'piece', 'pack'].map((unit) => <option key={unit}>{unit}</option>)}
            </select>
          </label>
        </div>
        <label>
          <span className="label">Related meal</span>
          <select className="input" name="mealId" value={form.mealId} onChange={updateForm}>
            <option value="">Not linked to a meal</option>
            {meals.map((meal) => (
              <option key={meal._id} value={meal._id}>
                {new Date(meal.date).toLocaleDateString()} · {meal.mealType}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Notes</span>
          <input className="input" name="notes" maxLength={300} value={form.notes} onChange={updateForm} placeholder="Optional" />
        </label>
        <button className="btn-primary w-full" type="submit" disabled={saving || !form.quantity}>
          {saving ? 'Saving…' : 'Add waste record'}
        </button>
      </form>

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold text-gray-800">Segregation totals</h2>
          <p className="text-xs text-gray-500">Latest 100 records; totals remain separated by unit.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(totalsBySegregation).map(([label, total]) => (
            <div className="rounded-lg border border-gray-100 bg-white px-3 py-2" key={label}>
              <p className="text-xs capitalize text-gray-500">{label}</p>
              <p className="font-semibold text-gray-900">{total.toFixed(2)}</p>
            </div>
          ))}
          {!Object.keys(totalsBySegregation).length && <p className="text-sm text-gray-500">No waste records yet.</p>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-800">Recent entries</h2>
        {loading ? <div className="card animate-pulse h-24 bg-gray-100" /> : entries.length === 0 ? (
          <div className="card text-sm text-gray-500">No waste has been logged.</div>
        ) : entries.map((entry) => (
          <article className="card !p-4" key={entry._id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium capitalize text-gray-900">{entry.category} · {entry.segregation}</p>
                <p className="text-xs text-gray-500">
                  {new Date(entry.recordedAt).toLocaleString()} · {entry.loggedBy?.name || 'Staff'}
                </p>
                {entry.meal && <p className="text-xs capitalize text-gray-500">{entry.meal.mealType} meal</p>}
              </div>
              <p className="whitespace-nowrap font-semibold text-gray-900">{entry.quantity} {entry.unit}</p>
            </div>
            {entry.notes && <p className="mt-2 text-sm text-gray-600">{entry.notes}</p>}
          </article>
        ))}
      </section>
    </div>
  );
}