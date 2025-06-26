'use client'

export default function FloatingOptionButtons() {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex space-x-2">
      <button className="px-3 py-1 bg-neutral-800/80 text-white text-xs rounded-lg backdrop-blur border border-neutral-700">Background</button>
      <button className="px-3 py-1 bg-neutral-800/80 text-white text-xs rounded-lg backdrop-blur border border-neutral-700">Clothing</button>
      <button className="px-3 py-1 bg-neutral-800/80 text-white text-xs rounded-lg backdrop-blur border border-neutral-700">Colour</button>
    </div>
  );
} 