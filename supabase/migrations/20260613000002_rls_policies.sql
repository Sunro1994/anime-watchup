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
