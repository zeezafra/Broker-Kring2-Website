import { Suspense } from "react";
import AdminShell from "@/components/admin/AdminShell";
import EditPropertyLoader from "@/components/admin/EditPropertyLoader";

// params is runtime data, so it is awaited inside <Suspense> (required with cacheComponents).
async function EditContent({ params }: { params: PageProps<"/admin/properties/[id]">["params"] }) {
  const { id } = await params;
  return <EditPropertyLoader id={id} />;
}

export default function EditPropertyPage(props: PageProps<"/admin/properties/[id]">) {
  return (
    <AdminShell>
      <Suspense fallback={<p className="text-muted">Loading listing…</p>}>
        <EditContent params={props.params} />
      </Suspense>
    </AdminShell>
  );
}
