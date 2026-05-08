'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Match, DiscoverProfile } from '@/types/swipe';
import { Heart, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MatchAnimationProps {
  match: Match | null;
  show: boolean;
  onSendMessage: () => void;
  onKeepSwiping: () => void;
}

export function MatchAnimation({
  match,
  show,
  onSendMessage,
  onKeepSwiping,
}: MatchAnimationProps) {
  const profile = match?.profile as DiscoverProfile | undefined;
  const primaryPhoto = profile?.photos?.find((p) => p.isPrimary) || profile?.photos?.[0];

  return (
    <AnimatePresence>
      {show && match && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Content */}
          <motion.div
            className="relative z-10 flex flex-col items-center px-8 text-center max-w-sm"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
          >
            {/* Hearts confetti effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{
                    x: 0,
                    y: 0,
                    scale: 0,
                    rotate: 0,
                  }}
                  animate={{
                    x: (Math.random() - 0.5) * 300,
                    y: -200 - Math.random() * 200,
                    scale: [0, 1.2, 1],
                    rotate: (Math.random() - 0.5) * 360,
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 1.5 + Math.random(),
                    delay: Math.random() * 0.5,
                    ease: 'easeOut',
                  }}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      i % 3 === 0
                        ? 'text-rose-400'
                        : i % 3 === 1
                        ? 'text-pink-400'
                        : 'text-fuchsia-400'
                    }`}
                    fill="currentColor"
                  />
                </motion.div>
              ))}
            </div>

            {/* It's a Match text */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 mb-2">
                It&apos;s a Match!
              </h2>
              <p className="text-white/60 text-sm mb-8">
                You and {profile?.name || 'someone'} liked each other
              </p>
            </motion.div>

            {/* Profile photo */}
            {primaryPhoto && (
              <motion.div
                className="w-32 h-32 rounded-full overflow-hidden border-4 border-rose-400/50 mb-8 shadow-2xl shadow-rose-500/20"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              >
                <img
                  src={primaryPhoto.url}
                  alt={profile?.name || 'Match'}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            )}

            {/* Actions */}
            <motion.div
              className="flex flex-col gap-3 w-full"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={onSendMessage}
                className="w-full gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold h-12 rounded-xl shadow-lg shadow-rose-500/25"
              >
                <MessageCircle className="w-4 h-4" />
                Send a Message
              </Button>
              <Button
                onClick={onKeepSwiping}
                variant="ghost"
                className="w-full text-white/60 hover:text-white hover:bg-white/10 h-12 rounded-xl"
              >
                Keep Swiping
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
