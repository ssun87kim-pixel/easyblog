export interface ProductInfo {
    name: string;
    link: string;
    description: string;
    referenceContext?: string;
    referenceTitle?: string;
}

export type ContentFormat = "blog" | "thread";

export interface TargetPersona {
    id: string;
    title: string;
    description: string;
    icon: string;
    recommendedTone: string;
}

export interface GeneratedPost {
    titles: string[];
    content: string;
    hashtags: string[];
    threads: string[];
    primaryFormat: ContentFormat;
}

export interface LinkContextData {
    sourceUrl: string;
    title: string;
    description: string;
    context: string;
}

type ThreadFormula = {
    name: string;
    flow: string[];
    focus: string;
};

const THREAD_FORMULAS: ThreadFormula[] = [
    {
        name: "문제-전환-행동(PTA)",
        flow: [
            "강한 문제 제기 훅",
            "왜 지금 바꿔야 하는지 손실 강조",
            "해결 원리 1~2개 제시",
            "실행 가능한 팁/체크리스트",
            "행동 유도 질문",
        ],
        focus: "실수 방지, 즉시 실행, 댓글 유도",
    },
    {
        name: "오해-반박-증거(MRC)",
        flow: [
            "업계에서 흔한 오해 제시",
            "짧고 단호한 반박",
            "구체 사례/숫자 근거",
            "대안 제시",
            "저장/공유를 유도하는 마무리",
        ],
        focus: "의견형 글, 논쟁성 훅, 신뢰 확보",
    },
    {
        name: "전후비교-인사이트-Before/After",
        flow: [
            "전(문제 상황) 장면 제시",
            "후(개선 결과) 장면 제시",
            "결과를 만든 핵심 차이 2~3개",
            "누가 적용하면 좋은지 명확화",
            "지금 바로 할 한 가지 행동 제안",
        ],
        focus: "변화 체감, 이미지 연상, 구매/문의 전환",
    },
];

const THREAD_GLOBAL_RULES = [
    "첫 post 첫 문장은 스크롤을 멈추게 하는 강한 훅으로 시작한다.",
    "각 post는 한 가지 핵심만 전달하고, 문장을 짧게 끊는다.",
    "중간 post 최소 1개에는 숫자/비교/체크리스트를 넣어 신뢰를 만든다.",
    "광고 문구를 앞부분에 몰아 넣지 말고, 마지막 post에서만 행동 유도를 한다.",
    "마지막 post는 댓글 유도 질문 또는 저장 가치 문장으로 끝낸다.",
];

async function callOpenRouter(prompt: string) {
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "EasyBlog",
        },
        body: JSON.stringify({
            "model": "google/gemini-2.0-flash-001",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "OpenRouter API request failed");
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

export async function extractLinkContext(link: string): Promise<LinkContextData> {
    const url = link.trim();
    if (!url) {
        throw new Error("판매 링크가 비어 있습니다.");
    }

    const response = await fetch(`/api/link-context?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
        let message = "링크 크롤링에 실패했습니다.";
        try {
            const data = await response.json() as { error?: string };
            message = data.error || message;
        } catch {
            // noop
        }
        throw new Error(message);
    }

    return response.json() as Promise<LinkContextData>;
}

function sanitizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}

function ensureHashtagPrefix(hashtags: string[]): string[] {
    const normalized = hashtags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .map((tag) => (tag.startsWith("#") ? tag : `#${tag.replace(/^#+/, "")}`));

    return normalized.length > 0 ? normalized : ["#easyblog"];
}

function stripThreadPrefix(text: string): string {
    return text.replace(/^\s*\d+\s*\/\s*\d+\s*/, "").trim();
}

function finalizeThreadBodies(bodies: string[]): string[] {
    const clean = bodies
        .map(stripThreadPrefix)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

    return clean.map((item, index) => `${index + 1}/${clean.length}\n${item}`);
}

function normalizeThreads(threads: string[]): string[] {
    return finalizeThreadBodies(threads);
}

function splitByLength(text: string, maxLength: number): string[] {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized) {
        return [];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < normalized.length) {
        let end = Math.min(start + maxLength, normalized.length);
        if (end < normalized.length) {
            const breakPoint = normalized.lastIndexOf(" ", end);
            if (breakPoint > start + Math.floor(maxLength * 0.5)) {
                end = breakPoint;
            }
        }

        chunks.push(normalized.slice(start, end).trim());
        start = end;
        while (normalized[start] === " ") {
            start += 1;
        }
    }

    return chunks;
}

function extractHashtagsFromText(text: string): string[] {
    const matches = text.match(/#[\p{L}\p{N}_-]+/gu) ?? [];
    return ensureHashtagPrefix(Array.from(new Set(matches)));
}

function stripHsoSectionLabels(content: string): string {
    return content
        .replace(/^\s*(?:#{1,6}\s*)?(?:[-*]\s*)?(?:\d+\s*[\.\)]\s*)?(?:H\s*S\s*O|H\/S\/O|Hook|Story|Offer|후크|스토리|오퍼)\s*[:：\-]\s*/gim, "")
        .replace(/^\s*(?:#{1,6}\s*)?(?:H\s*S\s*O|H\/S\/O|Hook|Story|Offer|후크|스토리|오퍼)\s*$/gim, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function pickThreadFormula(seed: string): ThreadFormula {
    const normalized = seed.trim() || "default";
    const sum = Array.from(normalized).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return THREAD_FORMULAS[sum % THREAD_FORMULAS.length];
}

function buildThreadStrategyGuide(seed: string): string {
    const formula = pickThreadFormula(seed);
    const flow = formula.flow.map((step, index) => `${index + 1}. ${step}`).join("\n");
    const rules = THREAD_GLOBAL_RULES.map((rule, index) => `${index + 1}. ${rule}`).join("\n");

    return `
    적용할 반응형 스레드 공식:
    - 공식명: ${formula.name}
    - 집중 포인트: ${formula.focus}
    - 흐름:
    ${flow}
    
    반응형 작성 규칙:
    ${rules}
  `;
}

function buildThreadFallback(titles: string[], content: string, hashtags: string[]): string[] {
    const cleanTitle = titles[0]?.trim() || "핵심 요약";
    const cleanContent = content
        .replace(/\[IMAGE:.*?\]/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    const paragraphs = cleanContent
        .split(/\n+/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    const threadBodies: string[] = [cleanTitle];

    for (const paragraph of paragraphs) {
        const parts = splitByLength(paragraph, 230);
        for (const part of parts) {
            if (threadBodies.length >= 6) {
                break;
            }
            threadBodies.push(part);
        }
        if (threadBodies.length >= 6) {
            break;
        }
    }

    const extraParts = splitByLength(cleanContent, 150);
    for (const part of extraParts) {
        if (threadBodies.length >= 7) {
            break;
        }
        if (!threadBodies.includes(part)) {
            threadBodies.push(part);
        }
        if (threadBodies.length >= 4) {
            break;
        }
    }

    const defaults = [
        "핵심은 내 상황에 맞는 기준을 먼저 세우는 것입니다.",
        "적용해 보고 막히는 지점은 댓글로 남겨 주세요.",
    ];

    for (const line of defaults) {
        if (threadBodies.length >= 4) {
            break;
        }
        threadBodies.push(line);
    }

    if (threadBodies.length > 7) {
        threadBodies.splice(7);
    }

    const hashtagText = ensureHashtagPrefix(hashtags).join(" ").trim();
    if (hashtagText) {
        const lastIndex = threadBodies.length - 1;
        const merged = `${threadBodies[lastIndex]}\n\n${hashtagText}`;
        if (merged.length <= 270) {
            threadBodies[lastIndex] = merged;
        } else if (threadBodies.length < 7) {
            threadBodies.push(hashtagText);
        }
    }

    return finalizeThreadBodies(threadBodies);
}

function buildBlogFallbackFromThreads(threads: string[], hashtags: string[]): Pick<GeneratedPost, "titles" | "content" | "hashtags"> {
    const cleanThreads = threads
        .map(stripThreadPrefix)
        .filter((item) => item.length > 0);

    const fallbackContent = cleanThreads.length > 0
        ? cleanThreads.join("\n\n")
        : "스레드 원문이 비어 있어 블로그 본문을 생성하지 못했습니다.";

    return {
        titles: ["스레드 내용을 정리한 블로그 글"],
        content: fallbackContent,
        hashtags: ensureHashtagPrefix(hashtags),
    };
}

function sanitizeBlogPayload(raw: unknown): Pick<GeneratedPost, "titles" | "content" | "hashtags"> | null {
    if (!raw || typeof raw !== "object") {
        return null;
    }

    const data = raw as Record<string, unknown>;
    const titles = sanitizeStringArray(data.titles).slice(0, 3);
    const rawContent = typeof data.content === "string" ? data.content.trim() : "";
    const content = stripHsoSectionLabels(rawContent);
    const hashtags = ensureHashtagPrefix(sanitizeStringArray(data.hashtags));

    if (!content) {
        return null;
    }

    return {
        titles: titles.length > 0 ? titles : ["추천 제목을 생성하지 못했습니다."],
        content,
        hashtags,
    };
}

function sanitizeThreadPayload(raw: unknown): { threads: string[]; hashtags: string[] } | null {
    if (!raw || typeof raw !== "object") {
        return null;
    }

    const data = raw as Record<string, unknown>;
    let threads = normalizeThreads(sanitizeStringArray(data.threads));
    if (threads.length > 7) {
        threads = finalizeThreadBodies(threads.slice(0, 7));
    }
    if (threads.length < 4) {
        return null;
    }

    const hashtags = ensureHashtagPrefix(sanitizeStringArray(data.hashtags));
    return { threads, hashtags };
}

function parseJsonObjectFromText(text: string): unknown | null {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        return null;
    }

    try {
        return JSON.parse(jsonMatch[0]);
    } catch {
        return null;
    }
}

function buildReferenceContext(productInfo: ProductInfo): string {
    const link = productInfo.link?.trim();
    const reference = productInfo.referenceContext?.trim();
    const title = productInfo.referenceTitle?.trim();

    if (!link) {
        return "";
    }

    return `
    참고 링크(필수): ${link}
    ${title ? `링크 제목: ${title}` : ""}
    ${reference ? `링크 크롤링 요약(반드시 우선 반영):\n${reference}` : "링크 크롤링 요약: (없음)"}
    
    작성 원칙:
    - 링크 크롤링 요약에 있는 사실/표현을 우선 반영
    - 링크에 없는 정보는 과장하거나 임의로 단정하지 않기
    - 수치/스펙/정책은 모르면 일반 표현으로 처리
  `;
}

export async function generateTargets(productInfo: ProductInfo): Promise<TargetPersona[]> {
    const referenceContext = buildReferenceContext(productInfo);
    const prompt = `
    다음 상품 정보를 분석하여 블로그 포스팅을 읽을 만한 타겟 고객 페르소나 4개를 제안해 주세요.
    결과는 반드시 **한국어**로 작성해 주세요.
    
    상품명: ${productInfo.name}
    상품 링크: ${productInfo.link}
    상품 설명: ${productInfo.description}
    ${referenceContext}
    
    각 페르소나에 대해 가장 적합한 블로그 톤(전문적인, 감성적인, 친근한 중 하나)을 추천해 주세요.
    
    응답은 오직 아래와 같은 JSON 배열 형식으로만 보내주세요.
    - id: 고유 문자열 (1, 2, 3, 4)
    - title: 타겟 페르소나를 나타내는 짧고 매력적인 제목 (예: '성장하는 스타트업 대표', '미니멀 라이프 입문자')
    - description: 이 페르소나가 왜 이 상품에 관심을 가질지에 대한 간단한 설명
    - icon: 관련 있는 이모지 하나
    - recommendedTone: '전문적인', '감성적인', '친근한' 중 해당 타겟에게 가장 잘 어울리는 톤 하나만 선택
    
    **주의 사항**: 페르소나 제목(title)을 정할 때 '김 대표'와 같이 특정 인물처럼 느껴지는 구체적인 이름은 피해주세요. 대신 비슷한 상황에 처한 더 많은 독자들이 공감할 수 있도록 구체적인 '그룹'이나 '상황'을 키워드로 스타일링해 주세요 (예: '집중이 필요한 수험생' O, '고3 수험생 박영희' X).
  `;

    try {
        const text = await callOpenRouter(prompt);
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("Failed to parse JSON from OpenRouter response");
    } catch (error) {
        console.error("OpenRouter Target Generation Error:", error);
        return [
            { id: "1", title: "실속파 고객", description: "가격과 성능을 중시하는 고객", icon: "💰", recommendedTone: "친근한" },
            { id: "2", title: "트렌드 세터", description: "최신 유행에 민감한 고객", icon: "✨", recommendedTone: "감성적인" },
            { id: "3", title: "전문가 그룹", description: "성능과 기능을 중시하는 고객", icon: "🛠️", recommendedTone: "전문적인" },
            { id: "4", title: "선물 구매자", description: "주변 분들께 선물할 제품을 찾는 고객", icon: "🎁", recommendedTone: "친근한" },
        ];
    }
}

async function generateBlogPost(productInfo: ProductInfo, target: TargetPersona, tone: string): Promise<GeneratedPost> {
    const referenceContext = buildReferenceContext(productInfo);
    const prompt = `
    다음 상품과 타겟 페르소나를 위한 전문적이고 매력적인 블로그 포스팅을 작성해 주세요.
    모든 내용은 반드시 **한국어**로 성의 있게 작성해 주세요.
    
    상품명: ${productInfo.name}
    상품 링크: ${productInfo.link}
    상품 설명: ${productInfo.description}
    타겟 페르소나: ${target.title} (${target.description})
    설정된 말투/톤: ${tone}
    ${referenceContext}
    
    블로그 포스트는 반드시 HSO (Hook, Story, Offer) 구조를 따라야 합니다:
    1. Hook: 독자의 주의를 끌 수 있는 매력적인 도입부.
    2. Story: 상품의 가치와 페르소나의 문제를 해결하는 방법 설명.
    3. Offer: 상품 상세 정보와 함께 행동 유도(Call to Action).
    단, 본문에 "Hook", "Story", "Offer", "HSO" 같은 섹션 라벨 텍스트는 절대 출력하지 마세요.
    구조만 내부적으로 반영하고, 독자에게는 자연스러운 일반 본문처럼 보이게 작성하세요.
    
    **중요**: 포스팅의 전체적인 말투와 분위기는 반드시 '${tone}' 톤을 유지해야 합니다.
    - 전문적인: 논리적이고 신뢰감 있는 표현, 객관적인 데이터나 성능 강조
    - 감성적인: 부드럽고 따뜻한 표현, 경험과 느낌, 브랜드 가치 강조
    - 친근한: 일상적인 표현, 친구에게 이야기하듯 편안한 문체, 이모지 적극 활용
    
    **이미지 삽입**: 블로그 본문 중간중간에 사진이 들어가야 할 적절한 위치에 [IMAGE: 이미지에 대한 구체적인 설명] 형식의 프롬프트를 넣어 주세요. 총 3~4개 이미지를 적절히 배치해 주세요.
    
    **제목 제안**: 해당 타겟과 톤에 어울리는 매력적인 블로그 제목 3개를 제안해 주세요. (첫 번째가 BEST)
    
    **해시태그 제안**: SNS 및 블로그 검색 유입에 유리한 해시태그 5~8개를 제안해 주세요.
    
    응답은 오직 아래 JSON 객체로만 보내주세요:
    - titles: 추천 제목 3개 배열 (첫 번째 요소가 Best)
    - content: [IMAGE: ...] 형식을 포함한 블로그 본문 텍스트
    - hashtags: '#'을 포함한 해시태그 문자열 배열
    
    예시:
    {
      "titles": ["첫 번째 추천 제목 (BEST)", "두 번째 제목", "세 번째 제목"],
      "content": "제목... \\n\\n [IMAGE: 책상 앞에 앉아있는 사람] \\n\\n 내용...",
      "hashtags": ["#데스커", "#모션데스크", "#오피스테리어"]
    }
  `;

    try {
        const text = await callOpenRouter(prompt);
        const parsed = parseJsonObjectFromText(text);
        const blog = sanitizeBlogPayload(parsed);
        if (!blog) {
            throw new Error("Failed to parse blog JSON from OpenRouter response");
        }

        return {
            ...blog,
            threads: [],
            primaryFormat: "blog",
        };
    } catch (error) {
        console.error("OpenRouter Blog Generation Error:", error);
        return {
            titles: ["글 생성 중 오류가 발생했습니다.", "오류 제목 2", "오류 제목 3"],
            content: "죄송합니다. 글 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
            hashtags: ["#오류발생"],
            threads: [],
            primaryFormat: "blog",
        };
    }
}

async function generateThreadPost(productInfo: ProductInfo, target: TargetPersona, tone: string): Promise<GeneratedPost> {
    const strategyGuide = buildThreadStrategyGuide(`${productInfo.name}|${target.title}|${tone}`);
    const referenceContext = buildReferenceContext(productInfo);
    const prompt = `
    다음 상품 정보를 바탕으로 Threads(X)에 올릴 짧은 스레드 문안을 작성해 주세요.
    모든 내용은 반드시 한국어로 작성하세요.
    
    상품명: ${productInfo.name}
    상품 링크: ${productInfo.link}
    상품 설명: ${productInfo.description}
    타겟 페르소나: ${target.title} (${target.description})
    설정된 말투/톤: ${tone}
    ${referenceContext}
    
    ${strategyGuide}
    
    조건:
    - 총 4~7개의 posts
    - 각 post는 220자 내외 (최대 280자)
    - 첫 post는 문제/갈등/손실을 건드리는 Hook
    - 2~4번째 post는 근거(숫자, 비교, 체크리스트) 중심
    - 마지막 post는 과장 없는 Offer + 질문형 CTA
    - "좋아요 부탁" 같은 노골적 참여유도 문구는 금지
    - 해시태그는 과하지 않게 4~8개
    
    응답은 오직 아래 JSON 객체로만 보내주세요:
    - threads: 스레드 문안 배열
    - hashtags: '#' 포함 해시태그 배열
    
    예시:
    {
      "threads": ["1번 post 본문", "2번 post 본문", "3번 post 본문", "4번 post 본문", "5번 post 본문"],
      "hashtags": ["#데스커", "#모션데스크", "#오피스테리어"]
    }
  `;

    try {
        const text = await callOpenRouter(prompt);
        const parsed = parseJsonObjectFromText(text);
        const threadPayload = sanitizeThreadPayload(parsed);
        if (!threadPayload) {
            throw new Error("Failed to parse thread JSON from OpenRouter response");
        }

        const defaultTitle = productInfo.name
            ? `${productInfo.name} 스레드 요약`
            : `${target.title} 대상 스레드`;

        return {
            titles: [defaultTitle],
            content: "",
            hashtags: threadPayload.hashtags,
            threads: threadPayload.threads,
            primaryFormat: "thread",
        };
    } catch (error) {
        console.error("OpenRouter Thread Generation Error:", error);
        const fallbackTitle = productInfo.name
            ? `${productInfo.name} 핵심 포인트`
            : `${target.title} 핵심 포인트`;
        const fallbackContent = [
            `${target.title}에게 맞는 핵심 포인트를 먼저 정리해 드립니다.`,
            productInfo.description || `${productInfo.name || "상품"}의 주요 장점을 간단히 비교해 보세요.`,
            productInfo.link ? `자세한 정보는 ${productInfo.link} 에서 확인할 수 있습니다.` : "자세한 정보는 판매 페이지에서 확인해 주세요.",
        ].join(" ");
        const fallbackHashtags = extractHashtagsFromText(`${productInfo.name} ${target.title} #easyblog`);

        return {
            titles: [fallbackTitle],
            content: "",
            hashtags: fallbackHashtags,
            threads: buildThreadFallback([fallbackTitle], fallbackContent, fallbackHashtags),
            primaryFormat: "thread",
        };
    }
}

export async function generatePost(
    productInfo: ProductInfo,
    target: TargetPersona,
    tone: string,
    format: ContentFormat = "blog"
): Promise<GeneratedPost> {
    if (format === "thread") {
        return generateThreadPost(productInfo, target, tone);
    }

    return generateBlogPost(productInfo, target, tone);
}

export async function convertBlogToThreads(generatedPost: GeneratedPost, tone: string): Promise<string[]> {
    if (!generatedPost.content.trim()) {
        return [];
    }

    const strategyGuide = buildThreadStrategyGuide(`${generatedPost.titles.join("|")}|${tone}`);
    const prompt = `
    아래 블로그 글을 Threads(X) 스레드 형식으로 변환해 주세요.
    응답은 한국어로 작성하고, 말투는 '${tone}' 톤을 유지해 주세요.
    
    ${strategyGuide}
    
    조건:
    - 4~7개의 스레드 post
    - 각 post 220자 내외 (최대 280자)
    - 첫 post는 강한 훅, 마지막 post는 질문형 CTA
    - 중복 문장 최소화, 불필요한 미사여구 제거
    - 블로그의 핵심 주장/근거는 유지하되 문장 길이는 짧게 재구성
    
    블로그 제목 후보: ${generatedPost.titles.join(" | ")}
    블로그 본문:
    ${generatedPost.content}
    
    해시태그:
    ${generatedPost.hashtags.join(" ")}
    
    응답은 JSON 객체로만:
    {
      "threads": ["1번 post", "2번 post", "3번 post", "4번 post", "5번 post"]
    }
  `;

    try {
        const text = await callOpenRouter(prompt);
        const parsed = parseJsonObjectFromText(text);
        const threadPayload = sanitizeThreadPayload(parsed);
        if (threadPayload) {
            return threadPayload.threads;
        }
        throw new Error("Failed to parse thread conversion JSON");
    } catch (error) {
        console.error("OpenRouter Blog->Thread Conversion Error:", error);
        return buildThreadFallback(generatedPost.titles, generatedPost.content, generatedPost.hashtags);
    }
}

export async function convertThreadsToBlog(
    threads: string[],
    tone: string
): Promise<Pick<GeneratedPost, "titles" | "content" | "hashtags">> {
    const cleanThreads = threads.map(stripThreadPrefix).filter((item) => item.length > 0);
    const extractedHashtags = extractHashtagsFromText(cleanThreads.join(" "));

    if (cleanThreads.length === 0) {
        return buildBlogFallbackFromThreads(cleanThreads, extractedHashtags);
    }

    const prompt = `
    아래 Threads(X) 스레드들을 하나의 블로그 글로 확장해 주세요.
    응답은 한국어로 작성하고, 말투는 '${tone}' 톤을 유지해 주세요.
    
    반드시 HSO(Hook, Story, Offer) 흐름으로 구성해 주세요.
    단, 본문에는 "Hook", "Story", "Offer", "HSO" 같은 라벨을 절대 적지 마세요.
    라벨 없는 자연스러운 단일 글 형태로 작성하세요.
    
    스레드 원문:
    ${cleanThreads.map((line, index) => `${index + 1}. ${line}`).join("\n")}
    
    응답은 오직 JSON 객체:
    {
      "titles": ["BEST 제목", "대체 제목 2", "대체 제목 3"],
      "content": "블로그 본문...",
      "hashtags": ["#해시태그1", "#해시태그2"]
    }
  `;

    try {
        const text = await callOpenRouter(prompt);
        const parsed = parseJsonObjectFromText(text);
        const blog = sanitizeBlogPayload(parsed);
        if (blog) {
            return blog;
        }
        throw new Error("Failed to parse thread conversion JSON");
    } catch (error) {
        console.error("OpenRouter Thread->Blog Conversion Error:", error);
        return buildBlogFallbackFromThreads(cleanThreads, extractedHashtags);
    }
}


