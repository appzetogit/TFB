import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { RefreshCw } from "lucide-react"

export default function PullToRefresh({ children }) {
  const [pullProgress, setPullProgress] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const containerRef = useRef(null)
  const startY = useRef(0)

  const THRESHOLD = 80 // pixels to pull before refresh
  const MAX_PULL = 120 // max visual pull distance

  useEffect(() => {
    const handleTouchStart = (e) => {
      // Only enable pull-to-refresh when scrolled to the very top
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
      } else {
        startY.current = -1
      }
    }

    const handleTouchMove = (e) => {
      if (startY.current === -1 || isRefreshing) return

      const currentY = e.touches[0].clientY
      const diff = currentY - startY.current

      if (diff > 0) {
        // We're pulling down
        const progress = Math.min(diff / 1.5, MAX_PULL)
        setPullProgress(progress)
        
        // Prevent default browser behavior (scroll) when pulling at top
        if (progress > 5 && e.cancelable) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = () => {
      if (startY.current === -1 || isRefreshing) return

      if (pullProgress > THRESHOLD) {
        handleRefresh()
      } else {
        setPullProgress(0)
      }
      startY.current = -1
    }

    const handleRefresh = () => {
      setIsRefreshing(true)
      setPullProgress(THRESHOLD)
      
      // Perform vibration for tactile feedback
      if (window.navigator.vibrate) {
        window.navigator.vibrate(50)
      }

      // Hard refresh to clear caches and stale chunks
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: false })
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", handleTouchEnd)

    return () => {
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [pullProgress, isRefreshing])

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Pull Indicator */}
      <div 
        className="absolute left-0 right-0 flex justify-center pointer-events-none z-[100]"
        style={{ top: -40 + pullProgress }}
      >
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center"
          animate={{ 
            rotate: isRefreshing ? 360 : pullProgress * 2,
            scale: pullProgress > 10 ? 1 : 0,
            opacity: pullProgress > 10 ? 1 : 0
          }}
          transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { type: "spring", stiffness: 300, damping: 20 }}
        >
          <RefreshCw className={`w-5 h-5 ${pullProgress > THRESHOLD ? "text-red-600" : "text-gray-400"}`} />
        </motion.div>
      </div>

      <motion.div
        animate={{ y: isRefreshing ? THRESHOLD : pullProgress }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
