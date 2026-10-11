import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Button } from "@/components/ui/button";
import { formatIQD } from "@/lib/format";
import type { Product } from "@/types";

const PERKS = ["تنفيذ خلال دقائق", "دعم على مدار الساعة", "ضمان استرداد الرصيد"];

const FALLBACK = [
  {
    id: "starter",
    title: "الباقة الأساسية",
    description: "ابدأ حضورك الرقمي بأهم الخدمات.",
    price_iqd: 5000,
  },
  {
    id: "pro",
    title: "الباقة الاحترافية",
    description: "نمو متكامل مع مزايا إضافية.",
    price_iqd: 15000,
  },
  {
    id: "elite",
    title: "باقة النخبة",
    description: "أقصى وصول وأفضل نتيجة ممكنة.",
    price_iqd: 35000,
  },
];

type PackageCard = {
  id: string;
  title: string;
  description: string;
  price: number;
  product?: Product;
};

export function FeaturedPackages({
  products,
  onBuy,
  onBrowse,
}: {
  products: Product[];
  onBuy: (product: Product) => void;
  onBrowse: () => void;
}) {
  const featured = products.filter((product) => product.available).slice(0, 3);

  const cards: PackageCard[] = featured.length
    ? featured.map((product) => ({
        id: product.id,
        title: product.name_ar || product.name,
        description: product.description,
        price: product.price_iqd,
        product,
      }))
    : FALLBACK.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price_iqd,
      }));

  const highlightIndex = cards.length > 1 ? 1 : 0;

  return (
    <section className="home-section home-container" aria-label="الباقات المميزة">
      <SectionHeading
        eyebrow="الباقات المميزة"
        title="اختر الباقة الأقرب لهدفك"
        subtitle="باقات جاهزة بأسعار واضحة، وكلها قابلة للتخصيص حسب احتياجك."
        icon={<Sparkles size={13} />}
      />

      <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
        {cards.map((card, index) => {
          const highlight = index === highlightIndex;
          return (
            <Reveal key={card.id} delay={index * 0.1} className="h-full">
              <article
                className={`glass-card relative flex h-full flex-col p-7 ${
                  highlight ? "price-featured" : ""
                }`}
              >
                {highlight && (
                  <span className="absolute -top-3 right-7 rounded-full bg-primary px-3 py-1 text-[10px] font-extrabold text-primary-foreground shadow-[0_10px_30px_-10px_var(--color-primary)]">
                    الأكثر طلباً
                  </span>
                )}

                <h3 className="font-display text-lg font-extrabold text-foreground">
                  {card.title}
                </h3>
                <p className="mt-2 min-h-[40px] text-xs leading-6 text-muted-foreground">
                  {card.description}
                </p>

                <div className="mt-5 flex items-end gap-1.5">
                  <span className="font-display text-3xl font-extrabold text-foreground">
                    {formatIQD(card.price)}
                  </span>
                </div>

                <ul className="mt-6 space-y-2.5">
                  {PERKS.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground"
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <Check size={11} />
                      </span>
                      {perk}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-7">
                  {card.product ? (
                    <Button
                      type="button"
                      onClick={() => onBuy(card.product as Product)}
                      className={`h-12 w-full text-sm font-extrabold ${
                        highlight ? "btn-glow" : ""
                      }`}
                    >
                      اطلب الآن <ArrowLeft size={16} />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant={highlight ? "default" : "outline"}
                      onClick={onBrowse}
                      className={`h-12 w-full text-sm font-extrabold ${
                        highlight ? "btn-glow" : ""
                      }`}
                    >
                      تصفّح الخدمات <ArrowLeft size={16} />
                    </Button>
                  )}
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
