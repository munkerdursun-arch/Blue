const COLORS = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899']

export default function Confetti({ active }) {
  if (!active) return null
  const pieces = Array.from({ length: 40 })
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100
        const delay = Math.random() * 0.4
        const duration = 1.6 + Math.random() * 1.2
        const color = COLORS[i % COLORS.length]
        const size = 6 + Math.random() * 8
        return (
          <span
            key={i}
            className="absolute top-[-10%] rounded-sm animate-confetti-fall"
            style={{
              left: `${left}%`,
              width: size,
              height: size * 1.4,
              backgroundColor: color,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        )
      })}
    </div>
  )
}
