
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
}

export interface GeneratedPost {
  content: string;
  imageGuide: string;
}

export async function generateTargets(productInfo: ProductInfo): Promise<TargetPersona[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const nameLabel = productInfo.name || "이 제품";

  return [
    {
      id: "1",
      title: "가격·후기를 꼼꼼히 비교하는 실속형 검색 고객",
      description: `${nameLabel}와 비슷한 제품을 검색 결과에서 비교하며 가격, 리뷰, 구성을 꼼꼼히 살펴보는 고객`,
      icon: "🔍",
    },
    {
      id: "2",
      title: "공간 활용·인테리어를 신경 쓰는 고객",
      description: `${nameLabel}를 놓을 위치와 전체 인테리어를 함께 고민하며 검색하는 고객`,
      icon: "🏠",
    },
    {
      id: "3",
      title: "업무·작업 효율을 높이려는 직장인·자영업자",
      description: `재택근무나 매장·사무실 환경을 개선하기 위해 ${nameLabel} 같은 제품을 찾아보는 고객`,
      icon: "💼",
    },
    {
      id: "4",
      title: "선물·이벤트용 실용 제품을 찾는 고객",
      description: `집들이, 오픈, 기념일 등 선물·이벤트용으로 ${nameLabel}을 포함한 실용적인 제품을 검색하는 고객`,
      icon: "🎁",
    },
  ];
}

export async function generatePost(productInfo: ProductInfo, target: TargetPersona): Promise<GeneratedPost> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const trimmedDescription = productInfo.description.trim();
  const hasDescription = trimmedDescription.length > 0;
  const hasLink = productInfo.link.trim().length > 0;

  const rawLines = hasDescription
    ? trimmedDescription
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    : [];

  const featureLines =
    rawLines.length > 0
      ? rawLines
      : hasLink
      ? [
          "상세 스펙과 옵션은 상품 페이지를 참고해 주세요.",
          "가격, 구성품, 배송 조건 등은 판매 페이지에서 최신 정보를 확인하는 것이 정확합니다.",
        ]
      : [];

  const baseName = productInfo.name || "이 제품";

  const content = `
[${baseName}] ${target.title}이(가) 한 번에 정리해 볼 정보

안녕하세요.
이번 글에서는 "${baseName}"을(를) 기준으로
${target.title} 입장에서 살펴볼 핵심 정보만 정리해 드립니다.

아래 내용은 제공된 상품 정보와 실제 판매 페이지를 기반으로 작성되었습니다.

---

① ${baseName} 기본 정보 정리

- 상품명: ${baseName}
${hasLink ? `- 상품 페이지: ${productInfo.link}` : ""}

검색하실 때 위 정보를 기준으로 비교해 보시면 편합니다.

---

② 주요 특징·포인트 체크

${featureLines.length > 0 ? featureLines.map((line) => `- ${line}`).join("\n") : "- 제공된 상세 설명이 없습니다."}

위 내용은 제공된 설명과 판매 페이지 정보를 기준으로 정리한 항목입니다.

---

③ 이런 분들이 특히 많이 찾아보는 타겟

- 타겟 유형: ${target.title}
- 특징 요약: ${target.description}

본인의 상황이 위 타겟과 비슷하다면
${baseName} 관련 정보와 옵션을 조금 더 꼼꼼히 비교해 보시는 것을 추천드립니다.

---

마지막으로,
${hasLink ? `자세한 스펙, 옵션, 재고 및 최신 가격 정보는 실제 판매 페이지 (${productInfo.link})에서 확인해 주세요.` : "자세한 스펙, 옵션, 재고 및 최신 가격 정보는 실제 판매 페이지에서 확인해 주세요."}

이 글은 구매를 유도하기보다
검색 시 한 번에 확인하기 어려운 정보를 정리하는 데 초점을 맞추고 있습니다.
  `.trim();

  const imageGuide = `
📸 **권장 이미지 가이드:**

1. **메인 이미지:** 깔끔한 배경에 제품이 돋보이는 고화질 사진 (텍스트를 살짝 얹으면 더 좋아요!)
2. **디테일 컷:** 제품의 질감이나 세부 기능이 돋보이는 접사 촬영
3. **실사용 컷:** 실제 공간에 제품이 놓여 있는 내추럴한 연출 사진 (누끼 이미지보다 신뢰가 가요)
4. **비포 & 애프터:** 제품 사용 전후의 변화를 직관적으로 보여주는 비교샷
5. **감성 컷:** 따뜻한 조명이나 적절한 소품을 활용한 무드 있는 사진
  `.trim();

  return {
    content,
    imageGuide,
  };
}
