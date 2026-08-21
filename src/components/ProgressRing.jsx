export default function ProgressRing({ value, max, size = 64, stroke = 8, children }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(1, max ? value / max : 0)
  const offset = circumference * (1 - pct)
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e9d5ff" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#8b5cf6"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xs font-extrabold text-violet-700">{children}</div>
    </div>
  )
}
