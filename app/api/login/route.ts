import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, AUTH_SALT, authToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const pw = String(form.get("password") ?? "");
  const hash = createHash("sha256").update(pw + AUTH_SALT).digest("hex");

  if (hash !== authToken()) {
    return NextResponse.redirect(new URL("/login?error=1", req.url), 303);
  }
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  res.cookies.set(AUTH_COOKIE, hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60일
  });
  return res;
}
