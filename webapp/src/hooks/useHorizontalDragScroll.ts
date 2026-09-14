import { useEffect, type RefObject } from 'react'

const DRAG_THRESHOLD_PX = 8
const VELOCITY_SAMPLE_MS = 80
const MIN_COAST_VELOCITY = 0.08
const FRICTION_PER_MS = 0.0032
const MAX_VELOCITY = 3.5

type Sample = { t: number; x: number }

/**
 * Click-and-drag to scroll a horizontal overflow container, with inertial
 * coasting on release. Pointer capture starts only after the drag threshold
 * so thumbnail clicks still reach the item buttons.
 */
export function useHorizontalDragScroll(
  ref: RefObject<HTMLElement | null>,
  active = true,
  resetKey?: unknown,
) {
  useEffect(() => {
    const el = ref.current
    if (!el || !active) return

    let pointerId: number | null = null
    let startX = 0
    let startScroll = 0
    let isPointerDown = false
    let didDrag = false
    let previousBehavior = ''
    let previousSnap = ''
    let previousRowSnap = ''
    let coastFrame = 0
    let samples: Sample[] = []
    const row = el.firstElementChild as HTMLElement | null

    const stopCoast = () => {
      if (coastFrame) {
        cancelAnimationFrame(coastFrame)
        coastFrame = 0
      }
    }

    const restoreSnap = () => {
      el.style.scrollBehavior = previousBehavior
      el.style.scrollSnapType = previousSnap
      if (row) row.style.scrollSnapType = previousRowSnap
      el.classList.remove('is-drag-scrolling')
    }

    const maxScrollLeft = () => {
      const contentWidth = (el.firstElementChild as HTMLElement)?.scrollWidth || el.scrollWidth
      return Math.max(0, contentWidth - el.clientWidth)
    }

    const beginDrag = (event: PointerEvent) => {
      didDrag = true
      stopCoast()
      previousBehavior = el.style.scrollBehavior
      previousSnap = el.style.scrollSnapType
      previousRowSnap = row?.style.scrollSnapType ?? ''
      el.style.scrollBehavior = 'auto'
      el.style.scrollSnapType = 'none'
      if (row) row.style.scrollSnapType = 'none'
      el.classList.add('is-drag-scrolling')
      try {
        el.setPointerCapture(event.pointerId)
      } catch {
        // capture is best-effort
      }
    }

    const releaseVelocity = (now: number) => {
      const recent = samples.filter((sample) => now - sample.t <= VELOCITY_SAMPLE_MS)
      if (recent.length < 2) return 0
      const first = recent[0]
      const last = recent[recent.length - 1]
      const dt = last.t - first.t
      if (dt <= 0) return 0
      const velocity = -(last.x - first.x) / dt
      if (!Number.isFinite(velocity)) return 0
      return Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocity))
    }

    const startCoast = (velocityPxPerMs: number) => {
      let velocity = velocityPxPerMs
      let last = performance.now()

      const tick = (now: number) => {
        const dt = Math.min(32, now - last)
        last = now
        velocity *= Math.exp(-FRICTION_PER_MS * dt)
        const next = el.scrollLeft + velocity * dt
        const max = maxScrollLeft()
        if (next <= 0 || next >= max) {
          el.scrollLeft = Math.max(0, Math.min(max, next))
          restoreSnap()
          coastFrame = 0
          return
        }
        el.scrollLeft = next
        if (Math.abs(velocity) < MIN_COAST_VELOCITY) {
          restoreSnap()
          coastFrame = 0
          return
        }
        coastFrame = requestAnimationFrame(tick)
      }

      coastFrame = requestAnimationFrame(tick)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || event.pointerType === 'pen') return
      if (event.button !== 0) return

      pointerId = event.pointerId
      startX = event.clientX
      startScroll = el.scrollLeft
      isPointerDown = true
      didDrag = false
      samples = [{ t: event.timeStamp, x: event.clientX }]
      stopCoast()
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!isPointerDown || event.pointerId !== pointerId) return
      const deltaX = event.clientX - startX
      if (!didDrag) {
        if (Math.abs(deltaX) < DRAG_THRESHOLD_PX) return
        beginDrag(event)
      }
      event.preventDefault()
      samples.push({ t: event.timeStamp, x: event.clientX })
      samples = samples.filter((sample) => event.timeStamp - sample.t <= VELOCITY_SAMPLE_MS)
      el.scrollLeft = startScroll - deltaX
    }

    const onPointerUp = (event: PointerEvent) => {
      if (!isPointerDown || event.pointerId !== pointerId) return
      isPointerDown = false
      pointerId = null
      const velocity = didDrag ? releaseVelocity(event.timeStamp) : 0
      if (didDrag) {
        if (Math.abs(velocity) >= MIN_COAST_VELOCITY) {
          startCoast(velocity)
        } else {
          restoreSnap()
        }
      }
      try {
        el.releasePointerCapture(event.pointerId)
      } catch {
        // ignore
      }
      window.setTimeout(() => {
        didDrag = false
      }, 0)
    }

    const onClickCapture = (event: MouseEvent) => {
      if (!didDrag) return
      event.preventDefault()
      event.stopPropagation()
      didDrag = false
    }

    const onDragStart = (event: DragEvent) => {
      event.preventDefault()
    }

    el.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    el.addEventListener('click', onClickCapture, true)
    el.addEventListener('dragstart', onDragStart)

    return () => {
      stopCoast()
      el.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      el.removeEventListener('click', onClickCapture, true)
      el.removeEventListener('dragstart', onDragStart)
    }
  }, [ref, active, resetKey])
}
