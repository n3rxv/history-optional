import CurrentAffairsSection from '@/components/CurrentAffairsSection';

export default function CurrentAffairsPage() {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
      {/* hideWhenEmpty=false: on the homepage the section collapsed when there was
          nothing to show, but a dedicated page must never render blank. */}
      <CurrentAffairsSection hideWhenEmpty={false} />
    </div>
  );
}
