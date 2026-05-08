'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, X, Star, Heart } from 'lucide-react';

interface ActionButtonsProps {
  onUndo: () => void;
  onNope: () => void;
  onSuperlike: () => void;
  onLike: () => void;
  canUndo: boolean;
  isAnimating?: boolean;
}

export function ActionButtons({
  onUndo,
  onNope,
  onSuperlike,
  onLike,
  canUndo,
  isAnimating,
}: ActionButtonsProps) {
  const [activeButton, setActiveButton] = useState<string | null>(null);

  const handleAction = useCallback(
    (action: string, callback: () => void) => {
      if (isAnimating) return;
      setActiveButton(action);
      setTimeout(() => {
        setActiveButton(null);
        callback();
      }, 150);
    },
    [isAnimating]
  );

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 py-4">
      {/* Undo */}
      <motion.button
        onClick={() => handleAction('undo', onUndo)}
        disabled={!canUndo || isAnimating}
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
          canUndo && !isAnimating
            ? 'bg-white/10 hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/30 text-white/60 hover:text-amber-400'
            : 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed'
        }`}
        whileTap={canUndo ? { scale: 0.85 } : {}}
        whileHover={canUndo ? { scale: 1.1 } : {}}
        aria-label="Undo last swipe"
      >
        <Undo2 className="w-5 h-5 sm:w-6 sm:h-6" />
      </motion.button>

      {/* Nope */}
      <motion.button
        onClick={() => handleAction('nope', onNope)}
        disabled={isAnimating}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-white/10 hover:bg-rose-500/20 border-2 border-rose-400/40 hover:border-rose-400 text-rose-400 hover:text-rose-300 transition-all duration-200"
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.1 }}
        aria-label="Pass on this profile"
      >
        <X className="w-6 h-6 sm:w-7 sm:h-7" />
      </motion.button>

      {/* Superlike */}
      <motion.button
        onClick={() => handleAction('superlike', onSuperlike)}
        disabled={isAnimating}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-white/10 hover:bg-blue-500/20 border border-blue-400/40 hover:border-blue-400 text-blue-400 hover:text-blue-300 transition-all duration-200"
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.1 }}
        aria-label="Superlike this profile"
      >
        <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
      </motion.button>

      {/* Like */}
      <motion.button
        onClick={() => handleAction('like', onLike)}
        disabled={isAnimating}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-white/10 hover:bg-emerald-500/20 border-2 border-emerald-400/40 hover:border-emerald-400 text-emerald-400 hover:text-emerald-300 transition-all duration-200"
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.1 }}
        aria-label="Like this profile"
      >
        <Heart className="w-6 h-6 sm:w-7 sm:h-7" />
      </motion.button>

      {/* Active button flash */}
      <AnimatePresence>
        {activeButton && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center ${
                activeButton === 'like'
                  ? 'bg-emerald-500/20'
                  : activeButton === 'nope'
                  ? 'bg-rose-500/20'
                  : activeButton === 'superlike'
                  ? 'bg-blue-500/20'
                  : 'bg-amber-500/20'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
