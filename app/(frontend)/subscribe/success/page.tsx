export { metadata } from './metadata';

import { Suspense } from 'react';
import SuccessPage from './SuccessPage';
import OwlLoader from '@/components/OwlLoader';

export default function Page() {
  return (
    <Suspense fallback={<OwlLoader size="page" />}>
      <SuccessPage />
    </Suspense>
  );
}
