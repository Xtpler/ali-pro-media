import { createFileRoute } from "@tanstack/react-router";
import App from "@/App";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الأدمن | Ali Pro Media" },
      { name: "description", content: "لوحة إدارة Ali Pro Media المخصصة لحسابات الإدارة فقط." },
      { property: "og:title", content: "لوحة الأدمن | Ali Pro Media" },
      {
        property: "og:description",
        content: "لوحة إدارة Ali Pro Media المخصصة لحسابات الإدارة فقط.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminRoute,
});

function AdminRoute() {
  return (
    <div dir="rtl" lang="ar">
      <App initialView="admin" />
    </div>
  );
}
