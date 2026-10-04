import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      toast.success('Welcome back!');
      const role = result.payload.user.role;
      navigate(role === 'admin' ? '/admin' : role === 'kitchen' ? '/kitchen' : '/student');
    } else {
      toast.error(result.payload || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌿</div>
          <h1 className="text-2xl font-bold text-gray-900">MessMate</h1>
          <p className="text-gray-500 text-sm mt-1">Smart Hostel Mess Management</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-medium hover:underline">
              Register
            </Link>
          </p>

          {/* Demo credentials hint */}
          <div className="mt-4 p-3 bg-brand-50 rounded-lg text-xs text-gray-600 space-y-1">
            <p className="font-medium text-brand-700">Demo accounts:</p>
            <p>Admin: admin@messmate.app / Admin@123</p>
            <p>Kitchen: kitchen@messmate.app / Kitchen@123</p>
            <p>Student: arjun@student.edu / Student@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
