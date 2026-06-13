// Server clock source for drift-free anchor math. No auth needed (no secrets).

import { headers } from "next/headers";

export async function GET() {
  await headers();
  return Response.json({ now: Date.now() });
}
