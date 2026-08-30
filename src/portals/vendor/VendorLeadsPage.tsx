import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { vendorApi, unwrapList } from "@/lib/apiClient";

interface Lead {
  id: string;
  customerName: string;
  phone?: string;
  email?: string;
  address?: string;
  area?: string;
  serviceType?: string;
  issue?: string;
  status: string;
  leadAcceptanceCharge?: string;
}

const leadStatusTone: Record<string, "gold" | "teal" | "success" | "danger" | "neutral"> = {
  NEW: "gold",
  ACCEPTED: "teal",
  ONGOING: "teal",
  PENDING_START_VERIFICATION: "gold",
  PENDING_DENIAL_VERIFICATION: "gold",
  COMPLETED: "success",
  DENIED: "danger",
};

export function VendorLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    vendorApi
      .get("/vendor/leads")
      .then((res) => setLeads(unwrapList<Lead>(res.data?.data ?? res.data)))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const accept = async (leadId: string) => {
    setActingId(leadId);
    setError("");
    try {
      await vendorApi.post(`/vendor/leads/${leadId}/accept`);
      load();
    } catch {
      setError("Couldn't accept that lead — check your wallet balance.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Pipeline"
        title="Leads"
        description="New leads show masked contact info until accepted. Accept a lead to unlock full phone number, address, and navigation."
      />

      {error && <div className="mb-4 rounded-xl bg-danger/10 px-4 py-2.5 text-sm font-medium text-danger">{error}</div>}

      {loading ? (
        <div className="h-40 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : leads.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No leads right now</p>
          <p className="mt-1 text-sm text-ink-soft/70">New leads in your area will show up here.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {leads.map((lead) => {
            const isNew = lead.status === "NEW";
            return (
              <Card key={lead.id} className="p-5 border border-ink/[0.08] hover:border-orange-500/50 transition-all shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <Link to={`/vendor/leads/${lead.id}`} className="min-w-0 flex-1 group">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-lg text-ink group-hover:text-orange-600 transition-colors">
                        {lead.customerName}
                      </p>
                      <Badge tone={leadStatusTone[lead.status] ?? "neutral"}>
                        {lead.status.replace(/_/g, " ")}
                      </Badge>
                      {isNew ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                          🔒 Masked Pre-Accept
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                          ✓ Full Details Unlocked
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm font-medium text-ink-soft/90">
                      🔧 {lead.serviceType ?? "Service"}
                    </p>

                    {/* Contact and Address Details Section */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Phone Display */}
                      <div className="flex items-center gap-2 rounded-lg bg-base p-2 border border-ink/[0.05]">
                        <span className="text-sm">📞</span>
                        <div className="min-w-0">
                          <span className="font-semibold text-ink-soft/70">Phone: </span>
                          <span className="font-mono font-bold text-ink">
                            {lead.phone || (isNew ? "******••••" : "Not shared")}
                          </span>
                        </div>
                        {isNew && (
                          <span className="ml-auto text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            (masked)
                          </span>
                        )}
                      </div>

                      {/* Address Display */}
                      <div className="flex items-center gap-2 rounded-lg bg-base p-2 border border-ink/[0.05]">
                        <span className="text-sm">📍</span>
                        <div className="min-w-0 truncate">
                          <span className="font-semibold text-ink-soft/70">Address: </span>
                          <span className="text-ink font-medium">
                            {lead.address || lead.area || "Area in Kolkata"}
                          </span>
                        </div>
                        {isNew && (
                          <span className="ml-auto text-[10px] text-amber-600 dark:text-amber-400 font-medium shrink-0">
                            (street masked)
                          </span>
                        )}
                      </div>
                    </div>

                    {lead.issue && (
                      <p className="mt-2 text-xs text-ink-soft/70 bg-ink/[0.02] p-2 rounded-lg border border-ink/[0.04]">
                        <strong className="text-ink font-semibold">Issue:</strong> {lead.issue}
                      </p>
                    )}
                  </Link>

                  <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0 self-center sm:self-auto">
                    {lead.leadAcceptanceCharge && (
                      <span className="font-mono text-sm font-bold text-orange-600 dark:text-orange-400">
                        {lead.leadAcceptanceCharge} Coins
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {isNew ? (
                        <Button accent="orange" loading={actingId === lead.id} onClick={() => accept(lead.id)} className="shadow-sm font-bold">
                          Accept Lead
                        </Button>
                      ) : (
                        <>
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                              📞 Call
                            </a>
                          )}
                          <Link to={`/vendor/leads/${lead.id}`}>
                            <Button accent="orange" variant="secondary" className="font-semibold">
                              Open Job →
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
