import LoteView from "@/modules/projects/views/LoteView";

export default async function LotePage({ params }: { params: Promise<{ id: string; loteId: string }> }) {
  const resolvedParams = await params;
  return <LoteView loteId={resolvedParams.loteId} projectId={resolvedParams.id} />;
}
