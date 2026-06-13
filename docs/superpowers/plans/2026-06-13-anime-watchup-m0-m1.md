# anime-watchup M0–M1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js + Supabase 기반 애니메이션 시청 기록 PWA의 첫 배포 가능 버전을 구현한다. 본인 혼자 매직 링크로 로그인해서 AniList 검색·작품 추가·시청 기록(상태·회차·평점·리뷰·태그·날짜) 편집까지 동작하는 상태가 목표.

**Architecture:** App Router 기반 풀스택 Next.js. 서버 액션이 Supabase Postgres와 직접 통신, RLS로 권한 분리. 외부 메타데이터는 AniList GraphQL을 클라이언트가 직접 호출하고, 최초 추가 시점에 서버가 캐시 테이블에 upsert. 인증은 이메일 매직 링크.

**Tech Stack:**
- Next.js 15 (App Router) + TypeScript (strict) + Tailwind CSS 4
- pnpm
- Supabase (Postgres + Auth + RLS) — `@supabase/ssr`
- AniList GraphQL — `graphql-request`
- Vitest (단위 테스트), React Testing Library (선택)
- Zod (입력 검증), nanoid (초대 코드)
- Vercel 배포

**Spec:** `docs/superpowers/specs/2026-06-13-anime-watchup-design.md`

---

## 사전 준비 (사용자가 직접 해야 하는 외부 작업)

플랜 시작 전 다음을 사용자가 직접 끝낸 상태여야 한다. 각 항목 옆에 발급된 값을 기록해두면 이후 태스크에서 바로 환경변수에 꽂는다.

1. **Supabase 프로젝트 생성**
   - https://supabase.com 가입/로그인 → New Project → 리전: Northeast Asia (Tokyo)
   - Project URL, anon key, service role key 보관
2. **Vercel 계정 준비**
   - https://vercel.com 가입, GitHub 연동
3. **Node.js / pnpm 설치 확인**
   - `node --version` (≥ 20), `pnpm --version` (없으면 `npm i -g pnpm`)
4. **Supabase CLI 설치**
   - `brew install supabase/tap/supabase`
   - `supabase --version`

이 4개가 끝나면 Task 1부터 시작 가능.

---

## File Structure

태스크가 만들 파일·디렉토리 전체. 각 파일은 단일 책임을 가진다.

```
anime-watchup/
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── vitest.config.ts
├── .gitignore                              # (이미 존재)
├── .env.example                            # 환경변수 템플릿
├── .env.local                              # gitignore
├── README.md
│
├── supabase/
│   ├── config.toml                         # supabase init 결과
│   └── migrations/
│       ├── 20260613000001_init_schema.sql
│       ├── 20260613000002_rls_policies.sql
│       └── 20260613000003_triggers_and_views.sql
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                      # 루트 레이아웃 (Tailwind globals)
│   │   ├── globals.css
│   │   ├── page.tsx                        # 비인증: /login, 인증: /list 리다이렉트
│   │   │
│   │   ├── login/
│   │   │   ├── page.tsx                    # 이메일 입력 폼
│   │   │   └── actions.ts                  # sendMagicLink server action
│   │   │
│   │   ├── auth/callback/
│   │   │   └── route.ts                    # 매직 링크 콜백, 세션 교환
│   │   │
│   │   ├── onboarding/
│   │   │   ├── page.tsx                    # display_name + 그룹 선택
│   │   │   └── actions.ts                  # setDisplayName, createGroup, joinGroup
│   │   │
│   │   └── (app)/
│   │       ├── layout.tsx                  # 인증 보호 + 하단 네비
│   │       │
│   │       ├── list/
│   │       │   └── page.tsx                # 상태 탭 + 내 목록
│   │       │
│   │       ├── search/
│   │       │   ├── page.tsx                # AniList 검색 UI
│   │       │   ├── search-client.tsx       # client component (입력 디바운스)
│   │       │   └── actions.ts              # addEntry server action
│   │       │
│   │       └── entries/[id]/
│   │           ├── page.tsx                # 작품 상세
│   │           ├── entry-form.tsx          # client 편집 폼
│   │           └── actions.ts              # updateEntry, deleteEntry
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── browser.ts                  # 브라우저용 클라이언트
│   │   │   ├── server.ts                   # 서버용 (cookies 사용)
│   │   │   ├── service.ts                  # service role (서버 전용)
│   │   │   └── database.types.ts           # supabase gen types 결과
│   │   │
│   │   ├── anilist/
│   │   │   ├── client.ts                   # graphql-request 인스턴스
│   │   │   ├── queries.ts                  # 검색 쿼리 GQL
│   │   │   └── types.ts                    # Media, Title 등 타입
│   │   │
│   │   ├── entries/
│   │   │   ├── schema.ts                   # Zod EntryInput 스키마
│   │   │   └── repository.ts               # CRUD 함수 (서버 전용)
│   │   │
│   │   ├── groups/
│   │   │   ├── invite-code.ts              # 6자리 코드 생성
│   │   │   └── repository.ts               # 그룹 CRUD
│   │   │
│   │   └── auth/
│   │       └── require-user.ts             # 서버에서 사용자/그룹 보장
│   │
│   ├── components/
│   │   ├── EntryCard.tsx                   # 목록 카드
│   │   ├── StatusBadge.tsx                 # 상태 색상
│   │   ├── EpisodeStepper.tsx              # +1/-1 회차 버튼
│   │   ├── RatingPicker.tsx                # 1~10 선택
│   │   ├── TagInput.tsx                    # 태그 입력
│   │   └── BottomNav.tsx                   # 모바일 하단 네비
│   │
│   └── middleware.ts                       # 세션 갱신
│
└── tests/
    ├── lib/
    │   ├── groups/invite-code.test.ts
    │   ├── anilist/queries.test.ts
    │   └── entries/schema.test.ts
    └── setup.ts
```

**테스트 정책**: 순수 함수·검증 로직만 unit 테스트 (`tests/lib/`). UI는 Vercel 프리뷰에서 수동 smoke. RLS는 Supabase Studio에서 두 세션으로 수동 검증 (M2에서 자동화 검토).

---

## M0 — 프로젝트 부트스트랩

목표: Next.js 앱이 Vercel에 떠 있고, Supabase에 스키마가 마이그레이션된 상태.

### Task M0.1: Next.js 프로젝트 초기화

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `tailwind.config.ts`, `postcss.config.js`

- [ ] **Step 1: create-next-app 실행**

작업 디렉토리: `/Users/leeseonro/anime-watchup`

```bash
pnpm dlx create-next-app@latest . \
  --typescript --tailwind --app --src-dir --import-alias '@/*' \
  --no-eslint --use-pnpm --turbopack
```

기존 `.gitignore`, `docs/` 보존됨 (CLI가 덮어쓰기 묻는 항목은 No 또는 keep). 만약 빈 디렉토리가 아니라고 거부하면 `--force` 추가.

- [ ] **Step 2: 동작 확인**

```bash
pnpm dev
```

브라우저로 http://localhost:3000 접속 → Next.js 기본 페이지 확인. Ctrl+C로 종료.

- [ ] **Step 3: 커밋**

```bash
git add -A
git commit -m "chore(m0.1): bootstrap Next.js 15 + TS + Tailwind"
```

### Task M0.2: Vitest 셋업

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`
- Modify: `package.json` (test 스크립트)

- [ ] **Step 1: 의존성 설치**

```bash
pnpm add -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: vitest.config.ts 작성**

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

- [ ] **Step 3: tests/setup.ts 작성**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: package.json scripts 추가**

`package.json`의 `"scripts"` 객체에 추가:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: 더미 테스트로 검증**

`tests/smoke.test.ts` 작성:

```ts
import { describe, it, expect } from 'vitest'
describe('smoke', () => {
  it('runs', () => expect(1 + 1).toBe(2))
})
```

Run: `pnpm test`
Expected: 1 passed.

`tests/smoke.test.ts` 삭제 후 커밋.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "chore(m0.2): add Vitest setup"
```

### Task M0.3: 환경변수 템플릿 + README

**Files:**
- Create: `.env.example`, `.env.local`, `README.md`

- [ ] **Step 1: .env.example 작성**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 2: .env.local 작성** (사용자가 Supabase 콘솔 값을 채워넣음)

`.env.example` 그대로 복사 후 Supabase Project Settings → API에서 값 채우기:
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- service_role secret → `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Step 3: README.md 작성**

```markdown
# anime-watchup

친구 그룹용 애니메이션 시청 기록 PWA.

## Stack
Next.js 15 · TypeScript · Tailwind · Supabase · AniList GraphQL

## Local Dev
\`\`\`bash
pnpm install
cp .env.example .env.local      # 값 채우기
pnpm dev
\`\`\`

## Docs
- Design: \`docs/superpowers/specs/2026-06-13-anime-watchup-design.md\`
- Plan: \`docs/superpowers/plans/\`
```

- [ ] **Step 4: 커밋**

```bash
git add .env.example README.md
git commit -m "chore(m0.3): add env template and README"
```

### Task M0.4: Supabase CLI 초기화 + 원격 연결

**Files:**
- Create: `supabase/config.toml`

- [ ] **Step 1: Supabase 초기화**

```bash
supabase init
```

`supabase/` 디렉토리 생성됨. 기본 `config.toml` 그대로.

- [ ] **Step 2: 원격 프로젝트 링크**

Supabase 콘솔 Project Settings → General에서 Reference ID 복사.

```bash
supabase login                # 브라우저 인증
supabase link --project-ref <REF_ID>
```

- [ ] **Step 3: 커밋**

```bash
git add supabase/
git commit -m "chore(m0.4): init supabase project"
```

### Task M0.5: 마이그레이션 — 스키마

**Files:**
- Create: `supabase/migrations/20260613000001_init_schema.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- users (auth.users 확장)
CREATE TABLE public.users (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text NOT NULL DEFAULT '',
  group_id      uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- groups
CREATE TABLE public.groups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  invite_code   text UNIQUE NOT NULL,
  created_by    uuid REFERENCES public.users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.users
  ADD CONSTRAINT users_group_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE SET NULL;

-- anime_cache (AniList 메타 캐시, 공용)
CREATE TABLE public.anime_cache (
  anilist_id      bigint PRIMARY KEY,
  title_ko        text,
  title_en        text,
  title_romaji    text,
  cover_url       text,
  total_episodes  int,
  season_year     int,
  format          text,
  genres          text[] NOT NULL DEFAULT '{}',
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- entries (사용자별 시청 기록)
CREATE TABLE public.entries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  anilist_id       bigint NOT NULL REFERENCES public.anime_cache(anilist_id),
  status           text NOT NULL CHECK (status IN ('watching','completed','on_hold','dropped','plan_to_watch')),
  current_episode  int NOT NULL DEFAULT 0 CHECK (current_episode >= 0),
  rating           int CHECK (rating BETWEEN 1 AND 10),
  review           text,
  tags             text[] NOT NULL DEFAULT '{}',
  started_at       date,
  finished_at      date,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, anilist_id)
);

CREATE INDEX entries_user_status_idx ON public.entries(user_id, status);

-- episode_logs (회차 로그, M3 본격 활용)
CREATE TABLE public.episode_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id     uuid NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  episode_no   int NOT NULL CHECK (episode_no > 0),
  watched_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entry_id, episode_no)
);
```

- [ ] **Step 2: 원격에 푸시**

```bash
supabase db push
```

성공 메시지 확인. 실패 시 SQL 오류 메시지 보고 수정.

- [ ] **Step 3: Supabase Studio에서 검증**

브라우저 Supabase 콘솔 → Table Editor → 5개 테이블 (users, groups, anime_cache, entries, episode_logs) 보이는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/
git commit -m "feat(m0.5): add initial schema migration"
```

### Task M0.6: 마이그레이션 — RLS 정책

**Files:**
- Create: `supabase/migrations/20260613000002_rls_policies.sql`

- [ ] **Step 1: 마이그레이션 작성**

```sql
-- 모든 public 테이블 RLS 활성화
ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_cache   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_logs  ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY users_self_select ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_self_update ON public.users
  FOR UPDATE USING (auth.uid() = id);
-- INSERT은 트리거로만 (Task M0.7)

-- groups: 멤버만 SELECT, 인증 사용자는 INSERT 가능 (그룹 생성)
CREATE POLICY groups_member_select ON public.groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY groups_authed_insert ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY groups_creator_update ON public.groups
  FOR UPDATE USING (auth.uid() = created_by);

-- anime_cache: 인증된 사용자 누구나 SELECT, INSERT/UPDATE도 허용 (서버에서만 호출하지만 RLS 보수적 설정)
CREATE POLICY anime_cache_authed_all ON public.anime_cache
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- entries: 본인 행 전체 권한
CREATE POLICY entries_self_all ON public.entries
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- episode_logs: 본인 entry의 로그만
CREATE POLICY episode_logs_self_all ON public.episode_logs
  FOR ALL USING (
    entry_id IN (SELECT id FROM public.entries WHERE user_id = auth.uid())
  )
  WITH CHECK (
    entry_id IN (SELECT id FROM public.entries WHERE user_id = auth.uid())
  );
```

> **참고:** 같은 그룹 멤버의 entries 열람은 M2의 `public_entries_view`로 처리한다. M1은 본인 행만 다루기 때문에 그룹 SELECT 정책을 entries에 추가하지 않는다.

- [ ] **Step 2: 원격 적용**

```bash
supabase db push
```

- [ ] **Step 3: RLS 활성화 검증**

Supabase Studio → Authentication → Policies 탭에서 5개 테이블 각각 정책 보이는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/
git commit -m "feat(m0.6): add RLS policies"
```

### Task M0.7: 마이그레이션 — auth.users 트리거

**Files:**
- Create: `supabase/migrations/20260613000003_triggers_and_views.sql`

- [ ] **Step 1: 마이그레이션 작성**

```sql
-- 신규 auth.users 생성 시 public.users 행 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER entries_touch_updated_at
  BEFORE UPDATE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER anime_cache_touch_updated_at
  BEFORE UPDATE ON public.anime_cache
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
```

- [ ] **Step 2: 원격 적용**

```bash
supabase db push
```

- [ ] **Step 3: 트리거 검증**

Supabase Studio → Database → Triggers에서 `on_auth_user_created`, `entries_touch_updated_at`, `anime_cache_touch_updated_at` 3개 확인.

- [ ] **Step 4: 타입 자동 생성**

```bash
supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

빈 디렉토리면 먼저 만들기:

```bash
mkdir -p src/lib/supabase && supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

- [ ] **Step 5: 커밋**

```bash
git add supabase/migrations/ src/lib/supabase/database.types.ts
git commit -m "feat(m0.7): add auth trigger and updated_at touch + gen DB types"
```

### Task M0.8: Vercel 첫 배포

**Files:** (없음 — 외부 작업)

- [ ] **Step 1: GitHub 푸시 확인**

```bash
git push
```

- [ ] **Step 2: Vercel 프로젝트 import**

vercel.com → Add New Project → GitHub `Sunro1994/anime-watchup` 선택 → 기본 Next.js 프리셋.

- [ ] **Step 3: 환경 변수 등록**

Vercel Project Settings → Environment Variables. `.env.local`의 3개를 각각 Production·Preview·Development 모두 체크해서 추가:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

`NEXT_PUBLIC_SITE_URL` 은 일단 건너뛰고 다음 단계 후 결정.

- [ ] **Step 4: Deploy**

Vercel이 자동으로 빌드·배포. 완료 후 `<some-name>.vercel.app` URL 확인.

- [ ] **Step 5: Vercel URL을 env에 반영**

배포된 URL을 Vercel 환경변수 `NEXT_PUBLIC_SITE_URL`에 등록 (Production 전용). 그리고 Supabase Project Settings → Authentication → URL Configuration → Site URL과 Redirect URLs에도 등록:
- Site URL: `https://<your>.vercel.app`
- Additional Redirect URLs: `https://<your>.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`

Vercel에서 Redeploy 트리거. 배포 페이지가 기본 Next.js 화면이면 M0 완료.

> **체크포인트:** 여기까지 끝나면 빈 Next.js 앱이 Vercel에 떠 있고, Supabase 스키마/RLS/트리거가 적용된 상태. M1 시작 가능.

---

## M1 — 핵심 시청 기록

목표: 본인 계정으로 로그인 → AniList 검색 → 작품 추가 → 상태/회차/평점/리뷰/태그/날짜 편집 → 내 목록 조회까지 동작.

### Task M1.1: Supabase 클라이언트 헬퍼

**Files:**
- Create: `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/service.ts`, `src/middleware.ts`

- [ ] **Step 1: 의존성 설치**

```bash
pnpm add @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 2: 브라우저 클라이언트**

`src/lib/supabase/browser.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: 서버 클라이언트**

`src/lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // server component에서 호출 시 무시
          }
        },
      },
    }
  )
}
```

- [ ] **Step 4: Service role 클라이언트** (서버 액션 한정, RLS 우회 시에만)

`src/lib/supabase/service.ts`:

```ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
```

- [ ] **Step 5: 미들웨어 (세션 갱신)**

`src/middleware.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 6: 타입 체크**

```bash
pnpm tsc --noEmit
```

오류 없이 통과해야 함.

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat(m1.1): add supabase client helpers and middleware"
```

### Task M1.2: 초대 코드 생성기 (TDD)

**Files:**
- Create: `src/lib/groups/invite-code.ts`, `tests/lib/groups/invite-code.test.ts`

- [ ] **Step 1: 의존성 설치**

```bash
pnpm add nanoid
```

- [ ] **Step 2: 실패 테스트 작성**

`tests/lib/groups/invite-code.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generateInviteCode } from '@/lib/groups/invite-code'

describe('generateInviteCode', () => {
  it('6자리 영숫자 대문자 문자열을 만든다', () => {
    const code = generateInviteCode()
    expect(code).toMatch(/^[A-Z0-9]{6}$/)
  })

  it('호출마다 다른 값을 만든다 (충돌 확률 무시)', () => {
    const codes = new Set(Array.from({ length: 1000 }, () => generateInviteCode()))
    expect(codes.size).toBeGreaterThan(995)
  })
})
```

- [ ] **Step 3: 테스트 실행 (실패 확인)**

```bash
pnpm test tests/lib/groups/invite-code.test.ts
```

Expected: FAIL (모듈 없음).

- [ ] **Step 4: 구현**

`src/lib/groups/invite-code.ts`:

```ts
import { customAlphabet } from 'nanoid'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const nano = customAlphabet(ALPHABET, 6)

export function generateInviteCode(): string {
  return nano()
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
pnpm test tests/lib/groups/invite-code.test.ts
```

Expected: 2 passed.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat(m1.2): add invite code generator"
```

### Task M1.3: AniList GraphQL 클라이언트 (TDD)

**Files:**
- Create: `src/lib/anilist/client.ts`, `src/lib/anilist/queries.ts`, `src/lib/anilist/types.ts`, `tests/lib/anilist/queries.test.ts`

- [ ] **Step 1: 의존성 설치**

```bash
pnpm add graphql-request graphql
```

- [ ] **Step 2: 타입 정의**

`src/lib/anilist/types.ts`:

```ts
export type AniListMedia = {
  id: number
  title: { romaji: string | null; english: string | null; native: string | null }
  coverImage: { large: string | null }
  episodes: number | null
  seasonYear: number | null
  format: string | null
  genres: string[]
}

export type SearchResult = {
  Page: { media: AniListMedia[] }
}
```

- [ ] **Step 3: 쿼리 정의**

`src/lib/anilist/queries.ts`:

```ts
import { gql } from 'graphql-request'

export const SEARCH_ANIME = gql`
  query SearchAnime($q: String!, $perPage: Int = 10) {
    Page(perPage: $perPage) {
      media(search: $q, type: ANIME, sort: SEARCH_MATCH) {
        id
        title { romaji english native }
        coverImage { large }
        episodes
        seasonYear
        format
        genres
      }
    }
  }
`
```

- [ ] **Step 4: 클라이언트**

`src/lib/anilist/client.ts`:

```ts
import { GraphQLClient } from 'graphql-request'
import { SEARCH_ANIME } from './queries'
import type { SearchResult, AniListMedia } from './types'

const client = new GraphQLClient('https://graphql.anilist.co')

export async function searchAnime(query: string): Promise<AniListMedia[]> {
  if (query.trim().length < 2) return []
  const data = await client.request<SearchResult>(SEARCH_ANIME, { q: query })
  return data.Page.media
}
```

- [ ] **Step 5: 쿼리 단위 테스트**

`tests/lib/anilist/queries.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { SEARCH_ANIME } from '@/lib/anilist/queries'

describe('SEARCH_ANIME query', () => {
  it('search 변수와 type ANIME을 포함한다', () => {
    expect(SEARCH_ANIME).toContain('$q: String!')
    expect(SEARCH_ANIME).toContain('type: ANIME')
    expect(SEARCH_ANIME).toContain('coverImage')
  })
})
```

- [ ] **Step 6: 테스트 실행**

```bash
pnpm test
```

Expected: 3 passed (이전 2 + 새 1).

- [ ] **Step 7: 실 네트워크 smoke (선택)**

Node REPL:

```bash
pnpm tsx -e "import('./src/lib/anilist/client.ts').then(m => m.searchAnime('진격')).then(r => console.log(r.length, r[0]?.title))"
```

10 이하의 숫자와 제목 객체가 출력되면 OK. tsx 없으면 `pnpm add -D tsx`.

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "feat(m1.3): add AniList search client"
```

### Task M1.4: Zod 검증 스키마 (TDD)

**Files:**
- Create: `src/lib/entries/schema.ts`, `tests/lib/entries/schema.test.ts`

- [ ] **Step 1: 의존성 설치**

```bash
pnpm add zod
```

- [ ] **Step 2: 실패 테스트 작성**

`tests/lib/entries/schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { EntryUpdateSchema } from '@/lib/entries/schema'

describe('EntryUpdateSchema', () => {
  it('유효한 입력을 통과시킨다', () => {
    const r = EntryUpdateSchema.safeParse({
      status: 'watching',
      current_episode: 5,
      rating: 8,
      review: '재밌음',
      tags: ['action', 'shounen'],
      started_at: '2026-06-13',
      finished_at: null,
    })
    expect(r.success).toBe(true)
  })

  it('잘못된 status를 거부한다', () => {
    const r = EntryUpdateSchema.safeParse({ status: 'unknown' })
    expect(r.success).toBe(false)
  })

  it('rating 범위 밖을 거부한다', () => {
    expect(EntryUpdateSchema.safeParse({ rating: 0 }).success).toBe(false)
    expect(EntryUpdateSchema.safeParse({ rating: 11 }).success).toBe(false)
  })

  it('current_episode 음수를 거부한다', () => {
    expect(EntryUpdateSchema.safeParse({ current_episode: -1 }).success).toBe(false)
  })
})
```

- [ ] **Step 3: 실패 확인**

```bash
pnpm test tests/lib/entries/schema.test.ts
```

Expected: FAIL.

- [ ] **Step 4: 구현**

`src/lib/entries/schema.ts`:

```ts
import { z } from 'zod'

export const STATUS_VALUES = ['watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'] as const

export const EntryStatusSchema = z.enum(STATUS_VALUES)
export type EntryStatus = z.infer<typeof EntryStatusSchema>

export const EntryUpdateSchema = z
  .object({
    status: EntryStatusSchema.optional(),
    current_episode: z.number().int().min(0).optional(),
    rating: z.number().int().min(1).max(10).nullable().optional(),
    review: z.string().max(5000).nullable().optional(),
    tags: z.array(z.string().min(1).max(30)).max(20).optional(),
    started_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    finished_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  })
  .strict()

export type EntryUpdateInput = z.infer<typeof EntryUpdateSchema>
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
pnpm test tests/lib/entries/schema.test.ts
```

Expected: 4 passed.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat(m1.4): add EntryUpdate Zod schema"
```

### Task M1.5: requireUser 헬퍼

**Files:**
- Create: `src/lib/auth/require-user.ts`

- [ ] **Step 1: 구현**

`src/lib/auth/require-user.ts`:

```ts
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name, group_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.display_name) {
    redirect('/onboarding')
  }

  return { user, profile, supabase }
}
```

- [ ] **Step 2: 타입 체크**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add -A
git commit -m "feat(m1.5): add requireUser server helper"
```

### Task M1.6: 로그인 페이지 + 매직 링크

**Files:**
- Create: `src/app/login/page.tsx`, `src/app/login/actions.ts`, `src/app/auth/callback/route.ts`

- [ ] **Step 1: 매직 링크 발송 server action**

`src/app/login/actions.ts`:

```ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) return { error: '이메일을 입력해주세요.' }

  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  })

  if (error) return { error: error.message }
  return { ok: true }
}
```

- [ ] **Step 2: 로그인 페이지**

`src/app/login/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { sendMagicLink } from './actions'

export default function LoginPage() {
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function action(formData: FormData) {
    const r = await sendMagicLink(formData)
    if (r?.error) {
      setStatus('error')
      setMessage(r.error)
    } else {
      setStatus('sent')
      setMessage('메일함을 확인해주세요.')
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form action={action} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">anime-watchup</h1>
        <p className="text-sm text-gray-600">이메일로 로그인 링크를 받으세요.</p>
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full border rounded p-2"
        />
        <button type="submit" className="w-full bg-black text-white rounded p-2">
          매직 링크 받기
        </button>
        {status !== 'idle' && (
          <p className={status === 'sent' ? 'text-green-700' : 'text-red-700'}>{message}</p>
        )}
      </form>
    </main>
  )
}
```

- [ ] **Step 3: 콜백 라우트**

`src/app/auth/callback/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}/onboarding`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
```

- [ ] **Step 4: 루트 페이지를 로그인 게이트로**

`src/app/page.tsx` 교체:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/list')
  redirect('/login')
}
```

- [ ] **Step 5: 로컬 smoke**

```bash
pnpm dev
```

`http://localhost:3000` → 자동 `/login` 이동 → 이메일 입력 → 메일 도착 → 링크 클릭 → `/onboarding` 도달 (아직 빈 페이지여도 OK).

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat(m1.6): add magic link login and callback"
```

### Task M1.7: 온보딩 페이지 (display_name + 그룹)

**Files:**
- Create: `src/app/onboarding/page.tsx`, `src/app/onboarding/actions.ts`, `src/lib/groups/repository.ts`

- [ ] **Step 1: 그룹 리포지토리**

`src/lib/groups/repository.ts`:

```ts
import { createServiceClient } from '@/lib/supabase/service'
import { generateInviteCode } from './invite-code'

export async function createGroupForUser(userId: string, groupName: string) {
  const svc = createServiceClient()

  // 최대 5회 코드 재시도
  for (let i = 0; i < 5; i++) {
    const code = generateInviteCode()
    const { data: group, error } = await svc
      .from('groups')
      .insert({ name: groupName, invite_code: code, created_by: userId })
      .select('id, invite_code')
      .single()

    if (!error && group) {
      await svc.from('users').update({ group_id: group.id }).eq('id', userId)
      return { ok: true as const, group }
    }
    if (error?.code !== '23505') return { ok: false as const, error: error?.message ?? 'unknown' }
  }
  return { ok: false as const, error: 'invite code collision' }
}

export async function joinGroupByCode(userId: string, code: string) {
  const svc = createServiceClient()
  const { data: group } = await svc.from('groups').select('id').eq('invite_code', code).single()
  if (!group) return { ok: false as const, error: '초대 코드를 찾을 수 없어요.' }
  await svc.from('users').update({ group_id: group.id }).eq('id', userId)
  return { ok: true as const, groupId: group.id }
}
```

- [ ] **Step 2: 서버 액션**

`src/app/onboarding/actions.ts`:

```ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createGroupForUser, joinGroupByCode } from '@/lib/groups/repository'

async function getAuthedUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('not authenticated')
  return user.id
}

export async function saveOnboarding(formData: FormData) {
  const userId = await getAuthedUserId()
  const displayName = String(formData.get('display_name') ?? '').trim()
  const mode = String(formData.get('mode') ?? '')

  if (displayName.length < 1) return { error: '닉네임을 입력해주세요.' }

  const svc = createServiceClient()
  await svc.from('users').update({ display_name: displayName }).eq('id', userId)

  if (mode === 'create') {
    const groupName = String(formData.get('group_name') ?? '').trim() || `${displayName}의 그룹`
    const r = await createGroupForUser(userId, groupName)
    if (!r.ok) return { error: r.error }
  } else if (mode === 'join') {
    const code = String(formData.get('invite_code') ?? '').trim().toUpperCase()
    const r = await joinGroupByCode(userId, code)
    if (!r.ok) return { error: r.error }
  }

  redirect('/list')
}
```

- [ ] **Step 3: 페이지**

`src/app/onboarding/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { saveOnboarding } from './actions'

export default function OnboardingPage() {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [error, setError] = useState('')

  async function action(formData: FormData) {
    formData.set('mode', mode)
    const r = await saveOnboarding(formData)
    if (r?.error) setError(r.error)
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form action={action} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold">시작하기</h1>

        <label className="block">
          <span className="text-sm">닉네임</span>
          <input
            name="display_name"
            required
            className="mt-1 w-full border rounded p-2"
          />
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 p-2 rounded border ${mode === 'create' ? 'bg-black text-white' : ''}`}
          >
            그룹 만들기
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`flex-1 p-2 rounded border ${mode === 'join' ? 'bg-black text-white' : ''}`}
          >
            초대 코드로 참가
          </button>
        </div>

        {mode === 'create' ? (
          <label className="block">
            <span className="text-sm">그룹 이름 (선택)</span>
            <input name="group_name" className="mt-1 w-full border rounded p-2" />
          </label>
        ) : (
          <label className="block">
            <span className="text-sm">초대 코드 (6자리)</span>
            <input
              name="invite_code"
              required
              maxLength={6}
              className="mt-1 w-full border rounded p-2 uppercase tracking-widest"
            />
          </label>
        )}

        <button type="submit" className="w-full bg-black text-white rounded p-2">
          시작
        </button>

        {error && <p className="text-red-700 text-sm">{error}</p>}
      </form>
    </main>
  )
}
```

- [ ] **Step 4: smoke**

매직 링크 로그인 → 콜백 후 `/onboarding` 도달 → 닉네임 + "그룹 만들기" 제출 → `/list`로 이동 (아직 빈 페이지 OK).

Supabase Studio에서 `users` 테이블에 `display_name`, `group_id` 채워졌는지 확인. `groups` 테이블에 행 1개 보이는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat(m1.7): add onboarding (display name + create/join group)"
```

### Task M1.8: 인증 보호 레이아웃 + 하단 네비

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/components/BottomNav.tsx`

- [ ] **Step 1: 하단 네비 컴포넌트**

`src/components/BottomNav.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/list', label: '내 목록' },
  { href: '/search', label: '검색' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 inset-x-0 border-t bg-white">
      <ul className="flex">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.href)
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={`block text-center p-3 text-sm ${active ? 'font-bold' : 'text-gray-500'}`}
              >
                {t.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
```

- [ ] **Step 2: 보호 레이아웃**

`src/app/(app)/layout.tsx`:

```tsx
import { requireUser } from '@/lib/auth/require-user'
import { BottomNav } from '@/components/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser()
  return (
    <div className="min-h-dvh pb-16">
      {children}
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add -A
git commit -m "feat(m1.8): add authed layout and bottom nav"
```

### Task M1.9: AniList 검색 페이지

**Files:**
- Create: `src/app/(app)/search/page.tsx`, `src/app/(app)/search/search-client.tsx`, `src/app/(app)/search/actions.ts`, `src/lib/entries/repository.ts`

- [ ] **Step 1: anime_cache upsert + entries insert 리포지토리**

`src/lib/entries/repository.ts`:

```ts
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { AniListMedia } from '@/lib/anilist/types'

export async function upsertAnimeCache(media: AniListMedia) {
  const svc = createServiceClient()
  await svc.from('anime_cache').upsert({
    anilist_id: media.id,
    title_ko: null,
    title_en: media.title.english,
    title_romaji: media.title.romaji,
    cover_url: media.coverImage.large,
    total_episodes: media.episodes,
    season_year: media.seasonYear,
    format: media.format,
    genres: media.genres,
  })
}

export async function addEntryForCurrentUser(userId: string, anilistId: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entries')
    .insert({
      user_id: userId,
      anilist_id: anilistId,
      status: 'plan_to_watch',
      current_episode: 0,
    })
    .select('id')
    .single()

  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, entryId: data.id }
}
```

- [ ] **Step 2: addEntry 서버 액션**

`src/app/(app)/search/actions.ts`:

```ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { searchAnime } from '@/lib/anilist/client'
import { upsertAnimeCache, addEntryForCurrentUser } from '@/lib/entries/repository'

export async function searchAction(query: string) {
  return searchAnime(query)
}

export async function addEntry(anilistId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  const media = (await searchAnime(`${anilistId}`)).find((m) => m.id === anilistId)
    ?? (await searchAnimeById(anilistId))
  if (!media) return { error: '작품 정보를 찾을 수 없어요.' }

  await upsertAnimeCache(media)
  const r = await addEntryForCurrentUser(user.id, anilistId)
  if (!r.ok) return { error: r.error }
  redirect(`/entries/${r.entryId}`)
}

async function searchAnimeById(id: number) {
  const { GraphQLClient, gql } = await import('graphql-request')
  const client = new GraphQLClient('https://graphql.anilist.co')
  const q = gql`
    query ById($id: Int!) {
      Media(id: $id, type: ANIME) {
        id
        title { romaji english native }
        coverImage { large }
        episodes
        seasonYear
        format
        genres
      }
    }
  `
  try {
    const data = await client.request<{ Media: import('@/lib/anilist/types').AniListMedia }>(q, { id })
    return data.Media
  } catch {
    return undefined
  }
}
```

- [ ] **Step 3: search-client (입력 디바운스)**

`src/app/(app)/search/search-client.tsx`:

```tsx
'use client'

import { useEffect, useState, useTransition } from 'react'
import { searchAction, addEntry } from './actions'
import type { AniListMedia } from '@/lib/anilist/types'

export function SearchClient() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<AniListMedia[]>([])
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        const r = await searchAction(q)
        setResults(r)
      })
    }, 300)
    return () => clearTimeout(handle)
  }, [q])

  return (
    <div className="space-y-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="작품명 검색"
        className="w-full border rounded p-2"
      />
      {pending && <p className="text-sm text-gray-500">검색 중...</p>}
      <ul className="space-y-3">
        {results.map((m) => (
          <li key={m.id} className="flex gap-3 items-center border rounded p-2">
            {m.coverImage.large && (
              <img src={m.coverImage.large} alt="" className="w-12 h-16 object-cover rounded" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {m.title.english ?? m.title.romaji ?? m.title.native}
              </p>
              <p className="text-xs text-gray-500">
                {m.seasonYear ?? '—'} · {m.format ?? '—'} · {m.episodes ?? '?'}화
              </p>
            </div>
            <form action={async () => { await addEntry(m.id) }}>
              <button className="border rounded px-3 py-1 text-sm">추가</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: 페이지**

`src/app/(app)/search/page.tsx`:

```tsx
import { SearchClient } from './search-client'

export default function SearchPage() {
  return (
    <main className="p-4 space-y-4">
      <h1 className="text-lg font-bold">검색</h1>
      <SearchClient />
    </main>
  )
}
```

- [ ] **Step 5: smoke**

로그인 상태로 `/search` → "진격" 입력 → 결과 노출 → "추가" 클릭 → `/entries/<uuid>` 이동 (페이지 미구현이라 404여도 OK). Supabase Studio에서 `entries`, `anime_cache` 행 생성 확인.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat(m1.9): add AniList search and add-entry flow"
```

### Task M1.10: 작품 상세 페이지 + 편집

**Files:**
- Create: `src/app/(app)/entries/[id]/page.tsx`, `src/app/(app)/entries/[id]/entry-form.tsx`, `src/app/(app)/entries/[id]/actions.ts`
- Create: `src/components/StatusBadge.tsx`, `src/components/EpisodeStepper.tsx`, `src/components/RatingPicker.tsx`, `src/components/TagInput.tsx`

- [ ] **Step 1: 컴포넌트 — StatusBadge**

`src/components/StatusBadge.tsx`:

```tsx
import type { EntryStatus } from '@/lib/entries/schema'

const LABEL: Record<EntryStatus, string> = {
  watching: '시청 중',
  completed: '완결',
  on_hold: '보류',
  dropped: '드롭',
  plan_to_watch: '보고 싶음',
}

export function StatusBadge({ status }: { status: EntryStatus }) {
  return <span className="text-xs border rounded px-2 py-0.5">{LABEL[status]}</span>
}

export { LABEL as STATUS_LABEL }
```

- [ ] **Step 2: 컴포넌트 — EpisodeStepper**

`src/components/EpisodeStepper.tsx`:

```tsx
'use client'

type Props = {
  value: number
  max: number | null
  onChange: (v: number) => void
}

export function EpisodeStepper({ value, max, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-8 h-8 border rounded"
      >
        −
      </button>
      <span className="font-mono">
        {value}
        {max ? ` / ${max}` : ''}
      </span>
      <button
        type="button"
        onClick={() => onChange(max ? Math.min(max, value + 1) : value + 1)}
        className="w-8 h-8 border rounded"
      >
        +
      </button>
    </div>
  )
}
```

- [ ] **Step 3: 컴포넌트 — RatingPicker**

`src/components/RatingPicker.tsx`:

```tsx
'use client'

type Props = { value: number | null; onChange: (v: number | null) => void }

export function RatingPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 flex-wrap">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? null : n)}
          className={`w-8 h-8 border rounded text-sm ${value === n ? 'bg-black text-white' : ''}`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: 컴포넌트 — TagInput**

`src/components/TagInput.tsx`:

```tsx
'use client'

import { useState, type KeyboardEvent } from 'react'

type Props = { value: string[]; onChange: (v: string[]) => void }

export function TagInput({ value, onChange }: Props) {
  const [input, setInput] = useState('')

  function commit() {
    const v = input.trim()
    if (!v || value.includes(v)) {
      setInput('')
      return
    }
    onChange([...value, v])
    setInput('')
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !input) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap gap-1 border rounded p-2">
      {value.map((t) => (
        <span key={t} className="bg-gray-100 rounded px-2 py-0.5 text-xs flex items-center gap-1">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))}>×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKey}
        onBlur={commit}
        placeholder="태그 입력 후 Enter"
        className="flex-1 min-w-[120px] outline-none text-sm"
      />
    </div>
  )
}
```

- [ ] **Step 5: update/delete 서버 액션**

`src/app/(app)/entries/[id]/actions.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EntryUpdateSchema } from '@/lib/entries/schema'

export async function updateEntry(entryId: string, raw: unknown) {
  const parsed = EntryUpdateSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.message }

  const supabase = await createClient()
  const { error } = await supabase.from('entries').update(parsed.data).eq('id', entryId)
  if (error) return { error: error.message }

  revalidatePath(`/entries/${entryId}`)
  revalidatePath('/list')
  return { ok: true }
}

export async function deleteEntry(entryId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('entries').delete().eq('id', entryId)
  if (error) return { error: error.message }
  redirect('/list')
}
```

- [ ] **Step 6: 편집 폼 (client)**

`src/app/(app)/entries/[id]/entry-form.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { updateEntry, deleteEntry } from './actions'
import { EpisodeStepper } from '@/components/EpisodeStepper'
import { RatingPicker } from '@/components/RatingPicker'
import { TagInput } from '@/components/TagInput'
import { STATUS_LABEL } from '@/components/StatusBadge'
import { STATUS_VALUES, type EntryStatus } from '@/lib/entries/schema'

type EntryRow = {
  id: string
  status: EntryStatus
  current_episode: number
  rating: number | null
  review: string | null
  tags: string[]
  started_at: string | null
  finished_at: string | null
}

type Props = {
  entry: EntryRow
  totalEpisodes: number | null
}

export function EntryForm({ entry, totalEpisodes }: Props) {
  const [state, setState] = useState(entry)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function patch<K extends keyof EntryRow>(key: K, value: EntryRow[K]) {
    setState((s) => ({ ...s, [key]: value }))
  }

  function save() {
    setSaved(false)
    startTransition(async () => {
      const r = await updateEntry(entry.id, {
        status: state.status,
        current_episode: state.current_episode,
        rating: state.rating,
        review: state.review,
        tags: state.tags,
        started_at: state.started_at,
        finished_at: state.finished_at,
      })
      if (!r.error) setSaved(true)
    })
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">상태</span>
        <select
          value={state.status}
          onChange={(e) => patch('status', e.target.value as EntryStatus)}
          className="mt-1 border rounded p-2 w-full"
        >
          {STATUS_VALUES.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </label>

      <div>
        <span className="text-sm font-medium block mb-1">회차 진행도</span>
        <EpisodeStepper
          value={state.current_episode}
          max={totalEpisodes}
          onChange={(v) => patch('current_episode', v)}
        />
      </div>

      <div>
        <span className="text-sm font-medium block mb-1">평점 (1~10)</span>
        <RatingPicker value={state.rating} onChange={(v) => patch('rating', v)} />
      </div>

      <label className="block">
        <span className="text-sm font-medium">한 줄 리뷰 (비공개)</span>
        <textarea
          value={state.review ?? ''}
          onChange={(e) => patch('review', e.target.value || null)}
          className="mt-1 w-full border rounded p-2 min-h-24"
        />
      </label>

      <div>
        <span className="text-sm font-medium block mb-1">태그 (비공개)</span>
        <TagInput value={state.tags} onChange={(v) => patch('tags', v)} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm font-medium">시작일</span>
          <input
            type="date"
            value={state.started_at ?? ''}
            onChange={(e) => patch('started_at', e.target.value || null)}
            className="mt-1 w-full border rounded p-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">완료일</span>
          <input
            type="date"
            value={state.finished_at ?? ''}
            onChange={(e) => patch('finished_at', e.target.value || null)}
            className="mt-1 w-full border rounded p-2"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex-1 bg-black text-white rounded p-2 disabled:opacity-50"
        >
          {pending ? '저장 중...' : '저장'}
        </button>
        <form action={async () => { await deleteEntry(entry.id) }}>
          <button className="border border-red-500 text-red-600 rounded p-2 px-4">삭제</button>
        </form>
      </div>

      {saved && <p className="text-green-700 text-sm">저장됨</p>}
    </div>
  )
}
```

- [ ] **Step 7: 페이지**

`src/app/(app)/entries/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EntryForm } from './entry-form'

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: entry } = await supabase
    .from('entries')
    .select('id, status, current_episode, rating, review, tags, started_at, finished_at, anilist_id')
    .eq('id', id)
    .single()

  if (!entry) notFound()

  const { data: anime } = await supabase
    .from('anime_cache')
    .select('title_en, title_romaji, cover_url, total_episodes')
    .eq('anilist_id', entry.anilist_id)
    .single()

  const title = anime?.title_en ?? anime?.title_romaji ?? '—'

  return (
    <main className="p-4 space-y-4">
      <div className="flex gap-3 items-start">
        {anime?.cover_url && (
          <img src={anime.cover_url} alt="" className="w-20 h-28 object-cover rounded" />
        )}
        <h1 className="text-xl font-bold flex-1">{title}</h1>
      </div>

      <EntryForm
        entry={{
          id: entry.id,
          status: entry.status,
          current_episode: entry.current_episode,
          rating: entry.rating,
          review: entry.review,
          tags: entry.tags,
          started_at: entry.started_at,
          finished_at: entry.finished_at,
        }}
        totalEpisodes={anime?.total_episodes ?? null}
      />
    </main>
  )
}
```

- [ ] **Step 8: smoke**

검색에서 추가한 작품의 상세로 진입 → 상태/회차/평점/리뷰/태그/날짜 변경 후 저장 → "저장됨" 메시지 → 새로고침 시에도 값 유지.

- [ ] **Step 9: 커밋**

```bash
git add -A
git commit -m "feat(m1.10): add entry detail editor"
```

### Task M1.11: 내 목록 페이지 (상태 탭)

**Files:**
- Create: `src/app/(app)/list/page.tsx`, `src/components/EntryCard.tsx`

- [ ] **Step 1: EntryCard 컴포넌트**

`src/components/EntryCard.tsx`:

```tsx
import Link from 'next/link'
import { StatusBadge } from './StatusBadge'
import type { EntryStatus } from '@/lib/entries/schema'

type Props = {
  id: string
  title: string
  coverUrl: string | null
  status: EntryStatus
  currentEpisode: number
  totalEpisodes: number | null
  rating: number | null
}

export function EntryCard(p: Props) {
  const progress = p.totalEpisodes
    ? `${p.currentEpisode}/${p.totalEpisodes}`
    : `${p.currentEpisode}화`

  return (
    <Link
      href={`/entries/${p.id}`}
      className="flex gap-3 items-center border rounded p-2 hover:bg-gray-50"
    >
      {p.coverUrl && (
        <img src={p.coverUrl} alt="" className="w-12 h-16 object-cover rounded shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{p.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <StatusBadge status={p.status} />
          <span className="text-xs text-gray-600">{progress}</span>
          {p.rating != null && <span className="text-xs">★ {p.rating}</span>}
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: 목록 페이지**

`src/app/(app)/list/page.tsx`:

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/require-user'
import { EntryCard } from '@/components/EntryCard'
import { STATUS_VALUES, type EntryStatus } from '@/lib/entries/schema'
import { STATUS_LABEL } from '@/components/StatusBadge'

const TABS: { value: EntryStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  ...STATUS_VALUES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
]

export default async function ListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { user } = await requireUser()
  const { status: rawStatus } = await searchParams
  const status = (TABS.some((t) => t.value === rawStatus) ? rawStatus : 'all') as
    | EntryStatus
    | 'all'

  const supabase = await createClient()
  let query = supabase
    .from('entries')
    .select('id, status, current_episode, rating, anilist_id, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (status !== 'all') query = query.eq('status', status)

  const { data: entries } = await query

  const ids = (entries ?? []).map((e) => e.anilist_id)
  const { data: animes } = await supabase
    .from('anime_cache')
    .select('anilist_id, title_en, title_romaji, cover_url, total_episodes')
    .in('anilist_id', ids.length ? ids : [0])

  const animeById = new Map((animes ?? []).map((a) => [a.anilist_id, a]))

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-lg font-bold">내 목록</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={t.value === 'all' ? '/list' : `/list?status=${t.value}`}
            className={`whitespace-nowrap text-sm rounded-full border px-3 py-1 ${
              status === t.value ? 'bg-black text-white' : ''
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {(entries ?? []).length === 0 ? (
        <p className="text-gray-500 text-sm">
          아직 등록한 작품이 없어요. <Link href="/search" className="underline">검색</Link>에서 추가해보세요.
        </p>
      ) : (
        <ul className="space-y-2">
          {(entries ?? []).map((e) => {
            const a = animeById.get(e.anilist_id)
            return (
              <li key={e.id}>
                <EntryCard
                  id={e.id}
                  title={a?.title_en ?? a?.title_romaji ?? '—'}
                  coverUrl={a?.cover_url ?? null}
                  status={e.status}
                  currentEpisode={e.current_episode}
                  totalEpisodes={a?.total_episodes ?? null}
                  rating={e.rating}
                />
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
```

- [ ] **Step 3: smoke**

`/list` 진입 → 추가한 작품 카드 노출 → 상태 탭 클릭 → 필터링 동작 → 카드 클릭 → `/entries/<id>` 이동 후 편집 가능.

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "feat(m1.11): add my-list page with status tabs"
```

### Task M1.12: 로그아웃 + 프로필 메뉴

**Files:**
- Modify: `src/components/BottomNav.tsx`
- Create: `src/app/(app)/me/page.tsx`, `src/app/(app)/me/actions.ts`

- [ ] **Step 1: 로그아웃 액션**

`src/app/(app)/me/actions.ts`:

```ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 2: 프로필 페이지**

`src/app/(app)/me/page.tsx`:

```tsx
import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import { signOut } from './actions'

export default async function MePage() {
  const { profile } = await requireUser()
  const supabase = await createClient()

  let inviteCode: string | null = null
  if (profile.group_id) {
    const { data: group } = await supabase
      .from('groups')
      .select('invite_code, name')
      .eq('id', profile.group_id)
      .single()
    inviteCode = group?.invite_code ?? null
  }

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-lg font-bold">내 정보</h1>
      <p>닉네임: <strong>{profile.display_name}</strong></p>

      {inviteCode && (
        <section className="border rounded p-3 space-y-1">
          <p className="text-sm text-gray-600">그룹 초대 코드</p>
          <p className="font-mono text-2xl tracking-widest">{inviteCode}</p>
          <p className="text-xs text-gray-500">친구에게 이 코드를 전달하면 같은 그룹에 합류합니다 (M2에서 활성화).</p>
        </section>
      )}

      <form action={signOut}>
        <button className="border rounded p-2 px-4">로그아웃</button>
      </form>
    </main>
  )
}
```

- [ ] **Step 3: 하단 네비에 탭 추가**

`src/components/BottomNav.tsx`의 `TABS` 배열:

```ts
const TABS = [
  { href: '/list', label: '내 목록' },
  { href: '/search', label: '검색' },
  { href: '/me', label: '내 정보' },
]
```

- [ ] **Step 4: smoke**

`/me` 진입 → 닉네임·초대 코드 노출 → 로그아웃 → `/login` 이동.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat(m1.12): add profile page with invite code and signout"
```

### Task M1.13: 전체 통합 smoke + Vercel 배포

**Files:** (없음)

- [ ] **Step 1: 로컬 전체 시나리오 점검**

체크리스트 (각 항목 통과해야 M1 완료):

- [ ] `/` 비인증 → `/login` 이동
- [ ] 매직 링크 발송 → 메일 클릭 → 첫 사용자면 `/onboarding`, 기존 사용자면 `/list`
- [ ] 온보딩 — 닉네임 + 새 그룹 생성 → `/list`
- [ ] `/search` 입력 디바운스 동작 (300ms)
- [ ] 검색 결과에서 "추가" → 상세 페이지로 이동
- [ ] 상세에서 상태/회차/평점/리뷰/태그/날짜 저장 → 새로고침 시 유지
- [ ] `/list` 상태 탭 필터 동작
- [ ] `/me` 닉네임·초대 코드 노출, 로그아웃 동작
- [ ] 다른 사람 entry URL 직접 접근 시 RLS에 의해 안 보임 (가능하면 두 번째 계정으로 확인)

- [ ] **Step 2: 타입 + 빌드 검증**

```bash
pnpm tsc --noEmit
pnpm test
pnpm build
```

3개 모두 통과.

- [ ] **Step 3: 푸시 → Vercel 자동 배포**

`/deploy-precheck` 통과 후:

```bash
git push
```

Vercel 빌드 완료 대기.

- [ ] **Step 4: 프로덕션 smoke**

Vercel URL 모바일 브라우저로 접속 → 위 시나리오 동일하게 통과.

- [ ] **Step 5: 완료 커밋 (선택)**

```bash
git commit --allow-empty -m "chore(m1.13): m0+m1 deploy verified"
git push
```

> **체크포인트:** 여기까지 끝나면 M1 종료. spec의 "M1 검증 기준" (5작품 등록 + 신작 1편 시청 진행도 갱신)을 실사용으로 확인할 단계.

---

## Self-Review

**Spec 커버리지 (스펙 섹션별 매칭)**

- 1. 목적·범위 → 플랜 전체가 친구 그룹 PWA·M1 본인용 MVP 범위에 맞춤. M2/M3는 별도 플랜 명시. ✓
- 2. 사용자 흐름 1 (로그인) → M1.6 ✓
- 2. 사용자 흐름 2 (메인 카드) → M1.11 ✓
- 2. 사용자 흐름 3 (검색) → M1.9 ✓
- 2. 사용자 흐름 4 (작품 상세 편집) → M1.10 ✓
- 2. 사용자 흐름 5 (친구 탭) → **M2로 명시 이연** ✓
- 2. 사용자 흐름 6 (통계 탭) → **M3로 명시 이연** ✓
- 3. 아키텍처 → M0.1, M1.1 ✓
- 4. 데이터 모델 → M0.5 ✓ (public_entries_view는 M2)
- 5. RLS → M0.6 ✓ (그룹 SELECT는 M2)
- 6. AniList 통합 → M1.3, M1.9 ✓
- 7. 인증 (매직 링크) → M1.6, M0.7 트리거 ✓ (구글 OAuth는 명시 제외)
- 8. 배포·운영 → M0.8, M1.13 ✓ (`/deploy-precheck` 명시)
- 9. 마일스톤 → 본 플랜이 M0+M1 ✓
- 10. 위험요소 (AniList rate limit) → M1.9 디바운스 300ms ✓

**Placeholder 스캔**: TBD/TODO 없음, 모든 코드 블록 완전. ✓

**타입 정합성**:
- `EntryStatus` ↔ `STATUS_VALUES` ↔ `STATUS_LABEL` 일관. ✓
- `AniListMedia` 타입이 `searchAnime`/`searchAnimeById`/`upsertAnimeCache`에서 동일 시그니처. ✓
- `requireUser` 반환 `{ user, profile, supabase }`을 `/me`, `/(app)/layout` 에서 일관 사용. ✓
- `EntryUpdateSchema` 필드와 `entry-form.tsx`의 `patch` 호출 키 일치. ✓

**알려진 단순화**:
- `title_ko` 컬럼은 스키마에 있지만 AniList가 한국어 제목을 제공하지 않아 항상 null 상태. M3에서 별도 번역 매핑 검토.
- `signInWithOtp`는 첫 사용자 자동 가입 모드(default `shouldCreateUser: true`)를 그대로 사용. 화이트리스트는 M2 그룹 도입 후 검토.
