const STATIC_FILE_PATTERN = /\/[^/]+\.[^/]+$/;

function withNoStore(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-cache, no-store, must-revalidate");

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  if (!env.ASSETS) {
    return new Response("Static asset binding is not available.", { status: 500 });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return env.ASSETS.fetch(request);
  }

  const assetResponse = await env.ASSETS.fetch(request);

  if (assetResponse.status !== 404) {
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return withNoStore(assetResponse);
    }

    return assetResponse;
  }

  if (STATIC_FILE_PATTERN.test(url.pathname)) {
    return assetResponse;
  }

  const indexRequest = new Request(new URL("/index.html", request.url), request);
  const indexResponse = await env.ASSETS.fetch(indexRequest);
  return withNoStore(indexResponse);
}
