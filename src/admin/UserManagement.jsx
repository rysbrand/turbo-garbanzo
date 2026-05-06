import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client.js';
import { logAction } from '../lib/auditLog.js';

const ROLES = [
  { id: 1, label: 'Employee' },
  { id: 2, label: 'Scheduling Manager' },
  { id: 3, label: 'System Admin' },
];

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(null);
    const [saved, setSaved] = useState(null);
    const [search, setSearch] = useState('');

    const [editingUser, setEditingUser] = useState(null);
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editRole, setEditRole] = useState(1);
    const [deleting, setDeleting] = useState(null);
    const [editPayType, setEditPayType] = useState('hourly');
    const [editPayRate, setEditPayRate] = useState(0);
    const [editBenefits, setEditBenefits] = useState(false);
    const [editHireDate, setEditHireDate] = useState('');

    const fetchUsers = async () => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username, user_role, updated_at')
          .order('last_name');
        if (profileError) throw profileError;

        const { data: compData, error: compError } = await supabase
          .from('employee_compensation')
          .select('*');
        if (compError) throw compError;

        console.log('profiles:', profileData, profileError);
        console.log('comp:', compData, compError);

        const merged = (profileData || []).map(profile => ({
          ...profile,
          compensation: (compData || []).find(c => c.user_id === profile.id) || null
        }));

        setUsers(merged);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchUsers();
    }, []);
  const handleRoleChange = async (userId, newRole, oldRole) => {
    setSaving(userId);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('profiles')
        .update({ user_role: newRole })
        .eq('id', userId);

      if (error) throw error;

      await logAction({
        actorId: user.id,
        targetUserId: userId,
        action: 'role_changed',
        entityType: 'profiles',
        entityId: userId,
        oldValue: { user_role: oldRole },
        newValue: { user_role: newRole },
      });

      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, user_role: newRole } : u)
      );

      setSaved(userId);
      setTimeout(() => setSaved(null), 2000);
    } catch (err) {
      alert('Error updating role: ' + err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleEditSave = async () => {
  if (!editingUser) return;
  setSaving(editingUser.id);
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        user_role: editRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingUser.id);

    if (profileError) throw profileError;

    // Upsert compensation record
    const { error: compError } = await supabase
      .from('employee_compensation')
      .upsert({
        user_id: editingUser.id,
        pay_type: editPayType,
        pay_rate: parseFloat(editPayRate) || 0,
        benefits_eligible: editBenefits,
        hire_date: editHireDate || null,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      }, { onConflict: 'user_id' });

    if (compError) throw compError;

    await logAction({
      actorId: user.id,
      targetUserId: editingUser.id,
      action: 'profile_updated_by_admin',
      entityType: 'profiles',
      entityId: editingUser.id,
      oldValue: {
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        user_role: editingUser.user_role,
        pay_type: editingUser.compensation?.pay_type,
        pay_rate: editingUser.compensation?.pay_rate,
        benefits_eligible: editingUser.compensation?.benefits_eligible,
        hire_date: editingUser.compensation?.hire_date,
      },
      newValue: {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        user_role: editRole,
        pay_type: editPayType,
        pay_rate: editPayRate,
        benefits_eligible: editBenefits,
        hire_date: editHireDate,
      },
    });

    setUsers(prev =>
      prev.map(u => u.id === editingUser.id ? {
        ...u,
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        user_role: editRole,
        compensation: {
          ...u.compensation,
          pay_type: editPayType,
          pay_rate: editPayRate,
          benefits_eligible: editBenefits,
          hire_date: editHireDate,
        }
      } : u)
    );

    setEditingUser(null);
    setSaved(editingUser.id);
    setTimeout(() => setSaved(null), 2000);
  } catch (err) {
    alert('Error updating user: ' + err.message);
  } finally {
    setSaving(null);
  }
};

const handleDelete = async (userId) => {
  if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
  setDeleting(userId);
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    await logAction({
      actorId: user.id,
      targetUserId: userId,
      action: 'profile_deleted',
      entityType: 'profiles',
      entityId: userId,
    });

    setUsers(prev => prev.filter(u => u.id !== userId));
  } catch (err) {
    alert('Error deleting user: ' + err.message);
  } finally {
    setDeleting(null);
  }
};

  const filtered = users.filter(u => {
    const name = `${u.first_name} ${u.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <p className="text-slate-400 text-sm mt-1">Manage employee roles and access levels</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {/* Users List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-400">No users found.</p>
          </div>
        ) : (
          filtered.map(user => (
            <div
                key={user.id}
                className="bg-slate-800 rounded-xl p-5 border border-slate-700 flex items-center justify-between gap-4 flex-wrap"
            >
                <div>
                <p className="text-white font-medium">
                    {user.first_name} {user.last_name}
                </p>
                {user.username && (
                    <p className="text-slate-400 text-sm">@{user.username}</p>
                )}
                <p className="text-slate-500 text-xs mt-0.5">
                    {ROLES.find(r => r.id === user.user_role)?.label || 'No role'}
                </p>
                </div>

                <div className="flex items-center gap-2">
                {saved === user.id && (
                    <span className="text-green-400 text-xs">✓ Saved</span>
                )}
                <button
                    onClick={() => {
                    setEditingUser(user);
                    setEditFirstName(user.first_name || '');
                    setEditLastName(user.last_name || '');
                    setEditRole(user.user_role || 1);
                    setEditPayType(user.compensation?.pay_type || 'hourly');
                    setEditPayRate(user.compensation?.pay_rate || 0);
                    setEditBenefits(user.compensation?.benefits_eligible || false);
                    setEditHireDate(user.compensation?.hire_date || '');
                    }}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition"
                >
                    Edit
                </button>
                <button
                    onClick={() => handleDelete(user.id)}
                    disabled={deleting === user.id}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm rounded-lg transition"
                >
                    {deleting === user.id ? 'Deleting...' : 'Delete'}
                </button>
                </div>
            </div>
            ))
        )
    }
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-lg font-semibold text-white">Edit User</h3>

            <div>
              <label className="block text-xs text-slate-400 mb-1">First Name</label>
              <input
                type="text"
                value={editFirstName}
                onChange={e => setEditFirstName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Last Name</label>
              <input
                type="text"
                value={editLastName}
                onChange={e => setEditLastName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Role</label>
              <select
                value={editRole}
                onChange={e => setEditRole(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ROLES.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="border-t border-slate-700 pt-4">
  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">Compensation</p>
  
  <div className="space-y-4">
    <div>
      <label className="block text-xs text-slate-400 mb-1">Pay Type</label>
      <select
        value={editPayType}
        onChange={e => setEditPayType(e.target.value)}
        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="hourly">Hourly</option>
        <option value="salary">Salary</option>
      </select>
    </div>

    <div>
      <label className="block text-xs text-slate-400 mb-1">
        {editPayType === 'hourly' ? 'Hourly Rate ($)' : 'Annual Salary ($)'}
      </label>
      <input
        type="number"
        min="0"
        step="0.01"
        value={editPayRate}
        onChange={e => setEditPayRate(e.target.value)}
        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <div>
      <label className="block text-xs text-slate-400 mb-1">Hire Date</label>
      <input
        type="date"
        value={editHireDate}
        onChange={e => setEditHireDate(e.target.value)}
        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        id="benefits"
        checked={editBenefits}
        onChange={e => setEditBenefits(e.target.checked)}
        className="rounded border-slate-600"
      />
      <label htmlFor="benefits" className="text-sm text-slate-300">
        Benefits Eligible
      </label>
        </div>
      </div>
  </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleEditSave}
                disabled={saving === editingUser.id}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                {saving === editingUser.id ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;