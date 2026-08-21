export default function Teacher({ children, mood = 'happy', size = 'md' }) {
  const faces = { happy: '👩‍🏫', excited: '🥳', encouraging: '😊', thinking: '🤔' }
  const sizes = { sm: 'text-3xl h-12 w-12', md: 'text-4xl h-16 w-16', lg: 'text-6xl h-24 w-24' }
  return (
    <div className="flex items-start gap-3">
      <div className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-orange-300 shadow-md ${sizes[size]}`}>
        {faces[mood] || faces.happy}
      </div>
      {children && (
        <div className="relative mt-1 min-w-0 flex-1 rounded-3xl rounded-tl-md bg-white px-4 py-3 shadow-md">
          {children}
        </div>
      )}
    </div>
  )
}
