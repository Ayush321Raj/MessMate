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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f9f3] px-4 py-10">
      <div className="pointer-events-none absolute -left-24 -top-20 h-80 w-80 rounded-full bg-brand-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-16 h-96 w-96 rounded-full bg-amber-100/70 blur-3xl" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-7 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 text-2xl text-white shadow-lg shadow-brand-900/15" aria-hidden="true">🌿</span>
          <span className="mt-3 text-2xl font-black tracking-tight text-gray-900">MessMate</span>
          <span className="mt-1 text-sm text-gray-500">A smarter, happier mess experience</span>
        </Link>

        <div className="rounded-3xl border border-white bg-white/95 p-6 shadow-xl shadow-gray-900/5 sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to get back to your MessMate.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                className="input py-3"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className="input py-3"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full rounded-xl py-3" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            New to MessMate?{' '}
            <Link to="/register" className="font-bold text-brand-700 hover:text-brand-800 hover:underline">Create an account</Link>
          </p>

          {import.meta.env.DEV && (
            <div className="mt-6 rounded-2xl bg-brand-50 p-4 text-xs leading-5 text-gray-600">
              <p className="mb-1 font-bold text-brand-800">Development demo accounts</p>
              <p>Admin: admin@messmate.app / Admin@123</p>
              <p>Kitchen: kitchen@messmate.app / Kitchen@123</p>
              <p>Student: arjun@student.edu / Student@123</p>
            </div>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-gray-500"><Link to="/" className="hover:text-brand-700">← Back to home</Link></p>
      </div>
    </div>
  );
}
