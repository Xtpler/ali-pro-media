import { useEffect, useMemo, useState } from "react";
import { Boxes, ChevronLeft, Instagram, ShieldCheck, Users2 } from "lucide-react";
import { MotionHero } from "@/components/MotionHero";
import { AdBoard } from "@/components/AdBoard";
import { ProductCard } from "@/components/ProductCard";
import { PaymentModal } from "@/components/PaymentModal";
import { AccountsMarket } from "@/components/AccountsMarket";
import { SocialMediaServices } from "@/components/SocialMediaServices";
import { UnbanSection } from "@/components/UnbanSection";
import { ElectronicCards } from "@/components/ElectronicCards";
import { Toast } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import { getBanners, getProducts } from "@/lib/data";
import type { Banner, Product } from "@/types";

type Tab = "social_media" | "accounts" | "digital_cards" | "unban";

export function HomePage({
  search,
  onNavigate,
}: {
  search: string;
  onNavigate?: (view: "support") => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [tab, setTab] = useState<Tab>("social_media");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProducts(), getBanners()])
      .then(([p, b]) => {
        setProducts(Array.isArray(p) ? p : []);
        setBanners(Array.isArray(b) ? b : []);
      })
      .catch(() => {
        setProducts([]);
        setBanners([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      (products ?? []).filter(
        (p) =>
          p.category === tab &&
          `${p.name} ${p.name_ar} ${p.description}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [products, tab, search],
  );

  const tabs: [Tab, string, React.ReactNode][] = [
    ["social_media", "خدمات السوشيال ميديا", <Instagram key="i" size={15} />],
    ["accounts", "بيع وشراء الحسابات", <Users2 key="u" size={15} />],
    ["digital_cards", "الكارتات الإلكترونية", <Boxes key="b" size={15} />],
    ["unban", "قسم فتح الباند", <ShieldCheck key="s" size={15} />],
  ];

  return (
    <main className="min-h-screen bg-background pt-20 text-foreground sm:pt-24">
      <MotionHero onCta={() => setTab("social_media")} />
      {banners.some((b) => b?.active !== false) && (
        <div className="pt-6">
          <AdBoard banners={banners} onCta={() => setTab("social_media")} />
        </div>
      )}
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-5 sm:pt-12 lg:px-10">
        <div className="mb-8 flex flex-col gap-5">
          <div>
            <p className="text-xs font-bold text-primary">اكتشف مجموعتنا</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
              خدماتنا الرقمية
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">كل ما تحتاجه لتطوير تجربتك الرقمية</p>
          </div>
          <div className="flex gap-2 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-sm transition-colors duration-300">
            {tabs.map(([id, label, icon]) => (
              <Button
                type="button"
                variant={tab === id ? "default" : "ghost"}
                key={id}
                onClick={() => setTab(id)}
                className="h-auto shrink-0 rounded-lg px-4 py-2.5 text-xs font-bold"
              >
                {icon} {label}
              </Button>
            ))}
          </div>
        </div>

        {tab === "accounts" ? (
          <AccountsMarket search={search} onSellRequest={() => onNavigate?.("support")} />
        ) : tab === "unban" ? (
          <UnbanSection />
        ) : tab === "social_media" ? (
          <SocialMediaServices products={filtered} search={search} onBuy={setSelected} />
        ) : tab === "digital_cards" ? (
          <>
            {loading ? (
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="motion-skeleton h-64 rounded-2xl border border-border" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="motion-stagger mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} onBuy={setSelected} />
                ))}
              </div>
            ) : null}
            <ElectronicCards search={search} />
          </>
        ) : filtered.length ? (
          <div className="motion-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} onBuy={setSelected} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            لا توجد نتائج مطابقة لبحثك
          </div>
        )}

        <Button
          type="button"
          variant="link"
          onClick={() => onNavigate?.("support")}
          className="h-auto px-0 text-xs font-bold text-primary"
        >
          تواصل معنا <ChevronLeft size={15} />
        </Button>
      </div>
      {selected && (
        <PaymentModal
          product={selected}
          onClose={() => setSelected(null)}
          onDone={() => {
            setSelected(null);
            setMessage("تم تسجيل طلبك بنجاح");
          }}
        />
      )}
      {message && <Toast message={message} onClose={() => setMessage("")} />}
    </main>
  );
}
