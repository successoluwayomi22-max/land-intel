import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("google-site-verification: googlef8411a63fb4c6533.html\n", {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
