"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Delete, MessageSquare, ArrowRight } from "lucide-react";
import { getEmoji } from "./InventoryCard";
import { parseQuantity } from "@/lib/quantity-parser";

interface ItemEditSheetProps {
  isOpen: boolean;
  item: {
    category: string;
    name: string;
    quantity: string;
    unit: string;
    note: string;
  } | null;
  initialQuantity: string;
  initialNote: string;
  onClose: () => void;
  onSave: (quantity: string, note: string) => void;
}

export default function ItemEditSheet({
  isOpen,
  item,
  initialQuantity,
  initialNote,
  onClose,
  onSave,
}: ItemEditSheetProps) {
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (item) {
      setQuantity(initialQuantity);
      setNote(initialNote);
    }
  }, [item, initialQuantity, initialNote]);

  if (!isOpen || !item) return null;

  const emoji = getEmoji(item.name, item.category);

  const handleKeyPress = (val: string) => {
    if (val === "1/2" || val === "1/3" || val === "1/4") {
      setQuantity(val);
      return;
    }
    setQuantity((prev) => prev + val);
  };

  const handleBackspace = () => {
    setQuantity((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setQuantity("");
  };

  const handleStep = (step: number) => {
    const num = parseQuantity(quantity);
    if (num === null) {
      setQuantity(String(Math.max(0, step)));
    } else {
      const next = Math.max(0, num + step);
      const formatted = Number(next.toFixed(2));
      setQuantity(String(formatted));
    }
  };

  const handleConfirm = () => {
    onSave(quantity, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 animate-fade-in px-4">
      {/* Tap outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide up panel */}
      <div className="w-full max-w-md bg-[#0f1011] border border-white/10 rounded-t-3xl pt-4 pb-6 px-5 relative z-10 shadow-2xl animate-slide-up max-h-[95vh] overflow-y-auto no-scrollbar">
        {/* Drag line */}
        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-4" onClick={onClose} />

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl shrink-0 select-none">{emoji}</span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate leading-tight">{item.name}</h2>
              <span className="text-[10px] text-gray-400">
                {item.category.replace(/^(완제품|원재료)\s*-\s*/, "")}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 active:bg-white/10 flex items-center justify-center border border-white/5 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quantity Comparative Display Area */}
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl mb-4">
          <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium">
            <span>기존 수량</span>
            <span className="text-amber-500">입력된 수량</span>
          </div>

          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-extrabold text-gray-400">
                {item.quantity === "" ? "—" : item.quantity}
              </span>
              <span className="text-[11px] text-gray-500 font-medium">{item.unit}</span>
            </div>

            <ArrowRight className="w-5 h-5 text-gray-600 shrink-0" />

            <div className="flex items-baseline gap-0.5 text-right">
              <span className="text-3xl font-black text-amber-500 select-all">
                {quantity === "" ? "—" : quantity}
              </span>
              <span className="text-xs text-amber-500 font-semibold">{item.unit}</span>
            </div>
          </div>
        </div>

        {/* Step Adjusters */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {[
            { label: "-1", step: -1 },
            { label: "-0.5", step: -0.5 },
            { label: "+0.5", step: 0.5 },
            { label: "+1", step: 1 },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => handleStep(btn.step)}
              className="py-2 rounded-lg bg-white/5 active:bg-amber-500/10 active:text-amber-400 border border-white/5 text-xs font-semibold text-white transition-all"
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Premium Numeric & Fraction Keypad */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { val: "1", type: "num" },
            { val: "2", type: "num" },
            { val: "3", type: "num" },
            { val: "1/2", type: "frac" },
            { val: "4", type: "num" },
            { val: "5", type: "num" },
            { val: "6", type: "num" },
            { val: "1/3", type: "frac" },
            { val: "7", type: "num" },
            { val: "8", type: "num" },
            { val: "9", type: "num" },
            { val: "과", type: "op" },
            { val: ".", type: "op" },
            { val: "0", type: "num" },
            { val: "/", type: "op" },
            { val: "C", type: "action" },
          ].map((btn) => (
            <button
              key={btn.val}
              onClick={() => {
                if (btn.val === "C") handleClear();
                else handleKeyPress(btn.val);
              }}
              className={`h-11 rounded-lg flex items-center justify-center font-bold text-sm transition-all duration-75 active:scale-95 border ${
                btn.type === "num"
                  ? "bg-white/5 text-white border-white/5 active:bg-white/10"
                  : btn.type === "frac"
                  ? "bg-indigo-950/20 text-indigo-400 border-indigo-500/15 active:bg-indigo-900/30"
                  : btn.type === "op"
                  ? "bg-amber-950/20 text-amber-500 border-amber-500/15 active:bg-amber-900/30"
                  : "bg-red-950/20 text-red-400 border-red-500/15 active:bg-red-900/30"
              }`}
            >
              {btn.val}
            </button>
          ))}
        </div>

        {/* Note input */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>비고 / 메모 입력</span>
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 입고, 누락분, 보이는 것 위주"
            className="w-full px-3 py-2.5 bg-white/[0.02] border border-white/5 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition duration-150"
          />
        </div>

        {/* Cancel and Confirm buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onClose}
            className="py-3 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-400 font-semibold flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="py-3 rounded-xl bg-amber-600 active:bg-amber-700 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(217,119,6,0.15)] active:scale-95 transition-all"
          >
            <Check className="w-4 h-4 stroke-[3px]" />
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
