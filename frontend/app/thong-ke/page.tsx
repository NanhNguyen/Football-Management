'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ThongKePageRedirect() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to home page where Thống kê is integrated as a tab
    router.replace('/');
  }, [router]);

  return null;
}
