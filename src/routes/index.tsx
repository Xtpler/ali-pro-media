import { createFileRoute } from "@tanstack/react-router";
import App from "@/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ali Pro Media | سوقك الرقمي الموثوق" },
      {
        name: "description",
        content:
          "Ali Pro Media — سوقك الرقمي الموثوق لشراء المنتجات والخدمات الرقمية بأمان وسهولة.",
      },
      { property: "og:title", content: "Ali Pro Media | سوقك الرقمي الموثوق" },
      {
        property: "og:description",
        content:
          "Ali Pro Media — سوقك الرقمي الموثوق لشراء المنتجات والخدمات الرقمية بأمان وسهولة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div dir="rtl" lang="ar">
      <App />
    </div>
  );
}
