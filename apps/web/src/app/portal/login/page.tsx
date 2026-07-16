'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Login is unified at /login now — this route stays only so old links/bookmarks don't 404. */
export default function PortalLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return null;
}
