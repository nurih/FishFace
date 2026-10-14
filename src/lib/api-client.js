const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN || "";
const siteBasePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH || "";

export const siteUrl = (path) => siteBasePath + path;

function resolveUrls(value) {
  if (typeof value === "string") {
    const fishImage = value.match(/^\/api\/media\/fish\/(fish-[\w-]+\.(?:jpg|jpeg|png|webp))$/i);
    if (fishImage) return siteUrl(`/fish/${fishImage[1]}`);
    if (value.startsWith("/api/")) return apiOrigin + value;
    if (value.startsWith("/fish/")) return siteUrl(value);
    return value;
  }
  if (Array.isArray(value)) return value.map(resolveUrls);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveUrls(item)]));
  }
  return value;
}

export async function apiFetch(path, options) {
  const response = await fetch(apiOrigin + path, options);
  if (!apiOrigin || !response.headers.get("content-type")?.includes("application/json")) return response;
  return new Response(JSON.stringify(resolveUrls(await response.json())), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
