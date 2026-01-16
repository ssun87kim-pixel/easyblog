"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PenLine, Sparkles, Wand2 } from "lucide-react";
import { ProductInfo, TargetPersona, GeneratedPost, generatePost, generateTargets } from "@/lib/ai";
import InputForm from "@/components/InputForm";
import ResultPreview from "@/components/ResultPreview";

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

export default function MainLayout() {
  const [productInfo, setProductInfo] = useState<ProductInfo>({
    name: "",
    link: "",
    description: "",
  });
  const [targets, setTargets] = useState<TargetPersona[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<string>("친근한");
  const [customTargetTitle, setCustomTargetTitle] = useState("");
  const [customTargetDescription, setCustomTargetDescription] = useState("");
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "image">("content");
  const [toast, setToast] = useState<ToastState>(null);

  const selectedTarget = useMemo(
    () => {
      if (selectedTargetId === "custom") {
        const title = customTargetTitle.trim();
        const description = customTargetDescription.trim();

        if (!title) {
          return null;
        }

        return {
          id: "custom",
          title,
          description: description || "사용자가 직접 지정한 타겟 페르소나",
          icon: "✏️",
          recommendedTone: "친근한", // Default for custom
        };
      }

      return targets.find((t) => t.id === selectedTargetId) ?? null;
    },
    [targets, selectedTargetId, customTargetTitle, customTargetDescription]
  );

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2200);
  };

  const handleAnalyzeTargets = async () => {
    const hasName = productInfo.name.trim().length > 0;
    const hasDescription = productInfo.description.trim().length > 0;
    const hasLink = productInfo.link.trim().length > 0;

    if (!hasName || (!hasDescription && !hasLink)) {
      showToast("상품명과 링크 또는 설명 중 하나를 입력해 주세요.", "error");
      return;
    }

    try {
      setLoadingTargets(true);
      setGeneratedPost(null);
      const personas = await generateTargets(productInfo);
      setTargets(personas);
      if (personas.length > 0) {
        setSelectedTargetId(personas[0].id);
        setSelectedTone(personas[0].recommendedTone);
      }
      showToast("타겟 페르소나를 분석했어요.");
    } catch {
      showToast("타겟 분석 중 오류가 발생했어요.", "error");
    } finally {
      setLoadingTargets(false);
    }
  };

  const handleSelectTarget = (id: string) => {
    setSelectedTargetId(id);
    const target = targets.find((t) => t.id === id);
    if (target) {
      setSelectedTone(target.recommendedTone);
    }
  };

  const handleUseCustomTarget = () => {
    if (!customTargetTitle.trim()) {
      showToast("직접 타겟의 이름을 입력해 주세요.", "error");
      return;
    }

    setSelectedTargetId("custom");
    showToast("직접 입력한 타겟을 사용합니다.");
  };

  const handleGeneratePost = async () => {
    if (!selectedTarget) {
      showToast("먼저 타겟을 선택해 주세요.", "error");
      return;
    }

    try {
      setLoadingPost(true);
      const result = await generatePost(productInfo, selectedTarget, selectedTone);
      setGeneratedPost(result);
      setActiveTab("content");
      showToast("블로그 글이 생성되었어요.");
    } catch {
      showToast("글 생성 중 오류가 발생했어요.", "error");
    } finally {
      setLoadingPost(false);
    }
  };


  const headlineEmphasis = productInfo.name || "EasyBlog";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-900 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 md:px-8 lg:py-12">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 ring-1 ring-indigo-300/40 backdrop-blur">
              <PenLine className="h-5 w-5 text-indigo-200" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tracking-tight text-slate-50">
                  EasyBlog
                </span>
                <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-medium text-indigo-100 ring-1 ring-indigo-300/40">
                  Gemini AI
                </span>
              </div>
              <p className="text-sm text-slate-300">
                대리점 운영자를 위한 프리미엄 AI 블로그 포스팅 생성기
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-100 shadow-sm backdrop-blur md:flex">
            <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
            <span>AI 기술을 접목한 프리미엄 생성기</span>
          </div>
        </header>

        <main className="mt-8 flex flex-1 flex-col gap-6 lg:mt-10 lg:flex-row">
          <motion.section
            className="flex w-full flex-col rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.75)] backdrop-blur-lg lg:w-1/2 lg:p-6"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
                  나만의 AI 블로그 글을
                  <span className="ml-2 bg-gradient-to-r from-indigo-300 via-sky-300 to-violet-300 bg-clip-text text-transparent">
                    {headlineEmphasis}
                  </span>
                  로 완성하기
                </h1>
                <p className="mt-1 text-xs text-slate-400 md:text-sm">
                  상품 정보만 입력하면 타겟 분석부터 글 생성까지 한 번에 진행됩니다.
                </p>
              </div>
              <div className="hidden items-center gap-2 rounded-2xl bg-indigo-500/15 px-3 py-2 text-xs text-indigo-100 ring-1 ring-indigo-300/40 md:flex">
                <Wand2 className="h-4 w-4" />
                <span>HSO 구조 자동 생성</span>
              </div>
            </div>
            <InputForm
              productInfo={productInfo}
              onChange={setProductInfo}
              onAnalyzeTargets={handleAnalyzeTargets}
              onGeneratePost={handleGeneratePost}
              targets={targets}
              selectedTargetId={selectedTargetId}
              onSelectTarget={handleSelectTarget}
              selectedTone={selectedTone}
              onSelectTone={setSelectedTone}
              loadingTargets={loadingTargets}
              loadingPost={loadingPost}
              customTargetTitle={customTargetTitle}
              customTargetDescription={customTargetDescription}
              onChangeCustomTargetTitle={setCustomTargetTitle}
              onChangeCustomTargetDescription={setCustomTargetDescription}
              onUseCustomTarget={handleUseCustomTarget}
              isCustomSelected={selectedTargetId === "custom"}
            />

          </motion.section>

          <motion.section
            className="flex w-full flex-col rounded-3xl border border-white/10 bg-slate-900/60 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.85)] backdrop-blur-lg lg:w-1/2 lg:p-5"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            <ResultPreview
              productName={productInfo.name}
              generatedPost={generatedPost}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onCopy={(success) =>
                showToast(
                  success ? "클립보드에 복사했어요." : "복사에 실패했어요.",
                  success ? "success" : "error"
                )
              }
            />
          </motion.section>
        </main>

        {toast && (
          <div className="pointer-events-none fixed inset-x-0 bottom-5 flex justify-center px-4 sm:bottom-6 sm:justify-end sm:px-8">
            <div
              className={`pointer-events-auto flex max-w-xs items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm shadow-xl shadow-black/40 backdrop-blur ${toast.type === "success"
                ? "bg-emerald-500/90 text-emerald-50"
                : "bg-rose-500/90 text-rose-50"
                }`}
            >
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-white/80" />
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

