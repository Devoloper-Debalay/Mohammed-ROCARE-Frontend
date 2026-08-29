import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { customerApi } from "@/lib/apiClient";

interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: string;
  discountPercent?: string;
  stock: number;
}

export function CustomerCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    customerApi
      .get("/catalog/products")
      .then((res) => setProducts(res.data?.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = async (productId: string) => {
    setAddingId(productId);
    try {
      await customerApi.post("/cart/items", { productId, quantity: 1 });
      setToast("Added to cart.");
      setTimeout(() => setToast(""), 2000);
    } catch {
      setToast("Couldn't add that item. Try again.");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Shop" title="Catalog" description="RO, AC and geyser products available in your area." />

      {toast && <div className="mb-4 rounded-xl bg-teal-tint px-4 py-2.5 text-sm font-medium text-teal-deep">{toast}</div>}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-card bg-ink/[0.04]" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No products listed yet</p>
          <p className="mt-1 text-sm text-ink-soft/70">Check back soon — new products are added by branch admins regularly.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
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
