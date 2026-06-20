
CREATE POLICY "roteirodoyoutubegratis users read own"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'roteirodoyoutubegratis' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "roteirodoyoutubegratis users insert own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'roteirodoyoutubegratis' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "roteirodoyoutubegratis users update own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'roteirodoyoutubegratis' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'roteirodoyoutubegratis' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "roteirodoyoutubegratis users delete own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'roteirodoyoutubegratis' AND auth.uid()::text = (storage.foldername(name))[1]);
