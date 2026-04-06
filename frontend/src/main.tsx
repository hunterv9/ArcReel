// main.tsx — New entry point using wouter + StudioLayout
// Replaces main.js as the application entry point.
// The old main.js is kept as a reference during the migration.

import { createRoot } from "react-dom/client";
import { AppRoutes } from "./router";
import { useAuthStore } from "@/stores/auth-store";

import "./index.css";
import "./css/styles.css";
import "./css/app.css";
import "./css/studio.css";

// Khôi phục trạng thái đăng nhập từ localStorage
useAuthStore.getState().initialize();

// ---------------------------------------------------------------------------
// Tự động ẩn thanh cuộn toàn cầu: Hiện khi cuộn, ẩn sau 1.2s khi dừng
// ---------------------------------------------------------------------------
{
  const timers = new WeakMap<Element, ReturnType<typeof setTimeout>>();

  document.addEventListener(
    "scroll",
    (e) => {
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;

      // Hiển thị thanh cuộn
      el.dataset.scrolling = "";

      // Xóa bộ hẹn giờ ẩn trước đó
      const prev = timers.get(el);
      if (prev) clearTimeout(prev);

      // Ẩn sau 1.2s nếu không có thao tác cuộn
      timers.set(
        el,
        setTimeout(() => {
          delete el.dataset.scrolling;
          timers.delete(el);
        }, 1200),
      );
    },
    true, // capture phase — bắt tất cả các sự kiện scroll của phần tử con
  );
}

const root = document.getElementById("app-root");
if (root) {
  createRoot(root).render(<AppRoutes />);
}
