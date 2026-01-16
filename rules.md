asyBlog 구현 계획
목표
Next.js, Shadcn UI, Framer Motion을 사용하여 대리점 운영자를 위한 AI 블로그 포스팅 생성기 "EasyBlog"를 구축합니다. 참고: 요청하신 대로 Google Gemini API는 제거/모의(Mock) 처리됩니다.

사용자 검토 필요
IMPORTANT

모의(Mock) AI 통합: Gemini API가 명시적으로 제거/무시되므로, 모든 "AI" 기능(타겟 추천, 콘텐츠 생성)은 데모 목적으로 모의/정적 데이터 또는 간단한 휴리스틱 템플릿을 반환합니다.

변경 제안
프로젝트 구조 (신규)
EasyBlog 디렉토리에 새로운 Next.js 애플리케이션을 초기화합니다.

기술 스택
프레임워크: Next.js 14+ (App Router)
스타일링: Tailwind CSS
UI 컴포넌트: Shadcn UI (Radix Primitives)
아이콘: Lucide React
애니메이션: Framer Motion
테마: Indigo/Purple 그라디언트 (프리미엄 느낌)
컴포넌트
[레이아웃]
app/layout.tsx: ThemeProvider와 toaster를 포함한 전역 레이아웃.
app/page.tsx: 메인 컨테이너.
components/MainLayout.tsx: 스플릿 뷰 구현 (왼쪽: 입력, 오른쪽: 미리보기).
[입력 섹션]
components/InputForm.tsx:
제품명, 링크, 원본 텍스트.
버튼: "타겟 분석" (Mock 트리거).
타겟 독자 선택기 (카드 형태).
버튼: "글 생성".
[미리보기 섹션]
components/ResultPreview.tsx:
모바일 너비 컨테이너 (약 400px 너비 시뮬레이션 또는 반응형 뷰).
탭: 블로그 내용 / 이미지 가이드.
콘텐츠 렌더링: HSO 구조 (Hook, Story, Offer).
내보내기 버튼: 복사, HTML/TXT로 저장.
[서비스]
lib/mock-ai.ts:
generateTargets(productInfo): 4개의 사전 정의된 페르소나 반환.
generatePost(productInfo, target): 이모지가 포함된 구조화된 블로그 포스트 텍스트 반환.
검증 계획
빌드 확인: npm run build를 실행하여 오류가 없는지 확인합니다.
시각적 확인:
Indigo/Purple 그라디언트 테마 확인.
반응형 동작 확인 (PC에서는 스플릿 뷰, 모바일에서는 스택).
기능 확인:
"타겟 분석" 클릭 -> 모의 페르소나 확인.
"생성" 클릭 -> 모의 블로그 포스트 확인.
복사/다운로드 버튼 테스트.