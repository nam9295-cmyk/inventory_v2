export const CATEGORY_ORDER = [
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
] as const;

export type InventoryItem = {
  order?: number;
  category: string;
  name: string;
  quantity: string;
  unit: string;
  note: string;
  updated_at?: string;
  icon?: string;
  hidden?: boolean;
  inactive?: boolean;
  [key: string]: unknown;
};

export type InventoryState = {
  updated_at?: string;
  source?: string;
  template?: string;
  items: InventoryItem[];
  [key: string]: unknown;
};

export type InventoryChange = {
  key: string;
  quantity?: string;
  note?: string;
};

export function itemKey(item: Pick<InventoryItem, "order" | "category" | "name">): string {
  return [item.order ?? "", item.category ?? "", item.name ?? ""]
    .map((value) => encodeURIComponent(String(value)))
    .join("|");
}

export function categoryEmoji(category?: string): string {
  if (!category) return "📦";
  if (category.includes("초콜릿")) return "🍫";
  if (category.includes("디톡스티") || category.includes("커피") || category.includes("음료")) return "☕";
  if (category.includes("티라미수")) return "🍰";
  if (category.includes("그레놀라") || category.includes("견과")) return "🥣";
  if (category.includes("유제품") || category.includes("냉장")) return "🥛";
  if (category.includes("베이킹") || category.includes("분말")) return "🥄";
  if (category.includes("청") || category.includes("시럽") || category.includes("오일")) return "🍯";
  if (category.includes("포장") || category.includes("소모품")) return "🧾";
  if (category.includes("굿즈") || category.includes("부자재")) return "🎁";
  return "📦";
}

export function sortItems(items: InventoryItem[]): InventoryItem[] {
  const rank = new Map<string, number>(CATEGORY_ORDER.map((category, index) => [category, index]));
  return [...items].sort((a, b) => {
    const categoryA = rank.get(a.category ?? "") ?? 999;
    const categoryB = rank.get(b.category ?? "") ?? 999;
    if (categoryA !== categoryB) return categoryA - categoryB;
    const orderA = Number.isFinite(Number(a.order)) ? Number(a.order) : 9999;
    const orderB = Number.isFinite(Number(b.order)) ? Number(b.order) : 9999;
    if (orderA !== orderB) return orderA - orderB;
    return String(a.name ?? "").localeCompare(String(b.name ?? ""), "ko");
  });
}

export function parseQuantity(qtyStr: string): number | null {
  const cleanStr = qtyStr.trim().replace(/\s+/g, " ");
  if (!cleanStr) return null;

  const mixedFractionRegex = /^(\d+)\s*(?:과|\s)\s*(\d+)\/(\d+)$/;
  const simpleFractionRegex = /^(\d+)\/(\d+)$/;
  const decimalRegex = /^(\d+(?:\.\d+)?)$/;

  const mixedMatch = cleanStr.match(mixedFractionRegex);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);
    if (den !== 0) return whole + num / den;
  }

  const fractionMatch = cleanStr.match(simpleFractionRegex);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2], 10);
    if (den !== 0) return num / den;
  }

  const decimalMatch = cleanStr.match(decimalRegex);
  if (decimalMatch) return parseFloat(decimalMatch[1]);

  const parsed = parseFloat(cleanStr);
  return Number.isNaN(parsed) ? null : parsed;
}

export function addOne(quantity: string | undefined, delta: number): string {
  const value = String(quantity ?? "").trim();
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  const next = numeric + delta;
  return Number.isInteger(next) ? String(next) : String(Number(next.toFixed(3)));
}
