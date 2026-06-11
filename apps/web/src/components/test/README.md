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

- The video does **not** autoplay. It loads cued/paused and only starts when
  the user presses the play button on the fullscreen splash. That click is
  also the user gesture browsers require to start playback **with sound**.
- A volume slider + mute toggle appear (bottom-left) after the video starts.
- The sign-in form markup is duplicated here (rather than shared) on purpose,
  so deleting the test leaves the real `sign-in/page.tsx` untouched.
