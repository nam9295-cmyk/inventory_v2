"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Save, LogOut, FileSpreadsheet, Loader2, AlertCircle, RefreshCw, X, ChevronLeft, ChevronRight, Check, Settings, PackagePlus, EyeOff, RotateCcw } from "lucide-react";
import InventoryCard from "./InventoryCard";
import ItemEditSheet from "./ItemEditSheet";
import ChangeReviewDialog from "./ChangeReviewDialog";
import { InventoryState, InventoryItem } from "@/lib/inventory-store";

interface InventoryDashboardProps {
  actor: string;
  onLogout: () => void;
}

const CATEGORIES = [
  "완제품 - 초콜릿",
  "완제품 - 디톡스티",
  "완제품 - 티라미수",
  "완제품 - 그레놀라",
  "원재료 - 초콜릿류",
  "원재료 - 견과/과일/토핑",
  "원재료 - 유제품/냉장",
  "원재료 - 베이킹/분말",
  "원재료 - 청/시럽/오일",
  "커피/음료",
  "포장/소모품",
  "굿즈/부자재"
];

type QuickFilter = "all" | "modified" | "pending";
type AdminMode = "none" | "add" | "hidden";

type NewItemForm = {
  category: string;
  name: string;
  quantity: string;
  unit: string;
  note: string;
};

export default function InventoryDashboard({ actor, onLogout }: InventoryDashboardProps) {
  // Inventory State
  const [originalState, setOriginalState] = useState<InventoryState | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Category & Filters
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Drafts & Verification state
  const [draftQuantities, setDraftQuantities] = useState<Record<string, string>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [verifiedItems, setVerifiedItems] = useState<Record<string, boolean>>({});
  const [syncMessage, setSyncMessage] = useState("최신 재고 로드됨");

  // Modal control
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Actions
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<string | null>(null);
  const [showExportToast, setShowExportToast] = useState(false);
  const [adminMode, setAdminMode] = useState<AdminMode>("none");
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [newItem, setNewItem] = useState<NewItemForm>({
    category: CATEGORIES[0],
    name: "",
    quantity: "0",
    unit: "개",
    note: "",
  });

  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch from server
  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("재고 데이터를 로드할 수 없습니다.");
      const data = (await res.json()) as InventoryState;
      setOriginalState(data);
      setItems(data.items);

      // Restore session drafts
      const stored = localStorage.getItem(`choco_draft_${actor}`);
      if (stored) {
        const { quantities, notes, verified, date } = JSON.parse(stored);
        const todayStr = new Date().toISOString().slice(0, 10);
        if (date === todayStr) {
          setDraftQuantities(quantities || {});
          setDraftNotes(notes || {});
          setVerifiedItems(verified || {});
          setSyncMessage("로컬 임시저장 복원됨");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [actor]);

  // Auto-save drafts on changes
  useEffect(() => {
    if (originalState) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const draftData = {
        quantities: draftQuantities,
        notes: draftNotes,
        verified: verifiedItems,
        date: todayStr,
      };
      localStorage.setItem(`choco_draft_${actor}`, JSON.stringify(draftData));
      
      const hasChanges = Object.keys(draftQuantities).length > 0 || Object.keys(draftNotes).length > 0;
      setSyncMessage(hasChanges ? "임시 저장됨 (기기 보관)" : "최신 재고 로드됨");
    }
  }, [draftQuantities, draftNotes, verifiedItems, actor, originalState]);

  // Handle single item update
  const handleQuantityChange = (item: InventoryItem, newQty: string) => {
    const key = `${item.category}::${item.name}`;
    
    if (newQty === item.quantity) {
      const nextQ = { ...draftQuantities };
      delete nextQ[key];
      setDraftQuantities(nextQ);

      const nextV = { ...verifiedItems };
      delete nextV[key];
      setVerifiedItems(nextV);
    } else {
      setDraftQuantities((prev) => ({ ...prev, [key]: newQty }));
      setVerifiedItems((prev) => ({ ...prev, [key]: true }));
    }
  };

  const handleEditSave = (newQty: string, newNote: string) => {
    if (!selectedItem) return;
    const key = `${selectedItem.category}::${selectedItem.name}`;

    handleQuantityChange(selectedItem, newQty);

    if (newNote === selectedItem.note) {
      const nextN = { ...draftNotes };
      delete nextN[key];
      setDraftNotes(nextN);
    } else {
      setDraftNotes((prev) => ({ ...prev, [key]: newNote }));
      setVerifiedItems((prev) => ({ ...prev, [key]: true }));
    }

    setIsEditOpen(false);
    setSelectedItem(null);
  };

  // Compile list of active changes
  const getChangesList = () => {
    const list: Array<{
      name: string;
      category: string;
      originalQuantity: string;
      draftQuantity: string;
      originalNote: string;
      draftNote: string;
      unit: string;
    }> = [];

    items.forEach((item) => {
      const key = `${item.category}::${item.name}`;
      const draftQty = draftQuantities[key];
      const draftNote = draftNotes[key];

      const isQtyModified = draftQty !== undefined && draftQty !== item.quantity;
      const isNoteModified = draftNote !== undefined && draftNote !== item.note;

      if (isQtyModified || isNoteModified) {
        list.push({
          name: item.name,
          category: item.category,
          originalQuantity: item.quantity,
          draftQuantity: draftQty !== undefined ? draftQty : item.quantity,
          originalNote: item.note,
          draftNote: draftNote !== undefined ? draftNote : item.note,
          unit: item.unit,
        });
      }
    });

    return list;
  };

  const changesList = getChangesList();

  // Commit save to server
  const handleConfirmSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    const payloadChanges = changesList.map((c) => ({
      name: c.name,
      category: c.category,
      quantity: c.draftQuantity,
      note: c.draftNote,
    }));

    try {
      const res = await fetch("/api/inventory/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor,
          initialUpdatedAt: originalState?.updated_at,
          changes: payloadChanges,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 409) {
          throw new Error("CONFLICT: 타 직원이 이미 마감하였습니다. 페이지를 새로고침 한 후 복원된 드래프트를 연동해주세요.");
        }
        throw new Error(errData.error || "저장 오류");
      }

      // Success
      localStorage.removeItem(`choco_draft_${actor}`);
      setDraftQuantities({});
      setDraftNotes({});
      setVerifiedItems({});
      setIsReviewOpen(false);

      await fetchInventory();
      setSyncMessage("서버 저장 완료");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "저장 오류");
    } finally {
      setIsSaving(false);
    }
  };

  // Run python exporter
  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);
    try {
      const res = await fetch("/api/export", { method: "POST" });
      if (!res.ok) throw new Error("엑셀 생성기 실행 오류");
      const data = await res.json();
      
      if (data.success) {
        const paths = data.paths || [];
        const xlsxFile = paths.find((p: string) => p.endsWith(".xlsx")) || "Print/Inventory-Input.xlsx";
        setExportResult(xlsxFile.split("/").pop() || "Inventory-Input.xlsx");
        setShowExportToast(true);
      } else {
        throw new Error(data.error || "파일 생성 실패");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "엑셀 내보내기 실패");
    } finally {
      setIsExporting(false);
    }
  };

  // Admin item management
  const runAdminAction = async (payload: unknown) => {
    setAdminBusy(true);
    setAdminMessage("");
    try {
      const res = await fetch("/api/inventory/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "관리 작업 실패");
      setAdminMessage(data.message || "관리 작업을 저장했습니다.");
      await fetchInventory();
      return true;
    } catch (err) {
      setAdminMessage(err instanceof Error ? err.message : "관리 작업에 실패했습니다.");
      return false;
    } finally {
      setAdminBusy(false);
    }
  };

  const handleAddItem = async () => {
    const ok = await runAdminAction({ type: "add", actor, item: newItem });
    if (ok) {
      setSelectedCategory(newItem.category);
      setNewItem({ category: newItem.category, name: "", quantity: "0", unit: "개", note: "" });
      setAdminMode("none");
    }
  };

  const handleHideItem = async (item: InventoryItem) => {
    if (!window.confirm(`${item.name} 품목을 숨길까요? 과거 기록은 유지되고 숨긴 품목에서 복구할 수 있습니다.`)) return;
    await runAdminAction({ type: "hide", actor, category: item.category, name: item.name });
  };

  const handleRestoreItem = async (item: InventoryItem) => {
    await runAdminAction({ type: "restore", actor, category: item.category, name: item.name });
  };

  // Scroll category chips bar
  const scrollTabs = (direction: "left" | "right") => {
    if (tabsContainerRef.current) {
      const scrollAmt = 160;
      tabsContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmt : scrollAmt,
        behavior: "smooth"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-gray-500 text-xs font-semibold">데이터를 연동하는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-6 text-center gap-4">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <div>
          <h2 className="text-sm font-bold text-white">데이터 연동 실패</h2>
          <p className="text-gray-500 text-xs mt-1">{error}</p>
        </div>
        <button
          onClick={fetchInventory}
          className="px-5 py-2 rounded-xl bg-amber-600 text-black font-extrabold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          다시 불러오기
        </button>
      </div>
    );
  }

  const activeItems = items.filter((item) => !item.hidden && !item.inactive);
  const hiddenItems = items.filter((item) => item.hidden || item.inactive);

  // Calculate global checked counts
  const totalItemsCount = activeItems.length;
  const verifiedItemsCount = activeItems.filter((i) => {
    const k = `${i.category}::${i.name}`;
    return verifiedItems[k] === true || draftQuantities[k] !== undefined || draftNotes[k] !== undefined;
  }).length;
  const globalCompletionPct = totalItemsCount > 0 ? Math.round((verifiedItemsCount / totalItemsCount) * 100) : 0;

  const searchTerm = searchQuery.trim().toLowerCase();
  const isGlobalList = searchTerm.length > 0 || quickFilter === "modified";

  // Filter items logic
  const getFilteredItems = () => {
    return activeItems.filter((item) => {
      if (!isGlobalList && item.category !== selectedCategory) return false;
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm)) return false;

      const key = `${item.category}::${item.name}`;
      const isVerified = verifiedItems[key] === true || draftQuantities[key] !== undefined || draftNotes[key] !== undefined;

      if (quickFilter === "modified") {
        const isQtyMod = draftQuantities[key] !== undefined && draftQuantities[key] !== item.quantity;
        const isNoteMod = draftNotes[key] !== undefined && draftNotes[key] !== item.note;
        return isQtyMod || isNoteMod;
      }
      
      if (quickFilter === "pending") {
        return !isVerified;
      }
      return true;
    });
  };

  // Category completion counters
  const getCategoryProgress = (cat: string) => {
    const catItems = activeItems.filter((i) => i.category === cat);
    const verified = catItems.filter((i) => {
      const k = `${i.category}::${i.name}`;
      return verifiedItems[k] === true || draftQuantities[k] !== undefined || draftNotes[k] !== undefined;
    }).length;
    return { verified, total: catItems.length };
  };

  const visibleItems = getFilteredItems();
  const listScopeLabel = isGlobalList
    ? `전체 ${visibleItems.length}개`
    : `${selectedCategory.replace(/^(완제품|원재료)\s*-\s*/, "")} ${visibleItems.length}개`;

  return (
    <div className="min-h-screen flex flex-col pb-24 safe-padding-bottom bg-[#08090a] text-gray-300">
      
      {/* Sticky Compact Top Panel */}
      <div className="sticky top-0 z-40 bg-[#08090a]/95 backdrop-blur-md border-b border-white/[0.04] pt-3 pb-2 px-4 space-y-2.5">
        
        {/* Top Info Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base select-none">🍫</span>
            <div>
              <h1 className="text-xs font-black text-white tracking-tight uppercase">초코창고</h1>
              <p className="text-[9px] text-gray-500">{actor} 근무 중</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Minimal sync text */}
            <span className="text-[9px] text-gray-500 font-medium">
              {syncMessage}
            </span>
            <button
              onClick={() => setAdminMode(adminMode === "none" ? "add" : "none")}
              className={`h-6.5 px-2 rounded-lg text-[9px] font-bold border flex items-center gap-1 active:scale-95 transition-all ${adminMode !== "none" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-white/5 text-gray-400 border-white/5"}`}
              title="품목 관리"
            >
              <Settings className="w-3 h-3" />
              관리
            </button>
            <button
              onClick={onLogout}
              className="w-6.5 h-6.5 rounded-lg bg-white/5 active:bg-red-500/20 text-gray-400 active:text-red-400 flex items-center justify-center border border-white/5 active:scale-95 transition-all"
              title="로그아웃"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Global Progress Bar (Slimmer) */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] text-gray-500 font-medium leading-none">
            <span>마감률 ({verifiedItemsCount}/{totalItemsCount})</span>
            <span className="text-amber-500 font-bold">{globalCompletionPct}%</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${globalCompletionPct}%` }}
            />
          </div>
        </div>

        {/* Sticky Search bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="품목 이름 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition duration-150"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-500">
            <Search className="w-3.5 h-3.5" />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Scroll Snap Chips Bar (Linear-inspired) */}
        <div className="relative flex items-center">
          <button
            onClick={() => scrollTabs("left")}
            className="absolute left-0 z-10 w-5 h-7 bg-gradient-to-r from-[#08090a] to-transparent flex items-center justify-start text-gray-500 hover:text-white active:scale-90"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          
          <div
            ref={tabsContainerRef}
            className="w-full overflow-x-auto flex gap-1.5 px-4 no-scrollbar snap-inline"
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              const { verified, total } = getCategoryProgress(cat);
              const isCatCompleted = verified === total && total > 0;
              const displayCatName = cat.replace(/^(완제품|원재료)\s*-\s*/, "");

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-semibold tracking-tight transition-all duration-100 shrink-0 border select-none ${
                    isActive
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      : isCatCompleted
                      ? "bg-emerald-950/10 text-emerald-400/90 border-emerald-500/10"
                      : "bg-white/[0.02] text-gray-400 border-white/[0.04] hover:border-white/10"
                  }`}
                >
                  {displayCatName}
                  <span className={`ml-1 text-[9px] ${isActive ? "text-amber-400/80" : "text-gray-500"}`}>
                    ({verified}/{total})
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollTabs("right")}
            className="absolute right-0 z-10 w-5 h-7 bg-gradient-to-l from-[#08090a] to-transparent flex items-center justify-end text-gray-500 hover:text-white active:scale-90"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Global Filters Area */}
        <div className="flex items-center gap-1 bg-white/[0.01] p-0.5 rounded-lg border border-white/[0.03] max-w-max">
          {[
            { id: "all", label: "전체" },
            { id: "modified", label: "변경됨" },
            { id: "pending", label: "확인필요" },
          ].map((f) => {
            const isFActive = quickFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setQuickFilter(f.id as QuickFilter)}
                className={`py-1 px-3.5 rounded-md text-[10px] font-bold transition-all duration-75 ${
                  isFActive
                    ? "bg-white/5 text-white"
                    : "text-gray-500 hover:text-gray-400"
                }`}
              >
                {f.label}
              </button>
            );
          })}
          <button
            onClick={() => setAdminMode("add")}
            className={`py-1 px-3.5 rounded-md text-[10px] font-bold transition-all duration-75 flex items-center gap-1 ${adminMode === "add" ? "bg-amber-500/10 text-amber-400" : "text-gray-500 hover:text-gray-400"}`}
          >
            <PackagePlus className="w-3 h-3" />
            추가
          </button>
          <button
            onClick={() => setAdminMode("hidden")}
            className={`py-1 px-3.5 rounded-md text-[10px] font-bold transition-all duration-75 flex items-center gap-1 ${adminMode === "hidden" ? "bg-amber-500/10 text-amber-400" : "text-gray-500 hover:text-gray-400"}`}
          >
            <EyeOff className="w-3 h-3" />
            숨김 {hiddenItems.length}
          </button>
        </div>
        {adminMessage && <p className="text-[10px] text-amber-400 px-1">{adminMessage}</p>}
      </div>

      {/* Main Dense Listing Area */}
      <main className="flex-1 px-4 mt-3 max-w-md mx-auto w-full">
        {adminMode === "add" && (
          <section className="mb-3 p-3 rounded-2xl bg-white/[0.02] border border-amber-500/15 space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-white flex items-center gap-1.5"><PackagePlus className="w-3.5 h-3.5 text-amber-500" /> 새 품목 추가</h2>
              <button onClick={() => setAdminMode("none")} className="text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <select value={newItem.category} onChange={(e) => setNewItem((v) => ({ ...v, category: e.target.value }))} className="w-full px-3 py-2 bg-[#0f1011] border border-white/10 rounded-xl text-xs text-white">
              {CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}
            </select>
            <div className="grid grid-cols-[1fr_80px] gap-2">
              <input value={newItem.name} onChange={(e) => setNewItem((v) => ({ ...v, name: e.target.value }))} placeholder="품목명" className="px-3 py-2 bg-[#0f1011] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600" />
              <input value={newItem.unit} onChange={(e) => setNewItem((v) => ({ ...v, unit: e.target.value }))} placeholder="단위" className="px-3 py-2 bg-[#0f1011] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600" />
            </div>
            <div className="grid grid-cols-[90px_1fr] gap-2">
              <input value={newItem.quantity} onChange={(e) => setNewItem((v) => ({ ...v, quantity: e.target.value }))} placeholder="수량" className="px-3 py-2 bg-[#0f1011] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600" />
              <input value={newItem.note} onChange={(e) => setNewItem((v) => ({ ...v, note: e.target.value }))} placeholder="메모 선택" className="px-3 py-2 bg-[#0f1011] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600" />
            </div>
            <button onClick={handleAddItem} disabled={adminBusy || !newItem.name.trim() || !newItem.category.trim() || !newItem.unit.trim()} className="w-full py-2.5 rounded-xl bg-amber-600 disabled:bg-white/5 disabled:text-gray-600 text-black font-extrabold text-xs active:scale-95 transition-all">
              {adminBusy ? "저장 중..." : "품목 추가 저장"}
            </button>
          </section>
        )}

        {adminMode === "hidden" && (
          <section className="mb-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-white flex items-center gap-1.5"><EyeOff className="w-3.5 h-3.5 text-gray-400" /> 숨긴 품목</h2>
              <button onClick={() => setAdminMode("none")} className="text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            {hiddenItems.length === 0 ? (
              <p className="text-[10px] text-gray-500 py-3 text-center">숨긴 품목이 없습니다.</p>
            ) : hiddenItems.map((item) => (
              <div key={`${item.category}::${item.name}`} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/20 border border-white/[0.04]">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-200 truncate">{item.name}</p>
                  <p className="text-[9px] text-gray-500 truncate">{item.category} · {item.quantity}{item.unit}</p>
                </div>
                <button onClick={() => handleRestoreItem(item)} disabled={adminBusy} className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 text-[10px] font-bold flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> 복구
                </button>
              </div>
            ))}
          </section>
        )}

        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-gray-500">{listScopeLabel}</span>
          {isGlobalList && (
            <span className="text-[9px] text-amber-500/80">
              {quickFilter === "modified" ? `저장 전 변경 ${changesList.length}개` : "전체 검색"}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          {visibleItems.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/[0.04] rounded-2xl p-6">
              <AlertCircle className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-semibold">품목이 비어있습니다.</p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                {quickFilter === "pending"
                  ? "해당 카테고리의 모든 품목 조사를 완료했습니다!"
                  : quickFilter === "modified"
                  ? "수정된 수량이 아직 없습니다."
                  : "일치하는 품목이 없습니다."}
              </p>
            </div>
          ) : (
            visibleItems.map((item) => {
              const key = `${item.category}::${item.name}`;
              const draftQty = draftQuantities[key] !== undefined ? draftQuantities[key] : item.quantity;
              const draftNote = draftNotes[key] !== undefined ? draftNotes[key] : item.note;
              const isModified = draftQty !== item.quantity || draftNote !== item.note;

              return (
                <div key={key} className="relative group">
                  <InventoryCard
                    item={item}
                    draftQuantity={draftQty}
                    draftNote={draftNote}
                    isModified={isModified}
                    categoryLabel={isGlobalList ? item.category.replace(/^(완제품|원재료)\s*-\s*/, "") : undefined}
                    onQuantityChange={(qty) => handleQuantityChange(item, qty)}
                    onEditClick={() => {
                      setSelectedItem(item);
                      setIsEditOpen(true);
                    }}
                  />
                  {adminMode !== "none" && (
                    <button
                      onClick={() => handleHideItem(item)}
                      disabled={adminBusy}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-red-500/10 text-red-300 border border-red-500/15 text-[9px] font-bold flex items-center gap-1 shadow-lg"
                    >
                      <EyeOff className="w-3 h-3" /> 숨김
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Export Toast Dialog */}
      {showExportToast && exportResult && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-[#121315]/95 border border-emerald-500/20 p-3 rounded-xl shadow-2xl animate-slide-up flex gap-3 items-center max-w-md mx-auto">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <Check className="w-4 h-4 stroke-[3px]" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[11px] font-bold text-white">엑셀 출력 파일 생성 성공</h4>
            <p className="text-[9px] text-gray-500 truncate mt-0.5">{exportResult}</p>
          </div>
          <button
            onClick={() => setShowExportToast(false)}
            className="text-[10px] font-bold text-emerald-400 hover:text-white shrink-0 ml-2"
          >
            닫기
          </button>
        </div>
      )}

      {/* Dense Bottom Sticky Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#08090a]/90 backdrop-blur-lg border-t border-white/[0.04] py-3.5 px-4 flex items-center justify-center safe-margin-bottom shadow-[0_-8px_20px_rgba(0,0,0,0.6)]">
        <div className="w-full max-w-md grid grid-cols-2 gap-3">
          {/* Export sheets */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="py-3 rounded-xl bg-white/5 active:bg-white/10 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 border border-white/5 active:scale-95 transition-all disabled:opacity-40"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                생성 중...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                인쇄용 엑셀 만들기
              </>
            )}
          </button>

          {/* Confirm & Save */}
          <button
            onClick={() => setIsReviewOpen(true)}
            className="py-3 rounded-xl bg-amber-600 active:bg-amber-700 text-black font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-[0_3px_12px_rgba(217,119,6,0.15)] active:scale-95 transition-all relative overflow-hidden"
          >
            <Save className="w-3.5 h-3.5" />
            변경 리뷰 ({changesList.length})
            {changesList.length > 0 && (
              <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse border border-white" />
            )}
          </button>
        </div>
      </footer>

      {/* Focused Edit Sheet */}
      <ItemEditSheet
        isOpen={isEditOpen}
        item={selectedItem}
        initialQuantity={
          selectedItem
            ? draftQuantities[`${selectedItem.category}::${selectedItem.name}`] !== undefined
              ? draftQuantities[`${selectedItem.category}::${selectedItem.name}`]
              : selectedItem.quantity
            : ""
        }
        initialNote={
          selectedItem
            ? draftNotes[`${selectedItem.category}::${selectedItem.name}`] !== undefined
              ? draftNotes[`${selectedItem.category}::${selectedItem.name}`]
              : selectedItem.note
            : ""
        }
        onClose={() => {
          setIsEditOpen(false);
          setSelectedItem(null);
        }}
        onSave={handleEditSave}
      />

      {/* Review Dialog */}
      <ChangeReviewDialog
        isOpen={isReviewOpen}
        actor={actor}
        changes={changesList}
        isSaving={isSaving}
        saveError={saveError}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={handleConfirmSave}
      />
    </div>
  );
}
