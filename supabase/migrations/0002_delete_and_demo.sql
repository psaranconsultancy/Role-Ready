-- RoleReady schema v0.2 (contingency): lets users delete their own resume PDFs,
-- so deleting a practice session also removes its file from Storage.
-- Sessions, questions and answers already allow delete through the "own ..." policies,
-- and questions/answers cascade when their session is deleted.
create policy "resumes: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
