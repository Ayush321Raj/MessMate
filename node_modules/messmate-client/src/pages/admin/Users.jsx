import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ROLE_COLORS = { student: 'badge-green', admin: 'badge-amber', kitchen: 'badge-gray' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { search, role: roleFilter || undefined } });
      setUsers(data.users || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const handleEdit = (user) => {
    setEditUser(user);
    setEditForm({ role: user.role, isActive: user.isActive, rfidCardId: user.rfidCardId || '', roomNumber: user.roomNumber || '', department: user.department || '' });
  };

  const handleSave = async () => {
    try {
      await api.put(`/admin/users/${editUser._id}`, editForm);
      toast.success('User updated');
      setEditUser(null);
      fetchUsers();
    } catch {
      toast.error('Update failed');
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    await api.delete(`/admin/users/${id}`);
    toast.success('User deactivated');
    fetchUsers();
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">User Management</h1>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          className="input max-w-xs"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input w-36" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="admin">Admin</option>
          <option value="kitchen">Kitchen</option>
        </select>
      </div>

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl space-y-3">
            <h3 className="font-semibold">Edit — {editUser.name}</h3>
            <div>
              <label className="label">Role</label>
              <select className="input" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
                <option value="kitchen">Kitchen</option>
              </select>
            </div>
            <div>
              <label className="label">RFID Card ID</label>
              <input className="input" value={editForm.rfidCardId} onChange={(e) => setEditForm({ ...editForm, rfidCardId: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Room</label>
                <input className="input" value={editForm.roomNumber} onChange={(e) => setEditForm({ ...editForm, roomNumber: e.target.value })} />
              </div>
              <div>
                <label className="label">Dept</label>
                <input className="input" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} />
              <label htmlFor="active" className="text-sm">Active</label>
            </div>
            <div className="flex gap-2 pt-1">
              <button className="btn-primary flex-1" onClick={handleSave}>Save</button>
              <button className="btn-secondary flex-1" onClick={() => setEditUser(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="card animate-pulse h-14 bg-gray-100"/>)}</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name', 'Email', 'Role', 'Room', 'RFID', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-3"><span className={ROLE_COLORS[u.role]}>{u.role}</span></td>
                  <td className="px-4 py-3 text-gray-500">{u.roomNumber || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{u.rfidCardId || '—'}</td>
                  <td className="px-4 py-3">
                    {u.isActive ? <span className="badge-green">Active</span> : <span className="badge-red">Inactive</span>}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => handleEdit(u)} className="text-brand-600 text-xs font-medium hover:underline">Edit</button>
                    <button onClick={() => handleDeactivate(u._id)} className="text-red-500 text-xs font-medium hover:underline">Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-center py-8 text-gray-400">No users found.</p>
          )}
        </div>
      )}
    </div>
  );
}
