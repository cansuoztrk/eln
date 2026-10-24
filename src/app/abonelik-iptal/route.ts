import { NextResponse } from "next/server";
import { db } from "@/server/db";

/** E-postadaki tek tıkla abonelikten çıkma (giriş gerektirmez). */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (token.length >= 10 && token.length <= 64) {
    await db.user.updateMany({ where: { unsubscribeToken: token }, data: { digestOptIn: false } });
  }
  return NextResponse.redirect(new URL("/abonelik-iptal/tamam", req.url), 303);
}
export const POST = GET;
