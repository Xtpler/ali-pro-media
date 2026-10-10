import {
  ArrowLeft,
  Gamepad2,
  Package,
  CreditCard,
  Crosshair,
  Music,
  Smartphone,
} from "lucide-react";
import type { ComponentType } from "react";
import type { Product } from "@/types";
import { formatIQD } from "@/lib/format";
import { BrandIcon, detectPlatform } from "@/components/BrandIcons";

const icons: Record<string, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  Gamepad2,
  Smartphone,
  Crosshair,
  Music,
  CreditCard,
};

export function ProductCard({
  product,
  onBuy,
}: {
  product: Product;
  onBuy: (product: Product) => void;
}) {
  const platform = detectPlatform(`${product.name} ${product.name_ar} ${product.icon}`);
  const Icon = icons[product.icon] ?? Package;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <div className="mb-5 flex items-start justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:scale-105">
          {platform ? (
            <BrandIcon platform={platform} size={24} />
          ) : (
            <Icon
              size={24}
              strokeWidth={1.8}
              className="transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
            />
          )}
        </div>
        {product.available && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            متوفر
          </span>
        )}
      </div>
      <h3 className="font-display text-base font-bold text-card-foreground">
        {product.name_ar || product.name}
      </h3>
      <p className="mt-2 line-clamp-2 min-h-[40px] text-xs leading-5 text-muted-foreground">
        {product.description}
      </p>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
        <div>
          <p className="text-[10px] text-muted-foreground">سعر الوحدة</p>
          <p className="mt-0.5 text-base font-bold text-primary">{formatIQD(product.price_iqd)}</p>
        </div>
        <button
          disabled={!product.available}
          onClick={() => onBuy(product)}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-400 px-3 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          اطلب الآن <ArrowLeft size={14} />
        </button>
      </div>
    </article>
  );
}
