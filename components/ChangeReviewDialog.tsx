"use client";

import React from "react";
import { X, Check, Save, ArrowRight, ClipboardList, Loader2, AlertCircle } from "lucide-react";
import { getEmoji } from "./InventoryCard";

interface ChangeReviewDialogProps {
  isOpen: boolean;
  actor: string;
  changes: Array<{
    name: string;
    category: string;
    originalQuantity: string;
    draftQuantity: string;
    originalNote: string;
    draftNote: string;
    unit: string;
  }>;
  isSaving: boolean;
  saveError: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ChangeReviewDialog({
  isOpen,
  actor,
  changes,
  isSaving,
  saveError,
  onClose,
  onConfirm,
}: ChangeReviewDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      {/* Tap background to close */}
      <div className="absolute inset-0" onClick={() => !isSaving && onClose()} />

      <div className="w-full max-w-md bg-[#0f1011] border border-white/10 rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-amber-500" />
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">변경사항 확인</h2>
              <p className="text-[9px] text-gray-500 mt-0.5">
                근무자: <span className="text-amber-500 font-semibold">{actor}</span> • {changes.length}개 항목 수정됨
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-7 h-7 rounded-lg bg-white/5 active:bg-white/10 flex items-center justify-center border border-white/5 text-gray-400 hover:text-white disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Changes List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 no-scrollbar">
          {changes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xs font-semibold">수정된 품목이 없습니다.</p>
              <p className="text-[10px] text-gray-600 mt-0.5">수량을 변경한 후 저장해 주세요.</p>
            </div>
          ) : (
            changes.map((c, index) => {
              const emoji = getEmoji(c.name, c.category);
              return (
                <div
                  key={index}
                  className="bg-white/[0.01] border border-white/5 rounded-xl p-3 flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-lg shrink-0 select-none">{emoji}</span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate">{c.name}</h4>
                      <span className="text-[9px] text-gray-500">
                        {c.category.replace(/^(완제품|원재료)\s*-\s*/, "")}
                      </span>
                    </div>
                  </div>

                  {/* Before -> After comparisons */}
                  <div className="flex items-center justify-between py-1.5 px-2 bg-white/[0.01] rounded-lg border border-white/[0.02] text-[10px]">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-gray-500 font-medium">수정 전</span>
                      <span className="text-gray-400 font-bold mt-0.5">
                        {c.originalQuantity === "" ? "—" : c.originalQuantity}
                        <span className="text-[9px] ml-0.5 font-normal">{c.unit}</span>
                      </span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />

                    <div className="flex flex-col text-right">
                      <span className="text-[8px] text-amber-500 font-medium">수정 후</span>
                      <span className="text-amber-500 font-black mt-0.5">
                        {c.draftQuantity}
                        <span className="text-[9px] ml-0.5 font-normal text-amber-500/80">{c.unit}</span>
                      </span>
                    </div>
                  </div>

                  {/* Note modifications */}
                  {(c.originalNote || c.draftNote) && (
                    <div className="text-[10px] bg-amber-950/20 border border-amber-500/10 rounded-lg p-2 flex flex-col gap-0.5 text-amber-400/90">
                      {c.originalNote && c.originalNote !== c.draftNote && (
                        <div className="flex gap-1 opacity-55 line-through">
                          <span className="font-semibold shrink-0">기존:</span>
                          <span className="truncate">{c.originalNote}</span>
                        </div>
                      )}
                      {c.draftNote && (
                        <div className="flex gap-1">
                          <span className="font-semibold text-amber-500 shrink-0">메모:</span>
                          <span className="font-medium text-white truncate">{c.draftNote}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Error Alert */}
          {saveError && (
            <div className="bg-red-950/20 border border-red-500/15 text-red-400 p-3 rounded-xl flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <div className="text-[10px]">
                <span className="font-bold">오류:</span> {saveError}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-white/10 bg-white/[0.01] grid grid-cols-2 gap-2.5 shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="py-3 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-400 font-semibold flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all disabled:opacity-40"
          >
            돌아가기
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isSaving || changes.length === 0}
            className="py-3 rounded-xl bg-amber-600 active:bg-amber-700 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_3px_12px_rgba(217,119,6,0.15)] active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                재고 저장
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
