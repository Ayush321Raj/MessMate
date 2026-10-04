import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const MEAL_ICONS = { breakfast: '☀️', lunch: '🌤️', dinner: '🌙' };

export default function StudentPasses() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api.get('/passes/my')
      .then((r) => setPasses(r.data.passes || []))
      .catch(() => toast.error('Failed to load passes'))
      .finally(() => setLoading(false));
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const todayPasses = passes.filter((p) => p.meal?.date?.startsWith(todayStr));
  const upcomingPasses = passes.filter((p) => p.meal?.date > todayStr + 'T');

  const PassCard = ({ pass }) => {
    const mealDate = pass.meal ? new Date(pass.meal.date) : null;
    const isUsed = pass.qrTokenUsed;
    const isExpanded = expandedId === pass._id;

    return (
      <div className={`card ${isUsed ? 'opacity-60' : 'border-brand-100'}`}>
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpandedId(isExpanded ? null : pass._id)}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{MEAL_ICONS[pass.meal?.mealType] || '🍽️'}</span>
            <div>
              <p className="font-medium text-gray-800 capitalize">{pass.meal?.mealType}</p>
              <p className="text-xs text-gray-500">{mealDate?.toDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isUsed ? <span className="badge-gray">Used</span> : <span className="badge-green">Active</span>}
            <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
          </div>
        </div>

        {isExpanded && !isUsed && pass.qrCodeImageUrl && (
          <div className="mt-4 flex flex-col items-center">
            <div className="p-2 bg-white border-2 border-brand-200 rounded-xl">
              <img src={pass.qrCodeImageUrl} alt="QR Pass" className="w-48 h-48" />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Show this at the mess counter. Single use only.
            </p>
            <p className="font-mono text-xs text-gray-400 mt-1 break-all px-4 text-center">
              {pass.qrToken}
            </p>
          </div>
        )}

        {isExpanded && isUsed && (
          <div className="mt-4 text-center py-6 text-gray-400">
            <p className="text-2xl mb-1">✅</p>
            <p className="text-sm">This pass has been used.</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-20 bg-gray-100" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold text-gray-900">My Meal Passes</h1>

      {passes.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🎫</p>
          <p>No active passes. Opt in to a meal to get your QR pass.</p>
        </div>
      ) : (
        <>
          {todayPasses.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Today</h2>
              <div className="space-y-2">{todayPasses.map((p) => <PassCard key={p._id} pass={p} />)}</div>
            </section>
          )}
          {upcomingPasses.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Upcoming</h2>
              <div className="space-y-2">{upcomingPasses.map((p) => <PassCard key={p._id} pass={p} />)}</div>
            </section>
          )}
          {todayPasses.length === 0 && upcomingPasses.length === 0 && (
            <div className="space-y-2">{passes.map((p) => <PassCard key={p._id} pass={p} />)}</div>
          )}
        </>
      )}
    </div>
  );
}
