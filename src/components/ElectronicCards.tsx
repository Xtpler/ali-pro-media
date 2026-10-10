import { useEffect, useMemo, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { formatIQD } from "@/lib/format";

type CardCategory = { id: string; name_ar: string; sort_order?: number | null };
type ElectronicCard = {
  id: string;
  category_id: string | null;
  name_ar: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  is_active?: boolean | null;
};

export function ElectronicCards({
  search = "",
  onBuy,
}: {
  search?: string;
  onBuy?: (card: ElectronicCard) => void;
}) {
  const [categories, setCategories] = useState<CardCategory[]>([]);
  const [cards, setCards] = useState<ElectronicCard[]>([]);
  const [active, setActive] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [catRes, cardRes] = await Promise.all([
          supabase.from("card_categories").select("*").order("sort_order", { ascending: true }),
          supabase.from("electronic_cards").select("*").order("created_at", { ascending: false }),
        ]);
        if (cancelled) return;
        setCategories(Array.isArray(catRes?.data) ? catRes.data : []);
        const list = Array.isArray(cardRes?.data) ? cardRes.data : [];
        setCards(list.filter((c: ElectronicCard) => c.is_active !== false));
      } catch {
        if (!cancelled) {
          setCategories([]);
          setCards([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cards.filter(
      (card) =>
        (active === "all" || card.category_id === active) &&
        `${card.name_ar} ${card.description ?? ""}`.toLowerCase().includes(term),
    );
  }, [cards, active, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="animate-spin" size={18} /> جاري تحميل الكارتات...
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center">
        <CreditCard className="mx-auto text-muted-foreground" size={30} />
        <p className="mt-4 text-sm font-bold text-foreground">لا توجد كارتات متاحة حالياً</p>
        <p className="mt-2 text-xs text-muted-foreground">
          سيتم إضافة الكارتات الإلكترونية قريباً، تابعنا.
        </p>
      </div>
    );
  }

  return (
    <section>
      {categories.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          <Button
            type="button"
            variant={active === "all" ? "default" : "outline"}
            onClick={() => setActive("all")}
            className="h-auto shrink-0 rounded-lg px-4 py-2 text-xs font-bold"
          >
            الكل
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              type="button"
              variant={active === category.id ? "default" : "outline"}
              onClick={() => setActive(category.id)}
              className="h-auto shrink-0 rounded-lg px-4 py-2 text-xs font-bold"
            >
              {category.name_ar}
            </Button>
          ))}
        </div>
      )}

      {visible.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((card) => (
            <article
              key={card.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              {card.image_url ? (
                <img src={card.image_url} alt={card.name_ar} className="h-36 w-full object-cover" />
              ) : (
                <div className="flex h-36 w-full items-center justify-center bg-primary/10 text-primary">
                  <CreditCard size={32} />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-sm font-bold text-foreground">{card.name_ar}</h3>
                {card.description && (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {card.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-primary">
                    {formatIQD(Number(card.price ?? 0))}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    className="text-xs font-bold"
                    onClick={() => onBuy?.(card)}
                  >
                    شراء
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          لا توجد كارتات مطابقة لبحثك
        </div>
      )}
    </section>
  );
}
