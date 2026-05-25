"use client";

import React from "react";
import { Plus, Minus, Check, MessageSquare, AlertCircle } from "lucide-react";
import { parseQuantity } from "@/lib/quantity-parser";

// Clean category emojis
export function getEmoji(name: string, category: string): string {
  const n = name.toLowerCase();
  const c = category.toLowerCase();
  
  if (n.includes("초콜릿") || n.includes("초코")) return "🍫";
  if (n.includes("티라미수")) return "🍰";
  if (n.includes("쿠키")) return "🍪";
  if (n.includes("티") || n.includes("원두") || n.includes("커피")) return "☕";
  if (n.includes("그레놀라")) return "🥣";
  if (n.includes("우유") || n.includes("생크림")) return "🥛";
  if (n.includes("버터")) return "🧈";
  if (n.includes("계란")) return "🥚";
  if (n.includes("밀가루") || n.includes("설탕") || n.includes("가루")) return "🌾";
  if (n.includes("아몬드") || n.includes("견과") || n.includes("피칸")) return "🥜";
  if (n.includes("딸기") || n.includes("레몬") || n.includes("청")) return "🍓";
  if (n.includes("니트릴") || n.includes("장갑")) return "🧤";
  if (n.includes("박스") || n.includes("보냉백") || n.includes("주머니")) return "🛍️";
  if (n.includes("키링")) return "🐯";
  
  if (c.includes("초콜릿")) return "🍫";
  if (c.includes("티라미수")) return "🍰";
  if (c.includes("음료")) return "🥤";
  if (c.includes("포장") || c.includes("소모품")) return "📦";
  if (c.includes("유제품") || c.includes("냉장")) return "🧀";
  
  return "🏷️";
}

interface InventoryCardProps {
  item: {
    category: string;
    name: string;
    quantity: string;
    unit: string;
    note: string;
  };
  draftQuantity: string;
  draftNote: string;
  isModified: boolean;
  categoryLabel?: string;
  onQuantityChange: (qty: string) => void;
  onEditClick: () => void;
}

export default function InventoryCard({
  item,
  draftQuantity,
  draftNote,
  isModified,
  categoryLabel,
  onQuantityChange,
  onEditClick,
}: InventoryCardProps) {
  const emoji = getEmoji(item.name, item.category);

  const handleStep = (e: React.MouseEvent, step: number) => {
    e.stopPropagation(); // Avoid triggering full edit sheet
    const currentNum = parseQuantity(draftQuantity);
    if (currentNum === null) {
      const base = 0;
      const next = Math.max(0, base + step);
      onQuantityChange(String(next));
    } else {
      const next = Math.max(0, currentNum + step);
      const formatted = Number(next.toFixed(2));
      onQuantityChange(String(formatted));
    }
  };

  return (
    <div
      onClick={onEditClick}
      className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl border transition-all duration-150 cursor-pointer ${
        isModified
          ? "bg-amber-500/[0.02] border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.03)]"
          : "bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.02]"
      }`}
    >
      {/* Left Area: Emoji & Name */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span className="text-xl shrink-0 select-none">{emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-white truncate leading-snug">
              {item.name}
            </span>
            {isModified && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 shadow-[0_0_4px_#f59e0b] animate-pulse" />
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-0.5">
            {categoryLabel && (
              <span className="text-[10px] text-gray-400 font-semibold truncate max-w-[90px]">
                {categoryLabel}
              </span>
            )}
            {/* Unit display */}
            <span className="text-[10px] text-gray-500 font-medium shrink-0">
              단위: {item.unit}
            </span>
            {/* Note tag if exists */}
            {draftNote && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/10 max-w-[120px] truncate shrink-0">
                <MessageSquare className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{draftNote}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Area: Quantity & Inline Controls */}
      <div className="flex items-center gap-3 shrink-0 ml-3">
        {/* Quantity display */}
        <div className="text-right min-w-[56px] flex flex-col justify-center">
          <div className="flex items-baseline justify-end gap-0.5">
            <span className={`text-sm font-bold ${isModified ? "text-amber-500" : "text-gray-300"}`}>
              {draftQuantity === "" ? "—" : draftQuantity}
            </span>
            <span className="text-[9px] text-gray-500 font-medium">{item.unit}</span>
          </div>
          {isModified && (
            <span className="text-[8px] text-gray-500 leading-none">
              이전: {item.quantity}
            </span>
          )}
        </div>

        {/* Dense Stepper Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => handleStep(e, -1)}
            className="w-7 h-7 rounded-lg bg-white/5 active:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center border border-white/5 transition-all"
            title="-1"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={(e) => handleStep(e, 1)}
            className="w-7 h-7 rounded-lg bg-white/5 active:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center border border-white/5 transition-all"
            title="+1"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
