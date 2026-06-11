# ⚠️ TEST / TEMPORARY — remove later

This folder holds a throwaway experiment, **not** production UI.

## What it is

`login-video-test.tsx` renders a fullscreen YouTube video on the landing
page (`/`) with a "Đăng nhập" button in the top-right corner that opens the
sign-in form in a modal. Purpose: quick visual/playback test only.

## How to remove

1. Delete this folder: `apps/web/src/components/test/`.
2. Revert `apps/web/src/app/page.tsx` to its previous landing-page markup
   (restore the marketing hero + Sign In / Sign Up buttons). It was changed
   only to render `<LoginVideoTest />`; the auth redirect logic stayed the
   same.

That's it — nothing else imports this component.

## Notes

- Autoplay **with sound** is blocked by browsers until the user interacts
  with the page. The component attempts unmuted autoplay and falls back to
  muted playback + auto-unmute on the first click/keypress (plus a visible
  "🔊 Bật tiếng" button).
- The sign-in form markup is duplicated here (rather than shared) on purpose,
  so deleting the test leaves the real `sign-in/page.tsx` untouched.
