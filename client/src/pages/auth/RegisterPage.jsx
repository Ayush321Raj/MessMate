import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', roomNumber: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(registerUser({ ...form, role: 'student' }));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created! Welcome to MessMate 🌿');
      navigate('/student');
    } else {
      toast.error(result.payload || 'Registration failed');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f9f3] px-4 py-8">
      <div className="pointer-events-none absolute -left-24 -top-20 h-80 w-80 rounded-full bg-brand-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-16 h-96 w-96 rounded-full bg-amber-100/70 blur-3xl" />
      <div className="relative w-full max-w-lg">
        <Link to="/" className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 text-2xl text-white shadow-lg shadow-brand-900/15" aria-hidden="true">🌿</span>
          <span className="mt-3 text-2xl font-black tracking-tight text-gray-900">MessMate</span>
          <span className="mt-1 text-sm text-gray-500">A smarter, happier mess experience</span>
        </Link>

        <div className="rounded-3xl border border-white bg-white/95 p-6 shadow-xl shadow-gray-900/5 sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Join your campus mess</h1>
          <p className="mt-1 text-sm text-gray-500">Create your student account and make meal time simpler.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="register-name">Full name</label>
              <input id="register-name" className="input py-3" autoComplete="name" placeholder="Arjun Sharma" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="register-email">Email address</label>
              <input id="register-email" className="input py-3" type="email" autoComplete="email" placeholder="you@student.edu" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="register-password">Password</label>
              <input id="register-password" className="input py-3" type="password" autoComplete="new-password" placeholder="At least 6 characters" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="register-department">Department <span className="font-normal text-gray-400">(optional)</span></label>
                <input id="register-department" className="input py-3" autoComplete="organization-title" placeholder="CSE" value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="register-room">Room number <span className="font-normal text-gray-400">(optional)</span></label>
                <input id="register-room" className="input py-3" autoComplete="off" placeholder="A-101" value={form.roomNumber}
                  onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} />
              </div>
            </div>
            <button className="btn-primary w-full rounded-xl py-3" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create student account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-700 hover:text-brand-800 hover:underline">Sign in</Link>
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-gray-500"><Link to="/" className="hover:text-brand-700">← Back to home</Link></p>
      </div>
    </div>
  );
}
