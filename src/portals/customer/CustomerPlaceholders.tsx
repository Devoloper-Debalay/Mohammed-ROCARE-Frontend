import { PageHeader } from "@/components/ui/PageHeader";
import { ModulePlaceholder } from "@/components/ui/PageHeader";

export function CustomerServiceRequestsPage() {
  return (
    <div>
      <PageHeader eyebrow="Service" title="Service requests" description="Raise and track RO, AC and geyser service jobs." />
      <ModulePlaceholder title="Service request flow coming online" note="Raising a request, live technician tracking and the 4-stage pipeline view land in the next build pass." />
    </div>
  );
}

export function CustomerComplaintsPage() {
  return (
    <div>
      <PageHeader eyebrow="Support" title="Complaints" description="Report an issue with an order or service." />
      <ModulePlaceholder title="Complaints coming online" note="You'll be able to file and track complaints here shortly." />
    </div>
  );
}

export function CustomerNotificationsPage() {
  return (
    <div>
      <PageHeader eyebrow="Updates" title="Notifications" description="Order, service and account updates." />
      <ModulePlaceholder title="Notification center coming online" note="Real-time updates on your orders and service requests will appear here." />
    </div>
  );
}
