import { describe, expect, it } from "vitest";
import type { ProjectChange } from "@/types";
import {
  formatGroupedDeferredText,
  formatGroupedNotificationText,
  groupChangesByType,
} from "./project-changes";

function makeChange(overrides: Partial<ProjectChange> = {}): ProjectChange {
  return {
    entity_type: "character",
    action: "created",
    entity_id: "NguyenVanA",
    label: 'Nhân vật "Nguyễn Văn A"',
    important: true,
    focus: null,
    ...overrides,
  };
}

describe("project-changes utils", () => {
  it("groups changes by entity_type and action", () => {
    const groups = groupChangesByType([
      makeChange({ entity_id: "NguyenVanA", label: 'Nhân vật "Nguyễn Văn A"' }),
      makeChange({ entity_id: "TranThiB", label: 'Nhân vật "Trần Thị B"' }),
      makeChange({
        entity_type: "clue",
        entity_id: "NgocBoi",
        label: 'Manh mối "Ngọc Bội"',
      }),
      makeChange({
        entity_type: "character",
        action: "updated",
        entity_id: "LeVanC",
        label: 'Nhân vật "Lê Văn C"',
      }),
    ]);

    expect(groups).toHaveLength(3);
    expect(groups[0]).toMatchObject({
      key: "character:created",
      changes: [expect.objectContaining({ entity_id: "NguyenVanA" }), expect.objectContaining({ entity_id: "TranThiB" })],
    });
    expect(groups[1].key).toBe("clue:created");
    expect(groups[2].key).toBe("character:updated");
  });

  it("formats grouped notification text and truncates long lists", () => {
    const [singleGroup] = groupChangesByType([
      makeChange({ entity_id: "NguyenVanA", label: 'Nhân vật "Nguyễn Văn A"' }),
    ]);
    expect(formatGroupedNotificationText(singleGroup)).toBe('Nhân vật "Nguyễn Văn A" đã được tạo');

    const [grouped] = groupChangesByType([
      makeChange({ entity_id: "NguyenVanA", label: 'Nhân vật "Nguyễn Văn A"' }),
      makeChange({ entity_id: "TranThiB", label: 'Nhân vật "Trần Thị B"' }),
      makeChange({ entity_id: "LeVanC", label: 'Nhân vật "Lê Văn C"' }),
      makeChange({ entity_id: "PhamVanD", label: 'Nhân vật "Phạm Văn D"' }),
      makeChange({ entity_id: "HoangVanE", label: 'Nhân vật "Hoàng Văn E"' }),
      makeChange({ entity_id: "VuVanF", label: 'Nhân vật "Vũ Văn F"' }),
    ]);

    expect(formatGroupedNotificationText(grouped)).toBe(
      "Đã thêm mới 6 Nhân vật: NguyenVanA, TranThiB, LeVanC, PhamVanD, HoangVanE...v.v.",
    );
    expect(formatGroupedDeferredText(grouped)).toBe(
      "AI vừa thêm mới 6 Nhân vật: NguyenVanA, TranThiB, LeVanC, PhamVanD, HoangVanE...v.v., nhấn để xem",
    );
  });
});
