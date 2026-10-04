import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInventory } from '../../store/slices/inventorySlice';

export default function KitchenInventory() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.inventory);

  useEffect(() => { dispatch(fetchInventory()); }, [dispatch]);

  const lowStockItems = items.filter((i) => i.quantityInStock <= i.reorderThreshold);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Stock Overview</h1>
      <p className="text-gray-500 text-sm">Read-only view. Contact admin to restock.</p>

      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="font-semibold text-amber-700 mb-2">⚠️ {lowStockItems.length} item(s) need restocking</p>
          {lowStockItems.map((i) => (
            <div key={i._id} className="text-sm text-amber-600">
              {i.itemName}: {i.quantityInStock} {i.unit} (threshold: {i.reorderThreshold})
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="card animate-pulse h-14 bg-gray-100"/>)}</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const isLow = item.quantityInStock <= item.reorderThreshold;
            const pct = Math.min(100, (item.quantityInStock / Math.max(item.reorderThreshold * 2, 1)) * 100);
            return (
              <div key={item._id} className="card">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-gray-800 text-sm">{item.itemName}</span>
                  <span className={`text-sm font-semibold ${isLow ? 'text-red-600' : 'text-brand-600'}`}>
                    {item.quantityInStock} {item.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${isLow ? 'bg-red-400' : 'bg-brand-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Threshold: {item.reorderThreshold} {item.unit}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
