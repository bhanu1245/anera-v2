'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Loader2, MessageCircle } from 'lucide-react';
import { useChatStore, type ChatMessage } from '@/stores/chat-store';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

// ─── Types ──────────────────────────────────────────────────────────────────

interface OtherProfile {
  id?: string;
  userId?: string;
  name: string;
  age?: number;
  photos?: { id: string; url: string; order: number; isPrimary: boolean }[];
  bio?: string;
  interests?: string[];
  city?: string;
}

interface ChatPageProps {
  matchId: string;
  otherProfile: OtherProfile;
  onBack: () => void;
}

// ─── Utility: Format time for message bubbles ───────────────────────────────

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Today: show time only
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    // Yesterday
    return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays < 7) {
    // This week: show day name
    return `${date.toLocaleDateString([], { weekday: 'short' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    // Older: show date
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
}

// ─── Message Bubble ─────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isOwn,
  showAvatar,
}: {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
}) {
  return (
    <motion.div
      className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      {/* Other user's avatar */}
      {!isOwn && (
        <div className="w-7 shrink-0">
          {showAvatar && message.sender?.photoUrl ? (
            <Avatar className="w-7 h-7">
              <AvatarImage src={message.sender.photoUrl} alt={message.sender.name} />
              <AvatarFallback className="text-[10px]">
                {message.sender.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-3.5 py-2.5 ${
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md'
        }`}
      >
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
          {message.content}
        </p>
        <p
          className={`text-[10px] mt-1 ${
            isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
          }`}
        >
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Date Separator ─────────────────────────────────────────────────────────

function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const today = new Date();
  const diffDays = Math.floor(
    (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );

  let label: string;
  if (diffDays === 0) label = 'Today';
  else if (diffDays === 1) label = 'Yesterday';
  else label = d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex items-center justify-center my-3">
      <div className="bg-muted/80 text-muted-foreground text-[10px] font-medium px-3 py-1 rounded-full">
        {label}
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────

function ChatEmptyState({ name }: { name: string }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[40vh] px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <MessageCircle className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Start the conversation!</h3>
      <p className="text-muted-foreground text-sm text-center max-w-xs">
        Say something nice to {name}. Great conversations start with a simple hello!
      </p>
    </motion.div>
  );
}

// ─── Main Chat Component ────────────────────────────────────────────────────

export function ChatPage({ matchId, otherProfile, onBack }: ChatPageProps) {
  const { userId } = useAuthStore();
  const {
    messages,
    isLoading,
    isSending,
    error,
    fetchMessages,
    sendMessage,
    clearMessages,
  } = useChatStore();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get other profile's photo
  const primaryPhoto =
    otherProfile.photos?.find((p) => p.isPrimary) ||
    otherProfile.photos?.sort((a, b) => a.order - b.order)[0] ||
    null;

  // Fetch messages on mount
  useEffect(() => {
    if (matchId) {
      fetchMessages(matchId);
    }
    return () => {
      clearMessages();
    };
  }, [matchId, fetchMessages, clearMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.length]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!matchId) return;

    pollingRef.current = setInterval(() => {
      fetchMessages(matchId);
    }, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [matchId, fetchMessages]);

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isSending) return;

    setInputValue('');
    await sendMessage(matchId, trimmed);
  }, [inputValue, isSending, matchId, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Group messages by date and determine if avatar should show
  const renderMessages = () => {
    let lastDate = '';
    let lastSenderId = '';

    return messages.map((message) => {
      const messageDate = new Date(message.createdAt).toDateString();
      const showDateSeparator = messageDate !== lastDate;
      const showAvatar = message.senderId !== lastSenderId;
      lastDate = messageDate;
      lastSenderId = message.senderId;

      const isOwn = message.senderId === userId;

      return (
        <div key={message.id}>
          {showDateSeparator && <DateSeparator date={message.createdAt} />}
          <MessageBubble
            message={message}
            isOwn={isOwn}
            showAvatar={showAvatar && !isOwn}
          />
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <motion.div
        className="shrink-0 flex items-center gap-3 px-3 py-2.5 border-b border-border/50 bg-background/95 backdrop-blur-md z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-9 w-9 p-0 rounded-full shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <Avatar className="w-9 h-9 shrink-0">
          {primaryPhoto ? (
            <AvatarImage src={primaryPhoto.url} alt={otherProfile.name} />
          ) : null}
          <AvatarFallback className="text-xs font-semibold">
            {otherProfile.name?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate">
            {otherProfile.name}
            {otherProfile.age ? `, ${otherProfile.age}` : ''}
          </h2>
          {otherProfile.city && (
            <p className="text-[11px] text-muted-foreground truncate">
              {otherProfile.city}
            </p>
          )}
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <ChatEmptyState name={otherProfile.name} />
        ) : (
          <ScrollArea className="h-full">
            <div className="px-3 sm:px-4 py-3 space-y-1.5">
              {renderMessages()}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="px-4 py-2 bg-destructive/10 border-t border-destructive/20"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="text-xs text-destructive">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input - Fixed at bottom */}
      <motion.div
        className="shrink-0 border-t border-border/50 bg-background/95 backdrop-blur-md px-3 py-2.5 safe-area-bottom"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 h-10 rounded-full bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary/50 text-sm px-4"
            disabled={isSending}
            maxLength={2000}
            autoComplete="off"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            size="sm"
            className="h-10 w-10 rounded-full p-0 shrink-0"
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
