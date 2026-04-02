'use client';

import { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send } from 'lucide-react';

// Kimi AI config
const KIMI_API_KEY = 'sk-zgfw04mTqnw3pMS2qcqiuk8CQzyZB0KucyxgK1fsDkiMTW9B';
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const KIMI_MODEL = 'moonshot-v1-8k';

function buildSystemPrompt(pathname: string): string {
  const base =
    'You are a friendly and helpful AI assistant for NibbleNet, a food surplus marketplace app that connects providers (restaurants, bakeries, grocery stores) with consumers looking for affordable food. ' +
    'Keep answers concise and helpful. ' +
    'If the user asks how to contact us, reply with: "You can reach us at: support@nibblenet.com" ';

  const pageContext: Record<string, string> = {
    '/home':         'The user is currently browsing the home feed of nearby food listings.',
    '/search':       'The user is on the search page, filtering food listings by category, price, or cuisine.',
    '/reservations': 'The user is viewing their active and past food reservations.',
    '/pantry':       'The user is on the Pantry page where they can track rescued ingredients and generate AI recipes.',
    '/profile':      'The user is viewing their profile and allergen preferences.',
    '/impact':       'The user is viewing their personal food rescue impact stats.',
    '/listings/create': 'The user is creating a new food listing as a provider.',
    '/dashboard':    'The user is on the provider dashboard viewing their listings and analytics.',
    '/reports':      'The user is viewing AI-generated sales reports as a provider.',
  };

  const matched = Object.entries(pageContext).find(([key]) => pathname.includes(key));
  const ctx = matched ? matched[1] : 'The user is navigating NibbleNet.';

  return base + ctx + ' Answer questions relevant to their current context when possible.';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type Corner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

const BUBBLE_SIZE = 48;
const EDGE_GAP = 12;

export function ChatBot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [corner, setCorner] = useState<Corner>('top-right');
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; moved: boolean } | null>(null);
  const historyRef = useRef<{ role: string; content: string }[]>([
    { role: 'system', content: buildSystemPrompt(pathname ?? '') },
  ]);

  // Update system prompt when route changes
  useEffect(() => {
    const newPrompt = buildSystemPrompt(pathname ?? '');
    if (historyRef.current[0]?.role === 'system') {
      historyRef.current[0].content = newPrompt;
    }
  }, [pathname]);

  // Auto-greet after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!greeted) {
        const greeting = 'Hi! Do you need help with anything?';
        setMessages([{ role: 'assistant', content: greeting }]);
        historyRef.current.push({ role: 'assistant', content: greeting });
        setShowBadge(true);
        setGreeted(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [greeted]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // ─── Drag handling ──────────────────────────────────────────────
  const getContainerRect = useCallback(() => {
    return containerRef.current?.getBoundingClientRect() ?? null;
  }, []);

  const snapToCorner = useCallback((clientX: number, clientY: number) => {
    const rect = getContainerRect();
    if (!rect) return;
    const midX = rect.left + rect.width / 2;
    const midY = rect.top + rect.height / 2;
    const isRight = clientX >= midX;
    const isBottom = clientY >= midY;
    if (isBottom && isRight) setCorner('bottom-right');
    else if (isBottom && !isRight) setCorner('bottom-left');
    else if (!isBottom && isRight) setCorner('top-right');
    else setCorner('top-left');
  }, [getContainerRect]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isOpen) return; // don't drag when chat is open
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = { startX: e.clientX, startY: e.clientY, moved: false };
    setDragging(true);
  }, [isOpen]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragStartRef.current.moved = true;
    }
    if (!dragStartRef.current.moved) return;

    const rect = getContainerRect();
    if (!rect) return;
    // Clamp position inside container
    const x = Math.max(0, Math.min(e.clientX - rect.left - BUBBLE_SIZE / 2, rect.width - BUBBLE_SIZE));
    const y = Math.max(0, Math.min(e.clientY - rect.top - BUBBLE_SIZE / 2, rect.height - BUBBLE_SIZE));
    setDragPos({ x, y });
  }, [getContainerRect]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const wasDrag = dragStartRef.current.moved;
    dragStartRef.current = null;
    setDragging(false);
    setDragPos(null);

    if (wasDrag) {
      snapToCorner(e.clientX, e.clientY);
    } else {
      // It was a tap/click, toggle chat
      setIsOpen((o) => !o);
      setShowBadge(false);
    }
  }, [snapToCorner]);

  const toggleOpen = () => {
    setIsOpen((o) => !o);
    setShowBadge(false);
  };

  const fetchAIResponse = async (): Promise<string> => {
    const res = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: historyRef.current,
        max_tokens: 256,
        temperature: 0.7,
      }),
    });

    if (!res.ok) throw new Error(`API responded with status ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content.trim();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    historyRef.current.push({ role: 'user', content: text });
    setInput('');

    if (/contact|reach|email|support/i.test(text)) {
      const reply = 'You can reach us at: support@nibblenet.com';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      historyRef.current.push({ role: 'assistant', content: reply });
      return;
    }

    setIsTyping(true);
    try {
      const reply = await fetchAIResponse();
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      historyRef.current.push({ role: 'assistant', content: reply });
    } catch (err) {
      console.error('Featherless API error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I wasn't able to get a response. Please try again later." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ─── Position styles ────────────────────────────────────────────
  const bubbleCornerStyle = (): React.CSSProperties => {
    if (dragPos) {
      return { left: dragPos.x, top: dragPos.y, transition: 'none' };
    }
    const base: React.CSSProperties = { transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' };
    switch (corner) {
      case 'bottom-right': return { ...base, bottom: EDGE_GAP, right: EDGE_GAP };
      case 'bottom-left': return { ...base, bottom: EDGE_GAP, left: EDGE_GAP };
      case 'top-right': return { ...base, top: EDGE_GAP, right: EDGE_GAP };
      case 'top-left': return { ...base, top: EDGE_GAP, left: EDGE_GAP };
    }
  };

  const chatWindowStyle = (): React.CSSProperties => {
    const isBottom = corner.startsWith('bottom');
    const isRight = corner.endsWith('right');
    return {
      pointerEvents: 'auto',
      ...(isBottom ? { bottom: BUBBLE_SIZE + EDGE_GAP + 8 } : { top: BUBBLE_SIZE + EDGE_GAP + 8 }),
      ...(isRight ? { right: EDGE_GAP } : { left: EDGE_GAP }),
    };
  };

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50 }}>
      {/* Floating draggable bubble */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          pointerEvents: 'auto',
          position: 'absolute',
          width: BUBBLE_SIZE,
          height: BUBBLE_SIZE,
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
          ...bubbleCornerStyle(),
        }}
      >
        <div
          className={`w-full h-full rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg ${
            dragging ? 'scale-110 opacity-80' : 'hover:scale-105'
          } transition-transform`}
        >
          {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
          {showBadge && !isOpen && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
          )}
        </div>
      </div>

      {/* Chat window */}
      {isOpen && (
        <div
          style={chatWindowStyle()}
          className="absolute w-[calc(100%-24px)] max-w-[360px] max-h-[420px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-brand-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <span className="font-semibold text-sm">NibbleNet Assistant</span>
            <button onClick={toggleOpen} className="text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[200px] max-h-[280px]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed rounded-2xl ${
                  msg.role === 'user'
                    ? 'ml-auto bg-brand-600 text-white rounded-br-sm'
                    : 'mr-auto bg-gray-100 text-gray-700 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isTyping && (
              <div className="mr-auto bg-gray-100 text-gray-400 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-gray-100 px-3 py-2.5 flex gap-2 bg-gray-50 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-brand-500 transition-colors"
            />
            <button
              type="submit"
              className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 transition-colors shrink-0"
              aria-label="Send"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
