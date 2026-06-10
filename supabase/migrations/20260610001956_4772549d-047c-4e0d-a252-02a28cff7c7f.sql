
-- Soft delete columns
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.income   ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS expenses_user_deleted_idx ON public.expenses(user_id, deleted_at);
CREATE INDEX IF NOT EXISTS income_user_deleted_idx   ON public.income(user_id, deleted_at);

-- Update semantic search RPC to skip trashed rows
CREATE OR REPLACE FUNCTION public.match_user_transactions(_user_id uuid, _query extensions.vector, _match_count integer DEFAULT 50)
 RETURNS TABLE(kind text, row_id uuid, similarity double precision)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  if _user_id is null or _user_id <> auth.uid() then
    return;
  end if;

  return query
  (
    select 'expense'::text, e.id, 1 - (e.embedding <=> _query)
    from public.expenses e
    where e.user_id = _user_id and e.embedding is not null and e.deleted_at is null
    order by e.embedding <=> _query
    limit _match_count
  )
  union all
  (
    select 'income'::text, i.id, 1 - (i.embedding <=> _query)
    from public.income i
    where i.user_id = _user_id and i.embedding is not null and i.deleted_at is null
    order by i.embedding <=> _query
    limit _match_count
  )
  union all
  (
    select 'category'::text, c.id, 1 - (c.embedding <=> _query)
    from public.categories c
    where c.user_id = _user_id and c.embedding is not null
    order by c.embedding <=> _query
    limit _match_count
  )
  order by similarity desc
  limit _match_count;
end;
$function$;

-- Best-effort scheduled purge of trash older than 30 days
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('flowbit_purge_trash') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'flowbit_purge_trash');
    PERFORM cron.schedule(
      'flowbit_purge_trash',
      '0 3 * * *',
      $cron$
        DELETE FROM public.expenses WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
        DELETE FROM public.income   WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
      $cron$
    );
  END IF;
END $$;
