import { NextResponse } from "next/server";
import { saveInventoryChanges } from "@/lib/inventory-store";

interface SaveRequest {
  actor?: string;
  initialUpdatedAt?: string;
  changes?: Array<{
    key?: string;
    name: string;
    category: string;
    quantity: string;
    note?: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveRequest;
    
    if (!body.actor) {
      return NextResponse.json({ error: "작성자(actor) 정보가 필요합니다." }, { status: 400 });
    }

    const result = await saveInventoryChanges({
      actor: body.actor,
      initialUpdatedAt: body.initialUpdatedAt,
      changes: body.changes,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "저장에 실패했습니다.";
    const status = message.includes("CONFLICT") ? 409 : 400;
    return NextResponse.json({ error: message.replace("CONFLICT: ", "") }, { status });
  }
}
