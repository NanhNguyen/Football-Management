'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { layDanhSachTournamentTemplates } from '@/lib/api';

export function useAdminAuth(
  fetchData: () => void,
  activeTab: string,
  setActiveTab: (tab: string) => void,
  setTournamentTemplates: (templates: any[]) => void
) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', session.user.id)
        .single();

      const roleId = roleData?.role_id || 3;
      const roleMap: Record<number, string> = { 1: 'admin', 2: 'ref', 3: 'user' };
      const role = roleMap[roleId] || 'user';
      setUserRole(role);

      if (role === 'user') {
        router.push('/');
        return;
      }

      if (role === 'ref' && activeTab !== 'referee') {
        setActiveTab('referee');
      }

      const templates = await layDanhSachTournamentTemplates();
      if (templates && templates.length > 0) {
        setTournamentTemplates(templates);
      }
      fetchData();
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) return;
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return { userRole, handleLogout };
}
