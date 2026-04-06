import { createPortal } from "react-dom";
import { useAnchoredPopover } from "@/hooks/useAnchoredPopover";
import { UI_LAYERS } from "@/utils/ui-layers";
import type { RefObject, ReactNode, CSSProperties } from "react";

// ---------------------------------------------------------------------------
// Popover — Thành phần bảng điều khiển bật lên thống nhất
// ---------------------------------------------------------------------------
// Tất cả các bảng điều khiển bật lên phải sử dụng component này, thay vì kết hợp thủ công createPortal + useAnchoredPopover.
// Nó thoát khỏi ngữ cảnh xếp chồng của cha thông qua portal (ví dụ: backdrop-blur của header),
// đảm bảo nền không trong suốt và quản lý z-index thống nhất.

/** Màu nền mặc định của bảng (gray-900 = rgb(17 24 39)) */
export const POPOVER_BG = "rgb(17 24 39)";

type PopoverAlign = "start" | "center" | "end";
type PopoverLayer = keyof typeof UI_LAYERS;

interface PopoverProps {
  open: boolean;
  onClose?: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  /** Tailwind width class, e.g. "w-72", "w-96" */
  width?: string;
  /** ClassName bổ sung (thêm vào phần tử gốc của bảng) */
  className?: string;
  /** Style nội dòng bổ sung */
  style?: CSSProperties;
  /** Khoảng cách lệch điểm neo (px), mặc định là 8 */
  sideOffset?: number;
  /** Cách căn lề, mặc định là "end" */
  align?: PopoverAlign;
  /** Cấp độ z-index, mặc định là "workspacePopover" */
  layer?: PopoverLayer;
  /** Màu nền tùy chỉnh, mặc định là POPOVER_BG */
  backgroundColor?: string;
}

export function Popover({
  open,
  onClose,
  anchorRef,
  children,
  width = "w-72",
  className = "",
  style,
  sideOffset = 8,
  align,
  layer = "workspacePopover",
  backgroundColor = POPOVER_BG,
}: PopoverProps) {
  const { panelRef, positionStyle } = useAnchoredPopover({
    open,
    anchorRef,
    onClose,
    sideOffset,
    align,
  });

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      className={`fixed isolate ${width} ${UI_LAYERS[layer]} ${className}`}
      style={{
        ...positionStyle,
        backgroundColor,
        ...style,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
