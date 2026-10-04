import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const MEAL_ICONS = { breakfast: '☀️', lunch: '🌤️', dinner: '🌙' };

export default function KitchenScanner() {
  const [meals, setMeals] = useState([]);
  const [selectedMealId, setSelectedMealId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [scanMethod, setScanMethod] = useState('qr'); // qr | rfid
  const [submitting, setSubmitting] = useState(false);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    api.get('/meals', { params: { startDate: today, endDate: today } })
      .then((r) => {
        const m = r.data.meals || [];
        setMeals(m);
        if (m.length > 0) setSelectedMealId(m[0]._id);
      });
  }, []);

  const startScanner = async () => {
    if (!selectedMealId) return toast.error('Select a meal first');
    const html5 = new Html5Qrcode('qr-reader');
    html5QrRef.current = html5;
    setScanning(true);
    try {
      await html5.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          await stopScanner();
          await validateToken(decodedText, 'qr');
        }
      );
    } catch (err) {
      setScanning(false);
      toast.error('Camera error: ' + err.message);
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop(); } catch {}
      html5QrRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => () => { stopScanner(); }, []);

  const validateToken = async (tokenOrCardId, method) => {
    if (!selectedMealId) return toast.error('No meal selected');
    setSubmitting(true);
    try {
      const { data } = await api.post('/passes/validate', {
        mealId: selectedMealId,
        scanMethod: method,
        tokenOrCardId,
      });
      setLastResult(data);
      if (data.success) {
        toast.success(data.message, { duration: 3000 });
      } else {
        toast.error(data.message, { duration: 4000 });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Validation error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    validateToken(manualToken.trim(), scanMethod);
    setManualToken('');
  };

  const selectedMeal = meals.find((m) => m._id === selectedMealId);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Entry Scanner</h1>

      {/* Meal selector */}
      <div className="card">
        <label className="label">Select Meal</label>
        <select
          className="input"
          value={selectedMealId}
          onChange={(e) => { setSelectedMealId(e.target.value); stopScanner(); setLastResult(null); }}
        >
          {meals.length === 0 && <option>No meals today</option>}
          {meals.map((m) => (
            <option key={m._id} value={m._id}>
              {MEAL_ICONS[m.mealType]} {m.mealType.charAt(0).toUpperCase() + m.mealType.slice(1)} — {new Date(m.date).toDateString()}
            </option>
          ))}
        </select>
      </div>

      {/* Method tabs */}
      <div className="flex gap-2">
        {['qr', 'rfid'].map((m) => (
          <button
            key={m}
            onClick={() => { setScanMethod(m); stopScanner(); setLastResult(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              scanMethod === m ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {m === 'qr' ? '📷 QR Code' : '💳 RFID Card'}
          </button>
        ))}
      </div>

      {/* QR Scanner */}
      {scanMethod === 'qr' && (
        <div className="card">
          <div id="qr-reader" ref={scannerRef} className="w-full rounded-lg overflow-hidden" />
          {!scanning ? (
            <button
              className="btn-primary w-full mt-3"
              onClick={startScanner}
              disabled={!selectedMealId}
            >
              📷 Start Camera Scanner
            </button>
          ) : (
            <button className="btn-danger w-full mt-3" onClick={stopScanner}>
              ✕ Stop Scanner
            </button>
          )}
        </div>
      )}

      {/* RFID / Manual input */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">
          {scanMethod === 'rfid' ? '💳 RFID Card Scan' : '⌨️ Manual Token Entry'}
        </h2>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            className="input flex-1"
            placeholder={scanMethod === 'rfid' ? 'Tap RFID card or enter ID…' : 'Paste QR token…'}
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            autoFocus={scanMethod === 'rfid'}
          />
          <button className="btn-primary px-5" type="submit" disabled={submitting || !manualToken.trim()}>
            {submitting ? '…' : 'Validate'}
          </button>
        </form>
        {scanMethod === 'rfid' && (
          <p className="text-xs text-gray-400 mt-2">
            RFID reader auto-fills this field when a card is tapped (via serialport bridge).
          </p>
        )}
      </div>

      {/* Scan result */}
      {lastResult && (
        <div
          className={`card border-2 ${
            lastResult.success
              ? 'border-brand-400 bg-brand-50'
              : lastResult.status === 'duplicate'
              ? 'border-amber-400 bg-amber-50'
              : 'border-red-400 bg-red-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-4xl">
              {lastResult.success ? '✅' : lastResult.status === 'duplicate' ? '⚠️' : '❌'}
            </span>
            <div>
              <p className={`font-bold text-lg ${lastResult.success ? 'text-brand-700' : lastResult.status === 'duplicate' ? 'text-amber-700' : 'text-red-700'}`}>
                {lastResult.success ? 'Entry Granted' : lastResult.status === 'duplicate' ? 'Already Scanned' : 'Entry Denied'}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">{lastResult.message}</p>
            </div>
          </div>
          <button
            className="mt-3 text-sm text-gray-500 underline"
            onClick={() => { setLastResult(null); }}
          >
            Clear & scan next
          </button>
        </div>
      )}
    </div>
  );
}
