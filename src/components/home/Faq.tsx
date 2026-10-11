import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/home/Reveal";
import { SectionHeading } from "@/components/home/SectionHeading";

const FAQ = [
  {
    q: "كيف أشحن رصيد محفظتي؟",
    a: "افتح المحفظة، اختر طريقة الدفع (سوبر كي، زين كاش، FIB أو آسيا باي)، حوّل المبلغ ثم ارفع وصل التحويل. تتم الموافقة عادة خلال دقائق.",
  },
  {
    q: "ما الفرق بين خدمات السوشيال ميديا وسوق الحسابات؟",
    a: "خدمات السوشيال ميديا تنمّي حساباتك الحالية بالمتابعين والمشاهدات، بينما سوق الحسابات يتيح لك شراء حسابات موثّقة جاهزة بضمان الوسيط.",
  },
  {
    q: "كم تستغرق مدة تنفيذ الطلب؟",
    a: "معظم الطلبات تبدأ فوراً وتكتمل خلال دقائق إلى ساعات حسب نوع الخدمة والكمية. يمكنك متابعة الحالة لحظياً من صفحة طلباتي.",
  },
  {
    q: "هل يمكنني استرجاع رصيدي؟",
    a: "نعم. إذا لم يبدأ تنفيذ الطلب يمكنك إلغاؤه واسترداد المبلغ كاملاً إلى محفظتك. الطلبات المكتملة غير قابلة للاسترداد.",
  },
  {
    q: "كيف تعمل خدمة فتح الباند؟",
    a: "أرسل تفاصيل الحظر مع لقطة شاشة، وسيراجع الفريق حالتك ويتواصل معك. الخدمة سرّية تماماً وتُتابع عبر تذاكر الدعم.",
  },
  {
    q: "هل بياناتي وحسابي آمنة؟",
    a: "نعم. كل العمليات محميّة بتشفير كامل، وبيانات الدخول للحسابات المشتراة لا تُعرض إلا لك بعد إتمام الشراء.",
  },
];

export function Faq() {
  return (
    <section className="home-section home-container lazy-section" aria-label="الأسئلة الشائعة">
      <SectionHeading
        eyebrow="الأسئلة الشائعة"
        title="كل ما تريد معرفته"
        subtitle="لم تجد إجابتك؟ فريق الدعم جاهز لمساعدتك على مدار الساعة."
        icon={<HelpCircle size={13} />}
      />

      <Reveal className="mx-auto mt-12 max-w-3xl">
        <div className="glass-card glass-card--flat px-5 py-2 sm:px-7">
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item) => (
              <AccordionItem key={item.q} value={item.q} className="border-border last:border-b-0">
                <AccordionTrigger className="py-5 text-right font-display text-sm font-extrabold text-foreground hover:no-underline sm:text-base">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-xs leading-7 text-muted-foreground sm:text-sm">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Reveal>
    </section>
  );
}
