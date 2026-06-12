// On-brand soccer-ball emblem used as the site logo. (The official FIFA World
// Cup mark is trademarked; swap this for the licensed asset if you have rights.)
export function Emblem({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="World Cup 2026">
      <circle cx="32" cy="32" r="27" fill="#FBF9F4" stroke="#C8A24B" strokeWidth="2.5" />
      <g stroke="#1E5B3E" strokeWidth="2.4" strokeLinecap="round">
        <line x1="32" y1="23.4" x2="32" y2="6.5" />
        <line x1="40.13" y1="29.3" x2="57.6" y2="23.6" />
        <line x1="37.02" y1="38.86" x2="47.8" y2="53.7" />
        <line x1="26.98" y1="38.86" x2="16.2" y2="53.7" />
        <line x1="23.87" y1="29.3" x2="6.4" y2="23.6" />
      </g>
      <polygon points="32,23.4 40.13,29.3 37.02,38.86 26.98,38.86 23.87,29.3" fill="#1E5B3E" />
    </svg>
  )
}
