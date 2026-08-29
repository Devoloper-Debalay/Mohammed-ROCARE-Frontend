import { PageHeader } from "@/components/ui/PageHeader";
import { ModulePlaceholder } from "@/components/ui/PageHeader";

export function VendorProductsPage() {
  return (
    <div>
      <PageHeader eyebrow="Store" title="Products & parts" description="Buy products and spare parts using wallet coins." />
      <ModulePlaceholder title="Product & parts catalog coming online" note="Browsing and purchasing products and parts lands in the next build pass." />
    </div>
  );
}

export function VendorOffersPage() {
  return (
    <div>
      <PageHeader eyebrow="Rewards" title="Offers" description="Active coupons and bonus offers for vendors." />
      <ModulePlaceholder title="Offers coming online" note="Vendor-specific offers and rewards will appear here." />
    </div>
  );
}

export function VendorComplaintsPage() {
  return (
    <div>
      <PageHeader eyebrow="Support" title="Complaints" description="Raise an issue with wallet, leads, payments or products." />
      <ModulePlaceholder title="Complaints coming online" note="You'll be able to file and track complaints here shortly." />
    </div>
  );
}

export function VendorNotificationsPage() {
  return (
    <div>
      <PageHeader eyebrow="Updates" title="Notifications" description="Lead, wallet and account updates." />
      <ModulePlaceholder title="Notification center coming online" note="Real-time updates on your leads and wallet will appear here." />
    </div>
  );
}
