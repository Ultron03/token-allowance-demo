const API_URL = process.env.TOKEN_ALLOWANCE_API_URL ?? "http://localhost:8080";

const FORWARDED_PATHS = new Set(["chat", "chat/stream", "agent", "me/budget"]);

const FORWARDED_RESPONSE_HEADERS = ["content-type", "retry-after"];

/** Forwards the demo endpoints to the Spring app, so the browser needs no CORS setup; responses stream through. */
async function forward(request: Request, ctx: RouteContext<"/api/[...path]">): Promise<Response> {
  const path = (await ctx.params).path.join("/");
  if (!FORWARDED_PATHS.has(path)) {
    return Response.json({ title: "Not found", detail: `No demo endpoint /${path}` }, { status: 404 });
  }

  const headers = new Headers();
  for (const name of ["authorization", "content-type"]) {
    const value = request.headers.get(name);
    if (value !== null) {
      headers.set(name, value);
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/${path}`, {
      method: request.method,
      headers,
      body: request.method === "GET" ? undefined : await request.text(),
      cache: "no-store",
    });
  } catch {
    return Response.json(
      {
        title: "Demo app not reachable",
        detail: `Nothing answers at ${API_URL}. Start it with ./mvnw spring-boot:run in the demo folder.`,
      },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value !== null) {
      responseHeaders.set(name, value);
    }
  }
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export const GET = forward;
export const POST = forward;
