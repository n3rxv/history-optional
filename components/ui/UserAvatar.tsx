'use client';

import { useState } from 'react';

/**
 * The reader's Google profile picture, falling back to their initial.
 *
 * Firebase hands this over as user.photoURL from the Google provider. It is
 * null for anyone who signed in without a picture, so the initial is a real
 * path rather than a safety net, and onError covers a URL that 404s later,
 * which Google's lh3 links do once a photo is removed.
 */
export default function UserAvatar({ email, name, photoURL, size = 34 }: {
  email: string; name?: string; photoURL?: string | null; size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const initial = (name?.trim() || email || '?').charAt(0).toUpperCase();
  const showImage = Boolean(photoURL) && !failed;
  return (
    <span className="nb-avatar-disc" style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoURL as string} alt="" width={size} height={size} referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : initial}
    </span>
  );
}
