
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS youtube_channel_url text,
  ADD COLUMN IF NOT EXISTS channel_analysis text;
