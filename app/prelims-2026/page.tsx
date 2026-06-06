import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UPSC Prelims 2026 — History Questions Decoded',
  description: 'In-depth analysis of Ancient, Medieval, Art & Culture and Modern History questions from UPSC CS Prelims GS-1 2026. History Optional connect and approach strategy.',
};

export default function Prelims2026Page() {
  return (
    <div style={{ width: '100%', height: 'calc(100vh - 90px)', display: 'flex', flexDirection: 'column' }}>
      <iframe
        src="/prelims-2026.pdf"
        style={{ width: '100%', flex: 1, border: 'none' }}
        title="UPSC Prelims 2026 History Questions Decoded"
      />
    </div>
  );
}
