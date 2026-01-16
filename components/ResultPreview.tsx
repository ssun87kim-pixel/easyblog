"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Download, FileText, ImageIcon } from "lucide-react";
import { GeneratedPost } from "@/lib/ai";

type ResultPreviewProps = {
  productName: string;
  generatedPost: GeneratedPost | null;
  activeTab: "content" | "image";
  onTabChange: (tab: "content" | "image") => void;
  onCopy: (success: boolean) => void;
};

export default function ResultPreview({
  productName,
  generatedPost,
  activeTab,
  onTabChange,
  onCopy,
}: ResultPreviewProps) {
  const hasResult = Boolean(generatedPost);

  const currentText = hasResult
    ? activeTab === "content"
      ? generatedPost?.content ?? ""
      : generatedPost?.imageGuide ?? ""
    : "";

  const handleCopy = useCallback(async () => {
    if (!currentText) {
      onCopy(false);
      return;
    }

    try {
      await navigator.clipboard.writeText(currentText);
      onCopy(true);
    } catch {
      onCopy(false);
    }
  }, [currentText, onCopy]);

  const handleDownload = () => {
    if (!currentText) return;

    const extension = activeTab === "content" ? "txt" : "txt";
    const fileName =
      (productName || "easyblog-post").replace(/[^\w가-힣-]+/g, "_") +
      (activeTab === "content" ? "_blog." : "_image-guide.") +
      extension;

    const blob = new Blob([currentText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-900/80 ring-1 ring-white/10">
            <FileText className="h-4 w-4 text-indigo-200" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-100">
              블로그 미리보기
            </span>
            <span className="text-[10px] text-slate-400">
              모바일 뷰 기준으로 내용을 확인해 보세요.
            </span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-2 py-1 text-[10px] text-slate-300 ring-1 ring-white/10">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Gemini AI · 최적화 생성</span>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-slate-900/80 p-1 text-xs text-slate-200 ring-1 ring-white/10">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => onTabChange("content")}
            className={`inline-flex items-center gap-1 rounded-2xl px-2.5 py-1 transition ${activeTab === "content"
                ? "bg-slate-50 text-slate-900"
                : "text-slate-300 hover:bg-slate-800/80"
              }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>블로그 내용</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange("image")}
            className={`inline-flex items-center gap-1 rounded-2xl px-2.5 py-1 transition ${activeTab === "image"
                ? "bg-slate-50 text-slate-900"
                : "text-slate-300 hover:bg-slate-800/80"
              }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>이미지 가이드</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!hasResult}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100/5 px-2.5 py-1 text-[11px] text-slate-100 ring-1 ring-slate-200/20 transition hover:bg-slate-100/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>복사</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!hasResult}
            className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-900 shadow-sm shadow-slate-900/40 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" />
            <span>다운로드</span>
          </button>
        </div>
      </div>

      <div className="relative mt-1 flex flex-1 justify-center">
        <motion.div
          className="relative w-full max-w-xs rounded-[32px] border border-slate-600/60 bg-slate-950/95 p-4 text-[11px] leading-relaxed text-slate-100 shadow-[0_18px_45px_rgba(15,23,42,0.95)]"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          <div className="mb-3 flex justify-between text-[10px] text-slate-400">
            <span>모바일 블로그 미리보기</span>
            <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[9px]">
              {productName || "상품명을 입력해 주세요"}
            </span>
          </div>
          <div className="h-[360px] overflow-y-auto rounded-2xl bg-slate-900/80 px-3 py-2.5">
            {hasResult ? (
              <pre className="whitespace-pre-wrap text-[11px] text-slate-100">
                {currentText}
              </pre>
            ) : (
              <div className="flex h-full flex-col items-start justify-center gap-2 text-[11px] text-slate-400">
                <p>왼쪽에서 상품 정보를 입력하고 글을 생성해 보세요.</p>
                <p className="text-[10px] text-slate-500">
                  HSO 구조(Hook, Story, Offer)에 맞춰 자연스러운 블로그 글과
                  이미지 가이드를 함께 생성합니다.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

