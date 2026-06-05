# Semantic Search with Vector Embeddings

Add meaning-based search on top of the current keyword search in `/search`, so queries like "fast food" surface McDonald's / Burger King / Salchipapas even when descriptions don't share words with the query.

## 1. Database (pgvector)

Migration:
- `create extension if not exists vector;`
- Add a nullable column `embedding vector(1536)` to:
  - `public.expenses`
  - `public.income`
  - `public.categories`
- Use `openai/text-embedding-3-small` (1536 dims) — cheap, fast, plenty for short transaction text. Store model name in a `embedding_model text` column on each table so we can re-embed safely later.
- Add HNSW cosine indexes on each embedding column (partial: `where embedding is not null`).
- Add a `match_user_transactions(_user_id uuid, _query vector, _match_count int)` SQL function (SECURITY DEFINER, scoped to `_user_id`) that returns unioned rows from expenses + income + categories with `1 - (embedding <=> query)` similarity, ordered desc. Grant `execute` to `authenticated` only.
- Keep RLS untouched; the function filters by `_user_id` and we'll always pass `auth.uid()` from the client.

## 2. Edge function: `embed`

`supabase/functions/embed/index.ts` with `verify_jwt = true` (default).

Two responsibilities:

1. **Embed query** — `POST { mode: "query", text }` → returns `{ embedding: number[] }`.
2. **Backfill / re-embed user data** — `POST { mode: "sync" }` → for the authenticated user, finds rows in `expenses`, `income`, `categories` where `embedding is null` (or model mismatch), batches their text (description / name + category fallback), calls Lovable AI Gateway `/v1/embeddings` with `openai/text-embedding-3-small`, and updates each row using the service role client scoped by `user_id`.

Calls Lovable AI Gateway with `LOVABLE_API_KEY` from env. Handles 402/429 with clear error JSON.

## 3. Auto-embed on insert/update

Two integration points so new data is always searchable:

- **Client hooks**: after a successful insert/update in `useExpenses`, `useIncome`, and `CategoriesContext`, fire-and-forget call to `embed` with `mode: "sync"` (debounced; cheap because it only touches rows missing embeddings).
- **One-shot backfill on app load**: in `AuthContext` after a verified session, call `embed` once per session (guarded by a `sessionStorage` flag) so existing data gets embeddings the first time the user opens the app post-deploy.

No DB triggers — keeps the edge function the single source of truth and avoids needing pg_net.

## 4. Client search integration

Update `src/lib/search.ts` and `src/pages/Search.tsx`:

- New helper `semanticSearch(query)`:
  - If `query.trim().length < 3` → skip (keyword only).
  - Calls `embed` with `mode: "query"` to get the query vector.
  - Calls a Supabase RPC `match_user_transactions` with `auth.uid()`, the vector, and `match_count: 50`.
  - Returns a `Map<string, number>` of `${kind}:${id}` → similarity score.
- Update `filterTransactions` to optionally accept this score map and:
  - Include semantic hits that pass the current type/date/amount/category filters even if they don't match the keyword.
  - Rank results by a blended score: `keywordMatch ? 1 : 0` + `similarity * 0.8`, falling back to date desc when scores tie.
- Debounce semantic lookups (300ms) inside `Search.tsx` so we don't hit the edge function on every keystroke. Show a subtle "AI" badge on result rows that came from semantic (not keyword) matches; keep the existing highlight for keyword matches.
- Internal-only: keep `similarity` on the item for ranking; do not render the number.

The `History` page keeps its current pure-keyword search (it's a timeline, not a finder) — only `/search` gets semantic.

## 5. i18n & UX

- Add strings: `search_semantic_badge` ("Similar" / "Similar"), `search_semantic_hint` (small helper under the input: "Búsqueda inteligente activada" / "Smart search enabled").
- Empty-state copy unchanged.
- No new UI controls — semantic always-on when query length ≥ 3, transparent to the user.

## 6. Security

- Embedding column updates only via edge function using service role, but always filtered by the JWT's `user_id`.
- RPC is SECURITY DEFINER but takes `_user_id` and verifies it matches `auth.uid()` inside the function; returns empty otherwise.
- No embeddings exposed to the client beyond the query vector round-trip; row payloads returned by the RPC contain only ids + kind + similarity (we already have the full rows client-side from `useExpenses`/`useIncome`/`useCategories`).
- `LOVABLE_API_KEY` stays server-side.

## 7. Out of scope (ask before adding)

- Re-ranking with an LLM.
- Multilingual cross-embedding tuning beyond what `text-embedding-3-small` already handles.
- Server-side pagination of search results.

---

## Technical Details

**Embedding text shape**
- Expense: `${description ?? ""} — ${categoryName}` (fallback to category name only when description empty).
- Income: `${description ?? ""} — ${sourceLabel}`.
- Category: `${name}` (single short string).

**RPC return shape**
```sql
returns table (
  kind text,        -- 'expense' | 'income' | 'category'
  row_id uuid,
  similarity float
)
```

**Files**
- New: `supabase/functions/embed/index.ts`, `src/lib/semanticSearch.ts`
- Migration: pgvector + columns + indexes + RPC + grants
- Edited: `src/lib/search.ts`, `src/pages/Search.tsx`, `src/hooks/useExpenses.ts`, `src/hooks/useIncome.ts`, `src/contexts/CategoriesContext.tsx`, `src/contexts/AuthContext.tsx`, `src/lib/i18n.ts`, `supabase/config.toml` (no change needed if defaults work)

Ready to implement on approval.