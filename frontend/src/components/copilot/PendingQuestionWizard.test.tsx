import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PendingQuestion } from "@/types";
import { PendingQuestionWizard } from "./PendingQuestionWizard";

function makePendingQuestion(overrides: Partial<PendingQuestion> = {}): PendingQuestion {
  return {
    question_id: "q-1",
    questions: [
      {
        header: "Đầu ra",
        question: "Định dạng đầu ra là gì?",
        multiSelect: false,
        options: [
          { label: "Tóm tắt", description: "Đầu ra ngắn gọn" },
          { label: "Chi tiết", description: "Mô tả đầy đủ" },
        ],
      },
      {
        header: "Chương",
        question: "Bao gồm những phần nào?",
        multiSelect: true,
        options: [
          { label: "Lời dẫn", description: "Ngữ cảnh mở đầu" },
          { label: "Kết luận", description: "Tổng kết kết thúc" },
        ],
      },
    ],
    ...overrides,
  };
}

describe("PendingQuestionWizard", () => {
  it("renders only the current question and blocks next until answered", () => {
    render(
      <PendingQuestionWizard
        pendingQuestion={makePendingQuestion()}
        answeringQuestion={false}
        error={null}
        onSubmitAnswers={vi.fn()}
      />,
    );

    expect(screen.getByText("Câu hỏi 1/2")).toBeInTheDocument();
    expect(screen.getByText("Định dạng đầu ra là gì?")).toBeInTheDocument();
    expect(screen.queryByText("Bao gồm những phần nào?")).not.toBeInTheDocument();

    const nextButton = screen.getByRole("button", { name: "Câu tiếp theo" });
    expect(nextButton).toBeDisabled();

    fireEvent.click(screen.getByLabelText("Tóm tắt"));
    expect(nextButton).toBeEnabled();

    fireEvent.click(nextButton);
    expect(screen.getByText("Câu hỏi 2/2")).toBeInTheDocument();
    expect(screen.getByText("Bao gồm những phần nào?")).toBeInTheDocument();
    expect(screen.queryByText("Định dạng đầu ra là gì?")).not.toBeInTheDocument();
  });

  it("keeps answers when navigating backward", () => {
    render(
      <PendingQuestionWizard
        pendingQuestion={makePendingQuestion()}
        answeringQuestion={false}
        error={null}
        onSubmitAnswers={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Chi tiết"));
    fireEvent.click(screen.getByRole("button", { name: "Câu tiếp theo" }));
    fireEvent.click(screen.getByRole("button", { name: "Quay lại" }));

    expect(screen.getByText("Định dạng đầu ra là gì?")).toBeInTheDocument();
    expect(screen.getByLabelText("Chi tiết")).toBeChecked();
  });

  it("validates custom other answers and joins multi-select payloads", () => {
    const onSubmitAnswers = vi.fn();

    render(
      <PendingQuestionWizard
        pendingQuestion={makePendingQuestion({
          questions: [
            {
              header: "Chương",
              question: "Bao gồm những phần nào?",
              multiSelect: true,
              options: [
                { label: "Lời dẫn", description: "Ngữ cảnh mở đầu" },
                { label: "Kết luận", description: "Tổng kết kết thúc" },
              ],
            },
          ],
        })}
        answeringQuestion={false}
        error={null}
        onSubmitAnswers={onSubmitAnswers}
      />,
    );

    fireEvent.click(screen.getByLabelText("Lời dẫn"));
    fireEvent.click(screen.getByLabelText("Khác"));

    const submitButton = screen.getByRole("button", { name: "Hoàn tất và gửi" });
    expect(submitButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Vui lòng nhập nội dung khác"), {
      target: { value: "Phụ lục" },
    });
    expect(submitButton).toBeEnabled();

    fireEvent.click(submitButton);

    expect(onSubmitAnswers).toHaveBeenCalledWith("q-1", {
      "Bao gồm những phần nào?": "Lời dẫn, Phụ lục",
    });
  });

  it("resets local wizard state when question_id changes", () => {
    const { rerender } = render(
      <PendingQuestionWizard
        pendingQuestion={makePendingQuestion()}
        answeringQuestion={false}
        error={null}
        onSubmitAnswers={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Tóm tắt"));
    fireEvent.click(screen.getByRole("button", { name: "Câu tiếp theo" }));
    expect(screen.getByText("Bao gồm những phần nào?")).toBeInTheDocument();

    rerender(
      <PendingQuestionWizard
        pendingQuestion={makePendingQuestion({ question_id: "q-2" })}
        answeringQuestion={false}
        error={null}
        onSubmitAnswers={vi.fn()}
      />,
    );

    expect(screen.getByText("Định dạng đầu ra là gì?")).toBeInTheDocument();
    expect(screen.queryByText("Bao gồm những phần nào?")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Tóm tắt")).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Câu tiếp theo" })).toBeDisabled();
  });

  it("keeps the action area visible by making question content scrollable", () => {
    render(
      <PendingQuestionWizard
        pendingQuestion={makePendingQuestion({
          questions: [
            {
              header: "Câu hỏi siêu dài",
              question: "Đây là một câu hỏi rất dài.".repeat(120),
              multiSelect: false,
              options: [
                { label: "Tiếp tục", description: "Tiếp tục xử lý" },
              ],
            },
          ],
        })}
        answeringQuestion={false}
        error={null}
        onSubmitAnswers={vi.fn()}
      />,
    );

    expect(screen.getByTestId("pending-question-scroll-area")).toHaveClass("overflow-y-auto");
    expect(screen.getByRole("button", { name: "Hoàn tất và gửi" })).toBeInTheDocument();
  });
});
