export const dynamic = 'force-dynamic';

import ReviewContent from './ReviewContent';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ReviewContent params={params} />;
}
