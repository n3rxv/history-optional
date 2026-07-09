import { useState, useCallback } from 'react';
import { auth } from '@/lib/firebase';

export function useLoginPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const requireLogin = useCallback((msg?: string): boolean => {
    const user = auth.currentUser;
    if (user) return true;
    setMessage(msg);
    setIsOpen(true);
    return false;
  }, []);

  const closeModal = useCallback(() => setIsOpen(false), []);

  return { isOpen, message, requireLogin, closeModal };
}
