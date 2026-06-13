// Server clock source for drift-free anchor math. No auth needed (no secrets).

export function GET() {
  return Response.json({ now: Date.now() });
}
