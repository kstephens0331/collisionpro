export const dynamic = 'force-dynamic';

import EstimateDetailContent from './EstimateDetailContent';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <EstimateDetailContent params={params} />;
}
