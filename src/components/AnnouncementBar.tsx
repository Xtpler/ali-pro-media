import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { getAnnouncement, type Announcement } from "@/lib/site";

export function AnnouncementBar() {
  const [data, setData] = useState<Announcement>({ text: "", active: false });
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    let active = true;
    const sync = () => {
      getAnnouncement().then((next) => {
        if (active) setData(next);
      });
    };
    sync();
    window.addEventListener("apm-site", sync);
    return () => {
      active = false;
      window.removeEventListener("apm-site", sync);
    };
  }, []);

  if (!data.active || !data.text.trim() || closed) return null;

  return (
    <div
      className="relative z-50 overflow-hidden border-b border-emerald-400/20 bg-emerald-400/10"
      dir="rtl"
    >
      <div className="flex items-center gap-3 px-4 py-2">
        <Megaphone size={15} className="shrink-0 text-emerald-400" />
        <div className="flex-1 overflow-hidden">
          <p className="apm-ticker whitespace-nowrap text-xs font-medium text-emerald-200">
            {data.text}
          </p>
        </div>
        <button
          onClick={() => setClosed(true)}
          aria-label="إغلاق الشريط"
          className="shrink-0 text-emerald-300/70 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
