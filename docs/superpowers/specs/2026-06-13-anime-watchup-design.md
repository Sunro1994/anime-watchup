# 애니메이션 시청 기록 PWA — 설계 문서

작성일: 2026-06-13
상태: 초안 (사용자 리뷰 대기)

## 1. 목적과 범위

친구 그룹(소수)이 함께 사용하는 모바일 우선 애니메이션 시청 기록 PWA. 본인이 우선 사용자이며, 친구 몇 명을 초대 코드로 합류시킨다. 실제 배포를 목표로 한다.

**비목표 (이 단계에서 다루지 않음)**:
- 공개 SNS 기능, 댓글, 좋아요
- 신규 에피소드 푸시 알림 (워커·cron 필요)
- 다중 그룹 가입
- 관리자 페이지

## 2. 사용자 흐름

1. 이메일 입력 → 매직 링크 수신 → 로그인
2. 첫 로그인: `display_name` 입력 → 초대 코드 입력 또는 새 그룹 생성
3. 메인 화면: 시청 중 카드 리스트 (포스터, 진행도 바)
4. 검색 화면: AniList에서 제목 검색 → 내 목록에 추가
5. 작품 상세: 상태 변경, 회차 +1, 평점, 비공개 리뷰, 태그, 시작/완료일
6. 친구 탭: 같은 그룹 멤버의 공개 목록·평점 열람 (리뷰·회차 로그·태그는 비공개)
7. 통계 탭(선택): 이번 달 시청 시간, 평균 평점, 장르 분포

오프라인은 캐시된 목록만 읽기 가능. 쓰기는 온라인 전제.

## 3. 아키텍처

- **프론트**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **백엔드**: Next.js Route Handler / Server Actions (별도 백엔드 서버 없음)
- **DB·인증·스토리지**: Supabase (Postgres + Auth + Row Level Security)
- **외부 API**: AniList GraphQL
- **배포**: Vercel (앱) + Supabase 클라우드 (DB)
- **비용**: $0 (Vercel Hobby + Supabase Free 티어)

## 4. 데이터 모델

```sql
-- users는 Supabase auth.users 확장
public.users (
  id            uuid PRIMARY KEY REFERENCES auth.users(id),
  display_name  text NOT NULL,
  group_id      uuid REFERENCES groups(id),
  created_at    timestamptz DEFAULT now()
)

public.groups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  invite_code   text UNIQUE NOT NULL,          -- 6자리 영숫자
  created_by    uuid REFERENCES public.users(id),
  created_at    timestamptz DEFAULT now()
)

public.anime_cache (
  anilist_id      bigint PRIMARY KEY,
  title_ko        text,
  title_en        text,
  cover_url       text,
  total_episodes  int,
  season_year     int,
  format          text,              -- TV, MOVIE, OVA 등
  genres          text[],
  updated_at      timestamptz DEFAULT now()
)

public.entries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  anilist_id       bigint NOT NULL REFERENCES public.anime_cache(anilist_id),
  status           text NOT NULL CHECK (status IN ('watching','completed','on_hold','dropped','plan_to_watch')),
  current_episode  int NOT NULL DEFAULT 0,
  rating           int CHECK (rating BETWEEN 1 AND 10),
  review           text,                       -- 비공개
  tags             text[] DEFAULT '{}',        -- 비공개
  started_at       date,
  finished_at      date,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  UNIQUE(user_id, anilist_id)
)

public.episode_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id     uuid NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  episode_no   int NOT NULL,
  watched_at   timestamptz DEFAULT now()
)
```

**친구 공개용 뷰**:

```sql
CREATE VIEW public.public_entries_view AS
SELECT id, user_id, anilist_id, status, current_episode, rating,
       started_at, finished_at, created_at, updated_at
FROM public.entries;
-- review, tags, episode_logs는 제외
```

## 5. Row Level Security 정책

- `users`: 본인만 SELECT/UPDATE. INSERT는 트리거(첫 로그인 시 자동 생성).
- `groups`: 멤버만 SELECT. 생성자(created_by)만 UPDATE.
- `anime_cache`: 인증된 사용자 누구나 SELECT. INSERT/UPDATE는 서버(Service Role)만.
- `entries`: 본인은 전체 권한. 같은 그룹 멤버는 `public_entries_view`를 통해서만 SELECT (review/tags/episode_logs 차단).
- `episode_logs`: 본인만 전체 권한. 그룹 멤버도 SELECT 불가.

## 6. AniList 통합

- 검색은 클라이언트가 AniList GraphQL 직접 호출 (rate limit 분당 90회 — 사용자 디바운스로 충분).
- 작품 최초 추가 시 서버 액션이 메타데이터를 `anime_cache`에 upsert.
- 캐시 만료: 7일. 만료된 항목은 다음 검색·조회 시 백그라운드 refresh.

쿼리 예 (검색):
```graphql
query Search($q: String) {
  Page(perPage: 10) {
    media(search: $q, type: ANIME) {
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
```

## 7. 인증

- Supabase Auth — 이메일 매직 링크만 (M1).
- 첫 로그인 시 `public.users` 행 자동 생성 (Supabase 트리거 또는 서버 액션).
- `display_name` 미설정 사용자는 온보딩 페이지로 강제 이동.
- 구글 OAuth는 M3 이후 옵션.

## 8. 배포·운영

- **Vercel**: 메인 브랜치 → 프로덕션. PR → 프리뷰 배포.
- **Supabase 클라우드**: DB·Auth·Storage 한 프로젝트.
- **도메인**: 초기 `<name>.vercel.app`. 정착되면 커스텀 도메인.
- **환경 변수**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (서버 전용, 클라이언트 노출 금지)
- **시크릿 관리**: 로컬은 `.env.local` (`.gitignore`). 푸시 전 `/deploy-precheck`.

## 9. 마일스톤

### M0 — 부트스트랩 (반나절)
- Next.js + Tailwind + Supabase 클라이언트 셋업
- Supabase 프로젝트 생성, 스키마·RLS 마이그레이션
- Vercel 첫 배포 (랜딩 페이지 수준)

### M1 — 핵심 시청 기록 (실배포 가능 최소)
- 매직 링크 로그인 + 온보딩(display_name)
- AniList 검색 → 작품 추가
- 작품 상세 편집(상태, 회차, 평점, 리뷰, 태그, 시작/완료일)
- 내 목록 화면 (상태별 탭)

**M1 검증 기준**: 본인 계정으로 5작품 등록 + 신작 1편 시청 진행도 갱신까지 무리 없이 동작.

### M2 — 그룹·친구 공유
- 그룹 생성·초대 코드 발급·참가 흐름
- 친구 탭: 멤버 목록 → 멤버 선택 시 공개 목록·평점 열람
- `public_entries_view` RLS 적용 검증

### M3 — 회차 로그·통계·PWA 다듬기
- "+1화" 버튼 → `episode_logs` 자동 기록
- 통계 탭 (이번 달 화수, 평균 평점, 장르 분포)
- PWA 매니페스트, 아이콘, 오프라인 캐시 (Service Worker)
- 커스텀 도메인 (선택)

## 10. 위험 요소

- **AniList rate limit**: 검색 디바운스(300ms) 미적용 시 429 가능. 클라이언트에서 디바운스 + 동일 쿼리 캐시.
- **RLS 누락**: 뷰 우회 SELECT가 가능하지 않은지 통합 테스트 필요. M2에서 친구 계정으로 본인 review 노출 안 되는지 수동 검증.
- **시크릿 노출**: Service Role 키가 클라이언트 번들에 섞이지 않도록 `NEXT_PUBLIC_` 접두사 규칙 엄수. `/deploy-precheck` 통과 후에만 푸시.
- **Vercel·Supabase 무료 한도**: 초기 사용량은 한참 미달. 그룹 인원이 10명 넘어가면 재검토.
