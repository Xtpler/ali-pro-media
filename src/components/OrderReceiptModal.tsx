import { Printer, X } from "lucide-react";
import type { Order } from "@/types";
import { formatDate, formatIQD } from "@/lib/format";
import { APP_NAME } from "@/lib/constants";

/** إيصال الطلب المكتمل — للعرض وللطباعة/الحفظ PDF عبر window.print() */
export function OrderReceiptModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const print = () => {
    try {
      window.print();
    } catch {
      /* non-fatal */
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl" dir="rtl">
        <div id="print-receipt" className="bg-white p-6 text-slate-900">
          <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-emerald-600">{APP_NAME}</h3>
              <p className="mt-1 text-[11px] text-slate-500">إيصال طلب — تم التسليم بنجاح</p>
            </div>
            <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              مكتمل ✓
            </span>
          </div>

          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">رقم الطلب</span>
              <span className="font-mono font-bold" dir="ltr">
                {order.code || order.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">تاريخ الطلب</span>
              <span className="font-bold">{formatDate(order.created_at)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">اسم العميل</span>
              <span className="font-bold">{order.buyer_name || "—"}</span>
            </div>
            {order.buyer_phone && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">رقم الهاتف</span>
                <span className="font-bold" dir="ltr">
                  {order.buyer_phone}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-500">
                  <th className="px-3 py-2 text-start font-bold">البيان</th>
                  <th className="px-3 py-2 text-center font-bold">الكمية</th>
                  <th className="px-3 py-2 text-center font-bold">السعر</th>
                  <th className="px-3 py-2 text-end font-bold">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-200">
                  <td className="px-3 py-2.5 font-bold">{order.product_name}</td>
                  <td className="px-3 py-2.5 text-center" dir="ltr">
                    × {order.quantity}
                  </td>
                  <td className="px-3 py-2.5 text-center">{formatIQD(order.unit_price_iqd)}</td>
                  <td className="px-3 py-2.5 text-end font-bold">
                    {formatIQD(order.total_price ?? order.price_iqd)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {(order.code || order.credentials) && (
            <div className="mt-4 space-y-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-3">
              <p className="text-[11px] font-bold text-emerald-700">بيانات التسليم</p>
              {order.code && (
                <p className="text-[11px] text-slate-600">
                  الكود:{" "}
                  <b dir="ltr" className="font-mono">
                    {order.code}
                  </b>
                </p>
              )}
              {order.credentials && (
                <p className="break-all text-[11px] leading-5 text-slate-600">
                  بيانات الحساب: {order.credentials}
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-300 pt-4">
            <span className="text-xs font-bold text-slate-500">إجمالي المدفوع</span>
            <span className="text-lg font-extrabold text-emerald-600">
              {formatIQD(order.total_price ?? order.price_iqd)}
            </span>
          </div>

          <p className="mt-5 text-center text-[11px] leading-6 text-slate-400">
            شكراً لثقتك بـ {APP_NAME} 💚
            <br />
            هذا الإيصال يُظهر تفاصيل طلبك المكتمل. في حال وجود أي استفسار تواصل مع فريق الدعم.
          </p>
          <p className="mt-3 text-center text-[9px] text-slate-400">
            {new Date().toLocaleString("ar-IQ")}
          </p>
        </div>

        <div className="no-print flex gap-2 border-t border-slate-200 bg-slate-50 p-4">
          <button
            onClick={print}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-bold text-white transition hover:bg-emerald-600"
          >
            <Printer size={15} /> طباعة / حفظ PDF
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
          >
            <X size={15} /> إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
