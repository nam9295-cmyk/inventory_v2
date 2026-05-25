import { execFile } from "node:child_process";
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { InventoryChange, InventoryItem, InventoryState, itemKey } from "./inventory";
import { parseQuantity } from "./quantity-parser";

export type { InventoryItem, InventoryState };
export { parseQuantity };

const execFileAsync = promisify(execFile);

const INVENTORY_DIR = "/home/john/workspace/obsidian-notes/Inventory";
const PRINT_DIR = "/home/john/workspace/obsidian-notes/Print";
const CURRENT_JSON = path.join(INVENTORY_DIR, "current.json");
const HISTORY_DIR = path.join(INVENTORY_DIR, "history");
const GENERATOR_PYTHON = "/home/john/.hermes/venvs/inventory-xlsx/bin/python";
const GENERATOR_SCRIPT = path.join(INVENTORY_DIR, "generate_daily_inventory_sheet.py");
const TZ = "Asia/Seoul";

type SaveInput = {
  actor?: string;
  initialUpdatedAt?: string;
  changes?: Array<{
    key?: string;
    category?: string;
    name?: string;
    quantity?: unknown;
    note?: string;
  }>;
};

function nowParts() {
  const date = new Date();
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const formatted = formatter.format(date).replace(" ", "T");
  return {
    date: formatted.slice(0, 10),
    timestamp: `${formatted}+09:00`,
    compact: formatted.replace(/[-:T]/g, "")
  };
}

async function writeJsonAtomic(filePath: string, value: unknown) {
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
  await rename(tempPath, filePath);
}

export async function readInventory(): Promise<InventoryState> {
  const raw = await readFile(CURRENT_JSON, "utf-8");
  const parsed = JSON.parse(raw) as InventoryState;
  return {
    ...parsed,
    items: Array.isArray(parsed.items) ? parsed.items : []
  };
}

function normalizeChanges(input: SaveInput): InventoryChange[] {
  const seen = new Set<string>();
  const changes: InventoryChange[] = [];
  for (const change of input.changes ?? []) {
    const quantity =
      typeof change.quantity === "number" || typeof change.quantity === "string"
        ? String(change.quantity).trim()
        : undefined;
    const note = typeof change.note === "string" ? change.note : undefined;
    if (quantity === undefined && note === undefined) continue;
    if (quantity === "" && note === undefined) continue;

    const keys = [change.key, change.category && change.name ? `${change.category}::${change.name}` : undefined].filter(Boolean) as string[];
    for (const key of keys) {
      if (seen.has(key)) continue;
      seen.add(key);
      changes.push({ key, quantity, note });
    }
  }
  return changes;
}

async function appendMarkdown(date: string, actor: string, timestamp: string, changedItems: Array<{ item: InventoryItem; previous: string; next: string }>) {
  const filePath = path.join(INVENTORY_DIR, `${date}.md`);
  const lines = [
    "",
    `## PWA 저장 ${timestamp}`,
    "",
    `- 담당: ${actor}`,
    `- 변경: ${changedItems.length}개`,
    "",
    "| 구분 | 품목명 | 이전 | 변경 | 단위 |",
    "| --- | --- | ---: | ---: | --- |",
    ...changedItems.map(({ item, previous, next }) => `| ${item.category ?? ""} | ${item.name ?? ""} | ${previous} | ${next} | ${item.unit ?? ""} |`),
    ""
  ];
  await writeFile(filePath, `${lines.join("\n")}`, { encoding: "utf-8", flag: "a" });
}

async function appendHistory(date: string, event: unknown) {
  await mkdir(HISTORY_DIR, { recursive: true });
  const filePath = path.join(HISTORY_DIR, `${date}.json`);
  let history: { date: string; events: unknown[] } = { date, events: [] };
  try {
    const parsed = JSON.parse(await readFile(filePath, "utf-8")) as unknown;
    if (Array.isArray(parsed)) history = { date, events: parsed };
    else if (parsed && typeof parsed === "object" && Array.isArray((parsed as { events?: unknown[] }).events)) history = parsed as { date: string; events: unknown[] };
  } catch {
    history = { date, events: [] };
  }
  history.date = date;
  history.events.push(event);
  await writeJsonAtomic(filePath, history);
}

export async function saveInventoryChanges(input: SaveInput) {
  const changes = normalizeChanges(input);
  if (changes.length === 0) {
    throw new Error("변경된 항목이 없습니다.");
  }

  const current = await readInventory();
  if (input.initialUpdatedAt && current.updated_at && input.initialUpdatedAt !== current.updated_at) {
    throw new Error("CONFLICT: 다른 저장이 먼저 반영되었습니다. 새로고침 후 다시 확인해 주세요.");
  }

  const { date, timestamp, compact } = nowParts();
  const actor = String(input.actor || "미지정");
  const byKey = new Map(changes.map((change) => [change.key, change]));
  const changedItems: Array<{ item: InventoryItem; previous: string; next: string; previousNote: string; nextNote: string }> = [];

  const nextItems = current.items.map((item) => {
    const stableKey = itemKey(item);
    const legacyKey = `${item.category}::${item.name}`;
    const change = byKey.get(stableKey) ?? byKey.get(legacyKey);
    if (!change) return item;

    const previous = String(item.quantity ?? "");
    const next = change.quantity !== undefined ? change.quantity : previous;
    const previousNote = String(item.note ?? "");
    const nextNote = change.note !== undefined ? change.note : previousNote;
    const previousNum = parseQuantity(previous);
    const nextNum = parseQuantity(next);
    const sameQty = previousNum !== null && nextNum !== null ? previousNum === nextNum && previous.trim() === next.trim() : previous.trim() === next.trim();
    const sameNote = previousNote === nextNote;
    if (sameQty && sameNote) return item;

    const nextItem = {
      ...item,
      quantity: next,
      note: nextNote,
      updated_at: timestamp
    };
    changedItems.push({ item: nextItem, previous, next, previousNote, nextNote });
    return nextItem;
  });

  if (changedItems.length === 0) {
    throw new Error("실제 변경된 수량이 없습니다.");
  }

  await mkdir(path.join(INVENTORY_DIR, "backups"), { recursive: true });
  const backupPath = path.join(INVENTORY_DIR, "backups", `current.before-pwa-${compact}.json`);
  await copyFile(CURRENT_JSON, backupPath);

  const nextState: InventoryState = {
    ...current,
    updated_at: timestamp,
    items: nextItems
  };
  await writeJsonAtomic(CURRENT_JSON, nextState);

  const event = {
    id: `pwa-${compact}`,
    source: "choco-inventory-pwa",
    actor,
    saved_at: timestamp,
    initial_updated_at: input.initialUpdatedAt ?? null,
    backup: backupPath,
    changes: changedItems.map(({ item, previous, next }) => ({
      key: itemKey(item),
      order: item.order,
      category: item.category,
      name: item.name,
      unit: item.unit,
      previous,
      next
    }))
  };
  await appendMarkdown(date, actor, timestamp, changedItems);
  await appendHistory(date, event);

  return {
    ok: true,
    success: true,
    updated_at: timestamp,
    updatedAt: timestamp,
    changed: changedItems.length,
    changesCount: changedItems.length,
    backup: backupPath,
    history: path.join(HISTORY_DIR, `${date}.json`),
    markdown: path.join(INVENTORY_DIR, `${date}.md`)
  };
}

export type AdminInventoryAction =
  | {
      type: "add";
      actor?: string;
      item: {
        category?: string;
        name?: string;
        quantity?: unknown;
        unit?: string;
        note?: string;
        order?: unknown;
        icon?: string;
      };
    }
  | { type: "hide" | "restore"; actor?: string; key?: string; category?: string; name?: string };

function findItemIndex(items: InventoryItem[], input: { key?: string; category?: string; name?: string }) {
  return items.findIndex((item) => {
    if (input.key && itemKey(item) === input.key) return true;
    return Boolean(input.category && input.name && item.category === input.category && item.name === input.name);
  });
}

function nextOrderForCategory(items: InventoryItem[], category: string) {
  const orders = items
    .filter((item) => item.category === category)
    .map((item) => Number(item.order))
    .filter((order) => Number.isFinite(order));
  return orders.length ? Math.max(...orders) + 1 : items.length + 1;
}

async function appendAdminMarkdown(date: string, actor: string, timestamp: string, message: string) {
  const filePath = path.join(INVENTORY_DIR, `${date}.md`);
  const lines = ["", `## PWA 관리자 변경 ${timestamp}`, "", `- 담당: ${actor}`, `- ${message}`, ""];
  await writeFile(filePath, `${lines.join("\n")}`, { encoding: "utf-8", flag: "a" });
}

export async function manageInventoryItem(input: AdminInventoryAction) {
  const current = await readInventory();
  const { date, timestamp, compact } = nowParts();
  const actor = String(input.actor || "관리자");
  let message = "";
  let nextItems = [...current.items];

  if (input.type === "add") {
    const category = String(input.item.category || "").trim();
    const name = String(input.item.name || "").trim();
    const unit = String(input.item.unit || "").trim();
    const quantity = String(input.item.quantity ?? "0").trim();
    const note = String(input.item.note || "").trim();
    const icon = String(input.item.icon || "").trim();
    const order = Number(input.item.order);

    if (!category || !name || !unit) {
      throw new Error("카테고리, 품목명, 단위는 필수입니다.");
    }
    if (nextItems.some((item) => item.category === category && item.name === name)) {
      throw new Error("이미 같은 카테고리에 같은 품목명이 있습니다.");
    }

    const item: InventoryItem = {
      order: Number.isFinite(order) ? order : nextOrderForCategory(nextItems, category),
      category,
      name,
      quantity: quantity === "" ? "0" : quantity,
      unit,
      note,
      updated_at: timestamp,
      ...(icon ? { icon } : {})
    };
    nextItems = [...nextItems, item];
    message = `품목 추가: ${category} / ${name} (${item.quantity}${unit})`;
  } else {
    const index = findItemIndex(nextItems, input);
    if (index < 0) throw new Error("대상 품목을 찾지 못했습니다.");
    const item = nextItems[index];
    const hidden = input.type === "hide";
    nextItems[index] = { ...item, hidden, inactive: hidden, updated_at: timestamp };
    message = hidden ? `품목 숨김: ${item.category} / ${item.name}` : `품목 복구: ${item.category} / ${item.name}`;
  }

  await mkdir(path.join(INVENTORY_DIR, "backups"), { recursive: true });
  const backupPath = path.join(INVENTORY_DIR, "backups", `current.before-admin-${compact}.json`);
  await copyFile(CURRENT_JSON, backupPath);

  const nextState: InventoryState = {
    ...current,
    updated_at: timestamp,
    items: nextItems
  };
  await writeJsonAtomic(CURRENT_JSON, nextState);

  const event = {
    id: `admin-${compact}`,
    source: "choco-inventory-pwa-admin",
    actor,
    saved_at: timestamp,
    action: input.type,
    message,
    backup: backupPath
  };
  await appendAdminMarkdown(date, actor, timestamp, message);
  await appendHistory(date, event);

  return {
    ok: true,
    success: true,
    updated_at: timestamp,
    updatedAt: timestamp,
    message,
    backup: backupPath,
    history: path.join(HISTORY_DIR, `${date}.json`),
    markdown: path.join(INVENTORY_DIR, `${date}.md`)
  };
}

export async function runDailyGenerator() {
  await mkdir(PRINT_DIR, { recursive: true });
  const { stdout, stderr } = await execFileAsync(GENERATOR_PYTHON, [GENERATOR_SCRIPT], {
    cwd: INVENTORY_DIR
  });
  const paths = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith(PRINT_DIR));
  return {
    ok: true,
    success: true,
    paths,
    output: stdout.trim(),
    warning: stderr.trim()
  };
}
