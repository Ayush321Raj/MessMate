import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInventory, createInventoryItem, updateInventoryItem, restockItem } from '../../store/slices/inventorySlice';
import toast from 'react-hot-toast';

const UNITS = ['kg', 'g', 'litre', 'ml', 'piece', 'dozen', 'pack'];

export default function AdminInventory() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.inventory);
  const [showForm, setShowForm] = useState(false);
  const [restockModal, setRestockModal] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [form, setForm] = useState({ itemName: '', unit: 'kg', quantityInStock: '', reorderThreshold: '', costPerUnit: '', supplier: '' });

  useEffect(() => { dispatch(fetchInventory()); }, [dispatch]);

  const lowStockItems = items.filter((i) => i.quantityInStock <= i.reorderThreshold);

  const handleCreate = async (e) => {
    e.preventDefault();
    const result = await dispatch(createInventoryItem({ ...form, quantityInStock: Number(form.quantityInStock), reorderThreshold: Number(form.reorderThreshold), costPerUnit: Number(form.costPerUnit) }));
    if (createInventoryItem.fulfilled.match(result)) {
      toast.success('Item added!');
      setShowForm(false);
      setForm({ itemName: '', unit: 'kg', quantityInStock: '', reorderThreshold: '', costPerUnit: '', supplier: '' });
    } else {
      toast.error(result.payload || 'Failed');
    }
  };

  const handleRestock = async () => {
    if (!restockQty || isNaN(restockQty)) return toast.error('Enter valid quantity');
    const result = await dispatch(restockItem({ id: restockModal._id, quantity: Number(restockQty) }));
    if (restockItem.fulfilled.match(result)) {
      toast.success(`Restocked ${restockModal.itemName}!`);
      setRestockModal(null);
      setRestockQty('');
    } else {
      toast.error(result.payload || 'Restock failed');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Item'}
        </button>
      </div>

      {/* Low stock banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="font-semibold text-amber-700 mb-2">⚠️ {lowStockItems.length} item(s) below reorder threshold</p>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((i) => (
              <span key={i._id} className="badge-amber">{i.itemName}: {i.quantityInStock} {i.unit}</span>
            ))}
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3 border-brand-200">
          <h2 className="font-semibold text-gray-800">New Inventory Item</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Item Name</label>
              <input className="input" placeholder="Rice" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} required />
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">In Stock</label>
              <input className="input" type="number" min="0" placeholder="100" value={form.quantityInStock} onChange={(e) => setForm({ ...form, quantityInStock: e.target.value })} required />
            </div>
            <div>
              <label className="label">Reorder At</label>
              <input className="input" type="number" min="0" placeholder="20" value={form.reorderThreshold} onChange={(e) => setForm({ ...form, reorderThreshold: e.target.value })} required />
            </div>
            <div>
              <label className="label">Cost/Unit (₹)</label>
              <input className="input" type="number" min="0" placeholder="40" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} />
            </div>
            <div>
              <label className="label">Supplier</label>
              <input className="input" placeholder="ABC Traders" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            </div>
          </div>
          <button className="btn-primary w-full" type="submit">Add Item</button>
        </form>
      )}

      {/* Restock modal */}
      {restockModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-3">Restock — {restockModal.itemName}</h3>
            <p className="text-sm text-gray-500 mb-3">Current: {restockModal.quantityInStock} {restockModal.unit}</p>
            <label className="label">Add Quantity ({restockModal.unit})</label>
            <input className="input mb-3" type="number" min="1" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} placeholder="50" />
            <div className="flex gap-2">
              <button className="btn-primary flex-1" onClick={handleRestock}>Restock</button>
              <button className="btn-secondary flex-1" onClick={() => { setRestockModal(null); setRestockQty(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="card animate-pulse h-14 bg-gray-100"/>)}</div>
      ) : items.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">📦</p>
          <p>No inventory items. Add one above.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Item', 'Unit', 'In Stock', 'Reorder At', 'Cost/Unit', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => {
                const isLow = item.quantityInStock <= item.reorderThreshold;
                return (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{item.itemName}</td>
                    <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                    <td className={`px-4 py-3 font-semibold ${isLow ? 'text-red-600' : 'text-gray-800'}`}>
                      {item.quantityInStock}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.reorderThreshold}</td>
                    <td className="px-4 py-3 text-gray-500">₹{item.costPerUnit}</td>
                    <td className="px-4 py-3">
                      {isLow ? <span className="badge-red">Low</span> : <span className="badge-green">OK</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setRestockModal(item)}
                        className="text-brand-600 hover:text-brand-800 font-medium text-xs"
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
