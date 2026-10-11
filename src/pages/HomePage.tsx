import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Boxes, ChevronLeft, Instagram, Sparkles, ShieldCheck, Users2 } from "lucide-react";
import { AdBoard } from "@/components/AdBoard";
import { ProductCard } from "@/components/ProductCard";
import { PaymentModal } from "@/components/PaymentModal";
import { AccountsMarket } from "@/components/AccountsMarket";
import { SocialMediaServices } from "@/components/SocialMediaServices";
import { UnbanSection } from "@/components/UnbanSection";
import { ElectronicCards } from "@/components/ElectronicCards";
import { Toast } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import { HomeHero } from "@/components/home/HomeHero";
import { TrustBar } from "@/components/home/TrustBar";
import { ServicesShowcase, type HomeTab } from "@/components/home/ServicesShowcase";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturedPackages } from "@/components/home/FeaturedPackages";
import { Testimonials } from "@/components/home/Testimonials";
import { Faq } from "@/components/home/Faq";
import { FinalCta } from "@/components/home/FinalCta";
import { Reveal } from "@/components/home/Reveal";
import { getBanners, getProducts } from "@/lib/data";
import { getPublicStats, type PublicStats } from "@/lib/store";
import type { Banner, Product } from "@/types";

export function HomePage({
  search,
  onNavigate,
}: {
  search: string;
  onNavigate?: (view: "support") => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [stats, setStats] = useState<PublicStats>({
    services: 0,
    accounts: 0,
  });
  const [selected, setSelected] = useState<Product | null>(null);
  const [tab, setTab] = useState<HomeTab>("social_media");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const showcaseRef = useRef<HTMLDivElement | null>(null);
  const catalogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    Promise.all([getProducts(), getBanners(), getPublicStats()])
      .then(([p, b, s]) => {
        setProducts(Array.isArray(p) ? p : []);
        setBanners(Array.isArray(b) ? b : []);
        setStats(s);
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

  const scrollTo = useCallback((target: RefObject<HTMLElement | null>) => {
    const reduce =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, []);

  const openTab = useCallback(
    (next: HomeTab) => {
      setTab(next);
      scrollTo(catalogRef);
    },
    [scrollTo],
  );

  const tabs: [HomeTab, string, ReactNode][] = [
    ["social_media", "خدمات السوشيال ميديا", <Instagram key="i" size={15} />],
    ["accounts", "بيع وشراء الحسابات", <Users2 key="u" size={15} />],
    ["digital_cards", "الكارتات الإلكترونية", <Boxes key="b" size={15} />],
    ["unban", "قسم فتح الباند", <ShieldCheck key="s" size={15} />],
  ];

  const hasBanners = banners.some((b) => b?.active !== false);

  return (
    <div className="home min-h-screen bg-background pt-20 text-foreground sm:pt-24">
      <div className="home-backdrop" aria-hidden>
        <div className="home-mesh" />
        <div className="home-grid" />
        <div className="home-noise" />
      </div>

      <div className="home-content">
        <HomeHero onStart={() => openTab("social_media")} onBrowse={() => scrollTo(showcaseRef)} />

        <TrustBar stats={stats} />

        {hasBanners && (
          <div className="home-container pt-8">
            <AdBoard banners={banners} onCta={() => openTab("social_media")} />
          </div>
        )}

        <div ref={showcaseRef} className="scroll-mt-24">
          <ServicesShowcase onSelect={openTab} />
        </div>

        <section
          ref={catalogRef}
          id="catalog"
          className="home-section home-container scroll-mt-24"
          aria-label="تصفّح الخدمات"
        >
          <Reveal>
            <div className="flex flex-col gap-2">
              <span className="eyebrow">
                <Sparkles size={13} />
                تصفّح الخدمات
              </span>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-foreground sm:text-3xl">
                كل ما تحتاجه، جاهز للطلب
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                اختر القسم واستعرض الخدمات المتاحة، ثم اطلب مباشرة من محفظتك.
              </p>
            </div>

            <div className="mt-6 flex gap-1.5 overflow-x-auto rounded-2xl border border-border bg-card/60 p-1.5 backdrop-blur">
              {tabs.map(([id, label, icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  aria-pressed={tab === id}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                    tab === id
                      ? "bg-primary text-primary-foreground shadow-[0_10px_30px_-12px_var(--color-primary)]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="mt-8">
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
                      <div
                        key={i}
                        className="motion-skeleton h-64 rounded-2xl border border-border"
                      />
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
              className="mt-6 h-auto px-0 text-xs font-bold text-primary"
            >
              تواصل معنا <ChevronLeft size={15} />
            </Button>
          </div>
        </section>

        <HowItWorks />

        <FeaturedPackages
          products={products}
          onBuy={setSelected}
          onBrowse={() => openTab("social_media")}
        />

        <Testimonials />

        <Faq />

        <FinalCta
          onStart={() => openTab("social_media")}
          onSupport={() => onNavigate?.("support")}
        />
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
    </div>
  );
}
