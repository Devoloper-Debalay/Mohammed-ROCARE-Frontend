import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StageBar } from "@/components/ui/StageRing";
import { Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { customerApi } from "@/lib/apiClient";
import { useCustomerAuth } from "@/store/authStore";

const stages = ["Requested", "Assigned", "In progress", "Completed"];

export function CustomerDashboardPage() {
  const user = useCustomerAuth((s) => s.user);
  const [addressCount, setAddressCount] = useState<number | null>(null);

  useEffect(() => {
    customerApi
      .get("/customer/addresses")
      .then((res) => setAddressCount(res.data?.data?.length ?? 0))
      .catch(() => setAddressCount(null));
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${user?.firstName ?? "there"}`}
        description="Everything about your orders and service requests, in one place."
        action={
          <Link to="/customer/service-requests">
            <Button accent="teal">Raise a service request</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/60">Saved addresses</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">{addressCount ?? "—"}</p>
          <Link to="/customer/addresses" className="mt-3 inline-block text-sm font-semibold text-teal-deep">
            Manage
          </Link>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/60">Cart</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">View</p>
          <Link to="/customer/cart" className="mt-3 inline-block text-sm font-semibold text-teal-deep">
            Open cart
          </Link>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/60">Orders</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">Track</p>
          <Link to="/customer/orders" className="mt-3 inline-block text-sm font-semibold text-teal-deep">
            View orders
          </Link>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-ink">Latest service request</p>
            <p className="text-sm text-ink-soft/70">Sample — your real requests appear here once raised.</p>
          </div>
          <Badge tone="teal">In progress</Badge>
        </div>
        <StageBar stages={stages} activeIndex={2} accent="var(--color-teal)" />
      </Card>
    </div>
  );
}
