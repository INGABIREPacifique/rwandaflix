-- Creator film submission uploads.
-- Private bucket: each creator can only read/write files inside their own
-- user-id-named folder (enforced by storage.foldername()). Submissions go
-- through review before becoming public movies — this bucket is NOT public,
-- so uploaded files are not directly accessible via a plain URL. The app
-- generates a long-lived signed URL at submission time instead (see
-- uploadSubmissionFile in src/lib/platform.js for the documented limitation
-- on that approach).

insert into storage.buckets (id, name, public)
values ('creator-submissions', 'creator-submissions', false)
on conflict (id) do nothing;

drop policy if exists "Creators can upload their own submission files" on storage.objects;
create policy "Creators can upload their own submission files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'creator-submissions'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Creators can view their own submission files" on storage.objects;
create policy "Creators can view their own submission files"
on storage.objects for select to authenticated
using (
  bucket_id = 'creator-submissions'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Creators can delete their own submission files" on storage.objects;
create policy "Creators can delete their own submission files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'creator-submissions'
  and (storage.foldername(name))[1] = auth.uid()::text
);
