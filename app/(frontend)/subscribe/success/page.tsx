export { metadata } from './metadata';

import { Suspense } from 'react';
import SuccessPage from './SuccessPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SuccessPage />
    </Suspense>
  );
}
