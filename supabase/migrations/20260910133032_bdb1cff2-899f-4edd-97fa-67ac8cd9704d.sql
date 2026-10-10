create policy "own upload receipts" on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own read receipts" on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));

create policy "own upload attachments" on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own read attachments" on storage.objects for select to authenticated
  using (bucket_id = 'attachments' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));