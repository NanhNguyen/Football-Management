'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BangXepHangPageRedirect() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to home page where Bảng xếp hạng is integrated as a tab
    router.replace('/');
  }, [router]);

  return null;
}
