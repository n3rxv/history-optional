'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GoogleCallbackPage() {
  const router = useRouter();
  useEffect(() => {
    // Firebase handles auth via popup — no callback page needed
    router.replace('/');
  }, [router]);
  return null;
}
