import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_COLORS = { pending: 'badge-amber', paid: 'badge-green', overdue: 'badge-red' };

export default function AdminBilling() {
  const [students, setStudents] = useState([]);
  const [bills, setBills] = useState([]);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedStudent, setSelectedStudent] = useState('all');

  useEffect(() => {
    api.get('/admin/users', { params: { role: 'student' } })
      .then((r) => setStudents(r.data.users || []));
  }, []);

  useEffect(() => {
    if (!selectedStudent || selectedStudent === 'all') {
      setBills([]);
      setLedger(null);
      return;
    }
    setLoading(true);
    Promise.all([
      api.get(`/billing/${selectedStudent}`),
      api.get(`/billing/ledger/${selectedStudent}`, { params: { month, year } }),
    ])
      .then(([billResponse, ledgerResponse]) => {
        setBills(billResponse.data.bills || []);
        setLedger(ledgerResponse.data);
      })
      .catch(() => toast.error('Failed to load student billing details'))
      .finally(() => setLoading(false));
  }, [selectedStudent, month, year]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/billing/generate', { month, year });
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (billId) => {
    await api.put(`/billing/${billId}/mark-paid`);
    toast.success('Marked as paid');
    setBills((prev) => prev.map((b) => b._id === billId ? { ...b, status: 'paid' } : b));
    setLedger((prev) => prev ? {
      ...prev,
      status: 'paid',
      entries: prev.entries.map((entry) => ({ ...entry, status: 'paid' })),
    } : prev);
  };

  const handleDownload = async (studentId, billMonth, billYear, format) => {
    const res = await api.get(`/billing/${studentId}/download`, {
      params: { format, month: billMonth, year: billYear },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill-${billMonth}-${billYear}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    a.click();
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Billing Management</h1>

      {/* Generate bills */}
      <div className="card border-brand-100">
        <h2 className="font-semibold text-gray-800 mb-3">Generate Monthly Bills</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Month</label>
            <select className="input w-28" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i+1} value={i+1}>
                  {new Date(0, i).toLocaleString('en', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <input className="input w-24" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
          <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating…' : '⚡ Generate Bills'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          This calculates bills for all active students based on attendance records and emails them.
        </p>
      </div>

      {/* View student bills */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">View Student Bills</h2>
        <select className="input max-w-xs mb-4" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
          <option value="all">Select a student…</option>
          {students.map((s) => <option key={s._id} value={s._id}>{s.name} — {s.email}</option>)}
        </select>

        {loading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="card animate-pulse h-24 bg-gray-100"/>)}</div>
        ) : bills.length === 0 && selectedStudent !== 'all' ? (
          <div className="space-y-3">
            <LedgerAudit ledger={ledger} />
            <div className="card text-center py-8 text-gray-400">No monthly statement generated for this student yet.</div>
          </div>
        ) : (
          <div className="space-y-3">
            <LedgerAudit ledger={ledger} />
            {bills.map((bill) => (
              <div key={bill._id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-800">
                      {new Date(bill.year, bill.month - 1).toLocaleDateString('en', { month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500">{bill.totalMealsConsumed} meals · ₹{bill.finalAmount?.toFixed(2)}</p>
                  </div>
                  <span className={STATUS_COLORS[bill.status]}>{bill.status}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {bill.status !== 'paid' && (
                    <button onClick={() => handleMarkPaid(bill._id)} className="btn-primary text-xs py-1 px-3">
                      Mark Paid
                    </button>
                  )}
                  <button onClick={() => handleDownload(bill.student._id || bill.student, bill.month, bill.year, 'pdf')} className="btn-secondary text-xs py-1 px-3">
                    📄 PDF
                  </button>
                  <button onClick={() => handleDownload(bill.student._id || bill.student, bill.month, bill.year, 'excel')} className="btn-secondary text-xs py-1 px-3">
                    📊 Excel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LedgerAudit({ ledger }) {
  if (!ledger) return null;
  return (
    <section className="card !p-0">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <h3 className="font-semibold text-gray-800">Bill audit · {ledger.month}/{ledger.year}</h3>
          <p className="text-xs text-gray-500">{ledger.totalMeals} successful meal scans</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">₹{ledger.totalAmount.toFixed(2)}</p>
          <span className={STATUS_COLORS[ledger.status]}>{ledger.status}</span>
        </div>
      </div>
      {ledger.entries.length ? (
        <div className="divide-y divide-gray-100">
          {ledger.entries.map((entry) => (
            <div className="flex items-center justify-between px-4 py-3 text-sm" key={entry._id}>
              <div>
                <p className="capitalize text-gray-800">{entry.mealType}</p>
                <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-900">₹{entry.amount.toFixed(2)}</p>
                <p className="text-xs capitalize text-gray-500">{entry.status}</p>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="px-4 py-5 text-sm text-gray-500">No successful meal scans for this period.</p>}
    </section>
  );
}
