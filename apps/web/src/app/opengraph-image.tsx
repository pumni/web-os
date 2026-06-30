import { ImageResponse } from 'next/og';

export const alt = 'Pumni Web OS';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Hex literals approximate the OKLCH brand stops + slate-950 background
// (Satori has no CSS-var/oklch access).
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px',
        backgroundColor: '#020617',
        backgroundImage:
          'radial-gradient(1000px 500px at 85% -10%, rgba(217,119,87,0.28), transparent)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 96,
          height: 96,
          marginBottom: 40,
          fontSize: 60,
          fontWeight: 700,
          color: '#ffffff',
          borderRadius: 22,
          background: 'linear-gradient(135deg, #d97757 0%, #e8920c 55%, #ef3e58 100%)',
        }}
      >
        P
      </div>
      <div
        style={{
          fontSize: 84,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          backgroundImage: 'linear-gradient(110deg, #d97757, #e8920c 55%, #ef3e58)',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        Pumni Web OS
      </div>
      <div style={{ marginTop: 24, fontSize: 34, color: '#94a3b8', maxWidth: 820 }}>
        A modern, reusable SaaS Starter base — Next.js App Router, Bun workspaces, Supabase SSR.
      </div>
    </div>,
    { ...size },
  );
}
