'use client';
import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { toast } from '@/components/ui/Toast';

/**
 * Publishes this answer check as a card at /s/<id>: the question, the marks
 * and a few lines of feedback, never the answer. The phone's share sheet
 * opens where there is one, otherwise the link is copied. Once shared, the
 * link can be copied again or taken down.
 */
export default function ShareButton({ evaluationId, marks, outOf, hi }: {
  evaluationId: string; marks: number; outOf: number; hi: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const T = (en: string, h: string) => (hi ? h : en);

  const call = async (method: 'POST' | 'DELETE') => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error(T('Sign in to share.', 'शेयर करने के लिए साइन इन करें।'));
    const res = await fetch('/api/evaluations/share', {
      method, headers: { 'Content-Type': 'application/json', 'x-user-token': token }, body: JSON.stringify({ id: evaluationId }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? T('That did not go through. Try again.', 'यह नहीं हो सका। फिर कोशिश करें।'));
    return body as { url?: string };
  };

  const copy = async (link: string) => {
    try { await navigator.clipboard.writeText(link); toast(T('Link copied', 'लिंक कॉपी हो गया')); }
    catch { toast(link); }
  };

  const share = async () => {
    setBusy(true);
    try {
      const link = url ?? (await call('POST')).url!;
      setUrl(link);
      const text = T(`I scored ${marks}/${outOf} on a UPSC History Optional answer. Get yours checked:`,
        `UPSC इतिहास वैकल्पिक के एक उत्तर पर मुझे ${marks}/${outOf} अंक मिले। अपना उत्तर भी जँचवाएँ:`);
      if (navigator.share) {
        try { await navigator.share({ title: 'History Optional', text, url: link }); }
        catch (e) { if ((e as Error).name !== 'AbortError') await copy(link); }
      } else await copy(link);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally { setBusy(false); }
  };

  const stop = async () => {
    setBusy(true);
    try { await call('DELETE'); setUrl(null); toast(T('Sharing stopped. The link no longer opens.', 'शेयर करना बंद हुआ। लिंक अब नहीं खुलेगा।')); }
    catch (e) { toast((e as Error).message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="ev-share">
      <button type="button" className="ds-btn ds-btn-line" onClick={share} disabled={busy}>
        {T('Share your score', 'अपने अंक शेयर करें')}
      </button>
      {url && (
        <p className="ev-share-note">
          {T('Shows the question, marks and feedback, not your answer.', 'प्रश्न, अंक और फ़ीडबैक दिखते हैं, आपका उत्तर नहीं।')}{' '}
          <button type="button" className="ev-share-link" onClick={() => copy(url)} disabled={busy}>{T('Copy link', 'लिंक कॉपी करें')}</button>
          {' · '}
          <button type="button" className="ev-share-link" onClick={stop} disabled={busy}>{T('Stop sharing', 'शेयर करना बंद करें')}</button>
        </p>
      )}
    </div>
  );
}
