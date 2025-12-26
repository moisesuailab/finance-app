import { useState } from 'react'

const STORAGE_KEY = 'financesVisibility'

export function useVisibility() {
  const [isVisible, setIsVisible] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved !== 'false'
  })

  const toggleVisibility = () => {
    setIsVisible(prev => {
      const newValue = !prev
      localStorage.setItem(STORAGE_KEY, String(newValue))
      return newValue
    })
  }

  return { isVisible, toggleVisibility }
}