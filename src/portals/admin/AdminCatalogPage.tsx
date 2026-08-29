import { type FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/lib/apiClient";

import { unwrapList } from "@/lib/apiClient";

interface Product {
  id: string;
  name: string;
  category: string;
  price: string | number;
  stock: number;
  isActive: boolean;
}
interface Service {
  id: string;
  name: string;
  category: string;
  price: string | number;
  isActive: boolean;
}

const PRODUCT_CATEGORIES = ["RO", "AC", "GEYSER", "OTHER"];
const SERVICE_CATEGORIES = ["RO", "AC", "GEYSER", "OTHER"];

export function AdminCatalogPage() {
  const [tab, setTab] = useState<"products" | "services">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "RO", price: "", stock: "" });
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    Promise.allSettled([adminApi.get("/admin/products"), adminApi.get("/admin/services")]).then(([p, s]) => {
      if (p.status === "fulfilled") setProducts(unwrapList<Product>(p.value.data?.data ?? p.value.data));
      if (s.status === "fulfilled") setServices(unwrapList<Service>(s.value.data?.data ?? s.value.data));
      setLoading(false);
    });
  };

  useEffect(load, []);

  const categories = tab === "products" ? PRODUCT_CATEGORIES : SERVICE_CATEGORIES;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (tab === "products") {
        const payload = {
          name: form.name,
          category: form.category,
          price: Number(form.price),
          stock: form.stock ? Number(form.stock) : 0,
        };
        await adminApi.post("/admin/products", payload);
      } else {
        const payload = {
          name: form.name,
          category: form.category,
          price: Number(form.price),
        };
        await adminApi.post("/admin/services", payload);
      }
      setForm({ name: "", category: "RO", price: "", stock: "" });
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Couldn't save that item.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: Product | Service) => {
    setTogglingId(item.id);
    try {
      if (tab === "products") {
        const prod = item as Product;
        await adminApi.patch(`/admin/products/${item.id}`, {
          name: prod.name,
          category: prod.category,
          price: Number(prod.price),
          stock: prod.stock,
          isActive: !prod.isActive,
        });
      } else {
        const serv = item as Service;
        await adminApi.patch(`/admin/services/${item.id}`, {
          name: serv.name,
          category: serv.category,
          price: Number(serv.price),
          isActive: !serv.isActive,
        });
      }
      load();
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Products & services"
        description="Manage what's sold in your branch."
        action={
          <Button accent="slate" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : `Add ${tab === "products" ? "product" : "service"}`}
          </Button>
        }
      />

      <div className="mb-6 flex gap-2 rounded-full bg-base p-1 w-fit">
        {(["products", "services"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setForm((f) => ({ ...f, category: t === "products" ? PRODUCT_CATEGORIES[0] : SERVICE_CATEGORIES[0] }));
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${
              tab === t ? "bg-slate text-white" : "text-ink-soft"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {showForm && (
        <Card className="mb-6 p-6">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-soft">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="rounded-xl border border-ink/10 bg-surface px-4 py-2.5 text-[15px] text-ink"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Price" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
            {tab === "products" && (
              <Input label="Stock" type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
            )}
            {error && <p className="text-sm font-medium text-danger sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit" accent="slate" loading={saving}>
                Save
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="h-40 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : (tab === "products" ? products : services).length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No {tab} added yet</p>
          <p className="mt-1 text-sm text-ink-soft/70">Add your first {tab === "products" ? "product" : "service"} using the button above.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(tab === "products" ? products : services).map((item) => (
            <Card key={item.id} className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-center justify-between">
                  <Badge tone="slate">{item.category}</Badge>
                  <Badge tone={item.isActive ? "success" : "neutral"}>{item.isActive ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="mt-2.5 font-display text-base font-semibold text-ink">{item.name}</p>
                {"stock" in item && <p className="mt-1 text-xs text-ink-soft/60">Stock: {(item as Product).stock ?? 0}</p>}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-ink/[0.06] pt-3">
                <span className="font-mono text-lg font-semibold text-ink">₹{item.price}</span>
                <Button
                  accent="slate"
                  variant="secondary"
                  loading={togglingId === item.id}
                  onClick={() => toggleActive(item)}
                >
                  {item.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
