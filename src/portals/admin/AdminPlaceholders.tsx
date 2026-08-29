import { PageHeader, ModulePlaceholder } from "@/components/ui/PageHeader";

function Placeholder({ eyebrow, title, description, note }: { eyebrow: string; title: string; description: string; note: string }) {
  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <ModulePlaceholder title={`${title} coming online`} note={note} />
    </div>
  );
}

export const AdminVendorsPage = () => (
  <Placeholder eyebrow="Vendors" title="All vendors" description="Every vendor and technician on your branch." note="The full searchable vendor directory ships next." />
);
export const AdminLeadsPage = () => (
  <Placeholder eyebrow="Pipeline" title="Leads" description="Branch-wide lead pipeline across all technicians." note="Lead management and proof review land in the next update." />
);
export const AdminOrdersPage = () => (
  <Placeholder eyebrow="Commerce" title="Orders" description="Product and service orders for your branch." note="Order management lands in the next update." />
);
export const AdminCatalogPage = () => (
  <Placeholder eyebrow="Catalog" title="Products & services" description="Manage what's sold in your branch." note="Product and service management lands in the next update." />
);
export const AdminComplaintsPage = () => (
  <Placeholder eyebrow="Support" title="Complaints" description="Customer and vendor complaints for your branch." note="Complaint review and replies land in the next update." />
);

export const SuperAdminBranchesPage = () => (
  <Placeholder eyebrow="Platform" title="Branches" description="Create and manage branches across the platform." note="Branch creation and editing lands in the next update." />
);
export const SuperAdminAdminsPage = () => (
  <Placeholder eyebrow="Platform" title="Admins" description="Manage admin accounts and roles." note="Admin account management lands in the next update." />
);
export const SuperAdminUsersPage = () => (
  <Placeholder eyebrow="Platform" title="Users" description="Every customer account on the platform." note="User search and role management lands in the next update." />
);
export const SuperAdminAuditLogsPage = () => (
  <Placeholder eyebrow="Platform" title="Audit logs" description="A record of every admin action." note="The audit log viewer lands in the next update." />
);
export const SuperAdminSettingsPage = () => (
  <Placeholder eyebrow="Platform" title="Settings" description="Platform-wide configuration." note="Settings management lands in the next update." />
);
