import { NextResponse } from "next/server";

export async function GET() {
  const xml = `<?xml version="1.0"?>
<users>
	<user>E22B9F42F613757DAE52A7F1DC618D30</user>
</users>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
