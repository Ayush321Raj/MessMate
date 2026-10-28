import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import api from '../../api/axios';
import { socketUrl } from '../../api/config';
import toast from 'react-hot-toast';

const STATUS_COLORS = { pending: 'badge-amber', paid: 'badge-green', overdue: 'badge-red' };

export default function StudentBilling() {
  const { user, token } = useSelector((s) => s.auth);
  const [bills, setBills] = useState([]);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ledgerLoaded = false;
    const pendingEntries = [];
    const socket = io(socketUrl, { auth: { token } });
    socket.on('billing:entry', ({ entry }) => {
      if (!ledgerLoaded) {
        pendingEntries.push(entry);
        return;
      }
      setLedger((current) => applyEntry(current, entry));
    });

    api.get(`/billing/${user._id}`)
      .then((r) => setBills(r.data.bills || []))
      .catch(() => toast.error('Failed to load billing'))
      .finally(() => setLoading(false));

    api.get(`/billing/ledger/${user._id}`)
      .then(({ data }) => {
        ledgerLoaded = true;
        setLedger(pendingEntries.reduce(applyEntry, data));
      })
      .catch(() => toast.error('Failed to load running bill'));

    return () => socket.disconnect();
  }, [user._id, token]);

  const handleDownload = async (bill, format) => {
    try {
      const res = await api.get(`/billing/${user._id}/download`, {
        params: { format, month: bill.month, year: bill.year },
        responseType: 'blob',
      });
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `bill-${bill.month}-${bill.year}.${ext}`;
      a.click();
    } catch {
      toast.error('Download failed');
    }
  };

  if (loading) return (
    <div className="space-y-3">
      {[1, 2].map((i) => <div key={i} className="card animate-pulse h-28 bg-gray-100" />)}
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-900">Mess Billing</h1>

      <section className="card border-brand-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">Running total</h2>
            <p className="text-xs text-gray-500">{ledger?.totalMeals || 0} successful meal scans this month</p>
          </div>
          <span className={STATUS_COLORS[ledger?.status || 'pending']}>
            {(ledger?.status || 'pending').toUpperCase()}
          </span>
        </div>
        <p className="mt-3 text-2xl font-bold text-gray-900">₹{(ledger?.totalAmount || 0).toFixed(2)}</p>
        <p className="mt-1 text-xs text-gray-500">Updates after each successful scan. Final amount is shown on the monthly statement.</p>
      </section>

      {!!ledger?.entries?.length && (
        <section className="card !p-0">
          <h2 className="border-b border-gray-100 px-4 py-3 font-semibold text-gray-800">This month’s meal activity</h2>
          <div className="divide-y divide-gray-100">
            {ledger.entries.map((entry) => (
              <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm" key={entry._id}>
                <div>
                  <p className="capitalize text-gray-800">{entry.mealType}</p>
                  <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₹{entry.amount.toFixed(2)}</p>
                  <p className="text-xs capitalize text-gray-500">{entry.status}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {bills.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">💳</p>
          <p>No bills generated yet. Bills are generated at month end.</p>
        </div>
      ) : (
        bills.map((bill) => (
          <div key={bill._id} className="card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-800">
                  {new Date(bill.year, bill.month - 1).toLocaleDateString('en', { month: 'long', year: 'numeric' })}
                </p>
                <p className="text-xs text-gray-500">{bill.totalMealsConsumed} meals consumed</p>
              </div>
              <span className={STATUS_COLORS[bill.status]}>{bill.status.toUpperCase()}</span>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm mb-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Gross Amount</span>
                <span>₹{bill.grossAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rebate</span>
                <span className="text-brand-600">-₹{bill.rebateAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-gray-200 pt-1.5 mt-1">
                <span>Total Due</span>
                <span className="text-lg">₹{bill.finalAmount?.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(bill, 'pdf')}
                className="btn-secondary flex-1 text-sm py-1.5"
              >
                📄 PDF
              </button>
              <button
                onClick={() => handleDownload(bill, 'excel')}
                className="btn-secondary flex-1 text-sm py-1.5"
              >
                📊 Excel
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function applyEntry(current, entry) {
  if (!current) return current;
  if (current.entries.some((existing) => existing._id === entry._id)) return current;
  const entries = [...current.entries, entry];
  return {
    ...current,
    entries,
    totalMeals: entries.length,
    totalAmount: entries.reduce((total, item) => total + item.amount, 0),
  };
}
