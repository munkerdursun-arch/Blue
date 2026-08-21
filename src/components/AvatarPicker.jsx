import { AVATARS } from './avatars'

export default function AvatarPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {AVATARS.map((a) => (
        <button
          key={a}
          type="button"
          onClick={() => onChange(a)}
          className={`grid aspect-square place-items-center rounded-2xl text-4xl shadow transition-transform active:scale-90 ${
            value === a ? 'bg-violet-500 ring-4 ring-violet-300 scale-105' : 'bg-white'
          }`}
        >
          {a}
        </button>
      ))}
    </div>
  )
}
