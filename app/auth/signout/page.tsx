'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function SignOutPage() {
  const router = useRouter();
  useEffect(() => {
    signOut(auth).then(() => {
      router.replace('/');
    });
  }, [router]);
  return null;
}
