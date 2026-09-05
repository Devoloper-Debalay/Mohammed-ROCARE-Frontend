import React, { type FormEvent, useEffect, useState, useRef } from "react";
import { AdminLteCard, AdminLteSmallBox, AdminLteTable, AdminLteModal } from "@/components/adminlte/AdminLteComponents";
import { adminApi, unwrapList } from "@/lib/apiClient";
import { API_BASE_URL } from "@/lib/env";

export interface Product {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  description?: string;
  price: string | number;
  discountPercent?: string | number;
  bulkQtyDiscount?: boolean;
  stock: number;
  images?: any;
  imageUrl?: string;
  image?: string;
  isActive: boolean;
}

export interface Part {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  stock: number;
  images?: any;
  imageUrl?: string;
  image?: string;
  isActive: boolean;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
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
  isActive?: boolean;
}

export const CATEGORY_OPTIONS = [
  { value: "RO", label: "💧 RO & Water Purifier" },
  { value: "AC", label: "❄️ Inverter / Split AC" },
  { value: "GEYSER", label: "🔥 Storage & Instant Geyser" },
  { value: "FRIDGE", label: "🧊 Refrigerator" },
  { value: "OTHER", label: "📦 Other Appliance / Service" },
];

export const PRODUCT_CATEGORY_OPTIONS = CATEGORY_OPTIONS;
export const SERVICE_CATEGORY_OPTIONS = CATEGORY_OPTIONS;

/**
 * Safely formats any API error response (including validation arrays with {field, errors})
 * to prevent React crashes like "Objects are not valid as a React child".
 */
export function getErrorMessage(err: any, fallback = "An error occurred"): string {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  const data = err.response?.data;
  const raw = data?.message ?? data?.error ?? err.message;
  if (!raw) return fallback;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          if (item.field) {
            const errs = Array.isArray(item.errors) ? item.errors.join(", ") : item.errors || item.message || "";
            return `${item.field}: ${errs}`;
          }
          if (item.message) return item.message;
          return JSON.stringify(item);
        }
        return String(item);
      })
      .join(" | ");
  }
  if (typeof raw === "object") {
    if (raw.field) {
      const errs = Array.isArray(raw.errors) ? raw.errors.join(", ") : raw.errors || raw.message || "";
      return `${raw.field}: ${errs}`;
    }
    if (raw.message) return String(raw.message);
    try {
      return JSON.stringify(raw);
    } catch {
      return fallback;
    }
  }
  return String(raw);
}

/**
 * Safely resolves an image path to full URL (Cloudinary, absolute or relative).
 */
export const getMediaUrl = (path?: any): string => {
  if (!path || typeof path !== "string") return "";
  const clean = path.trim();
  if (!clean) return "";
  if (
    clean.startsWith("http://") ||
    clean.startsWith("https://") ||
    clean.startsWith("data:") ||
    clean.startsWith("blob:")
  ) {
    return clean;
  }
  if (clean.startsWith("//")) {
    return `https:${clean}`;
  }
  const base = API_BASE_URL.replace(/\/api$/, "");
  return `${base}${clean.startsWith("/") ? "" : "/"}${clean}`;
};

/**
 * Robustly extracts all image URLs from a product or part object,
 * handling array of strings, JSON strings, object arrays with url/secure_url, etc.
 */
export function extractImages(item: any): string[] {
  if (!item) return [];
  const results: string[] = [];

  const addVal = (val: any) => {
    if (!val) return;
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (!trimmed) return;
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            parsed.forEach(addVal);
            return;
          }
        } catch {}
      }
      results.push(trimmed);
    } else if (typeof val === "object") {
      if (Array.isArray(val)) {
        val.forEach(addVal);
      } else {
        if (val.url) addVal(val.url);
        else if (val.secure_url) addVal(val.secure_url);
        else if (val.imageUrl) addVal(val.imageUrl);
        else if (val.path) addVal(val.path);
        else if (val.src) addVal(val.src);
      }
    }
  };

  addVal(item.images);
  addVal(item.imageUrl);
  addVal(item.image);
  addVal(item.imageUrls);
  addVal(item.imagesUrl);
  addVal(item.photos);
  addVal(item.photo);
  addVal(item.thumbnail);

  return Array.from(new Set(results));
}

export function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState<"products" | "parts" | "services" | "categories">("products");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  
  const [products, setProducts] = useState<Product[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<DynamicCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: "product" | "part" | "service"; data: any } | null>(null);
  const [previewModalImg, setPreviewModalImg] = useState<{ src: string; title: string } | null>(null);
  
  // Dynamic Category Form State
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"SERVICE" | "PRODUCT">("SERVICE");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [newCatDescription, setNewCatDescription] = useState("");
  const [savingCat, setSavingCat] = useState(false);

  // Item Form State
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<string>("RO");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("20");
  const [formDiscount, setFormDiscount] = useState("0");
  const [formBulkDiscount, setFormBulkDiscount] = useState(false);
  const [formDescription, setFormDescription] = useState("");
  
  // Simple Image Upload State
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      adminApi.get("/admin/products?page=1&limit=200").catch(() => adminApi.get("/catalog/products")),
      adminApi.get("/admin/parts?page=1&limit=200").catch(() => adminApi.get("/catalog/parts")),
      adminApi.get("/admin/services?page=1&limit=200").catch(() => adminApi.get("/catalog/service")),
      adminApi.get("/admin/categories?page=1&limit=500")
        .catch(() => adminApi.get("/admin/categories"))
        .catch(() => adminApi.get("/catalog/categories"))
        .catch(() => adminApi.get("/categories")),
    ]).then(([pRes, partsRes, srvRes, catRes]) => {
      let loadedProducts: Product[] = [];
      let loadedParts: Part[] = [];
      let loadedServices: Service[] = [];
      let loadedCategories: DynamicCategory[] = [];

      // Products
      if (pRes.status === "fulfilled") {
        loadedProducts = unwrapList<Product>(pRes.value.data?.data ?? pRes.value.data);
        setProducts(loadedProducts);
      }

      // Parts
      if (partsRes.status === "fulfilled") {
        const rawParts = unwrapList<any>(partsRes.value.data?.data ?? partsRes.value.data);
        loadedParts = rawParts.map((item: any) => {
          const rawStock = item.stock !== undefined && item.stock !== null
            ? item.stock
            : item.quantity !== undefined && item.quantity !== null
            ? item.quantity
            : item.stockQuantity !== undefined && item.stockQuantity !== null
            ? item.stockQuantity
            : item.stockUnits !== undefined && item.stockUnits !== null
            ? item.stockUnits
            : 0;
          return {
            ...item,
            id: item.id || item._id,
            name: item.name || "Unnamed Part",
            description: item.description || "",
            price: item.price !== undefined ? item.price : 0,
            stock: Number(rawStock) || 0,
            isActive: item.isActive !== false,
          };
        });
        setParts(loadedParts);
      }

      // Services
      if (srvRes.status === "fulfilled") {
        loadedServices = unwrapList<Service>(srvRes.value.data?.data ?? srvRes.value.data);
        setServices(loadedServices);
      }

      // Dynamic Categories
      if (catRes.status === "fulfilled") {
        loadedCategories = unwrapList<DynamicCategory>(catRes.value.data?.data ?? catRes.value.data);
      }

      // Discover any categories present on products/services not yet in dynamic list
      const existingIds = new Set(loadedCategories.map((c) => c.id.toLowerCase()));
      const existingNames = new Set(loadedCategories.map((c) => c.name.toLowerCase()));
      const standardKeys = new Set(["ro", "ac", "geyser", "fridge", "other", "all"]);

      const extraCats: DynamicCategory[] = [];
      loadedProducts.forEach((p) => {
        if (p.categoryId && !existingIds.has(p.categoryId.toLowerCase())) {
          extraCats.push({
            id: p.categoryId,
            name: p.category && !standardKeys.has(p.category.toLowerCase()) ? p.category : `Category-${p.categoryId.slice(0, 6)}`,
            type: "PRODUCT",
            icon: "📦",
            isActive: true,
          });
          existingIds.add(p.categoryId.toLowerCase());
        }
        if (p.category && !standardKeys.has(p.category.toLowerCase()) && !existingNames.has(p.category.toLowerCase())) {
          extraCats.push({
            id: p.category,
            name: p.category,
            type: "PRODUCT",
            icon: "📦",
            isActive: true,
          });
          existingNames.add(p.category.toLowerCase());
        }
      });

      loadedServices.forEach((s) => {
        if (s.categoryId && !existingIds.has(s.categoryId.toLowerCase())) {
          extraCats.push({
            id: s.categoryId,
            name: s.category && !standardKeys.has(s.category.toLowerCase()) ? s.category : `Service-${s.categoryId.slice(0, 6)}`,
            type: "SERVICE",
            icon: "🛠️",
            isActive: true,
          });
          existingIds.add(s.categoryId.toLowerCase());
        }
        if (s.category && !standardKeys.has(s.category.toLowerCase()) && !existingNames.has(s.category.toLowerCase())) {
          extraCats.push({
            id: s.category,
            name: s.category,
            type: "SERVICE",
            icon: "🛠️",
            isActive: true,
          });
          existingNames.add(s.category.toLowerCase());
        }
      });

      setDynamicCategories([...loadedCategories, ...extraCats]);
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
        name: newCatName.trim(),
        type: newCatType,
        icon: newCatIcon.trim() || undefined,
        description: newCatDescription.trim() || undefined,
        isActive: true,
      };
      const res = await adminApi.post("/admin/categories", payload);
      const created = (res.data?.data ?? res.data) as DynamicCategory;
      const catItem = created || { id: `cat-${Date.now()}`, ...payload };
      
      setDynamicCategories((prev) => [catItem, ...prev]);
      setFormCategory(catItem.id);
      setToast(`✓ Category "${newCatName}" added successfully.`);
      setShowCategoryModal(false);
      setNewCatName("");
      setNewCatIcon("");
      setNewCatDescription("");
      load();
    } catch (err: any) {
      setToast(getErrorMessage(err, `Failed to create category.`));
    } finally {
      setSavingCat(false);
      setTimeout(() => setToast(""), 3500);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormCategory("RO");
    setFormPrice("");
    setFormStock("20");
    setFormDiscount("0");
    setFormBulkDiscount(false);
    setFormDescription("");
    setExistingImages([]);
    setSelectedFiles([]);
    setFilePreviews([]);
    setUrlInput("");
    setShowUrlInput(false);
    setEditingItem(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenAdd = (type: "product" | "part" | "service") => {
    resetForm();
    setActiveTab(type === "product" ? "products" : type === "part" ? "parts" : "services");
    setShowAddModal(true);
  };

  const handleEdit = (type: "product" | "part" | "service", item: any) => {
    setActiveTab(type === "product" ? "products" : type === "part" ? "parts" : "services");
    setEditingItem({ type, data: item });
    setFormName(item.name || "");
    setFormCategory(item.categoryId || item.category || "RO");
    setFormPrice(String(item.price !== undefined ? item.price : ""));

    const rawStock =
      item.stock !== undefined && item.stock !== null
        ? item.stock
        : item.quantity !== undefined && item.quantity !== null
        ? item.quantity
        : item.stockQuantity !== undefined && item.stockQuantity !== null
        ? item.stockQuantity
        : item.stockUnits !== undefined && item.stockUnits !== null
        ? item.stockUnits
        : 20;
    setFormStock(String(rawStock));

    setFormDiscount(String(item.discountPercent !== undefined ? item.discountPercent : "0"));
    setFormBulkDiscount(Boolean(item.bulkQtyDiscount));
    setFormDescription(item.description || "");

    const imgs = extractImages(item);
    setExistingImages(imgs);
    setSelectedFiles([]);
    setFilePreviews([]);
    setUrlInput("");
    setShowUrlInput(false);

    setShowAddModal(true);
  };

  const handleFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
    
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddImageUrl = () => {
    if (!urlInput.trim()) return;
    setExistingImages((prev) => [...prev, urlInput.trim()]);
    setUrlInput("");
    setShowUrlInput(false);
  };

  const handleToggleCategoryStatus = async (cat: DynamicCategory) => {
    try {
      const nextStatus = !(cat.isActive !== false);
      await adminApi.patch(`/admin/categories/${cat.id}`, { isActive: nextStatus });
      setDynamicCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, isActive: nextStatus } : c)));
      setToast(`✓ Category status updated.`);
    } catch (err: any) {
      setToast(getErrorMessage(err, "Failed to update category status."));
    } finally {
      setTimeout(() => setToast(""), 2500);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await adminApi.delete(`/admin/categories/${catId}`);
      setDynamicCategories((prev) => prev.filter((c) => c.id !== catId));
      setToast("✓ Category removed.");
    } catch (err: any) {
      setToast(getErrorMessage(err, "Failed to delete category."));
    } finally {
      setTimeout(() => setToast(""), 2500);
    }
  };

  const handleToggleStatus = async (type: "product" | "part" | "service", id: string, current: boolean) => {
    setTogglingId(id);
    try {
      if (type === "product") {
        await adminApi.patch(`/admin/products/${id}`, { isActive: !current });
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p)));
      } else if (type === "part") {
        try {
          await adminApi.patch(`/admin/parts/${id}`, { isActive: !current });
        } catch (err: any) {
          if (err.response?.status === 404 || err.response?.status === 405) {
            await adminApi.put(`/admin/parts/${id}`, { isActive: !current })
              .catch(() => adminApi.patch(`/parts/${id}`, { isActive: !current }));
          } else {
            throw err;
          }
        }
        setParts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p)));
      } else {
        await adminApi.patch(`/admin/services/${id}`, { isActive: !current });
        setServices((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: !current } : s)));
      }
      setToast(`✓ ${type.toUpperCase()} status updated.`);
    } catch (err: any) {
      setToast(getErrorMessage(err, "Failed to update status."));
    } finally {
      setTogglingId(null);
      setTimeout(() => setToast(""), 2500);
    }
  };

  const handleDelete = async (type: "product" | "part" | "service", id: string) => {
    if (!window.confirm(`Are you sure you want to remove this ${type}?`)) return;
    setDeletingId(id);
    try {
      if (type === "product") {
        await adminApi.delete(`/admin/products/${id}`);
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else if (type === "part") {
        try {
          await adminApi.delete(`/admin/parts/${id}`);
        } catch (err: any) {
          if (err.response?.status === 404 || err.response?.status === 405) {
            await adminApi.delete(`/parts/${id}`);
          } else {
            throw err;
          }
        }
        setParts((prev) => prev.filter((p) => p.id !== id));
      } else {
        await adminApi.delete(`/admin/services/${id}`);
        setServices((prev) => prev.filter((s) => s.id !== id));
      }
      setToast(`✓ ${type.toUpperCase()} deleted.`);
    } catch (err: any) {
      setToast(getErrorMessage(err, "Failed to delete item."));
    } finally {
      setDeletingId(null);
      setTimeout(() => setToast(""), 2500);
    }
  };

  const sendPartUpdate = async (id: string, data: any, isMultipart = false) => {
    const config = isMultipart ? { headers: { "Content-Type": "multipart/form-data" } } : undefined;
    try {
      return await adminApi.patch(`/admin/parts/${id}`, data, config);
    } catch (err1: any) {
      if (err1.response?.status === 404 || err1.response?.status === 405) {
        try {
          return await adminApi.put(`/admin/parts/${id}`, data, config);
        } catch (err2: any) {
          if (err2.response?.status === 404 || err2.response?.status === 405) {
            try {
              return await adminApi.patch(`/parts/${id}`, data, config);
            } catch (err3) {
              return await adminApi.put(`/parts/${id}`, data, config);
            }
          }
          throw err2;
        }
      }
      throw err1;
    }
  };

  const sendPartCreate = async (data: any, isMultipart = false) => {
    const config = isMultipart ? { headers: { "Content-Type": "multipart/form-data" } } : undefined;
    try {
      return await adminApi.post("/admin/parts", data, config);
    } catch (err1: any) {
      if (err1.response?.status === 404 || err1.response?.status === 405) {
        return await adminApi.post("/parts", data, config);
      }
      throw err1;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const itemType = editingItem?.type || (activeTab === "products" ? "product" : activeTab === "parts" ? "part" : "service");

    try {
      const hasFiles = selectedFiles.length > 0;
      const numPrice = Number(formPrice) || 0;
      const numStock = Number(formStock) || 0;
      const numDiscount = Number(formDiscount) || 0;

      // Determine valid category and optional categoryId for Product and Service
      let category = "RO";
      let categoryId: string | undefined = undefined;

      if (["RO", "AC", "GEYSER", "OTHER"].includes(formCategory)) {
        category = formCategory;
      } else {
        const matchedDynamic = dynamicCategories.find((d) => d.id === formCategory || d.name === formCategory);
        if (matchedDynamic) {
          categoryId = matchedDynamic.id;
          category = "OTHER";
        } else {
          category = "OTHER";
        }
      }

      if (itemType === "product") {
        if (hasFiles) {
          const formData = new FormData();
          formData.append("name", formName.trim());
          formData.append("category", category);
          if (categoryId) formData.append("categoryId", categoryId);
          formData.append("price", String(numPrice));
          formData.append("stock", String(numStock));
          formData.append("discountPercent", String(numDiscount));
          formData.append("bulkQtyDiscount", String(formBulkDiscount));
          formData.append("description", formDescription.trim());
          formData.append("isActive", String(editingItem ? editingItem.data.isActive !== false : true));

          if (existingImages.length > 0) {
            formData.append("existingImages", JSON.stringify(existingImages));
          }

          selectedFiles.forEach((file) => {
            formData.append("files", file);
            formData.append("images", file);
          });
          if (selectedFiles[0]) {
            formData.append("file", selectedFiles[0]);
            formData.append("image", selectedFiles[0]);
          }

          if (editingItem) {
            await adminApi.patch(`/admin/products/${editingItem.data.id}`, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            setToast(`✓ Product updated with images.`);
          } else {
            await adminApi.post("/admin/products", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            setToast(`✓ New product created with images.`);
          }
        } else {
          const payload: any = {
            name: formName.trim(),
            category,
            categoryId: categoryId || undefined,
            price: numPrice,
            stock: numStock,
            discountPercent: numDiscount,
            bulkQtyDiscount: formBulkDiscount,
            description: formDescription.trim(),
            isActive: editingItem ? editingItem.data.isActive !== false : true,
            images: existingImages,
          };

          if (editingItem) {
            await adminApi.patch(`/admin/products/${editingItem.data.id}`, payload);
            setToast(`✓ Product updated successfully.`);
          } else {
            await adminApi.post("/admin/products", payload);
            setToast(`✓ New product added to inventory.`);
          }
        }
      } else if (itemType === "part") {
        const partId = editingItem?.data?.id || editingItem?.data?._id;
        if (hasFiles) {
          const formData = new FormData();
          formData.append("name", formName.trim());
          formData.append("price", String(numPrice));
          formData.append("stock", String(numStock));
          formData.append("quantity", String(numStock));
          formData.append("stockQuantity", String(numStock));
          formData.append("stockUnits", String(numStock));
          if (formDescription.trim()) {
            formData.append("description", formDescription.trim());
          }
          formData.append("isActive", String(editingItem ? editingItem.data.isActive !== false : true));

          if (existingImages.length > 0) {
            formData.append("existingImages", JSON.stringify(existingImages));
          }

          selectedFiles.forEach((file) => {
            formData.append("files", file);
            formData.append("images", file);
          });
          if (selectedFiles[0]) {
            formData.append("file", selectedFiles[0]);
            formData.append("image", selectedFiles[0]);
          }

          if (editingItem && partId) {
            await sendPartUpdate(partId, formData, true);
            setParts((prev) =>
              prev.map((p) =>
                p.id === partId
                  ? { ...p, name: formName.trim(), price: numPrice, stock: numStock, description: formDescription.trim() }
                  : p
              )
            );
            setToast(`✓ Spare part updated with images.`);
          } else {
            await sendPartCreate(formData, true);
            setToast(`✓ New spare part created with images.`);
          }
        } else {
          const payload: any = {
            name: formName.trim(),
            price: numPrice,
            stock: numStock,
            quantity: numStock,
            stockQuantity: numStock,
            stockUnits: numStock,
            description: formDescription.trim(),
            isActive: editingItem ? editingItem.data.isActive !== false : true,
            images: existingImages,
          };

          if (editingItem && partId) {
            await sendPartUpdate(partId, payload, false);
            setParts((prev) =>
              prev.map((p) =>
                p.id === partId
                  ? { ...p, ...payload, stock: numStock }
                  : p
              )
            );
            setToast(`✓ Spare part updated successfully.`);
          } else {
            await sendPartCreate(payload, false);
            setToast(`✓ New spare part added to inventory.`);
          }
        }
      } else {
        // Service tariff
        const payload: any = {
          name: formName.trim(),
          category,
          categoryId: categoryId || undefined,
          price: numPrice,
          description: formDescription.trim(),
          isActive: editingItem ? editingItem.data.isActive !== false : true,
        };

        if (editingItem) {
          await adminApi.patch(`/admin/services/${editingItem.data.id}`, payload);
          setToast(`✓ Service tariff modified successfully.`);
        } else {
          await adminApi.post("/admin/services", payload);
          setToast(`✓ New service tariff created.`);
        }
      }

      setShowAddModal(false);
      resetForm();
      load();
    } catch (err: any) {
      setToast(getErrorMessage(err, "Failed to save item."));
      load();
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 4500);
    }
  };

  const getItemPrimaryImage = (item: Product | Part): string => {
    const imgs = extractImages(item);
    if (imgs.length > 0) return getMediaUrl(imgs[0]);
    return "";
  };

  // Unified Dynamic Categories list across all tabs
  const allCategoryPillKeys = ["ALL", "RO", "AC", "GEYSER", "FRIDGE", "OTHER", ...dynamicCategories.map((d) => d.id)];

  // Filtered views
  const filteredProducts = products.filter(
    (p) => selectedCategory === "ALL" || p.category === selectedCategory || p.categoryId === selectedCategory
  );
  const filteredParts = parts.filter(() => true);
  const filteredServices = services.filter(
    (s) => selectedCategory === "ALL" || s.category === selectedCategory || s.categoryId === selectedCategory
  );
  const filteredCategories = dynamicCategories.filter(
    (c) => selectedCategory === "ALL" || c.id === selectedCategory || c.name === selectedCategory
  );

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span>⚙️</span> Catalog, Categories &amp; Spare Parts Inventory
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Manage appliance units, certified replacement parts with Cloudinary image upload, all dynamic product/service categories, and repair tariffs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setNewCatType("PRODUCT");
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
        <div className={`rounded-xl border p-3 text-xs font-bold animate-in fade-in ${
          toast.startsWith("✓")
            ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300"
            : "bg-rose-50 dark:bg-rose-950 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300"
        }`}>
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
          onLinkClick={() => {
            setActiveTab("products");
            setSelectedCategory("ALL");
          }}
          linkText="View full machines"
        />
        <AdminLteSmallBox
          title="Spare Parts Stock"
          value={parts.length}
          icon="⚙️"
          tone="teal"
          onLinkClick={() => {
            setActiveTab("parts");
            setSelectedCategory("ALL");
          }}
          linkText="Manage spare inventory"
        />
        <AdminLteSmallBox
          title="Service Tariffs"
          value={services.length}
          icon="🛠️"
          tone="warning"
          onLinkClick={() => {
            setActiveTab("services");
            setSelectedCategory("ALL");
          }}
          linkText="View labour tariffs"
        />
        <AdminLteSmallBox
          title="Dynamic Categories"
          value={dynamicCategories.length}
          icon="🏷️"
          tone="danger"
          onLinkClick={() => {
            setActiveTab("categories");
            setSelectedCategory("ALL");
          }}
          linkText="Manage categories hub"
        />
      </div>

      {/* Main Catalog Tabs & Table */}
      <AdminLteCard
        title="Catalog &amp; AMC Services Matrix"
        icon="📊"
        outlineTone="primary"
        tools={
          <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => {
                setActiveTab("products");
                setSelectedCategory("ALL");
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "products"
                  ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm font-black"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900"
              }`}
            >
              Appliance Units ({products.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("parts");
                setSelectedCategory("ALL");
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "parts"
                  ? "bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow-sm font-black"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900"
              }`}
            >
              Parts Stock ({parts.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("services");
                setSelectedCategory("ALL");
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "services"
                  ? "bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm font-black"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900"
              }`}
            >
              Services &amp; AMC ({services.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("categories");
                setSelectedCategory("ALL");
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "categories"
                  ? "bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm font-black"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900"
              }`}
            >
              Categories Hub ({dynamicCategories.length})
            </button>
          </div>
        }
      >
        {loading ? (
          <div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : (
          <>
            {/* Category Filter Pills Bar inside Card Body */}
            {(activeTab === "products" || activeTab === "services" || activeTab === "categories") && (
              <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/80 dark:bg-gray-800/60 p-2.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 w-full min-w-0 max-w-full overflow-hidden">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full min-w-0 max-w-full pb-1 scrollbar-thin">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1 shrink-0">
                    Category:
                  </span>
                  {allCategoryPillKeys.map((catKey) => {
                    const dynamicMatch = dynamicCategories.find((d) => d.id === catKey);
                    const standardMatch = CATEGORY_OPTIONS.find((s) => s.value === catKey);
                    const label = dynamicMatch
                      ? `🏷️ ${dynamicMatch.name}`
                      : standardMatch
                      ? standardMatch.label
                      : catKey === "ALL"
                      ? "All Categories"
                      : catKey;
                    return (
                      <button
                        key={catKey}
                        onClick={() => setSelectedCategory(catKey)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                          selectedCategory === catKey
                            ? "bg-[#0d6efd] text-white shadow-sm font-black scale-[1.02]"
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs font-semibold text-gray-500 shrink-0 self-end md:self-auto">
                  Showing {activeTab === "products" ? filteredProducts.length : activeTab === "services" ? filteredServices.length : filteredCategories.length} items
                </div>
              </div>
            )}
            {/* Products Table */}
            {activeTab === "products" && (
              <AdminLteTable
                striped
                hover
                headers={["Image", "Product Name", "Category", "Selling Price", "Stock Count", "Status", "Actions"]}
              >
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500 font-bold text-xs">
                      No products found under selected category filter. Click &ldquo;+ Add Product Unit&rdquo; to add a machine.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const primaryImg = getItemPrimaryImage(p);
                    const dynamicCatMatch = dynamicCategories.find((d) => d.id === p.categoryId);
                    const displayCategory = dynamicCatMatch ? `🏷️ ${dynamicCatMatch.name}` : p.category || "RO";

                    return (
                      <tr key={p.id}>
                        <td className="w-14">
                          {primaryImg ? (
                            <img
                              src={primaryImg}
                              alt={p.name}
                              onClick={() => setPreviewModalImg({ src: primaryImg, title: p.name })}
                              className="h-10 w-10 object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-white p-0.5 cursor-pointer hover:scale-110 transition-transform shadow-xs"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-base">
                              📦
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="font-bold text-xs text-gray-900 dark:text-white">{p.name}</span>
                          {p.description && <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{p.description}</p>}
                        </td>
                        <td>
                          <span className="rounded-md bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200 px-2 py-0.5 text-[10px] font-bold">
                            {displayCategory}
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
                              Number(p.stock) < 5 ? "text-red-600 animate-pulse" : "text-gray-900 dark:text-white"
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
                                p.isActive ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {p.isActive ? "Disable" : "Enable"}
                            </button>
                            <button
                              onClick={() => handleDelete("product", p.id)}
                              disabled={deletingId === p.id}
                              className="rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 px-2 py-1 text-[11px] font-bold"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </AdminLteTable>
            )}

            {/* Parts Table */}
            {activeTab === "parts" && (
              <AdminLteTable
                striped
                hover
                headers={["Image", "Part Name / Spec", "Unit Price", "Stock Units", "Status", "Actions"]}
              >
                {filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 font-bold text-xs">
                      No spare parts found in inventory. Click &ldquo;+ Add Spare Part&rdquo; to add replacement filters &amp; components.
                    </td>
                  </tr>
                ) : (
                  filteredParts.map((p) => {
                    const primaryImg = getItemPrimaryImage(p);
                    return (
                      <tr key={p.id}>
                        <td className="w-14">
                          {primaryImg ? (
                            <img
                              src={primaryImg}
                              alt={p.name}
                              onClick={() => setPreviewModalImg({ src: primaryImg, title: p.name })}
                              className="h-10 w-10 object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-white p-0.5 cursor-pointer hover:scale-110 transition-transform shadow-xs"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900 flex items-center justify-center text-base">
                              ⚙️
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="font-bold text-xs text-gray-900 dark:text-white">{p.name}</span>
                          {p.description && <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{p.description}</p>}
                        </td>
                        <td className="font-mono font-bold text-xs text-teal-600 dark:text-teal-400">₹{p.price}</td>
                        <td>
                          <span
                            className={`font-mono text-xs font-extrabold ${
                              Number(p.stock) < 10 ? "text-red-600" : "text-gray-900 dark:text-white"
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
                                p.isActive ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {p.isActive ? "Disable" : "Enable"}
                            </button>
                            <button
                              onClick={() => handleDelete("part", p.id)}
                              disabled={deletingId === p.id}
                              className="rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 px-2 py-1 text-[11px] font-bold"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
                  filteredServices.map((s) => {
                    const dynamicCatMatch = dynamicCategories.find((d) => d.id === s.categoryId);
                    const displayCategory = dynamicCatMatch ? `🏷️ ${dynamicCatMatch.name}` : s.category || "RO";

                    return (
                      <tr key={s.id}>
                        <td>
                          <span className="font-bold text-xs text-gray-900 dark:text-white">{s.name}</span>
                          {s.description && <p className="text-[10px] text-gray-500 mt-0.5">{s.description}</p>}
                        </td>
                        <td>
                          <span className="rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200 px-2 py-0.5 text-[10px] font-bold">
                            {displayCategory}
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
                                s.isActive ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {s.isActive ? "Disable" : "Enable"}
                            </button>
                            <button
                              onClick={() => handleDelete("service", s.id)}
                              disabled={deletingId === s.id}
                              className="rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 px-2 py-1 text-[11px] font-bold"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </AdminLteTable>
            )}

            {/* All Dynamic Categories Hub Table */}
            {activeTab === "categories" && (
              <AdminLteTable
                striped
                hover
                headers={["Icon", "Category Name", "Applicability", "Description", "Status", "Actions"]}
              >
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 font-bold text-xs">
                      No dynamic categories found. Click &ldquo;+ Add Category&rdquo; above to create a new category.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((c) => (
                    <tr key={c.id}>
                      <td className="w-12 text-center text-xl">
                        {c.icon || "📦"}
                      </td>
                      <td>
                        <span className="font-bold text-xs text-gray-900 dark:text-white">{c.name}</span>
                      </td>
                      <td>
                        <span className="rounded-md px-2 py-0.5 text-[10px] font-bold bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200">
                          📦 Products &amp; 🛠️ Services
                        </span>
                      </td>
                      <td>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {c.description || "—"}
                        </p>
                      </td>
                      <td>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-extrabold ${
                            c.isActive !== false ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {c.isActive !== false ? "ACTIVE" : "DISABLED"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleCategoryStatus(c)}
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                              c.isActive !== false
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {c.isActive !== false ? "Disable" : "Enable"}
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(c.id)}
                            className="rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 px-2 py-1 text-[11px] font-bold"
                          >
                            Delete
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
      {showAddModal && (() => {
        const formItemType = editingItem?.type || (activeTab === "products" ? "product" : activeTab === "parts" ? "part" : "service");
        return (
          <AdminLteModal
            title={`${editingItem ? "Edit" : "Add New"} ${
              formItemType === "product" ? "Product" : formItemType === "part" ? "Spare Part" : "Service Tariff"
            }`}
            isOpen={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              resetForm();
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Title / Name *</label>
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
                {formItemType !== "part" && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-gray-700 dark:text-gray-300">Category *</label>
                      <button
                        type="button"
                        onClick={() => {
                          setNewCatType("PRODUCT");
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
                      <optgroup label="Standard Categories">
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </optgroup>
                      {dynamicCategories.length > 0 && (
                        <optgroup label="Custom Created Categories">
                          {dynamicCategories.map((d) => (
                            <option key={d.id} value={d.id}>
                              🏷️ {d.icon ? d.icon + " " : ""}{d.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Price (INR) *</label>
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

                {formItemType !== "service" && (
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Available Stock Units *</label>
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

                {formItemType === "product" && (
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

              {/* Simple, Streamlined Product / Part Image Upload Section */}
              {formItemType !== "service" && (
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>Image(s)</span>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    {showUrlInput ? "Hide URL Input" : "+ Paste Image URL"}
                  </button>
                </label>

                {/* Direct Image URL input if expanded */}
                {showUrlInput && (
                  <div className="flex gap-1.5 mb-2.5">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://res.cloudinary.com/... or https://..."
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs font-medium focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 text-xs font-bold whitespace-nowrap"
                    >
                      Attach URL
                    </button>
                  </div>
                )}

                {/* Clean Dropzone */}
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*"
                  onChange={handleFilesChosen}
                  className="hidden"
                  id="admin-catalog-file-input"
                />
                <label
                  htmlFor="admin-catalog-file-input"
                  className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center"
                >
                  <span className="text-2xl mb-1">📷</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">
                    Choose Image File(s)
                  </span>
                  <span className="text-[10px] text-gray-500 mt-0.5">
                    Supports JPG, PNG, WEBP (Single or Multiple)
                  </span>
                </label>

                {/* Previews / Gallery */}
                {(existingImages.length > 0 || filePreviews.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {/* Existing Images */}
                    {existingImages.map((img, idx) => (
                      <div
                        key={`exist-${idx}`}
                        className="relative group rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden h-16 w-16 bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-1"
                      >
                        <img
                          src={getMediaUrl(img)}
                          alt={`Image ${idx}`}
                          className="h-full w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(idx)}
                          className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-bold shadow-md opacity-90 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* New Selected Files */}
                    {filePreviews.map((preview, idx) => (
                      <div
                        key={`new-${idx}`}
                        className="relative group rounded-xl border border-emerald-400 dark:border-emerald-600 overflow-hidden h-16 w-16 bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-1"
                      >
                        <img
                          src={preview}
                          alt={`New preview ${idx}`}
                          className="h-full w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedFile(idx)}
                          className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-bold shadow-md opacity-90 group-hover:opacity-100 transition-opacity"
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md flex items-center gap-1.5"
              >
                {saving ? "Saving..." : "Save to Inventory"}
              </button>
            </div>
          </form>
        </AdminLteModal>
      ); })()}

      {/* Add Dynamic Category Modal */}
      {showCategoryModal && (
        <AdminLteModal
          title="Create New Category"
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
        >
          <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
            <div className="rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 p-3 text-xs text-teal-800 dark:text-teal-200 font-medium flex items-center gap-2">
              <span className="text-base">✨</span>
              <span>Universal Category: Available across all Products, Spare Parts, and Service Tariffs.</span>
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

      {/* Image Zoom Preview Modal */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewModalImg(null)}
        >
          <div className="relative max-w-lg max-h-[85vh] bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center">
            <button
              onClick={() => setPreviewModalImg(null)}
              className="absolute top-3 right-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full h-8 w-8 flex items-center justify-center font-bold hover:bg-gray-200"
            >
              ✕
            </button>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3 pr-8 truncate max-w-full">
              {previewModalImg.title}
            </h4>
            <div className="aspect-square w-full max-h-[60vh] flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden p-2">
              <img src={previewModalImg.src} alt={previewModalImg.title} className="h-full w-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
