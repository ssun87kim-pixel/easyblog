"use client";

import { useCallback, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Download, FileText, ImageIcon, Loader2, Sparkles, AlertCircle, PencilLine, FileCode, Hash } from "lucide-react";
import { GeneratedPost } from "@/lib/ai";

type ResultPreviewProps = {
  productName: string;
  generatedPost: GeneratedPost | null;
  onCopy: (success: boolean) => void;
};

export default function ResultPreview({
  productName,
  generatedPost,
  onCopy,
}: ResultPreviewProps) {
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const hasResult = Boolean(generatedPost);

  useEffect(() => {
    if (generatedPost?.titles && generatedPost.titles.length > 0) {
      setSelectedTitle(generatedPost.titles[0]);
    }
  }, [generatedPost]);

  const handleCopy = useCallback(async () => {
    if (!generatedPost?.content) {
      onCopy(false);
      return;
    }

    const hashtagsStr = generatedPost.hashtags?.join(" ") || "";
    const fullContent = `[제목]\n${selectedTitle}\n\n${generatedPost.content}\n\n[해시태그]\n${hashtagsStr}`;

    try {
      await navigator.clipboard.writeText(fullContent);
      onCopy(true);
    } catch {
      onCopy(false);
    }
  }, [generatedPost, selectedTitle, onCopy]);

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    if (!generatedPost?.content) return;
    const hashtagsStr = generatedPost.hashtags?.join(" ") || "";
    const fullContent = `[제목]\n${selectedTitle}\n\n${generatedPost.content}\n\n[해시태그]\n${hashtagsStr}`;
    const fileName = (productName || "easyblog-post").replace(/[^\w가-힣-]+/g, "_") + "_blog.txt";
    downloadFile(fullContent, fileName, "text/plain;charset=utf-8");
  };

  const handleDownloadHtml = () => {
    if (!generatedPost?.content) return;

    const parts = generatedPost.content.split(/(\[IMAGE:.*?\])/g);
    const contentHtml = parts.map((part) => {
      const imageMatch = part.match(/\[IMAGE:(.*?)\]/);
      if (imageMatch) {
        const prompt = imageMatch[1].trim();
        const imageUrl = generatedImages[`img-${parts.indexOf(part)}`];
        if (imageUrl) {
          return `<div style="margin: 30px 0; text-align: center;">
            <img src="${imageUrl}" alt="${prompt}" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <p style="font-size: 12px; color: #666; margin-top: 8px;">(AI 생성 이미지: ${prompt})</p>
          </div>`;
        }
        return `<div style="margin: 30px 0; padding: 20px; border: 2px dashed #ddd; border-radius: 12px; text-align: center; color: #888;">
          <p style="font-size: 14px;">📷 [이미지 삽입 위치]</p>
          <p style="font-size: 12px;">${prompt}</p>
        </div>`;
      }
      return `<p style="line-height: 1.8; margin-bottom: 20px; white-space: pre-wrap;">${part}</p>`;
    }).join("");

    const hashtagsHtml = generatedPost.hashtags?.map(tag =>
      `<span style="color: #6366f1; margin-right: 8px; font-weight: 500;">${tag}</span>`
    ).join("") || "";

    const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${selectedTitle}</title>
    <style>
        body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; background-color: #f9f9f9; }
        .container { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        h1 { font-size: 28px; font-weight: 800; line-height: 1.3; color: #111; margin-bottom: 40px; border-bottom: 3px solid #6366f1; padding-bottom: 15px; }
        .hashtags { margin: 30px 0; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${selectedTitle}</h1>
        <div class="content">
            ${contentHtml}
        </div>
        <div class="hashtags">
            ${hashtagsHtml}
        </div>
    </div>
</body>
</html>`;

    const fileName = (productName || "easyblog-post").replace(/[^\w가-힣-]+/g, "_") + "_blog.html";
    downloadFile(htmlContent, fileName, "text/html;charset=utf-8");
  };

  const generateAIImage = async (prompt: string, id: string) => {
    setLoadingImages(prev => ({ ...prev, [id]: true }));
    try {
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;
      setGeneratedImages(prev => ({ ...prev, [id]: imageUrl }));
    } catch (error) {
      console.error("Image generation failed", error);
    } finally {
      setLoadingImages(prev => ({ ...prev, [id]: false }));
    }
  };

  const renderContent = () => {
    if (!generatedPost?.content) return null;

    const parts = generatedPost.content.split(/(\[IMAGE:.*?\])/g);

    return (
      <div className="space-y-4">
        {parts.map((part, index) => {
          const imageMatch = part.match(/\[IMAGE:(.*?)\]/);
          if (imageMatch) {
            const imagePrompt = imageMatch[1].trim();
            const imageId = `img-${index}`;
            const currentImageUrl = generatedImages[imageId];
            const isLoading = loadingImages[imageId];

            return (
              <div key={index} className="my-6">
                <div className="relative group overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40 min-h-[180px] flex flex-col items-center justify-center p-6 transition hover:border-indigo-500/30">
                  {currentImageUrl ? (
                    <div className="relative w-full">
                      <img
                        src={currentImageUrl}
                        alt={imagePrompt}
                        className="w-full h-auto rounded-xl shadow-2xl ring-1 ring-white/10"
                      />
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-indigo-600/90 px-2.5 py-1 text-[9px] font-bold text-white shadow-lg backdrop-blur-md ring-1 ring-indigo-400">
                        <Sparkles className="h-2.5 w-2.5" />
                        <span>AI GENERATED</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 mb-3 ring-1 ring-indigo-500/20">
                        <ImageIcon className="h-6 w-6 text-indigo-400/70" />
                      </div>
                      <p className="text-[10px] text-slate-400 text-center mb-4 max-w-[200px] leading-relaxed">
                        {imagePrompt}
                      </p>
                      <button
                        onClick={() => generateAIImage(imagePrompt, imageId)}
                        disabled={isLoading}
                        className="flex items-center gap-2 rounded-xl bg-indigo-500/20 px-4 py-2 text-[10px] font-bold text-indigo-200 ring-1 ring-indigo-400/40 transition hover:bg-indigo-500/30 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        <span>AI 이미지 생성</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          }
          return (
            <div key={index} className="whitespace-pre-wrap font-sans text-xs leading-[1.8] text-slate-200">
              {part}
            </div>
          );
        })}

        {/* 해시태그 섹션 */}
        {generatedPost.hashtags && generatedPost.hashtags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2 pt-6 border-t border-slate-700/50">
            {generatedPost.hashtags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2 py-1 text-[10px] font-medium text-indigo-300 ring-1 ring-indigo-500/20">
                <Hash className="h-2.5 w-2.5" />
                {tag.startsWith('#') ? tag.slice(1) : tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
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
              텍스트 또는 HTML 파일로 저장하세요.
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-slate-900/80 p-1.5 text-xs text-slate-200 ring-1 ring-white/10">
        <div className="px-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!hasResult}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100/5 px-2.5 py-1 text-[11px] text-slate-100 ring-1 ring-slate-200/20 transition hover:bg-slate-100/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>전체 복사</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleDownloadTxt}
            disabled={!hasResult}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-700/40 px-2.5 py-1 text-[11px] font-medium text-slate-100 ring-1 ring-white/10 transition hover:bg-slate-700/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" />
            <span>TXT</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadHtml}
            disabled={!hasResult}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500 px-3 py-1 text-[11px] font-bold text-white shadow-lg transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>HTML</span>
          </button>
        </div>
      </div>

      <div className="relative mt-1 flex flex-1 justify-center overflow-hidden">
        <motion.div
          className="relative w-full max-w-sm rounded-[32px] border border-slate-600/60 bg-slate-950/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.95)]"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="h-[520px] overflow-y-auto rounded-2xl bg-slate-900/80 px-5 py-6 scrollbar-thin scrollbar-thumb-slate-700">
            {hasResult ? (
              <div className="space-y-6">
                <div className="space-y-3 border-b border-slate-700/50 pb-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-indigo-300">최적의 제목 추천</span>
                    <button
                      onClick={() => setIsEditingTitle(!isEditingTitle)}
                      className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                    >
                      <PencilLine className="h-3 w-3" />
                      직접 수정하기
                    </button>
                  </div>

                  {isEditingTitle ? (
                    <input
                      value={selectedTitle}
                      onChange={(e) => setSelectedTitle(e.target.value)}
                      className="w-full bg-slate-800 border-indigo-500/50 border rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      autoFocus
                    />
                  ) : (
                    <div className="flex flex-col gap-2">
                      {generatedPost?.titles.map((title, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedTitle(title)}
                          className={`group relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${selectedTitle === title
                              ? "border-indigo-400/60 bg-indigo-500/15 ring-1 ring-indigo-400/30"
                              : "border-slate-700/40 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-800/40"
                            }`}
                        >
                          {i === 0 && (
                            <span className="absolute -top-2 -right-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-2 py-0.5 text-[8px] font-black text-white shadow-lg ring-1 ring-white/20">
                              BEST
                            </span>
                          )}
                          <div className={`mt-1 h-3 w-3 flex-shrink-0 rounded-full border-2 transition-all ${selectedTitle === title ? "border-indigo-400 bg-indigo-400 scale-110" : "border-slate-700"
                            }`} />
                          <span className="text-[11px] font-semibold leading-relaxed text-slate-200">{title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="h-px flex-1 bg-slate-800"></span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Preview</span>
                    <span className="h-px flex-1 bg-slate-800"></span>
                  </div>
                  <h1 className="text-base font-extrabold leading-tight text-white mb-6 tracking-tight">
                    {selectedTitle}
                  </h1>
                  {renderContent()}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-800/50 ring-1 ring-white/5 shadow-inner">
                  <ImageIcon className="h-8 w-8 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">생성된 내용이 없습니다.</p>
                  <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                    정보를 입력하신 후<br />
                    <span className="text-indigo-400/80 font-medium">포스팅 생성 버튼</span>을 눌러주세요.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-slate-800/90 px-4 py-1.5 text-[10px] text-slate-300 border border-white/10 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
            <AlertCircle className="h-3.5 w-3.5 text-indigo-400" />
            <span>원하는 포맷 버튼을 클릭하여 즉시 다운로드하세요.</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
