import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { vendorApi, unwrapList } from "@/lib/apiClient";

interface Offer {
  id: string;
  title: string;
  description?: string;
  validTill?: string;
}

export function VendorOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    vendorApi
      .get("/vendor/offers")
      .then((res) => setOffers(unwrapList<Offer>(res.data?.data ?? res.data)))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader eyebrow="Rewards" title="Offers" description="Active coupons and bonus offers for vendors." />

      {loading ? (
        <div className="h-32 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : offers.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No active offers</p>
          <p className="mt-1 text-sm text-ink-soft/70">Check back soon for new rewards.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {offers.map((o) => (
            <Card key={o.id} className="p-5">
              <div className="flex items-center justify-between">
                <p className="font-display text-base font-semibold text-ink">{o.title}</p>
                {o.validTill && <Badge tone="gold">Till {new Date(o.validTill).toLocaleDateString()}</Badge>}
              </div>
              {o.description && <p className="mt-1.5 text-sm text-ink-soft/70">{o.description}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
