/**
 * Uzak D1 REST sorgusu (Worker yok; dashboard sunucu route'larından okuma).
 */

type CfBlock = {
  results?: Record<string, unknown>[];
  success?: boolean;
};

type CfEnvelope = {
  success: boolean;
  errors?: { message: string }[];
  result?: CfBlock[];
};

export function d1EnvReady(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
      process.env.CLOUDFLARE_D1_DATABASE_ID &&
      process.env.CLOUDFLARE_API_TOKEN,
  );
}

export async function d1Query(
  sql: string,
  params: unknown[] = [],
): Promise<Record<string, unknown>[]> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? process.env.CF_ACCOUNT_ID;
  const databaseId =
    process.env.CLOUDFLARE_D1_DATABASE_ID ??
    process.env.D1_DATABASE_ID ??
    process.env.CF_D1_DATABASE_ID;
  const token =
    process.env.CLOUDFLARE_API_TOKEN ?? process.env.CF_API_TOKEN;

  if (!accountId || !databaseId || !token) {
    throw new Error("D1 ortam eksik: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN");
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });
  const json = (await res.json()) as CfEnvelope;
  if (!json.success) {
    const msg = json.errors?.map((e) => e.message).join("; ") ?? res.statusText;
    throw new Error(`D1 API: ${msg}`);
  }
  const block = json.result?.[0];
  const rows = block?.results;
  return Array.isArray(rows) ? rows : [];
}
