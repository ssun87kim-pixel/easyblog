"use client";

import { motion } from "framer-motion";
import { Heart, Loader2, MessageSquare, ShieldCheck, Sparkles, Target } from "lucide-react";
import { ContentFormat, ProductInfo, TargetPersona } from "@/lib/ai";

type InputFormProps = {
  productInfo: ProductInfo;
  onChange: (value: ProductInfo) => void;
  onAnalyzeTargets: () => void;
  onGeneratePost: () => void;
  targets: TargetPersona[];
  selectedTargetId: string | null;
  onSelectTarget: (id: string) => void;
  selectedTone: string;
  onSelectTone: (tone: string) => void;
  loadingTargets: boolean;
  loadingPost: boolean;
  customTargetTitle: string;
  customTargetDescription: string;
  onChangeCustomTargetTitle: (value: string) => void;
  onChangeCustomTargetDescription: (value: string) => void;
  onUseCustomTarget: () => void;
  isCustomSelected: boolean;
  contentFormat: ContentFormat;
  onSelectContentFormat: (format: ContentFormat) => void;
};

const TONE_OPTIONS = [
  { id: "전문적인", label: "전문적인", icon: ShieldCheck, desc: "신뢰감 있는 전문 문체" },
  { id: "감성적인", label: "감성적인", icon: Heart, desc: "부드럽고 감성적인 문체" },
  { id: "친근한", label: "친근한", icon: MessageSquare, desc: "대화하듯 편안한 문체" },
];

export default function InputForm({
  productInfo,
  onChange,
  onAnalyzeTargets,
  onGeneratePost,
  targets,
  selectedTargetId,
  onSelectTarget,
  selectedTone,
  onSelectTone,
  loadingTargets,
  loadingPost,
  customTargetTitle,
  customTargetDescription,
  onChangeCustomTargetTitle,
  onChangeCustomTargetDescription,
  onUseCustomTarget,
  isCustomSelected,
  contentFormat,
  onSelectContentFormat,
}: InputFormProps) {
  const handleFieldChange = (field: keyof ProductInfo, value: string) => {
    onChange({ ...productInfo, [field]: value });
  };

  const isBusy = loadingTargets || loadingPost;

  const selectedTarget = targets.find((t) => t.id === selectedTargetId);
  const recommendedTone = selectedTarget?.recommendedTone;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* 1. 상품 정보 섹션 */}
      <div className="space-y-4">
        <div className="grid gap-2.5">
          <label className="text-xs font-semibold text-slate-200">
            제품 이름
          </label>
          <input
            value={productInfo.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            placeholder="예: 프리미엄 모션데스크 1200 (미입력 시 링크 제목 사용)"
            className="h-10 rounded-2xl border border-slate-700/50 bg-slate-900/60 px-3 text-sm text-slate-50 outline-none transition focus:border-indigo-400 focus:bg-slate-900/80 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="grid gap-2.5">
          <label className="text-xs font-semibold text-slate-200">
            참고 링크(판매 링크)
            <span className="ml-1 text-[10px] text-rose-300">*</span>
          </label>
          <input
            value={productInfo.link}
            onChange={(e) => handleFieldChange("link", e.target.value)}
            placeholder="https://... (상품 상세/판매 페이지 URL)"
            className="h-10 rounded-2xl border border-slate-700/50 bg-slate-900/60 px-3 text-xs text-slate-100 outline-none transition focus:border-indigo-400"
          />
          <p className="text-[10px] leading-relaxed text-slate-500">
            분석 단계에서 링크를 크롤링해 핵심 정보(제목/설명/본문 요약)를 글 생성에 반영합니다.
          </p>
        </div>

        <div className="grid gap-2.5">
          <label className="text-xs font-semibold text-slate-200">포인트 / 특징</label>
          <textarea
            value={productInfo.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            placeholder="상품의 핵심 장점들을 적어주세요."
            rows={3}
            className="resize-none rounded-2xl border border-slate-700/50 bg-slate-900/60 px-3 py-2.5 text-xs text-slate-100 outline-none transition focus:border-indigo-400"
          />
        </div>
      </div>

      {/* 2. 타겟 분석 버튼 (중간 단계) */}
      <div>
        <button
          type="button"
          onClick={onAnalyzeTargets}
          disabled={isBusy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100/5 px-4 py-2.5 text-[11px] font-bold text-slate-100 ring-1 ring-white/10 transition hover:bg-slate-100/10 disabled:opacity-50"
        >
          {loadingTargets ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Target className="h-3.5 w-3.5 text-indigo-300" />
          )}
          <span>먼저 타겟 분석하기</span>
        </button>
      </div>

      {/* 3. 타겟 독자 선택 섹션 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500/20 text-[9px] text-indigo-300 ring-1 ring-indigo-400/30">1</span>
            <span>타겟 독자 선택</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {targets.length === 0 ? (
            <div className="col-span-2 rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/40 px-3 py-6 text-center text-[11px] text-slate-500">
              위의 버튼을 눌러 타겟을 분석해 보세요.
            </div>
          ) : (
            targets.map((target) => (
              <motion.button
                key={target.id}
                type="button"
                onClick={() => onSelectTarget(target.id)}
                whileTap={{ scale: 0.97 }}
                className={`flex flex-col items-start gap-1 rounded-2xl border px-3 py-2 text-left text-[11px] transition ${target.id === selectedTargetId
                    ? "border-indigo-400 bg-indigo-500/15 text-indigo-50 shadow-inner"
                    : "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-600"
                  }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <span>{target.icon}</span>
                  <span className="truncate">{target.title}</span>
                </div>
                <p className="line-clamp-1 text-[9px] opacity-70">
                  {target.description}
                </p>
              </motion.button>
            ))
          )}
        </div>

        {/* 직접 타겟 입력 옵션 */}
        <button
          type="button"
          onClick={onUseCustomTarget}
          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${isCustomSelected
            ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-50"
            : "border-slate-700/30 bg-slate-900/20 text-[10px] text-slate-500 hover:border-slate-600"
            }`}
        >
          <span className="text-[10px] font-medium">원하는 타겟이 없나요? 직접 입력하기</span>
          <CheckIcon isChecked={isCustomSelected} color="emerald" />
        </button>

        {isCustomSelected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <input
              value={customTargetTitle}
              onChange={(e) => onChangeCustomTargetTitle(e.target.value)}
              placeholder="예: 신혼부부"
              className="h-8 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 text-[11px] text-slate-100 outline-none"
            />
            <textarea
              value={customTargetDescription}
              onChange={(e) => onChangeCustomTargetDescription(e.target.value)}
              placeholder="예: 미니멀 라이프를 지향하는 신혼부부"
              rows={2}
              className="resize-none w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-100 outline-none"
            />
          </motion.div>
        )}
      </div>

      {/* 4. 글의 분위기(톤) 섹션 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[9px] text-amber-300 ring-1 ring-amber-400/30">2</span>
            <span>글의 분위기 (톤)</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {TONE_OPTIONS.map((tone) => {
            const isSelected = selectedTone === tone.id;
            const isRecommended = recommendedTone === tone.id;
            const Icon = tone.icon;

            return (
              <motion.button
                key={tone.id}
                type="button"
                onClick={() => onSelectTone(tone.id)}
                whileTap={{ scale: 0.96 }}
                className={`relative flex flex-col items-center gap-1.5 rounded-2xl border py-3 transition ${isSelected
                  ? "border-amber-400/60 bg-amber-500/10 text-amber-50 shadow-inner"
                  : "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-600"
                  }`}
              >
                {isRecommended && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-1.5 py-0.5 text-[7px] font-bold text-white ring-1 ring-indigo-300/50">
                    추천
                  </span>
                )}
                <Icon className={`h-4 w-4 ${isSelected ? "text-amber-300" : "text-slate-500"}`} />
                <span className="text-[10px] font-bold">{tone.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500/20 text-[9px] text-sky-300 ring-1 ring-sky-400/30">3</span>
          <span>초기 생성 형식</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSelectContentFormat("blog")}
            className={`rounded-2xl border px-3 py-2 text-[11px] font-semibold transition ${contentFormat === "blog"
              ? "border-sky-400/60 bg-sky-500/15 text-sky-50 shadow-inner"
              : "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-600"
              }`}
          >
            블로그 (기본)
          </button>
          <button
            type="button"
            onClick={() => onSelectContentFormat("thread")}
            className={`rounded-2xl border px-3 py-2 text-[11px] font-semibold transition ${contentFormat === "thread"
              ? "border-sky-400/60 bg-sky-500/15 text-sky-50 shadow-inner"
              : "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-600"
              }`}
          >
            스레드
          </button>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-500">
          먼저 하나의 형식을 완성한 뒤, 결과 화면에서 다른 형식으로 바로 변환할 수 있습니다.
        </p>
      </div>

      {/* 5. 최종 글 생성 버튼 */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onGeneratePost}
          disabled={isBusy || targets.length === 0}
          className="flex w-full items-center justify-center gap-2.5 rounded-[20px] bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 py-3.5 text-sm font-bold text-white shadow-[0_8px_30px_rgb(99,102,241,0.3)] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale"
        >
          {loadingPost ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span>{contentFormat === "blog" ? "블로그 포스팅 생성하기" : "스레드 초안 생성하기"}</span>
        </button>
        <p className="mt-3 text-center text-[10px] text-slate-500 leading-normal">
          위 작업을 모두 완료하셨나요? <br />
          생성하기를 누르면 AI가 선택한 형식으로 먼저 완성합니다.
        </p>
      </div>
    </div>
  );
}

function CheckIcon({ isChecked, color }: { isChecked: boolean; color: "indigo" | "emerald" }) {
  const colorClass = color === "indigo" ? "border-indigo-400 bg-indigo-400" : "border-emerald-400 bg-emerald-400";
  return (
    <div className={`h-3 w-3 rounded-full border-2 ${isChecked ? colorClass : "border-slate-700"}`} />
  );
}
