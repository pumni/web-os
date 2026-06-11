-- Create a test user in auth.users
-- Password is 'password123'
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a3a8a8a8-a8a8-a8a8-a8a8-a8a8a8a8a8a8',
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  null,
  null,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Test User", "avatar_url": "https://avatar.vercel.sh/test"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Seed initial user settings
INSERT INTO public.user_settings (user_id, theme, locale, timezone)
VALUES ('a3a8a8a8-a8a8-a8a8-a8a8-a8a8a8a8a8a8', 'dark', 'en', 'UTC')
ON CONFLICT (user_id) DO NOTHING;
