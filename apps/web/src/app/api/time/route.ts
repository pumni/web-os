// Server clock source for drift-free anchor math. No auth needed (no secrets).

import { connection } from 'next/server';

export async function GET() {
  await connection();
  return Response.json({ now: Date.now() });
}
