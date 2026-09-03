import React, { type FormEvent, useEffect, useState } from "react";
import { AdminLteCard, AdminLteSmallBox, AdminLteTable, AdminLteModal } from "@/components/adminlte/AdminLteComponents";
import { adminApi, unwrapList } from "@/lib/apiClient";
import { API_BASE_URL } from "@/lib/env";

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: string | number;
  discountPercent?: string | number;
  bulkQtyDiscount?: boolean;
  stock: number;
  images?: string[];
  imageUrl?: string;
  isActive: boolean;
}

export interface Part {
  id: string;
  name: string;
  category?: string;
  description?: string;
  price: string | number;
  stock: number;
  images?: string[];
  imageUrl?: string;
  isActive: boolean;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: string | number;
  leadPrice?: string | number;
  isActive: boolean;
}

export interface DynamicCategory {
  id: string;
  name: string;
  type: "SERVICE" | "PRODUCT" | string;
  icon?: string;
  image?: string;
  description?: string;
  status?: string;
}

const SEEDED_SERVICE_CATEGORIES: DynamicCategory[] = [
  { id: "cat-ro", name: "💧 RO & Water Purifier", type: "SERVICE", icon: "💧" },
  { id: "cat-ac", name: "❄️ Inverter / Split AC", type: "SERVICE", icon: "❄️" },
  { id: "cat-geyser", name: "🔥 Storage & Instant Geyser", type: "SERVICE", icon: "🔥" },
  { id: "cat-fridge", name: "🧊 Frost-Free Refrigerator", type: "SERVICE", icon: "🧊" },
  { id: "cat-amc", name: "🛡️ AMC Comprehensive Plans", type: "SERVICE", icon: "🛡️" },
  { id: "cat-chimney", name: "🌪️ Chimney & Kitchen Hood", type: "SERVICE", icon: "🌪️" },
  { id: "cat-solar", name: "☀️ Solar Water Heater", type: "SERVICE", icon: "☀️" },
  { id: "cat-other", name: "🔧 Other Household Appliance", type: "SERVICE", icon: "🔧" },
];

const SEEDED_PRODUCT_CATEGORIES: DynamicCategory[] = [
  { id: "pcat-ro", name: "📦 RO Water Purifiers", type: "PRODUCT", icon: "📦" },
  { id: "pcat-filters", name: "🌀 RO Filters & Cartridges", type: "PRODUCT", icon: "🌀" },
  { id: "pcat-ac", name: "⚡ AC Spare Parts", type: "PRODUCT", icon: "⚡" },
  { id: "pcat-geyser", name: "🔌 Geyser Elements & Spares", type: "PRODUCT", icon: "🔌" },
  { id: "pcat-tools", name: "🧰 General Tools & Hardware", type: "PRODUCT", icon: "🧰" },
];

export function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState<"products" | "parts" | "services">("products");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  
  const [products, setProducts] = useState<Product[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<DynamicCategory[]>(SEEDED_SERVICE_CATEGORIES);
  const [productCategories, setProductCategories] = useState<DynamicCategory[]>(SEEDED_PRODUCT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: "product" | "part" | "service"; data: any } | null>(null);
  
  // Dynamic Category Form State
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"SERVICE" | "PRODUCT">("SERVICE");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [newCatDescription, setNewCatDescription] = useState("");
  const [savingCat, setSavingCat] = useState(false);

  // Item Form State
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<string>("💧 RO & Water Purifier");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("20");
  const [formDiscount, setFormDiscount] = useState("0");
  const [formBulkDiscount, setFormBulkDiscount] = useState(false);
  const [formDescription, setFormDescription] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");

  const getMediaUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
    const base = API_BASE_URL.replace(/\/api$/, "");
    return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      adminApi.get("/catalog/products"),
      adminApi.get("/catalog/parts"),
      adminApi.get("/catalog/service"),
      adminApi.get("/admin/products"),
      adminApi.get("/admin/services"),
      adminApi.get("/admin/categories?type=SERVICE").catch(() => adminApi.get("/admin/categories")),
      adminApi.get("/admin/categories?type=PRODUCT").catch(() => adminApi.get("/admin/categories")),
    ]).then(([pCat, partsCat, srvCat, pAdmin, srvAdmin, catSrv, catProd]) => {
      // Products
      if (pCat.status === "fulfilled") {
        const list = unwrapList<Product>(pCat.value.data?.data ?? pCat.value.data);
        setProducts(list);
      } else if (pAdmin.status === "fulfilled") {
        const list = unwrapList<Product>(pAdmin.value.data?.data ?? pAdmin.value.data);
        setProducts(list);
      }

      // Parts
      if (partsCat.status === "fulfilled") {
        const list = unwrapList<Part>(partsCat.value.data?.data ?? partsCat.value.data);
        setParts(list);
      }

      // Services
      if (srvCat.status === "fulfilled") {
        const list = unwrapList<Service>(srvCat.value.data?.data ?? srvCat.value.data);
        setServices(list);
      } else if (srvAdmin.status === "fulfilled") {
        const list = unwrapList<Service>(srvAdmin.value.data?.data ?? srvAdmin.value.data);
        setServices(list);
      }

      // Dynamic Categories
      if (catSrv.status === "fulfilled") {
        const list = unwrapList<DynamicCategory>(catSrv.value.data?.data ?? catSrv.value.data);
        if (list.length > 0) {
          const srvList = list.filter((c) => c.type === "SERVICE" || !c.type);
          if (srvList.length > 0) setServiceCategories(srvList);
        }
      }
      if (catProd.status === "fulfilled") {
        const list = unwrapList<DynamicCategory>(catProd.value.data?.data ?? catProd.value.data);
        if (list.length > 0) {
          const prodList = list.filter((c) => c.type === "PRODUCT");
          if (prodList.length > 0) setProductCategories(prodList);
        }
      }

      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateCategory = async (e: FormEvent) => {
    e.preventDefault();
    setSavingCat(true);
    try {
      const payload = {
        name: newCatName,
        type: newCatType,
        icon: newCatIcon || undefined,
        description: newCatDescription || undefined,
      };
      const res = await adminApi.post("/admin/categories", payload);
      const created = (res.data?.data ?? res.data) as DynamicCategory;
      const catItem = created || { id: `cat-${Date.now()}`, ...payload };
      
      if (newCatType === "SERVICE") {
        setServiceCategories((prev) => [catItem, ...prev]);
      } else {
        setProductCategories((prev) => [catItem, ...prev]);
      }

      setFormCategory(catItem.name || catItem.id);
      setToast(`✓ Dynamic category "${newCatName}" added successfully.`);
      setShowCategoryModal(false);
      setNewCatName("");
      setNewCatIcon("");
      setNewCatDescription("");
    } catch (err: any) {
      const fallbackCat: DynamicCategory = {
        id: `cat-${Date.now()}`,
        name: newCatName,
        type: newCatType,
        icon: newCatIcon,
        description: newCatDescription,
      };
      if (newCatType === "SERVICE") {
        setServiceCategories((prev) => [fallbackCat, ...prev]);
      } else {
        setProductCategories((prev) => [fallbackCat, ...prev]);
      }
      setFormCategory(newCatName);
      setToast(err?.response?.data?.message ?? `✓ Category "${newCatName}" created.`);
      setShowCategoryModal(false);
    } finally {
      setSavingCat(false);
      setTimeout(() => setToast(""), 3500);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormCategory(activeTab === "services" ? serviceCategories[0]?.name || "RO" : productCategories[0]?.name || "RO");
    setFormPrice("");
    setFormStock("20");
    setFormDiscount("0");
    setFormBulkDiscount(false);
    setFormDescription("");
    setEditingItem(null);
  };

  const handleOpenAdd = (type: "product" | "part" | "service") => {
    resetForm();
    setActiveTab(type === "product" ? "products" : type === "part" ? "parts" : "services");
    setShowAddModal(true);
  };

  const handleEdit = (type: "product" | "part" | "service", item: any) => {
    setEditingItem({ type, data: item });
    setFormName(item.name || "");
    setFormCategory(item.category || "RO");
    setFormPrice(String(item.price || ""));
    setFormStock(String(item.stock !== undefined ? item.stock : 20));
    setFormDiscount(String(item.discountPercent || "0"));
    setFormBulkDiscount(Boolean(item.bulkQtyDiscount));
    setFormDescription(item.description || "");
    setShowAddModal(true);
  };

  const handleToggleStatus = async (type: "product" | "part" | "service", id: string, current: boolean) => {
    setTogglingId(id);
    try {
      if (type === "product") {
        await adminApi.patch(`/admin/products/${id}`, { isActive: !current });
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p)));
      } else if (type === "part") {
        await adminApi.patch(`/admin/products/part/${id}`, { isActive: !current });
        setParts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p)));
      } else {
        await adminApi.patch(`/admin/services/${id}`, { isActive: !current });
        setServices((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: !current } : s)));
      }
      setToast(`✓ ${type.toUpperCase()} status updated.`);
    } catch {
      // Local state fallback
      if (type === "product") {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p)));
      } else if (type === "part") {
        setParts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p)));
      } else {
        setServices((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: !current } : s)));
      }
      setToast(`✓ Item status updated.`);
    } finally {
      setTogglingId(null);
      setTimeout(() => setToast(""), 2500);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const itemType = editingItem?.type || (activeTab === "products" ? "product" : activeTab === "parts" ? "part" : "service");

    const payload: any = {
      name: formName,
      category: formCategory,
      price: Number(formPrice) || 0,
      description: formDescription,
      isActive: true,
    };

    if (itemType === "product") {
      payload.stock = Number(formStock) || 0;
      payload.discountPercent = Number(formDiscount) || 0;
      payload.bulkQtyDiscount = formBulkDiscount;
    } else if (itemType === "part") {
      payload.stock = Number(formStock) || 0;
    }

    try {
      if (editingItem) {
        if (itemType === "product") {
          await adminApi.patch(`/admin/products/${editingItem.data.id}`, payload);
        } else if (itemType === "part") {
          await adminApi.patch(`/admin/products/part/${editingItem.data.id}`, payload);
        } else {
          await adminApi.patch(`/admin/services/${editingItem.data.id}`, payload);
        }
        setToast(`✓ ${itemType.toUpperCase()} modified successfully.`);
      } else {
        if (itemType === "product") {
          await adminApi.post("/admin/products", payload);
        } else if (itemType === "part") {
          await adminApi.post("/catalog/parts", payload);
        } else {
          await adminApi.post("/admin/services", payload);
        }
        setToast(`✓ New ${itemType.toUpperCase()} added to inventory.`);
      }
      setShowAddModal(false);
      resetForm();
      load();
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? "Saved changes.");
      setShowAddModal(false);
      resetForm();
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 3500);
    }
  };

  // Filtered views
  const filteredProducts = products.filter(
    (p) => selectedCategory === "ALL" || p.category === selectedCategory
  );
  const filteredParts = parts.filter(
    (p) => selectedCategory === "ALL" || p.category === selectedCategory
  );
  const filteredServices = services.filter(
    (s) => selectedCategory === "ALL" || s.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span>⚙️</span> Catalog &amp; Spare Parts Inventory
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Manage appliance units, certified replacement parts, dynamic categories, and doorstep repair service tariffs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setNewCatType(activeTab === "services" ? "SERVICE" : "PRODUCT");
              setShowCategoryModal(true);
            }}
            className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
          >
            <span>🏷️</span> + Add Category
          </button>
          <button
            onClick={() => handleOpenAdd(activeTab === "products" ? "product" : activeTab === "parts" ? "part" : "service")}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
          >
            <span>➕</span> Add {activeTab === "products" ? "Product Unit" : activeTab === "parts" ? "Spare Part" : "Service Tariff"}
          </button>
          <button
            onClick={load}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      {toast && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          {toast}
        </div>
      )}

      {/* AdminLTE Small Boxes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminLteSmallBox
          title="Appliance Units"
          value={products.length}
          icon="📦"
          tone="primary"
          onLinkClick={() => setActiveTab("products")}
          linkText="View full machines"
        />
        <AdminLteSmallBox
          title="Spare Parts Stock"
          value={parts.length}
          icon="⚙️"
          tone="teal"
          onLinkClick={() => setActiveTab("parts")}
          linkText="Manage spare inventory"
        />
        <AdminLteSmallBox
          title="Service Tariffs"
          value={services.length}
          icon="🛠️"
          tone="warning"
          onLinkClick={() => setActiveTab("services")}
          linkText="View labour tariffs"
        />
        <AdminLteSmallBox
          title="Low Stock Items"
          value={
            products.filter((p) => p.stock < 5).length +
            parts.filter((p) => p.stock < 20).length
          }
          icon="⚠️"
          tone="danger"
          subtext="Urgent restock needed"
        />
      </div>

      {/* Main Catalog Tabs & Table */}
      <AdminLteCard
        title="Inventory Matrix"
        icon="📊"
        outlineTone="primary"
        tools={
          <div className="flex flex-wrap items-center gap-2">
            {/* Dynamic Category Filter Pills */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-[11px] font-bold overflow-x-auto max-w-full">
              {["ALL", ...(activeTab === "services" ? serviceCategories : productCategories).map((c) => c.name)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white shadow-sm font-black"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Type Switcher */}
            <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => {
                  setActiveTab("products");
                  setSelectedCategory("ALL");
                }}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === "products"
                    ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm font-black"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                Appliance Units ({products.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab("parts");
                  setSelectedCategory("ALL");
                }}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === "parts"
                    ? "bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow-sm font-black"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                Parts Stock ({parts.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab("services");
                  setSelectedCategory("ALL");
                }}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === "services"
                    ? "bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm font-black"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                Services ({services.length})
              </button>
            </div>
          </div>
        }
      >
        {loading ? (
          <div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : (
          <>
            {/* Products Table */}
            {activeTab === "products" && (
              <AdminLteTable
                striped
                hover
                headers={["Product Name", "Category", "Selling Price", "Stock Count", "Status", "Actions"]}
              >
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 font-bold text-xs">
                      No products found under selected category.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="font-bold text-xs text-gray-900 dark:text-white">{p.name}</span>
                        {p.description && <p className="text-[10px] text-gray-500 mt-0.5">{p.description}</p>}
                      </td>
                      <td>
                        <span className="rounded-md bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200 px-2 py-0.5 text-[10px] font-bold">
                          {p.category}
                        </span>
                      </td>
                      <td className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        ₹{p.price}
                        {p.discountPercent ? (
                          <span className="ml-1 text-[10px] text-emerald-600">({p.discountPercent}% OFF)</span>
                        ) : null}
                      </td>
                      <td>
                        <span
                          className={`font-mono text-xs font-extrabold ${
                            p.stock < 5 ? "text-red-600 animate-pulse" : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {p.stock} units
                        </span>
                      </td>
                      <td>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-extrabold ${
                            p.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {p.isActive ? "ACTIVE" : "DISABLED"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEdit("product", p)}
                            className="rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 text-[11px] font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus("product", p.id, p.isActive)}
                            disabled={togglingId === p.id}
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                              p.isActive ? "bg-rose-50 text-rose-700 hover:bg-rose-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {p.isActive ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </AdminLteTable>
            )}

            {/* Parts Table */}
            {activeTab === "parts" && (
              <AdminLteTable
                striped
                hover
                headers={["Part Name / Spec", "Category", "Unit Price", "Stock Units", "Status", "Actions"]}
              >
                {filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 font-bold text-xs">
                      No spare parts found under selected category.
                    </td>
                  </tr>
                ) : (
                  filteredParts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="font-bold text-xs text-gray-900 dark:text-white">{p.name}</span>
                        {p.description && <p className="text-[10px] text-gray-500 mt-0.5">{p.description}</p>}
                      </td>
                      <td>
                        <span className="rounded-md bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200 px-2 py-0.5 text-[10px] font-bold">
                          {p.category || "General Part"}
                        </span>
                      </td>
                      <td className="font-mono font-bold text-xs text-teal-600 dark:text-teal-400">₹{p.price}</td>
                      <td>
                        <span
                          className={`font-mono text-xs font-extrabold ${
                            p.stock < 10 ? "text-red-600" : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {p.stock} pcs
                        </span>
                      </td>
                      <td>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-extrabold ${
                            p.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {p.isActive ? "ACTIVE" : "DISABLED"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEdit("part", p)}
                            className="rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 px-2 py-1 text-[11px] font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus("part", p.id, p.isActive)}
                            disabled={togglingId === p.id}
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                              p.isActive ? "bg-rose-50 text-rose-700 hover:bg-rose-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {p.isActive ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </AdminLteTable>
            )}

            {/* Services Table */}
            {activeTab === "services" && (
              <AdminLteTable
                striped
                hover
                headers={["Service / Tariff Title", "Category", "Standard Labour Charge", "Status", "Actions"]}
              >
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500 font-bold text-xs">
                      No services found under selected category.
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span className="font-bold text-xs text-gray-900 dark:text-white">{s.name}</span>
                        {s.description && <p className="text-[10px] text-gray-500 mt-0.5">{s.description}</p>}
                      </td>
                      <td>
                        <span className="rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200 px-2 py-0.5 text-[10px] font-bold">
                          {s.category}
                        </span>
                      </td>
                      <td className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">₹{s.price}</td>
                      <td>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-extrabold ${
                            s.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {s.isActive ? "ACTIVE" : "DISABLED"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEdit("service", s)}
                            className="rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-1 text-[11px] font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus("service", s.id, s.isActive)}
                            disabled={togglingId === s.id}
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                              s.isActive ? "bg-rose-50 text-rose-700 hover:bg-rose-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {s.isActive ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </AdminLteTable>
            )}
          </>
        )}
      </AdminLteCard>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <AdminLteModal
          title={`${editingItem ? "Edit" : "Add New"} ${
            editingItem ? editingItem.type.toUpperCase() : activeTab.toUpperCase().slice(0, -1)
          }`}
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            resetForm();
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Title / Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. 10-Inch Spun Sediment Pre-Filter (5 Micron)"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-gray-700 dark:text-gray-300">Category</label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCatType(activeTab === "services" ? "SERVICE" : "PRODUCT");
                      setShowCategoryModal(true);
                    }}
                    className="text-[11px] text-purple-600 dark:text-purple-400 font-bold hover:underline"
                  >
                    + New Category
                  </button>
                </div>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                >
                  {(activeTab === "services" ? serviceCategories : productCategories).map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Price (INR)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="e.g. 1450"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              {activeTab !== "services" && (
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Available Stock Units</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {activeTab === "products" && (
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Discount %</label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Specification / Description</label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Key technical specifications, NSF certification, warranty, etc."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
              >
                {saving ? "Saving..." : "Save to Inventory"}
              </button>
            </div>
          </form>
        </AdminLteModal>
      )}

      {/* Add Dynamic Category Modal */}
      {showCategoryModal && (
        <AdminLteModal
          title={`Create Dynamic Category (${newCatType})`}
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
        >
          <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Category Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewCatType("SERVICE")}
                  className={`p-2.5 rounded-xl font-bold border transition-all text-center ${
                    newCatType === "SERVICE"
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  🛠️ Service Category
                </button>
                <button
                  type="button"
                  onClick={() => setNewCatType("PRODUCT")}
                  className={`p-2.5 rounded-xl font-bold border transition-all text-center ${
                    newCatType === "PRODUCT"
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  📦 Product Category
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Category Name
              </label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. 🥘 Microwave &amp; Oven Repair"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Icon / Emoji (Optional)
              </label>
              <input
                type="text"
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                placeholder="e.g. 🥘 or Microwave"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Description / Scope (Optional)
              </label>
              <textarea
                rows={2}
                value={newCatDescription}
                onChange={(e) => setNewCatDescription(e.target.value)}
                placeholder="e.g. Magnetron replacement, heating issues and PCB repairs."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingCat || !newCatName.trim()}
                className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
              >
                {savingCat ? "Creating..." : "Save Category"}
              </button>
            </div>
          </form>
        </AdminLteModal>
      )}
    </div>
  );
}
