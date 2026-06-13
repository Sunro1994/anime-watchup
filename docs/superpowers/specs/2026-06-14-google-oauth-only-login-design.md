# Google OAuth 전용 로그인 전환 — 설계

## 목적

매직 링크(이메일 OTP) 인증을 제거하고 Google OAuth 단일 방식으로 교체. 매번 이메일을 받는 번거로움 제거.

## 현재 상태

- 인증 방식: Supabase `signInWithOtp` (이메일 매직 링크)
- 콜백: `src/app/auth/callback/route.ts` — `exchangeCodeForSession` 사용
- 로그인 페이지: `src/app/login/page.tsx` — 이메일 입력 폼 + URL hash implicit-flow 토큰 처리
- 서버 액션: `src/app/login/actions.ts` — `sendMagicLink`
- 데이터 단계: 테스트, 기존 사용자 보존 불필요

## 범위

### 인프라 (사용자가 직접 설정)

1. **Google Cloud Console**
   - OAuth 2.0 Client ID 생성 (Web application)
   - Authorized redirect URI: `https://<supabase-project-ref>.supabase.co/auth/v1/callback`
2. **Supabase Dashboard → Authentication → Providers → Google**
   - Enable
   - Client ID, Client Secret 입력
3. **Supabase Dashboard → Authentication → URL Configuration**
   - Site URL: 프로덕션 도메인
   - Additional Redirect URLs: `https://<prod>/auth/callback`, `http://localhost:3000/auth/callback`
4. **(선택)** `auth.users` 의 기존 매직 링크 테스트 유저 삭제

### 코드 변경

| 파일 | 변경 |
|---|---|
| `src/app/login/page.tsx` | 이메일 폼·hash 처리 제거. "Google로 로그인" 버튼 한 개. 클릭 시 `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '${origin}/auth/callback' }})` |
| `src/app/login/actions.ts` | 삭제 |
| `src/app/auth/callback/route.ts` | 변경 없음 (PKCE code 도 동일하게 `exchangeCodeForSession` 처리) |

## UI

- 제목 "anime-watchup" (그라데이션 유지)
- 설명 "Google 계정으로 로그인하세요." 로 교체
- Google 로고 SVG + "Google로 로그인" 단일 버튼
- 로딩 상태: 클릭 후 Google로 리다이렉트되기 전까지 disabled + spinner
- 에러: URL `?error=auth` 처리 (콜백 실패 시) — 이미 콜백 라우트가 `/login?error=auth` 로 리다이렉트함

## 검증 기준

1. 시크릿 브라우저 → `/login` → Google 버튼 클릭 → Google 동의 화면 → `/auth/callback` → 신규 유저면 `/onboarding`, 기존이면 `/list`
2. `/me` 에서 로그아웃 → `/login` 으로 돌아오고 다시 Google 로그인 가능
3. 새로고침 시 세션 유지
4. 콜백 실패 시 `/login?error=auth` 표시
5. `pnpm tsc --noEmit` 통과

## 범위 외

- 성능 최적화 옵션 C/D (getUser 중복 제거, 네비게이션 피드백)
- 카드 클릭 후 상세 페이지 진입 속도
- 기존 매직 링크 사용자 마이그레이션 (테스트 단계라 불필요)

## 위험

- Supabase 환경 설정 누락 시 OAuth 실패 → URL 설정 체크리스트 따라야 함
- 프로덕션 도메인의 redirect URL이 Google Cloud Console + Supabase 양쪽에 모두 등록되어야 함
