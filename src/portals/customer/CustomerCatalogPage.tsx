import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { customerApi } from "@/lib/apiClient";

import { unwrapList } from "@/lib/apiClient";

interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: string | number;
  discountPercent?: string | number;
  stock: number;
}

export function CustomerCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const load = () => {
    setLoading(true);
    customerApi
      .get("/catalog/products")
      .then((res) => setProducts(unwrapList<Product>(res.data?.data ?? res.data)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const addToCart = async (productId: string) => {
    setAddingId(productId);
    try {
      await customerApi.post("/cart/items", { productId, quantity: 1 });
      setToast("Added to cart.");
      setTimeout(() => setToast(""), 2000);
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? "Couldn't add that item. Try again.");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setAddingId(null);
    }
  };

  const categories = ["ALL", "RO", "AC", "GEYSER", "OTHER"];
  const filtered = selectedCategory === "ALL" ? products : products.filter((p) => p.category === selectedCategory);

  return (
    <div>
      <PageHeader eyebrow="Shop" title="Catalog" description="RO, AC and geyser products available in your area." />

      {toast && <div className="mb-4 rounded-xl bg-teal-tint px-4 py-2.5 text-sm font-medium text-teal-deep">{toast}</div>}

      <div className="mb-6 flex flex-wrap gap-2 rounded-full bg-base p-1 w-fit">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              selectedCategory === cat ? "bg-teal-deep text-white shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-card bg-ink/[0.04]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No products found</p>
          <p className="mt-1 text-sm text-ink-soft/70">
            {selectedCategory === "ALL"
              ? "Check back soon — new products are added by branch admins regularly."
              : `No products available under category "${selectedCategory}".`}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id} className="flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <Badge tone="teal">{p.category}</Badge>
                {p.stock <= 0 && <Badge tone="danger">Out of stock</Badge>}
              </div>
              <p className="font-display text-base font-semibold text-ink">{p.name}</p>
              {p.description && <p className="mt-1 line-clamp-2 text-sm text-ink-soft/70">{p.description}</p>}
              <div className="mt-4 flex items-center justify-between">
                <span className="font-mono text-lg font-semibold text-ink">₹{p.price}</span>
                <Button
                  accent="teal"
                  variant="secondary"
                  disabled={p.stock <= 0}
                  loading={addingId === p.id}
                  onClick={() => addToCart(p.id)}
                >
                  Add to cart
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
