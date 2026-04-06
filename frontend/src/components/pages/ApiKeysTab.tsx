/**
 * Tab quản lý API Keys
 * Hiển thị danh sách, tạo (hiển thị key đầy đủ trong popup), xóa (xác nhận qua popup)
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { API } from "@/api";
import { useAppStore } from "@/stores/app-store";
import { copyText } from "@/utils/clipboard";
import type { ApiKeyInfo, CreateApiKeyResponse } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

// ---------------------------------------------------------------------------
// Create Modal
// ---------------------------------------------------------------------------

interface CreateModalProps {
  onClose: () => void;
  onCreated: (key: ApiKeyInfo) => void;
}

function CreateModal({ onClose, onCreated }: CreateModalProps) {
  const [name, setName] = useState("");
  const [expiresDays, setExpiresDays] = useState<number | "">(30);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreateApiKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const canCreate = useMemo(() => name.trim().length > 0, [name]);

  const handleCreate = useCallback(async () => {
    if (!canCreate || creating) return;
    setCreating(true);
    try {
      const days: number | undefined = expiresDays === "" ? 0 : expiresDays;
      const res = await API.createApiKey(name.trim(), days);
      setCreated(res);
      onCreated({
        id: res.id,
        name: res.name,
        key_prefix: res.key_prefix,
        created_at: res.created_at,
        expires_at: res.expires_at,
        last_used_at: null,
      });
    } catch (err) {
      useAppStore.getState().pushToast(`Tạo thất bại: ${(err as Error).message}`, "error");
    } finally {
      setCreating(false);
    }
  }, [canCreate, creating, expiresDays, name, onCreated]);

  const handleCopy = useCallback(async () => {
    if (!created?.key) return;
    await copyText(created.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [created?.key]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !created && canCreate) void handleCreate();
      if (e.key === "Escape") onClose();
    },
    [canCreate, created, handleCreate, onClose],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-1.5 text-indigo-400">
              <KeyRound className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-gray-100">
              {created ? "Đã tạo API Key" : "Tạo API Key mới"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300 focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:outline-none"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {created ? (
            /* ——— Giao diện tạo thành công ——— */
            <div className="space-y-4">
              {/* Cảnh báo duy nhất một lần */}
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                <p className="text-xs leading-5 text-amber-200">
                  Vui lòng sao chép và bảo quản kỹ API Key này ngay lập tức. Vì lý do bảo mật, key đầy đủ <strong className="font-semibold"> chỉ được hiển thị một lần duy nhất khi tạo</strong>, bạn sẽ không thể xem lại sau khi đóng cửa sổ này.
                </p>
              </div>

              {/* Hiển thị khóa */}
              <div>
                <div className="mb-1.5 text-xs font-medium text-gray-400">API Key của bạn</div>
                <div className="group relative flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-950 px-3 py-2.5">
                  <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-indigo-300 scrollbar-none">
                    {created.key}
                  </code>
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="flex-shrink-0 rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:outline-none"
                    aria-label="Sao chép key"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Siêu dữ liệu */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2">
                  <div className="text-gray-500">Tên</div>
                  <div className="mt-0.5 truncate font-medium text-gray-200">{created.name}</div>
                </div>
                <div className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2">
                  <div className="text-gray-500">Tiền tố</div>
                  <div className="mt-0.5 font-mono font-medium text-gray-200">{created.key_prefix}…</div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:outline-none"
              >
                Đã sao chép, đóng
              </button>
            </div>
          ) : (
            /* ——— Giao diện biểu mẫu tạo ——— */
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">
                  Tên <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Tích hợp OpenClaw"
                  autoFocus
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-indigo-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">
                  Thời hạn (ngày)
                </label>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={expiresDays}
                  onChange={(e) =>
                    setExpiresDays(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="Để trống nếu không hết hạn"
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-indigo-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                />
                <p className="mt-1 text-xs text-gray-600">Mặc định 30 ngày; để trống nếu không bao giờ hết hạn</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:outline-none"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreate()}
                  disabled={!canCreate || creating}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:outline-none"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {creating ? "Đang tạo..." : "Tạo"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirm Modal
// ---------------------------------------------------------------------------

interface DeleteModalProps {
  keyInfo: ApiKeyInfo;
  onClose: () => void;
  onDeleted: (keyId: number) => void;
}

function DeleteModal({ keyInfo, onClose, onDeleted }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await API.deleteApiKey(keyInfo.id);
      onDeleted(keyInfo.id);
    } catch (err) {
      useAppStore.getState().pushToast(`Xóa thất bại: ${(err as Error).message}`, "error");
    } finally {
      setDeleting(false);
    }
  }, [deleting, keyInfo.id, onDeleted]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl shadow-black/50">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-rose-500/10 p-2 text-rose-400">
              <Trash2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-100">Thu hồi API Key</h2>
              <p className="mt-1.5 text-xs leading-5 text-gray-400">
                Sẽ thu hồi vĩnh viễn{" "}
                <span className="font-mono text-gray-200">{keyInfo.key_prefix}…</span> ({keyInfo.name}).
                Các dịch vụ sử dụng Key này sẽ lập tức mất quyền truy cập, và hành động này không thể hoàn tác.
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:outline-none"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500/60 focus-visible:outline-none"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {deleting ? "Đang thu hồi..." : "Xác nhận thu hồi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ApiKeyRow — single key row
// ---------------------------------------------------------------------------

interface ApiKeyRowProps {
  keyInfo: ApiKeyInfo;
  onDelete: (keyInfo: ApiKeyInfo) => void;
}

function ApiKeyRow({ keyInfo, onDelete }: ApiKeyRowProps) {
  const expired = useMemo(() => isExpired(keyInfo.expires_at), [keyInfo.expires_at]);

  const handleDelete = useCallback(() => onDelete(keyInfo), [keyInfo, onDelete]);

  return (
    <tr className="group border-t border-gray-800/70 transition-colors hover:bg-gray-800/30">
      {/* Tên */}
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-gray-100">{keyInfo.name}</div>
            <div className="mt-0.5 font-mono text-xs text-gray-500">{keyInfo.key_prefix}…</div>
          </div>
        </div>
      </td>

      {/* Thời gian tạo */}
      <td className="hidden px-3 py-3 sm:table-cell">
        <span className="text-xs text-gray-400">{formatDate(keyInfo.created_at)}</span>
      </td>

      {/* Thời gian hết hạn */}
      <td className="hidden px-3 py-3 md:table-cell">
        {keyInfo.expires_at ? (
          <span
            className={`text-xs ${expired ? "font-medium text-rose-400" : "text-gray-400"}`}
          >
            {expired ? "Đã hết hạn · " : ""}
            {formatDate(keyInfo.expires_at)}
          </span>
        ) : (
          <span className="text-xs text-gray-600">Không bao giờ hết hạn</span>
        )}
      </td>

      {/* Sử dụng gần đây */}
      <td className="hidden px-3 py-3 lg:table-cell">
        <span className="text-xs text-gray-400">{formatDate(keyInfo.last_used_at)}</span>
      </td>

      {/* Thao tác */}
      <td className="py-3 pl-3 pr-4 text-right">
        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex items-center gap-1 rounded-lg border border-transparent px-2 py-1 text-xs text-gray-500 transition-colors hover:border-rose-500/30 hover:bg-rose-500/8 hover:text-rose-400 focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:outline-none"
          aria-label={`Thu hồi ${keyInfo.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Thu hồi
        </button>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// ApiKeysTab — main export
// ---------------------------------------------------------------------------

export function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyInfo | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.listApiKeys();
      setKeys(res);
    } catch (err) {
      useAppStore.getState().pushToast(`Tải API Keys thất bại: ${(err as Error).message}`, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreated = useCallback((newKey: ApiKeyInfo) => {
    setKeys((prev) => [newKey, ...prev]);
  }, []);

  const handleDeleted = useCallback((keyId: number) => {
    setKeys((prev) => prev.filter((k) => k.id !== keyId));
    setDeleteTarget(null);
    useAppStore.getState().pushToast("API Key đã bị thu hồi", "success");
  }, []);

  const handleOpenCreate = useCallback(() => setShowCreate(true), []);
  const handleCloseCreate = useCallback(() => setShowCreate(false), []);
  const handleCloseDelete = useCallback(() => setDeleteTarget(null), []);

  return (
    <>
      {/* Thanh thao tác */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-100">API Keys</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Dùng cho các dịch vụ bên ngoài như OpenClaw truy cập ArcReel API qua Bearer Token
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:outline-none"
        >
          <Plus className="h-4 w-4" />
          Tạo Key mới
        </button>
      </div>

      {/* Bảng */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            <span className="text-sm">Đang tải...</span>
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-gray-600">
            <KeyRound className="h-8 w-8 opacity-40" />
            <p className="text-sm">Chưa có API Key nào</p>
            <p className="text-xs">Nhấp vào "Tạo Key mới" để tạo cái đầu tiên</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="py-2.5 pl-4 pr-3 text-xs font-medium text-gray-500">Tên / Tiền tố</th>
                <th className="hidden px-3 py-2.5 text-xs font-medium text-gray-500 sm:table-cell">
                  Thời gian tạo
                </th>
                <th className="hidden px-3 py-2.5 text-xs font-medium text-gray-500 md:table-cell">
                  Thời gian hết hạn
                </th>
                <th className="hidden px-3 py-2.5 text-xs font-medium text-gray-500 lg:table-cell">
                  Sử dụng gần đây
                </th>
                <th className="py-2.5 pl-3 pr-4 text-right text-xs font-medium text-gray-500">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <ApiKeyRow key={k.id} keyInfo={k} onDelete={setDeleteTarget} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Chú thích */}
      <p className="mt-3 text-xs text-gray-600">
        Gửi trong request header:
        <code className="mx-1 rounded bg-gray-800 px-1.5 py-0.5 font-mono text-gray-400">
          Authorization: Bearer arc-xxxxxxxx…
        </code>
      </p>

      {/* Cửa sổ bật lên (Pop-up) */}
      {showCreate && (
        <CreateModal onClose={handleCloseCreate} onCreated={handleCreated} />
      )}
      {deleteTarget !== null && (
        <DeleteModal
          keyInfo={deleteTarget}
          onClose={handleCloseDelete}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}
