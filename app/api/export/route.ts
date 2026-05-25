import { NextResponse } from "next/server";
import { runDailyGenerator } from "@/lib/inventory-store";

export async function POST() {
  try {
    const result = await runDailyGenerator();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "출력 생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
