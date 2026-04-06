import { useEffect, useRef } from "react";
import { API } from "@/api";
import { useTasksStore } from "@/stores/tasks-store";

const POLL_INTERVAL_MS = 3000;

/**
 * Hook để thăm dò trạng thái hàng đợi tác vụ.
 * Kéo dữ liệu ngay khi mount, sau đó thăm dò mỗi 3 giây, dọn dẹp khi unmount.
 *
 * Thay thế kết nối dài EventSource SSE trước đây để giải phóng các slot kết nối của trình duyệt
 * (Giới hạn 6 kết nối cùng tên miền của Chrome HTTP/1.1).
 */
export function useTasksSSE(projectName?: string | null): void {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setTasks, setStats, setConnected } = useTasksStore();

  useEffect(() => {
    let disposed = false;

    async function poll() {
      try {
        const [tasksRes, statsRes] = await Promise.all([
          API.listTasks({
            projectName: projectName ?? undefined,
            pageSize: 200,
          }),
          API.getTaskStats(projectName ?? null),
        ]);
        if (disposed) return;
        setTasks(tasksRes.items);
        // REST returns { stats: {...} }
        const stats = (statsRes as any).stats ?? statsRes;
        setStats(stats);
        setConnected(true);
      } catch {
        if (disposed) return;
        setConnected(false);
      }
    }

    // Initial fetch
    poll();

    // Periodic polling
    timerRef.current = setInterval(() => {
      if (!disposed) poll();
    }, POLL_INTERVAL_MS);

    return () => {
      disposed = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setConnected(false);
    };
  }, [projectName, setTasks, setStats, setConnected]);
}
