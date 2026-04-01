'use client'

import { AnimatePresence, motion } from 'framer-motion'

export default function AssistantBubble({
  message,
  visible,
}: {
  message: string
  visible: boolean
}) {
  return (
    <AnimatePresence>
      {visible && message ? (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="pointer-events-auto max-w-[280px] rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,244,246,0.92))] px-4 py-3 text-right shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:border-white/8 dark:bg-[linear-gradient(180deg,rgba(31,31,35,0.96),rgba(18,18,21,0.94))]"
        >
          <p className="text-sm font-medium leading-6 text-zinc-900 dark:text-white/95">{message}</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
