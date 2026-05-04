import { ImageResponse } from 'next/og';

export const alt = 'Stackdify — Practice system design';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#09090b',
          fontFamily: 'Inter, Arial, sans-serif',
          padding: '60px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Aurora glow — top-left */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            left: '-80px',
            width: '560px',
            height: '560px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,255,163,0.12) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        {/* Aurora glow — bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: '-160px',
            right: '-100px',
            width: '480px',
            height: '480px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,255,163,0.07) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <svg width="40" height="40" viewBox="0 0 36 36">
            <polygon points="18,0 36,9 36,27 18,36 0,27 0,9" fill="#00ffa3" />
          </svg>
          <span style={{ color: '#fafafa', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Stackdify
          </span>
          {/* Badge */}
          <div
            style={{
              marginLeft: '12px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '999px',
              border: '1px solid rgba(0,255,163,0.35)',
              backgroundColor: 'rgba(0,255,163,0.08)',
              padding: '4px 14px',
            }}
          >
            <span style={{ color: '#00ffa3', fontSize: '14px', fontWeight: 600 }}>
              System Design Practice
            </span>
          </div>
        </div>

        {/* Architecture graph preview */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginTop: '52px',
          }}
        >
          {/* User actor node */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0,255,163,0.12)',
              border: '2px solid rgba(0,255,163,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#00ffa3" strokeWidth="2" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#00ffa3" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Connector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
            <div style={{ height: '2px', width: '44px', backgroundColor: '#00ffa3', borderRadius: '2px', opacity: 0.5 }} />
          </div>

          {/* Load Balancer — filled node */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              width: '164px',
              height: '78px',
              borderRadius: '14px',
              backgroundColor: '#141414',
              border: '1.5px solid #2a2a2a',
              padding: '14px 16px',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00ffa3' }} />
              <span style={{ color: '#a1a1aa', fontSize: '11px', fontWeight: 500 }}>NETWORK</span>
            </div>
            <span style={{ color: '#fafafa', fontSize: '14px', fontWeight: 600 }}>Load Balancer</span>
          </div>

          {/* Connector */}
          <div style={{ height: '2px', width: '44px', backgroundColor: '#00ffa3', borderRadius: '2px', opacity: 0.5 }} />

          {/* App Server — filled node */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              width: '164px',
              height: '78px',
              borderRadius: '14px',
              backgroundColor: '#141414',
              border: '1.5px solid #2a2a2a',
              padding: '14px 16px',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00ffa3' }} />
              <span style={{ color: '#a1a1aa', fontSize: '11px', fontWeight: 500 }}>COMPUTE</span>
            </div>
            <span style={{ color: '#fafafa', fontSize: '14px', fontWeight: 600 }}>App Server</span>
          </div>

          {/* Connector */}
          <div style={{ height: '2px', width: '44px', backgroundColor: '#fcd34d', borderRadius: '2px', opacity: 0.6 }} />

          {/* Blank slot */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '164px',
              height: '78px',
              borderRadius: '14px',
              border: '2px dashed #fb923c',
              backgroundColor: 'rgba(251,146,60,0.08)',
              gap: '6px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#fb923c" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ color: '#fb923c', fontSize: '13px', fontWeight: 600 }}>Drop here</span>
          </div>

          {/* Connector */}
          <div style={{ height: '2px', width: '44px', backgroundColor: '#fcd34d', borderRadius: '2px', opacity: 0.6 }} />

          {/* Cache — filled node */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              width: '164px',
              height: '78px',
              borderRadius: '14px',
              backgroundColor: '#141414',
              border: '1.5px solid #2a2a2a',
              padding: '14px 16px',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fcd34d' }} />
              <span style={{ color: '#a1a1aa', fontSize: '11px', fontWeight: 500 }}>STORAGE</span>
            </div>
            <span style={{ color: '#fafafa', fontSize: '14px', fontWeight: 600 }}>Cache (Redis)</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
          <span
            style={{
              color: '#fafafa',
              fontSize: '64px',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-2px',
            }}
          >
            Master System Design
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '3px', backgroundColor: '#00ffa3', borderRadius: '2px' }} />
            <span style={{ color: '#a1a1aa', fontSize: '26px', fontWeight: 400 }}>
              Drag, drop, and learn real-world architecture.
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
