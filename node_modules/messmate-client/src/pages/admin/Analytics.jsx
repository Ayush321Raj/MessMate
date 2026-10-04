import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAttendanceAnalytics, fetchWastageAnalytics } from '../../store/slices/analyticsSlice';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const COLORS = ['#16a34a', '#f59e0b', '#3b82f6', '#ec4899'];

export default function AdminAnalytics() {
  const dispatch = useDispatch();
  const { attendance, wastage } = useSelector((s) => s.analytics);
  const [feedbackSummary, setFeedbackSummary] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    dispatch(fetchAttendanceAnalytics({}));
    dispatch(fetchWastageAnalytics());
    api.get('/feedback/summary').then((r) => setFeedbackSummary(r.data));
  }, [dispatch]);

  const attendanceChartData = (attendance?.dailyAttendance || []).map((d) => ({
    date: d._id.date,
    [d._id.mealType]: d.count,
  }));

  // Merge by date
  const mergedAttendance = attendanceChartData.reduce((acc, cur) => {
    const existing = acc.find((a) => a.date === cur.date);
    if (existing) Object.assign(existing, cur);
    else acc.push({ ...cur });
    return acc;
  }, []);

  const wastageChartData = (wastage?.wastageData || []).map((d) => ({
    name: `${d.date} ${d.mealType}`,
    forecasted: d.forecasted,
    actual: d.actual,
    waste: d.excess,
  }));

  const topDishes = feedbackSummary?.topDishes || [];
  const dishChartData = topDishes.map((d) => ({ name: d.dishName, rating: parseFloat(d.avgRating) }));

  const handleDownloadAttendance = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/analytics/reports/attendance', {
        params: { format: 'excel' },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance-report.xlsx';
      a.click();
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Management Analytics</h1>
        <button className="btn-secondary text-sm" onClick={handleDownloadAttendance} disabled={downloading}>
          {downloading ? 'Downloading…' : '📊 Export Attendance'}
        </button>
      </div>

      {/* Attendance Trend */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Daily Attendance Trend</h2>
        {mergedAttendance.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={mergedAttendance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="breakfast" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="lunch" stroke="#16a34a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="dinner" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Forecast vs Actual */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Forecast vs Actual Headcount</h2>
        {wastageChartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400">No forecast data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={wastageChartData.slice(-15)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="forecasted" fill="#bbf7d0" name="Forecasted" />
              <Bar dataKey="actual" fill="#16a34a" name="Actual" />
              <Bar dataKey="waste" fill="#fca5a5" name="Excess/Waste" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top rated dishes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Top Rated Dishes</h2>
          {dishChartData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400">No feedback yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dishChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v) => v.toFixed(1)} />
                <Bar dataKey="rating" fill="#16a34a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Food Waste %</h2>
          {wastageChartData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400">No data yet</div>
          ) : (
            <>
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-amber-500">{wastage?.avgWastePercent ?? 0}%</p>
                <p className="text-xs text-gray-500">Average waste over last 30 meals</p>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Consumed', value: 100 - (wastage?.avgWastePercent || 0) },
                      { name: 'Wasted', value: wastage?.avgWastePercent || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {[0, 1].map((i) => (
                      <Cell key={i} fill={i === 0 ? '#16a34a' : '#fca5a5'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
