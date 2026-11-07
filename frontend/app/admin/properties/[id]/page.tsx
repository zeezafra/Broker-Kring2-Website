import { Suspense } from "react";
import AdminShell from "@/components/admin/AdminShell";
import EditPropertyLoader from "@/components/admin/EditPropertyLoader";

function EditContent({ params }: { params: { id: string } }) {
  const { id } = params;
  return <EditPropertyLoader id={id} />;
}

export default function EditPropertyPage(props: { params: { id: string } }) {
  return (
    <AdminShell>
      <Suspense fallback={<p className="text-muted">Loading listing…</p>}>
        <EditContent params={props.params} />
      </Suspense>
    </AdminShell>
  );
}
