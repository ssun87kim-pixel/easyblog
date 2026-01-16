export interface ProductInfo {
    name: string;
    link: string;
    description: string;
}

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
    imageGuide: string;
}

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

export async function generateTargets(productInfo: ProductInfo): Promise<TargetPersona[]> {
    const prompt = `
    다음 상품 정보를 분석하여 블로그 포스팅을 읽을 만한 타겟 고객 페르소나 4개를 제안해 주세요.
    결과는 반드시 **한국어**로 작성해 주세요.
    
    상품명: ${productInfo.name}
    상품 링크: ${productInfo.link}
    상품 설명: ${productInfo.description}
    
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

export async function generatePost(productInfo: ProductInfo, target: TargetPersona, tone: string): Promise<GeneratedPost> {
    const prompt = `
    다음 상품과 타겟 페르소나를 위한 전문적이고 매력적인 블로그 포스팅을 작성해 주세요.
    모든 내용은 반드시 **한국어**로 성의 있게 작성해 주세요.
    
    상품명: ${productInfo.name}
    상품 링크: ${productInfo.link}
    상품 설명: ${productInfo.description}
    타겟 페르소나: ${target.title} (${target.description})
    설정된 말투/톤: ${tone}
    
    블로그 포스트는 반드시 HSO (Hook, Story, Offer) 구조를 따라야 합니다:
    1. Hook: 독자의 주의를 끌 수 있는 매력적인 도입부.
    2. Story: 상품의 가치와 페르소나의 문제를 해결하는 방법 설명.
    3. Offer: 상품 상세 정보와 함께 행동 유도(Call to Action).
    
    **중요**: 포스팅의 전체적인 말투와 분위기는 반드시 '${tone}' 톤을 유지해야 합니다.
    - 전문적인: 논리적이고 신뢰감 있는 표현, 객관적인 데이터나 성능 강조
    - 감성적인: 부드럽고 따뜻한 표현, 경험과 느낌, 브랜드 가치 강조
    - 친근한: 일상적인 표현, 친구에게 이야기하듯 편안한 문체, 이모지 적극 활용
    
    **이미지 삽입**: 블로그 본문 중간중간에 사진이 들어가야 할 적절한 위치에 [IMAGE: 이미지에 대한 구체적인 설명] 형식의 프롬프트를 넣어서 글을 작성해 주세요. 총 3~4개의 이미지를 적절하게 배치해 주세요.
    
    **제목 제안**: 해당 타겟과 톤에 어울리는 매력적인 블로그 제목 3개를 제안해 주세요. (리스트의 첫 번째 제목이 가장 추천하는 BEST 제목이어야 합니다.)
    
    응답은 오직 아래 필드를 가진 JSON 객체 형식으로만 보내주세요:
    - titles: 추천 제목 3개가 들어있는 배열 (첫 번째 요소가 Best)
    - content: [IMAGE: ...] 형식을 포함한 블로그 포스트 전체 텍스트 (마크다운 지원)
    - imageGuide: 별도의 추천 이미지 목록 (요약본)
    
    형식 예시:
    {
      "titles": ["첫 번째 추천 제목 (BEST)", "두 번째 제목", "세 번째 제목"],
      "content": "제목... \\n\\n [IMAGE: 책상 앞에 앉아있는 사람] \\n\\n 내용...",
      "imageGuide": "..."
    }
  `;

    try {
        const text = await callOpenRouter(prompt);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("Failed to parse JSON from OpenRouter response");
    } catch (error) {
        console.error("OpenRouter Post Generation Error:", error);
        return {
            titles: ["글 생성 중 오류가 발생했습니다.", "오류 제목 2", "오류 제목 3"],
            content: "죄송합니다. 글 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
            imageGuide: "이미지 가이드를 불러올 수 없습니다.",
        };
    }
}


