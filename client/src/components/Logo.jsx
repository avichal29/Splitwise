/**
 * SplitKaro Logo — bold split-circle with three modes:
 *   1. animated  — continuous CSS split-merge loop
 *   2. progress  — scroll-driven (0 = closed circle, 1 = fully split)
 *   3. default   — static split position
 */
export default function Logo({ size = 40, className = '', animated = false, progress = null }) {
  const p = typeof progress === 'number' ? Math.max(0, Math.min(1, progress)) : null;

  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {animated && (
        <style>{`
          @keyframes sk-left {
            0%, 82%, 100% { transform: translate(256px,256px) rotate(0deg); }
            18%, 62%      { transform: translate(228px,256px) rotate(-14deg); }
          }
          @keyframes sk-right {
            0%, 82%, 100% { transform: translate(256px,256px) rotate(0deg); }
            18%, 62%      { transform: translate(284px,256px) rotate(14deg); }
          }
          @keyframes sk-dots {
            0%, 12%, 72%, 100% { opacity: 0; }
            24%, 58%           { opacity: 0.6; }
          }
          @keyframes sk-ring {
            0%, 82%, 100% { opacity: 0; r: 108px; }
            18%, 62%      { opacity: 0.15; r: 120px; }
          }
        `}</style>
      )}
      <defs>
        <linearGradient id="sk-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      {/* Background */}
      <rect width="512" height="512" rx="112" fill="url(#sk-bg)" />

      {/* Left half-circle */}
      <g
        {...(animated
          ? { style: { animation: 'sk-left 4s cubic-bezier(0.4,0,0.2,1) infinite' } }
          : p !== null
            ? { transform: `translate(${256 - 28 * p},256) rotate(${-14 * p})` }
            : { transform: 'translate(236,256) rotate(-10)' }
        )}
      >
        <path d="M0,-105 A105,105 0 0,0 0,105 Z" fill="white" opacity="0.95" />
      </g>

      {/* Right half-circle */}
      <g
        {...(animated
          ? { style: { animation: 'sk-right 4s cubic-bezier(0.4,0,0.2,1) infinite' } }
          : p !== null
            ? { transform: `translate(${256 + 28 * p},256) rotate(${14 * p})` }
            : { transform: 'translate(276,256) rotate(10)' }
        )}
      >
        <path d="M0,-105 A105,105 0 0,1 0,105 Z" fill="white" opacity="0.95" />
      </g>

      {/* Center accent dots — visible when split */}
      {[204, 256, 308].map((cy) => (
        <circle
          key={cy}
          cx="256"
          cy={cy}
          r="6"
          fill="white"
          {...(animated
            ? { style: { animation: 'sk-dots 4s ease-in-out infinite' } }
            : { opacity: p !== null ? 0.6 * p : (cy === 256 ? 0.35 : 0.5) }
          )}
        />
      ))}

      {/* Glow ring — visible when split */}
      {(animated || (p !== null && p > 0.05)) && (
        <circle
          cx="256"
          cy="256"
          r={p !== null ? 108 + 12 * p : 108}
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          {...(animated
            ? { style: { animation: 'sk-ring 4s ease-in-out infinite' } }
            : { opacity: p !== null ? 0.15 * p : 0 }
          )}
        />
      )}
    </svg>
  );
}
