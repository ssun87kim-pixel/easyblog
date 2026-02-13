# EasyBlog 작업 인수인계 (2026-02-13)

## 1) 목표 및 요청사항 요약
- 기본 작성 포맷은 `블로그`.
- 필요 시 같은 결과를 `스레드` 포맷으로 즉시 변환.
- 반대로 스레드에서 블로그 변환도 가능하도록 유지.
- 판매 링크는 필수 입력이며, 참고 링크로 활용.
- Hook/Story/Offer는 화면에 라벨로 노출하지 않고 내부 구조만 반영.
- 생성된 결과를 Convex에 저장.
- 저장 대상 Convex URL은 `https://basic-hippopotamus-607.eu-west-1.convex.cloud`.

## 2) 코드 기준 확인된 구현 범위
- Convex 저장 스키마 및 mutation 추가
  - `convex/schema.ts`
  - `convex/contentLogs.ts`
- 생성/변환 시 저장 호출 연결
  - `components/MainLayout.tsx`
  - 저장 액션 구분값:
    - `generate`
    - `convert_blog_to_thread`
    - `convert_thread_to_blog`
- 저장 테이블
  - `generatedContents`
  - 인덱스:
    - `by_created_at`
    - `by_product_link`

## 3) Convex 연결/검증 결과
- 로그인 상태: 정상 (`npx convex login status` 기준)
- 팀: `ssun87-kim`
- 프로젝트: `easyblog`
- 대상 배포: `basic-hippopotamus-607`
- 실제 DB 쓰기 테스트:
  - mutation `contentLogs:saveGeneratedContent` 실행 성공
  - 최근 데이터 조회에서 저장 문서 확인

## 4) 환경변수 정리
`.env.local` 정리 완료:
- `NEXT_PUBLIC_CONVEX_URL=https://basic-hippopotamus-607.eu-west-1.convex.cloud`
- `CONVEX_DEPLOYMENT=basic-hippopotamus-607`
- OpenRouter 키 라인 깨짐(붙음) 복구 완료

## 5) 관리자(Admin)에서 데이터 확인 방법
1. `https://dashboard.convex.dev` 접속
2. 팀 `ssun87-kim` 선택
3. 프로젝트 `easyblog` 선택
4. 배포 `basic-hippopotamus-607` 선택
5. `Data` 탭에서 `generatedContents` 테이블 확인

## 6) 터미널 확인 명령
```bash
npx convex login status
npx convex deployments
npx convex data generatedContents --deployment-name basic-hippopotamus-607 --limit 20 --format pretty
```

주의:
- 현재 환경에서는 간헐적으로 Sentry DNS 오류가 발생할 수 있어, 필요 시 아래처럼 실행:
```bash
CI=1 npx convex run ...
```
(PowerShell은 `$env:CI='1'`)

## 7) Vercel 관련 정리
- 기존에 이미 Vercel 프로젝트 연결/저장이 되어 있다면 `npx vercel link`는 필수 아님.
- 핵심은 Vercel 환경변수도 로컬과 동일하게 맞추는 것:
  - `NEXT_PUBLIC_CONVEX_URL`
  - `CONVEX_DEPLOYMENT` (서버/CLI 작업 시)

## 8) 보안 메모
- Convex 토큰, API 키 원문은 문서에 저장하지 않음.
- 토큰 확인 위치:
  - `C:\Users\FURSYS\.convex\config.json`
- 키/토큰은 유출 시 즉시 재발급 권장.

## 9) Git 참고
- 과거 반영 커밋: `f1d47ae` (main push 완료 이력)
- 현재 로컬 상태에서 추적 안 된 생성파일 예시:
  - `convex/_generated/`


## 10) 보안 후속 조치(추가 반영)
- 원격 URL에서 토큰 제거 완료
  - `origin`: `https://github.com/ssun87kim-pixel/easyblog.git`
- Windows 자격증명 관리자에서 GitHub 관련 항목 삭제 완료
  - `LegacyGeneric:target=git:https://github.com`
  - `LegacyGeneric:target=GitHub - https://api.github.com/ssun87kim-pixel`
- 남은 수동 작업
  - GitHub 웹에서 기존 PAT `Revoke` 필요
