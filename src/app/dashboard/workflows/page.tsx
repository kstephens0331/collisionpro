import WorkflowManager from "@/components/workflows/WorkflowManager";

// Make this page dynamic to avoid static generation issues
export const dynamic = "force-dynamic";

export default function WorkflowsPage() {
  return (
    <div className="p-6">
      <WorkflowManager />
    </div>
  );
}
