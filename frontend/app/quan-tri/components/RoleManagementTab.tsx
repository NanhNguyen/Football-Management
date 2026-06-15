'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './RoleManagementTab.module.css';

interface UserRole {
  id: string;
  user_id: string;
  email: string;
  role_id: number;
  created_at: string;
}

const roleIdToName: Record<number, 'admin' | 'ref' | 'user'> = {
  1: 'admin',
  2: 'ref',
  3: 'user',
};

const roleNameToId: Record<'admin' | 'ref' | 'user', number> = {
  admin: 1,
  ref: 2,
  user: 3,
};

export default function RoleManagementTab({ showToast }: { showToast: (msg: string) => void }) {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states for adding new role assignment
  const [newUserId, setNewUserId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'ref' | 'user'>('user');

  const fetchUserRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserRoles(data || []);
    } catch (err: any) {
      console.error('Lỗi khi lấy danh sách phân quyền:', err);
      showToast(`❌ Không thể lấy danh sách: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const handleRoleChange = async (id: string, newRoleName: 'admin' | 'ref' | 'user') => {
    try {
      const targetRoleId = roleNameToId[newRoleName];
      const { error } = await supabase
        .from('user_roles')
        .update({ role_id: targetRoleId, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setUserRoles((prev) =>
        prev.map((ur) => (ur.id === id ? { ...ur, role_id: targetRoleId } : ur))
      );
      showToast('⚡ Cập nhật vai trò thành công!');
    } catch (err: any) {
      console.error('Lỗi khi cập nhật vai trò:', err);
      showToast(`❌ Lỗi cập nhật: ${err.message}`);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phân quyền của người dùng này? Họ sẽ quay về vai trò mặc định (Người xem).')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUserRoles((prev) => prev.filter((ur) => ur.id !== id));
      showToast('✅ Đã xóa phân quyền người dùng!');
    } catch (err: any) {
      console.error('Lỗi khi xóa phân quyền:', err);
      showToast(`❌ Lỗi: ${err.message}`);
    }
  };

  const handleAddRoleAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) {
      showToast('❌ Vui lòng nhập User ID (UUID)');
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(newUserId.trim())) {
      showToast('❌ User ID không đúng định dạng UUID');
      return;
    }

    setSubmitting(true);
    try {
      const targetRoleId = roleNameToId[newRole];
      const { error } = await supabase
        .from('user_roles')
        .insert([
          {
            user_id: newUserId.trim(),
            email: newEmail.trim() || null,
            role_id: targetRoleId,
          },
        ]);

      if (error) {
        if (error.code === '23505') {
          throw new Error('Người dùng này đã được phân quyền trước đó.');
        }
        throw error;
      }

      showToast('⚡ Thêm phân quyền người dùng thành công!');
      setNewUserId('');
      setNewEmail('');
      setNewRole('user');
      fetchUserRoles();
    } catch (err: any) {
      console.error('Lỗi khi gán phân quyền:', err);
      showToast(`❌ Lỗi: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Quản lý &amp; Phân quyền người dùng</h2>
        <p className={styles.subtitle}>
          Thiết lập vai trò (Admin, Trọng tài, Người xem) cho các tài khoản đăng ký trong hệ thống Sparta.
        </p>
      </div>

      <div className={styles.grid}>
        {/* Left Column: Users list */}
        <div className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <h3>Danh sách đã phân quyền ({userRoles.length})</h3>
            <button className={styles.refreshBtn} onClick={fetchUserRoles} disabled={loading}>
              ↻ Tải lại
            </button>
          </div>

          {loading ? (
            <div className={styles.loader}>Đang tải danh sách người dùng...</div>
          ) : userRoles.length === 0 ? (
            <div className={styles.emptyState}>Chưa có người dùng nào được phân quyền trong hệ thống.</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>User ID (UUID)</th>
                    <th>Vai trò</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {userRoles.map((ur) => {
                    const roleName = roleIdToName[ur.role_id] || 'user';
                    return (
                      <tr key={ur.id}>
                        <td className={styles.emailCell}>{ur.email || 'Chưa cập nhật email'}</td>
                        <td className={styles.uuidCell} title={ur.user_id}>
                          {ur.user_id.substring(0, 8)}...{ur.user_id.substring(ur.user_id.length - 8)}
                        </td>
                        <td>
                          <select
                            className={`${styles.roleSelect} ${styles[`roleSelect_${roleName}`]}`}
                            value={roleName}
                            onChange={(e) => handleRoleChange(ur.id, e.target.value as any)}
                          >
                            <option value="user">Người xem</option>
                            <option value="ref">Trọng tài</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteRole(ur.id)}
                            title="Xóa phân quyền"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Add role assignment form */}
        <div className={styles.formCard}>
          <h3>Gán phân quyền cho User mới</h3>
          <p className={styles.formInstructions}>
            Nếu người dùng vừa tạo tài khoản nhưng chưa hiển thị trong danh sách, hãy nhập User ID (lấy từ Supabase Auth) để gán vai trò trực tiếp.
          </p>

          <form onSubmit={handleAddRoleAssignment} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="userId">User ID (UUID) *</label>
              <input
                id="userId"
                type="text"
                className={styles.input}
                placeholder="e.g. d3b07384-d113-4956-..."
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="e.g. user@sparta.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="role">Vai trò</label>
              <select
                id="role"
                className={styles.select}
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
              >
                <option value="user">Người xem (User)</option>
                <option value="ref">Trọng tài (Referee)</option>
                <option value="admin">Quản trị viên (Admin)</option>
              </select>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Gán vai trò'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
