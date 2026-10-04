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
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌿</div>
          <h1 className="text-2xl font-bold text-gray-900">MessMate</h1>
          <p className="text-gray-500 text-sm mt-1">Create your student account</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Create account</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="Arjun Sharma" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@student.edu" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Min. 6 characters" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Department</label>
                <input className="input" placeholder="CSE" value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
              <div>
                <label className="label">Room No.</label>
                <input className="input" placeholder="A-101" value={form.roomNumber}
                  onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} />
              </div>
            </div>
            <button className="btn-primary w-full mt-2" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
