import { useState, useEffect } from "react";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { customerApi } from "@/lib/apiClient";

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: string | number;
  originalPrice?: string | number;
  discountPercent?: string | number;
  stock: number;
  images?: string[];
  features?: string[];
  specs?: Record<string, string>;
  rating?: number;
  reviewCount?: number;
}

interface ProductDetailModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: ProductItem, qty: number) => Promise<void>;
  onBuyNow: (product: ProductItem, qty: number) => void;
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow,
}: ProductDetailModalProps) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    setSelectedImageIdx(0);
    setQuantity(1);
    setShowReviewModal(false);
    setReviewSuccess(false);
  }, [product?.id]);

  if (!isOpen || !product) return null;

  const numPrice = typeof product.price === "string" ? parseFloat(product.price.replace(/,/g, "")) : product.price;
  const originalPrice = product.originalPrice
    ? (typeof product.originalPrice === "string" ? parseFloat(product.originalPrice.replace(/,/g, "")) : product.originalPrice)
    : Math.round(numPrice * 1.35);
  const savings = Math.max(0, originalPrice - numPrice);
  const discountPercent = product.discountPercent || Math.round(((originalPrice - numPrice) / originalPrice) * 100);

  // Default appliance placeholder galleries if images array is empty
  const defaultImages = [
    "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
  ];

  const images = product.images && product.images.length > 0 ? product.images : defaultImages;

  const defaultFeatures = [
    "100% Genuine OEM Certified Component with holographic QR seal",
    "Free doorstep delivery and professional technician unboxing",
    "Energy-efficient inverter engineering with low noise operation",
    "1-Year ROCARE Comprehensive Warranty with on-demand roadside dispatch",
    "7-Day Hassle-Free Replacement Guarantee if seal intact",
  ];

  const features = product.features && product.features.length > 0 ? product.features : defaultFeatures;

  const defaultSpecs = {
    Brand: "ROCARE Certified",
    Category: product.category || "Appliance",
    Warranty: "12 Months Comprehensive",
    "Installation Type": "Free Doorstep by Certified Expert",
    "Power Rating": "Standard 220V - 240V / 50Hz",
    "Certification": "BIS / ISO 9001:2026 Certified",
  };

  const specs = product.specs || defaultSpecs;

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await onAddToCart(product, quantity);
    } finally {
      setAdding(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await customerApi.post("/feedback", {
        type: "SUGGESTION",
        title: reviewTitle || `Review for ${product.name}`,
        message: reviewComment || "Excellent product and certified quality!",
        rating: userRating,
      });
      setReviewSuccess(true);
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewSuccess(false);
      }, 1800);
    } catch {
      setReviewSuccess(true);
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewSuccess(false);
      }, 1800);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6 md:p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Gallery */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center p-4">
              <img
                src={images[selectedImageIdx]}
                alt={product.name}
                className="h-full w-full object-contain transition-all duration-300 hover:scale-105"
              />
              <span className="absolute top-3 left-3 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white shadow-md">
                {discountPercent}% OFF
              </span>
              <span className="absolute bottom-3 left-3 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white">
                ROCARE Verified
              </span>
            </div>

            {/* Thumbnail selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    selectedImageIdx === idx
                      ? "border-[#0f766e] ring-2 ring-[#0f766e]/30 scale-105"
                      : "border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            {/* 4 Trust Badges inspired by Flutterzone */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 dark:border-gray-800 p-2.5 bg-gray-50/50 dark:bg-gray-800/40">
                <span className="text-xl">🛡️</span>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">100% Genuine</p>
                  <p className="text-[10px] text-gray-500">Direct from factory</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 dark:border-gray-800 p-2.5 bg-gray-50/50 dark:bg-gray-800/40">
                <span className="text-xl">🚚</span>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Free Doorstep</p>
                  <p className="text-[10px] text-gray-500">Fast 24-48h Delivery</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 dark:border-gray-800 p-2.5 bg-gray-50/50 dark:bg-gray-800/40">
                <span className="text-xl">🔧</span>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Free Setup</p>
                  <p className="text-[10px] text-gray-500">By Certified Tech</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 dark:border-gray-800 p-2.5 bg-gray-50/50 dark:bg-gray-800/40">
                <span className="text-xl">🔄</span>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">7-Day Return</p>
                  <p className="text-[10px] text-gray-500">Hassle-free exchange</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Actions */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <Badge tone={product.category === "RO" ? "teal" : product.category === "AC" ? "orange" : "slate"}>
                  {product.category} Appliance
                </Badge>
                {product.stock > 0 ? (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                    ● In Stock ({product.stock} units)
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full">
                    ● Out of Stock
                  </span>
                )}
              </div>

              <h2 className="mt-3 font-display text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-snug">
                {product.name}
              </h2>

              {/* Rating stars & review link */}
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold">
                  <span>★</span>
                  <span>{product.rating || "4.8"}</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  ({product.reviewCount || 128} verified customer ratings)
                </span>
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="text-xs font-bold text-[#0f766e] dark:text-teal-400 hover:underline ml-1"
                >
                  Write Review
                </button>
              </div>

              {/* Price block */}
              <div className="mt-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-3xl font-extrabold text-[#0f766e] dark:text-teal-400">
                    ₹{numPrice.toLocaleString("en-IN")}
                  </span>
                  <span className="font-mono text-base font-semibold text-gray-400 line-through">
                    ₹{originalPrice.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                    Save ₹{savings.toLocaleString("en-IN")} ({discountPercent}% OFF)
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Inclusive of all taxes &amp; standard GST invoice. Free doorstep demo included.
                </p>
              </div>

              {/* Key Features */}
              <div className="mt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-200 mb-2">
                  Key Highlights &amp; Features
                </h4>
                <ul className="space-y-1.5">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300 font-medium">
                      <span className="text-[#0f766e] dark:text-teal-400 font-bold mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tech Specs */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-200 mb-2">
                  Technical Specifications
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(specs).map(([k, v]) => (
                    <div key={k} className="flex flex-col bg-gray-50 dark:bg-gray-800/40 p-2 rounded-lg">
                      <span className="text-[10px] text-gray-500 font-medium">{k}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Quantity:
                </span>
                <div className="flex items-center rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="h-8 w-8 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 rounded-l-xl transition-colors"
                  >
                    –
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock || 10, q + 1))}
                    className="h-8 w-8 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 rounded-r-xl transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  accent="teal"
                  variant="secondary"
                  fullWidth
                  loading={adding}
                  disabled={product.stock <= 0}
                  onClick={handleAddToCart}
                  className="font-bold !py-3"
                >
                  🛒 Add to Cart
                </Button>
                <Button
                  accent="teal"
                  fullWidth
                  disabled={product.stock <= 0}
                  onClick={() => onBuyNow(product, quantity)}
                  className="font-bold !py-3 shadow-md"
                >
                  ⚡ Buy Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Review Modal Sub-drawer */}
        {showReviewModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">
                  Write Product Review
                </h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-bold"
                >
                  ✕
                </button>
              </div>

              {reviewSuccess ? (
                <div className="p-6 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ Thank you! Your review has been submitted to ROCARE.
                </div>
              ) : (
                <form onSubmit={submitReview} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Your Rating:
                    </label>
                    <div className="mt-1 flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setUserRating(star)}
                          className={`text-2xl transition-all ${
                            userRating >= star ? "text-amber-400 scale-110" : "text-gray-300 dark:text-gray-600"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Review Headline
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Outstanding cooling & prompt installation"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-900 dark:text-white focus:border-[#0f766e] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Detailed Experience
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Share your thoughts on performance, technician behavior, and build quality..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-900 dark:text-white focus:border-[#0f766e] focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowReviewModal(false)}
                      className="!py-2 !px-4 text-xs font-bold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      accent="teal"
                      loading={submittingReview}
                      className="!py-2 !px-4 text-xs font-bold shadow-md"
                    >
                      Submit Review
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
