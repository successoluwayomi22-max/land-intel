import Image, { size, contentType } from "../opengraph-image";

export const runtime = "edge";

export async function GET() {
  const response = await Image();
  return response;
}
