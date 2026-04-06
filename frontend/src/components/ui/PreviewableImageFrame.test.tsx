import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PreviewableImageFrame } from "./PreviewableImageFrame";

describe("PreviewableImageFrame", () => {
  it("opens a fullscreen preview and closes from both the close button and backdrop", () => {
    render(
      <PreviewableImageFrame src="/demo.png" alt="Hình ví dụ">
        <img src="/demo.png" alt="Hình ví dụ" />
      </PreviewableImageFrame>,
    );

    const trigger = screen.getByRole("button", { name: "Xem toàn màn hình Hình ví dụ" });

    fireEvent.click(trigger);
    expect(
      screen.getByRole("dialog", { name: "Xem toàn màn hình Hình ví dụ" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Đóng xem toàn màn hình" }));
    expect(
      screen.queryByRole("dialog", { name: "Xem toàn màn hình Hình ví dụ" }),
    ).not.toBeInTheDocument();

    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Xem toàn màn hình Hình ví dụ" });
    const backdrop = dialog.parentElement?.parentElement;
    expect(backdrop).not.toBeNull();

    fireEvent.click(backdrop as HTMLElement);

    expect(
      screen.queryByRole("dialog", { name: "Xem toàn màn hình Hình ví dụ" }),
    ).not.toBeInTheDocument();
  }, 10_000);
});
