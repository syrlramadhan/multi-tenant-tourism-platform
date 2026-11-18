import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function GET(request: Request) {
  await clearSession();
  const url = new URL("/web-a/login", request.url);
  return NextResponse.redirect(url);
}

export async function POST() {
  await clearSession();
  return NextResponse.json({ success: true });
}
