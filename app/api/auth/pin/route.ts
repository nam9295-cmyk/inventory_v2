import { NextResponse } from "next/server";

type PinRequest = {
  pin?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as PinRequest;
  const expectedPin = process.env.INVENTORY_PIN || process.env.NEXT_PUBLIC_APP_PIN || "1234";

  if (String(body.pin ?? "") !== expectedPin) {
    return NextResponse.json({ error: "PIN이 일치하지 않습니다." }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
