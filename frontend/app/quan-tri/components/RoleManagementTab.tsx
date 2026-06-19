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
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredUserRoles = userRoles.filter((ur) => {
    const name = (ur as any).full_name || '';
    const email = ur.email || '';
    const userId = ur.user_id || '';
    const term = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(term) ||
      email.toLowerCase().includes(term) ||
      userId.toLowerCase().includes(term)
    );
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Quản lý &amp; Phân quyền người dùng</h2>
        <p className={styles.subtitle}>
          Thiết lập vai trò (Admin, Trọng tài, Người xem) cho các tài khoản đăng ký trong hệ thống Sparta.
        </p>
      </div>

      <div className={styles.grid}>
        {/* Users list */}
        <div className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <h3>Danh sách đã phân quyền ({filteredUserRoles.length})</h3>
            <button className={styles.refreshBtn} onClick={fetchUserRoles} disabled={loading}>
              ↻ Tải lại
            </button>
          </div>

          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email hoặc User ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {loading ? (
            <div className={styles.loader}>Đang tải danh sách người dùng...</div>
          ) : filteredUserRoles.length === 0 ? (
            <div className={styles.emptyState}>
              {searchTerm ? 'Không tìm thấy người dùng nào phù hợp với bộ lọc.' : 'Chưa có người dùng nào được phân quyền.'}
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Họ và tên</th>
                    <th>Email</th>
                    <th>User ID (UUID)</th>
                    <th>Vai trò</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUserRoles.map((ur) => {
                    const roleName = roleIdToName[ur.role_id] || 'user';
                    return (
                      <tr key={ur.id}>
                        <td className={styles.nameCell}>
                          {(ur as any).full_name || ur.email?.split('@')[0] || 'N/A'}
                        </td>
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
      </div>
    </div>
  );
}
