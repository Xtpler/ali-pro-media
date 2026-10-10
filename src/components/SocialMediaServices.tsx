import { useMemo, useState } from "react";
import { Layers } from "lucide-react";
import type { Product } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { BrandIcon, PLATFORMS, detectPlatform } from "@/components/BrandIcons";

type Filter = "all" | string;

export function SocialMediaServices({
  products,
  search,
  onBuy,
}: {
  products: Product[];
  search: string;
  onBuy: (product: Product) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const withPlatform = useMemo(
    () =>
      products.map((product) => ({
        product,
        platform:
          detectPlatform(
            `${product.name} ${product.name_ar} ${product.icon} ${product.description}`,
          ) ?? "other",
      })),
    [products],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: withPlatform.length, other: 0 };
    for (const item of withPlatform) {
      map[item.platform] = (map[item.platform] ?? 0) + 1;
    }
    return map;
  }, [withPlatform]);

  const tabs = PLATFORMS;

  const listings = useMemo(
    () =>
      withPlatform.filter(({ product, platform }) => {
        const matchesFilter = filter === "all" || platform === filter;
        const q = search.toLowerCase();
        const matchesSearch = `${product.name} ${product.name_ar} ${product.description}`
          .toLowerCase()
          .includes(q);
        return matchesFilter && matchesSearch;
      }),
    [withPlatform, filter, search],
  );

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-emerald-400/15 bg-emerald-400/[.05] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold text-emerald-400">خدمات السوشيال ميديا</p>
          <h3 className="mt-1 font-display text-lg font-bold text-white">
            تعزيز ومتابعة حسب المنصة
          </h3>
          <p className="mt-1 text-xs leading-6 text-slate-400">
            اختر المنصة لعرض الخدمات الخاصة بها — متابعين، مشاهدات، إعجابات والمزيد.
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
          <Layers size={22} />
        </div>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <PlatformTab
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="كل المنصات"
          count={counts["all"] ?? 0}
        />
        {tabs.map((p) => (
          <PlatformTab
            key={p.id}
            active={filter === p.id}
            onClick={() => setFilter(p.id)}
            label={p.label}
            count={counts[p.id] ?? 0}
            icon={<BrandIcon platform={p.id} size={16} className={p.color} />}
          />
        ))}
        {(counts["other"] ?? 0) > 0 && (
          <PlatformTab
            active={filter === "other"}
            onClick={() => setFilter("other")}
            label="خدمات أخرى"
            count={counts["other"] ?? 0}
          />
        )}
      </div>

      {listings.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map(({ product }) => (
            <ProductCard key={product.id} product={product} onBuy={onBuy} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-slate-500">
          لا توجد خدمات مطابقة لهذه المنصة حالياً
        </div>
      )}
    </section>
  );
}

function PlatformTab({
  active,
  onClick,
  label,
  count,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-[11px] font-bold transition ${
        active ? "bg-emerald-400 text-slate-950" : "bg-white/[.04] text-slate-400 hover:text-white"
      }`}
    >
      {icon}
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[9px] ${active ? "bg-slate-950/15" : "bg-white/10"}`}
      >
        {count}
      </span>
    </button>
  );
}
