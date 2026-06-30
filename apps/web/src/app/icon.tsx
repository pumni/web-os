import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// Brand "P" mark on the warm coral→amber→rose gradient. Hex literals approximate
// the OKLCH --brand-gradient-* stops (Satori has no CSS-var/oklch access).
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        fontWeight: 700,
        color: '#ffffff',
        borderRadius: 7,
        background: 'linear-gradient(135deg, #d97757 0%, #e8920c 55%, #ef3e58 100%)',
      }}
    >
      P
    </div>,
    { ...size },
  );
}
