import { NextRequest } from "next/server";

export function adminUnauthorized(): Response {
  return Response.json({ error: "Yetkisiz" }, { status: 401 });
}

export function requireAdmin(req: NextRequest): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected || expected.length < 8) {
    return false;
  }
  const got = req.headers.get("x-admin-secret");
  return got === expected;
}
