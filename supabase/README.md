# RwandaFlix Supabase setup

The SQL files in `supabase/` are the source-controlled database definition for RwandaFlix.

## Important distinction

A migration file committed to GitHub is **not automatically executed** in the Supabase project. The live Supabase database can therefore be ahead of, behind, or different from the repository.

## Safe reconciliation order

For a fresh Supabase project:

1. Run `schema.sql` first.
2. Run migrations in `supabase/migrations/` in filename order.

For the current partially restored project, use:

`supabase/migrations/20260901_schema_reconciliation.sql`

This migration is intended to reconcile the core RwandaFlix tables, columns, indexes, auth trigger, and RLS policies without deleting application data. It also removes/recreates only the named RwandaFlix policies so an already-existing policy does not cause a duplicate-policy failure.

## Before declaring the live database synchronized

Run this reconciliation migration in the Supabase SQL Editor, then verify the resulting tables/policies. The application should be tested against the same project after the SQL succeeds.

## 2026-09-02: ratings public-read fix

Also run `supabase/migrations/20260902_ratings_public_read.sql`. Without it, the `ratings`
table's original policy only lets a user see their own rating row, so an average rating
can never be computed or shown to anyone (including the person who submitted it, once
another user's row is involved). This migration only adds a policy; it does not remove
the existing one.

Do not run older creator migrations repeatedly just because they exist in Git. They remain historical migration sources; the reconciliation migration is the safer bridge for a database whose previous migration state is uncertain.
