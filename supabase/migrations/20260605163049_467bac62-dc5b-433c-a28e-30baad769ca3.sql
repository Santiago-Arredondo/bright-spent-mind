
create extension if not exists vector;

alter table public.expenses   add column if not exists embedding vector(1536);
alter table public.expenses   add column if not exists embedding_model text;
alter table public.income     add column if not exists embedding vector(1536);
alter table public.income     add column if not exists embedding_model text;
alter table public.categories add column if not exists embedding vector(1536);
alter table public.categories add column if not exists embedding_model text;

create index if not exists expenses_embedding_idx
  on public.expenses using hnsw (embedding vector_cosine_ops);
create index if not exists income_embedding_idx
  on public.income using hnsw (embedding vector_cosine_ops);
create index if not exists categories_embedding_idx
  on public.categories using hnsw (embedding vector_cosine_ops);

create or replace function public.match_user_transactions(
  _user_id uuid,
  _query vector(1536),
  _match_count int default 50
)
returns table (
  kind text,
  row_id uuid,
  similarity float
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if _user_id is null or _user_id <> auth.uid() then
    return;
  end if;

  return query
  (
    select 'expense'::text as kind, e.id as row_id,
           1 - (e.embedding <=> _query) as similarity
    from public.expenses e
    where e.user_id = _user_id and e.embedding is not null
    order by e.embedding <=> _query
    limit _match_count
  )
  union all
  (
    select 'income'::text as kind, i.id as row_id,
           1 - (i.embedding <=> _query) as similarity
    from public.income i
    where i.user_id = _user_id and i.embedding is not null
    order by i.embedding <=> _query
    limit _match_count
  )
  union all
  (
    select 'category'::text as kind, c.id as row_id,
           1 - (c.embedding <=> _query) as similarity
    from public.categories c
    where c.user_id = _user_id and c.embedding is not null
    order by c.embedding <=> _query
    limit _match_count
  )
  order by similarity desc
  limit _match_count;
end;
$$;

revoke all on function public.match_user_transactions(uuid, vector, int) from public;
grant execute on function public.match_user_transactions(uuid, vector, int) to authenticated;
