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
