import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type LinkContextPayload = {
  sourceUrl: string;
  title: string;
  description: string;
  context: string;
};

const MAX_HTML_LENGTH = 800_000;
const MAX_CONTEXT_LENGTH = 3_000;

function decodeHtmlEntities(input: string): string {
  const named: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": "\"",
    "&#39;": "'",
    "&nbsp;": " ",
  };

  return input
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => named[m] ?? m)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function stripTags(input: string): string {
  return decodeHtmlEntities(
    input
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function getAttr(tag: string, attr: string): string {
  const match = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1]?.trim() ?? "";
}

function getMetaContent(html: string, keys: string[]): string {
  const tags = html.match(/<meta\s+[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const name = getAttr(tag, "name").toLowerCase();
    const property = getAttr(tag, "property").toLowerCase();
    const content = getAttr(tag, "content");

    if (!content) continue;
    if (keys.includes(name) || keys.includes(property)) {
      return stripTags(content);
    }
  }

  return "";
}

function pickMainSection(html: string): string {
  const article = html.match(/<article[\s\S]*?<\/article>/i)?.[0];
  if (article) return article;

  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0];
  if (main) return main;

  const body = html.match(/<body[\s\S]*?<\/body>/i)?.[0];
  return body ?? html;
}

function pickHeadlines(html: string): string[] {
  const headlineMatches = html.match(/<h[1-3][^>]*>[\s\S]*?<\/h[1-3]>/gi) ?? [];
  return headlineMatches
    .map((h) => stripTags(h))
    .filter((line) => line.length > 8)
    .slice(0, 6);
}

function trimTo(input: string, maxLen: number): string {
  if (input.length <= maxLen) return input;
  return `${input.slice(0, maxLen - 1)}…`;
}

function buildContext(sourceUrl: string, html: string): LinkContextPayload {
  const title = stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const description = getMetaContent(html, ["description", "og:description", "twitter:description"]);
  const ogTitle = getMetaContent(html, ["og:title", "twitter:title"]);
  const headlineLines = pickHeadlines(html);
  const mainText = stripTags(pickMainSection(html));
  const snippet = trimTo(mainText, 1_600);

  const lines = [
    `URL: ${sourceUrl}`,
    title ? `제목: ${title}` : "",
    ogTitle && ogTitle !== title ? `소셜 제목: ${ogTitle}` : "",
    description ? `설명: ${description}` : "",
    headlineLines.length > 0 ? `핵심 헤드라인: ${headlineLines.join(" | ")}` : "",
    snippet ? `본문 요약: ${snippet}` : "",
  ].filter(Boolean);

  const context = trimTo(lines.join("\n"), MAX_CONTEXT_LENGTH);

  return {
    sourceUrl,
    title,
    description,
    context,
  };
}

function validateHttpUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url")?.trim() ?? "";
  const sourceUrl = validateHttpUrl(rawUrl);

  if (!sourceUrl) {
    return NextResponse.json({ error: "유효한 http/https 링크가 필요합니다." }, { status: 400 });
  }

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "EasyBlogBot/1.0 (+https://easyblog.local)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `링크 요청 실패: ${response.status}` }, { status: 400 });
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json({ error: "HTML 페이지가 아닌 링크입니다." }, { status: 400 });
    }

    const html = trimTo(await response.text(), MAX_HTML_LENGTH);
    const payload = buildContext(sourceUrl, html);

    if (payload.context.replace(/\s+/g, "").length < 30) {
      return NextResponse.json({ error: "링크에서 유효한 텍스트를 추출하지 못했습니다." }, { status: 422 });
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "링크 정보를 가져오지 못했습니다." }, { status: 500 });
  }
}
