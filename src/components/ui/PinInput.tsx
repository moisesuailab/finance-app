import {
  useRef,
  useEffect,
  useState,
  KeyboardEvent,
  ClipboardEvent
} from 'react'
import { cn } from '@/lib/utils'

interface PinInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  autoFocus?: boolean
  error?: boolean
}

export function PinInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
  error = false
}: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set())
  const timeoutRefs = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  /* Autofocus */
  useEffect(() => {
    if (autoFocus) {
      inputRefs.current[0]?.focus()
    }
  }, [autoFocus])

  /* Cleanup de timeouts */
  useEffect(() => {
    const timeouts = timeoutRefs.current

    return () => {
      timeouts.forEach(clearTimeout)
      timeouts.clear()
    }
  }, [])

  const showDigitTemporarily = (index: number) => {
    setVisibleIndices(prev => new Set(prev).add(index))

    const existing = timeoutRefs.current.get(index)
    if (existing) clearTimeout(existing)

    const timeout = setTimeout(() => {
      setVisibleIndices(prev => {
        const next = new Set(prev)
        next.delete(index)
        return next
      })
      timeoutRefs.current.delete(index)
    }, 300)

    timeoutRefs.current.set(index, timeout)
  }

  const handleChange = (index: number, digit: string) => {
    if (!/^\d?$/.test(digit)) return

    const next = value.split('')
    next[index] = digit

    onChange(next.join('').slice(0, length))

    if (digit) {
      showDigitTemporarily(index)
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[index]) {
        const next = value.split('')
        next[index] = ''
        onChange(next.join(''))
      } else if (index > 0) {
        const next = value.split('')
        next[index - 1] = ''
        onChange(next.join(''))
        inputRefs.current[index - 1]?.focus()
      }
    }

    if (e.key === 'ArrowLeft') {
      inputRefs.current[index - 1]?.focus()
    }

    if (e.key === 'ArrowRight') {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()

    const digits = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, length)

    if (!digits) return

    onChange(digits)

    const visible = new Set<number>()
    digits.split('').forEach((_, i) => visible.add(i))
    setVisibleIndices(visible)

    timeoutRefs.current.forEach(clearTimeout)
    timeoutRefs.current.clear()

    const timeout = setTimeout(() => {
      setVisibleIndices(new Set())
    }, 300)

    timeoutRefs.current.set(-1, timeout)

    inputRefs.current[Math.min(digits.length, length - 1)]?.focus()
  }

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {Array.from({ length }).map((_, index) => {
        const hasValue = Boolean(value[index])
        const isVisible = visibleIndices.has(index)

        return (
          <div key={index} className="relative">
            <input
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={value[index] ?? ''}
              disabled={disabled}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={cn(
                'w-12 h-14 sm:w-14 sm:h-16',
                'text-center text-2xl sm:text-3xl font-bold',
                'rounded-xl bg-stone-200 dark:bg-stone-800',
                'border-2 transition-all',
                error
                  ? 'border-red-500'
                  : hasValue
                    ? 'border-stone-900 dark:border-stone-50'
                    : 'border-transparent',
                'focus:outline-none focus:border-blue-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                hasValue && !isVisible && 'text-transparent caret-transparent'
              )}
              aria-label={`Dígito ${index + 1}`}
            />

            {/* DOT overlay */}
            {hasValue && !isVisible && (
              <span
                className="
                  pointer-events-none
                  absolute inset-0
                  flex items-center justify-center
                  text-3xl font-bold
                  text-stone-900 dark:text-stone-50
                "
              >
                •
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
