import { NextResponse } from "next/server";
import { manageInventoryItem, type AdminInventoryAction } from "@/lib/inventory-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AdminInventoryAction;

    if (!body || !body.type) {
      return NextResponse.json({ error: "관리 작업 유형이 필요합니다." }, { status: 400 });
    }

    if (!["add", "hide", "restore"].includes(body.type)) {
      return NextResponse.json({ error: "지원하지 않는 관리 작업입니다." }, { status: 400 });
    }

    const result = await manageInventoryItem(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "품목 관리 작업에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
