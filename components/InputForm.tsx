"use client";

import { motion } from "framer-motion";
import { Heart, Loader2, MessageSquare, ShieldCheck, Sparkles, Target } from "lucide-react";
import { ProductInfo, TargetPersona } from "@/lib/ai";

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
}: InputFormProps) {
  const handleFieldChange = (field: keyof ProductInfo, value: string) => {
    onChange({ ...productInfo, [field]: value });
  };

  const isBusy = loadingTargets || loadingPost;

  const selectedTarget = targets.find((t) => t.id === selectedTargetId);
  const recommendedTone = selectedTarget?.recommendedTone;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="grid gap-3">
        <label className="text-xs font-medium text-slate-200">
          제품명
          <span className="ml-1 text-[10px] text-rose-200/90">*</span>
        </label>
        <input
          value={productInfo.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          placeholder="예: 프리미엄 모션데스크 1200"
          className="h-10 rounded-2xl border border-slate-600/60 bg-slate-900/60 px-3 text-sm text-slate-50 outline-none ring-0 transition focus:border-indigo-300/80 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-400/70"
        />
      </div>

      <div className="grid gap-3">
        <label className="text-xs font-medium text-slate-200">
          제품 링크
          <span className="ml-1 text-[10px] text-slate-400">(설명 대신 사용 가능)</span>
        </label>
        <input
          value={productInfo.link}
          onChange={(e) => handleFieldChange("link", e.target.value)}
          placeholder="예: https://myshop.kr/products/motion-desk"
          className="h-10 rounded-2xl border border-slate-600/60 bg-slate-900/60 px-3 text-xs text-slate-100 outline-none ring-0 transition focus:border-indigo-300/80 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-400/70"
        />
      </div>

      <div className="grid gap-3">
        <label className="flex items-center justify-between text-xs font-medium text-slate-200">
          주요 포인트 / 설명
          <span className="text-[10px] text-slate-400">
            비워두면 링크 내용을 참고해서 생성합니다.
          </span>
        </label>
        <textarea
          value={productInfo.description}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          placeholder="- 전동 높낮이 조절\n- 조용한 모터\n- 3단 메모리 버튼\n- 견고한 내구성"
          rows={3}
          className="resize-none rounded-2xl border border-slate-600/60 bg-slate-900/60 px-3 py-2.5 text-xs text-slate-100 outline-none ring-0 transition focus:border-indigo-300/80 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-400/70"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onAnalyzeTargets}
          disabled={isBusy}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/5 px-3 py-1.5 text-xs font-medium text-slate-100 ring-1 ring-slate-300/20 transition hover:bg-slate-100/10 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loadingTargets ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Target className="h-3.5 w-3.5" />
          )}
          <span>타겟 분석</span>
        </button>

        <button
          type="button"
          onClick={onGeneratePost}
          disabled={isBusy || targets.length === 0}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-1.5 text-xs font-semibold text-slate-50 shadow-lg shadow-indigo-900/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loadingPost ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          <span>글 생성</span>
        </button>
      </div>

      <div className="mt-1 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Target className="h-3.5 w-3.5 text-indigo-300" />
            <span>타겟 독자 선택</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {targets.length === 0 ? (
            <div className="col-span-2 rounded-2xl border border-dashed border-slate-600/70 bg-slate-900/40 px-3 py-3 text-[11px] text-slate-400">
              <p>상품 정보를 입력하고 타겟 분석을 시작해 보세요.</p>
            </div>
          ) : (
            targets.map((target) => {
              const isSelected = target.id === selectedTargetId;
              return (
                <motion.button
                  key={target.id}
                  type="button"
                  onClick={() => onSelectTarget(target.id)}
                  whileTap={{ scale: 0.97 }}
                  className={`flex flex-col items-start gap-1 group rounded-2xl border px-3 py-2 text-left text-[11px] transition ${isSelected
                    ? "border-indigo-400/80 bg-indigo-500/20 text-indigo-50 shadow-inner shadow-indigo-900/40"
                    : "border-slate-700/60 bg-slate-900/40 text-slate-300 hover:border-slate-500 hover:bg-slate-900/70"
                    }`}
                >
                  <div className="flex w-full items-center justify-between gap-1 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span>{target.icon}</span>
                      <span className="truncate">{target.title}</span>
                    </div>
                  </div>
                  <p className={`line-clamp-1 text-[9px] ${isSelected ? "text-indigo-200/80" : "text-slate-500"}`}>
                    {target.description}
                  </p>
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
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
                className={`relative flex flex-col items-center gap-1.5 rounded-2xl border py-2.5 transition ${isSelected
                  ? "border-amber-400/60 bg-amber-500/15 text-amber-50 shadow-inner shadow-amber-900/40"
                  : "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-500 hover:bg-slate-900/70"
                  }`}
              >
                {isRecommended && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-1.5 py-0.5 text-[8px] font-bold text-white shadow-sm ring-1 ring-indigo-300/50">
                    추천
                  </span>
                )}
                <Icon className={`h-4 w-4 ${isSelected ? "text-amber-300" : "text-slate-500"}`} />
                <span className="text-[10px] font-semibold">{tone.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="mt-1 space-y-2">
        <button
          type="button"
          onClick={onUseCustomTarget}
          className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${isCustomSelected
            ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-50"
            : "border-slate-700/40 bg-slate-900/20 text-slate-400 hover:border-slate-600"
            }`}
        >
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">직접 타겟 입력 사용</span>
          </div>
          <div className={`h-3.5 w-3.5 rounded-full border-2 ${isCustomSelected ? "border-emerald-400 bg-emerald-400" : "border-slate-700"}`} />
        </button>

        {isCustomSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2 overflow-hidden"
          >
            <input
              value={customTargetTitle}
              onChange={(e) => onChangeCustomTargetTitle(e.target.value)}
              placeholder="예: 30대 재택근무 직장인"
              className="h-9 w-full rounded-2xl border border-slate-700/60 bg-slate-900/60 px-3 text-xs text-slate-100 outline-none transition focus:border-indigo-400/60"
            />
            <textarea
              value={customTargetDescription}
              onChange={(e) => onChangeCustomTargetDescription(e.target.value)}
              placeholder="예: 집에서 오래 앉아서 근무하며 자세를 신경 쓰는 분"
              rows={2}
              className="resize-none w-full rounded-2xl border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-100 outline-none transition focus:border-indigo-400/60"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
