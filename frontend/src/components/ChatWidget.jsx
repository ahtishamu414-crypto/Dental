import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { chatAPI } from '../services/api';
import { Send, ChevronDown, Sparkles, X, Bot, Calendar, RotateCcw, ArrowRight } from 'lucide-react';

const SUGGESTIONS = [
  'What are your service prices?',
  'Who are your clinic dentists?',
  'What are your opening hours?',
  'How do I track my booking?',
  'Do you accept dental insurance?'
];

const WELCOME = {
  role: 'assistant',
  content: "👋 Hello! I'm Bright Smile Dental's 24/7 AI Receptionist.\n\nI can help you check prices, learn about our dentists, view office hours, or request an appointment. What can I help you with today?",
};

export default function ChatWidget({ onOpenModal }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Listen for global 'open-ai-chat' event from buttons on the site
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setShowGreeting(false);
    };
    window.addEventListener('open-ai-chat', handleOpen);
    return () => window.removeEventListener('open-ai-chat', handleOpen);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Auto-scroll to newest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  const sendMessage = async (text) => {
    const userText = text.trim();
    if (!userText || loading) return;

    const nextHistory = [...messages, { role: 'user', content: userText }];
    setInput('');
    setMessages(nextHistory);
    setLoading(true);

    try {
      const res = await chatAPI.sendMessage(userText, nextHistory);
      if (res.data?.success) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.data.ai_response }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: res.data?.ai_response || 'Sorry, I could not process that request. Please try again.' }
        ]);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "I'm having a brief connection moment. You can reach our front desk directly at (212) 555-0199 or click 'Book Visit' above!";
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorMsg }
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    sendMessage(input);
  };

  const handleReset = () => {
    setMessages([WELCOME]);
    setInput('');
  };

  // Helper to format structured list items & inject inline booking CTA
  const renderMessageContent = (content, role) => {
    if (role === 'user') {
      return <span>{content}</span>;
    }

    const lines = (content || '').split('\n');
    const elements = [];
    let listItems = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="bsc-msg-list">
            {listItems.map((item, idx) => (
              <li key={idx} className="bsc-msg-list-item">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
        listItems.push(trimmed.slice(2));
      } else {
        flushList();
        if (trimmed) {
          elements.push(<p key={idx} className="bsc-msg-p">{trimmed}</p>);
        }
      }
    });
    flushList();

    const hasBookingHint = /book|appointment|schedule|cleanings|teeth whitening|root canal|fillings|checkup/i.test(content);

    return (
      <div className="bsc-msg-wrapper">
        <div className="bsc-msg-body">
          {elements.length > 0 ? elements : content}
        </div>
        {onOpenModal && hasBookingHint && (
          <button
            type="button"
            className="bsc-msg-book-cta"
            onClick={() => {
              setIsOpen(false);
              onOpenModal();
            }}
          >
            <Calendar size={13} />
            <span>Request Appointment</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>
    );
  };

  return createPortal(
    <>
      <style>{css}</style>

      {/* Floating Launcher Area */}
      {!isOpen && (
        <div className="bsc-floating-wrap">
          {/* Proactive Greeting Bubble */}
          {showGreeting && (
            <div className="bsc-greeting-bubble" onClick={() => setIsOpen(true)}>
              <button
                type="button"
                className="bsc-greeting-close"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGreeting(false);
                }}
                aria-label="Dismiss greeting"
              >
                <X size={13} />
              </button>
              <div className="bsc-greeting-header">
                <span className="bsc-greeting-badge">
                  <Sparkles size={11} style={{ marginRight: 3 }} /> 24/7 AI Receptionist
                </span>
              </div>
              <p className="bsc-greeting-text">
                👋 Need quick help? Ask me about our prices, dentists, or appointment openings!
              </p>
              <span className="bsc-greeting-hint">Click to chat with AI Helper →</span>
            </div>
          )}

          {/* Launcher Button with Text Pill */}
          <button
            type="button"
            className="bsc-launcher"
            onClick={() => {
              setIsOpen(true);
              setShowGreeting(false);
            }}
            aria-label="Open 24/7 AI Receptionist Chat"
          >
            <div className="bsc-launcher-icon">
              <Bot size={22} />
              <span className="bsc-pulse-dot" />
            </div>
            <div className="bsc-launcher-info">
              <span className="bsc-launcher-title">Ask AI Helper</span>
              <span className="bsc-launcher-status">Online 24/7</span>
            </div>
          </button>
        </div>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="bsc-box" role="dialog" aria-label="Bright Smile AI Receptionist Chat">
          {/* Header */}
          <div className="bsc-header">
            <div className="bsc-header-info">
              <div className="bsc-avatar">
                <Bot size={19} />
                <span className="bsc-avatar-dot" />
              </div>
              <div className="bsc-header-text">
                <div className="bsc-name">
                  <span>Bright Smile AI</span>
                  <span className="bsc-badge-ai">24/7</span>
                </div>
                <div className="bsc-status">
                  <span className="bsc-status-indicator">●</span> Online • Instant Answers
                </div>
              </div>
            </div>

            <div className="bsc-header-actions">
              {onOpenModal && (
                <button
                  type="button"
                  className="bsc-header-book-btn"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenModal();
                  }}
                  title="Open appointment booking form"
                >
                  <Calendar size={12} />
                  <span>Book Visit</span>
                </button>
              )}
              <button
                type="button"
                className="bsc-header-tool-btn"
                onClick={handleReset}
                title="Restart chat conversation"
                aria-label="Restart chat"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                className="bsc-minimize"
                onClick={() => setIsOpen(false)}
                aria-label="Minimize chat"
                title="Minimize chat"
              >
                <ChevronDown size={19} />
              </button>
            </div>
          </div>

          {/* Quick suggestions at the top */}
          <div className="bsc-chips-bar">
            <div className="bsc-chips-label">
              <Sparkles size={12} color="#1597a5" /> Suggested questions:
            </div>
            <div className="bsc-chips-scroll">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="bsc-chip-btn"
                  onClick={() => sendMessage(s)}
                  disabled={loading}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Feed */}
          <div className="bsc-messages">
            {messages.map((m, i) => (
              <div key={i} className={`bsc-bubble bsc-${m.role}`}>
                {renderMessageContent(m.content, m.role)}
              </div>
            ))}
            {loading && (
              <div className="bsc-typing">
                <span className="bsc-dot" />
                <span className="bsc-dot" />
                <span className="bsc-dot" />
                <span>AI receptionist is thinking…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="bsc-input-area">
            <input
              ref={inputRef}
              type="text"
              className="bsc-input"
              placeholder="Ask a question (prices, dentists, hours)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Type your question for the AI receptionist"
              disabled={loading}
            />
            <button
              type="submit"
              className="bsc-send"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>,
    document.body
  );
}

const css = `
.bsc-floating-wrap {
  position: fixed; right: 24px; bottom: 24px; z-index: 9999;
  display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
}
.bsc-greeting-bubble {
  position: relative; max-width: 270px;
  padding: 14px 16px;
  background: #ffffff;
  border-radius: 14px 14px 4px 14px;
  border: 1px solid #cce8ed;
  box-shadow: 0 12px 30px rgba(11, 42, 74, 0.16);
  cursor: pointer;
  animation: bscFadeIn 0.3s ease;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.bsc-greeting-bubble:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 36px rgba(11, 42, 74, 0.22);
}
.bsc-greeting-close {
  position: absolute; top: 8px; right: 8px;
  display: grid; place-items: center;
  width: 20px; height: 20px;
  border: none; background: #f1f7f9; border-radius: 50%;
  color: #64748b; cursor: pointer;
}
.bsc-greeting-close:hover { background: #e2e8f0; color: #0b2a4a; }
.bsc-greeting-header { margin-bottom: 4px; }
.bsc-greeting-badge {
  display: inline-flex; align-items: center;
  background: #e8f6f8; color: #1597a5;
  padding: 2px 7px; border-radius: 999px;
  font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
}
.bsc-greeting-text {
  margin: 0; font-size: 12.5px; line-height: 1.45; color: #0b2a4a; font-weight: 500;
}
.bsc-greeting-hint {
  display: block; margin-top: 6px; font-size: 11.5px; font-weight: 700; color: #1597a5;
}
.bsc-launcher {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 18px 8px 10px;
  background: linear-gradient(135deg, #1597a5 0%, #0b2a4a 100%);
  color: #ffffff;
  border: 2px solid #ffffff;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(11, 42, 74, 0.28);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.bsc-launcher:hover {
  transform: scale(1.04);
  box-shadow: 0 12px 28px rgba(11, 42, 74, 0.35);
}
.bsc-launcher-icon {
  position: relative;
  display: grid; place-items: center;
  width: 38px; height: 38px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}
.bsc-pulse-dot {
  position: absolute; top: 1px; right: 1px;
  width: 10px; height: 10px;
  background: #22c55e; border: 2px solid #ffffff; border-radius: 50%;
  animation: bscPulse 2s infinite;
}
.bsc-launcher-info {
  display: flex; flex-direction: column; text-align: left;
}
.bsc-launcher-title {
  font-size: 13.5px; font-weight: 700; line-height: 1.2; color: #ffffff;
}
.bsc-launcher-status {
  font-size: 11px; opacity: 0.95; color: #5eead4; font-weight: 600; margin-top: 1px;
}

.bsc-box {
  position: fixed; right: 24px; bottom: 24px; z-index: 9999;
  display: flex; flex-direction: column;
  width: 395px; max-width: calc(100vw - 32px);
  height: 540px; max-height: calc(100dvh - 36px);
  overflow: hidden; background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(11, 42, 74, 0.3);
  border: 1px solid #d6e8ec;
  font-family: inherit;
  animation: bscSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.bsc-header {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 11px 14px; background: linear-gradient(135deg, #0b2a4a 0%, #0f3761 100%);
  color: #ffffff; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}
.bsc-header-info { display: flex; align-items: center; gap: 9px; min-width: 0; flex: 1; }
.bsc-avatar {
  position: relative;
  display: grid; place-items: center;
  width: 34px; height: 34px; flex-shrink: 0;
  border-radius: 50%; background: linear-gradient(135deg, #1597a5 0%, #0d9488 100%);
  color: #ffffff; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}
.bsc-avatar-dot {
  position: absolute; bottom: 0; right: 0;
  width: 8px; height: 8px;
  background: #22c55e; border: 1.5px solid #0b2a4a; border-radius: 50%;
}
.bsc-header-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.bsc-name {
  font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 5px;
  color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.25;
}
.bsc-badge-ai {
  font-size: 9px; background: rgba(21, 151, 165, 0.35); color: #5eead4;
  border: 1px solid rgba(94, 234, 212, 0.3); padding: 1px 5px; border-radius: 4px;
  font-weight: 700; flex-shrink: 0;
}
.bsc-status {
  font-size: 10.5px; color: #a5f3fc; margin-top: 1px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  display: flex; align-items: center; gap: 4px; line-height: 1.2;
}
.bsc-status-indicator { color: #22c55e; font-size: 8px; flex-shrink: 0; }
.bsc-header-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.bsc-header-book-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 9px; border-radius: 999px;
  background: #1597a5; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.25);
  font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap;
  transition: all 0.15s ease;
}
.bsc-header-book-btn:hover { background: #0f7f8b; transform: translateY(-1px); }
.bsc-header-tool-btn, .bsc-minimize {
  display: grid; place-items: center; width: 28px; height: 28px;
  border: 0; border-radius: 50%; background: transparent; color: #cbd5e1; cursor: pointer;
  flex-shrink: 0; transition: all 0.15s ease;
}
.bsc-header-tool-btn:hover, .bsc-minimize:hover {
  background: rgba(255, 255, 255, 0.15); color: #ffffff;
}

.bsc-chips-bar {
  padding: 10px 14px 8px; background: #f8fcfe; border-bottom: 1px solid #e2eff2;
}
.bsc-chips-label {
  display: flex; align-items: center; gap: 4px;
  font-size: 11.5px; font-weight: 600; color: #5b6f86; margin-bottom: 6px;
}
.bsc-chips-scroll {
  display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px;
}
.bsc-chips-scroll::-webkit-scrollbar { height: 4px; }
.bsc-chips-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.bsc-chip-btn {
  white-space: nowrap; padding: 4px 10px;
  background: #ffffff; border: 1px solid #cfe3e8; border-radius: 999px;
  font-size: 11.5px; font-weight: 500; color: #0b2a4a; cursor: pointer;
  transition: all 0.15s ease;
}
.bsc-chip-btn:hover {
  background: #e8f6f8; border-color: #1597a5; color: #1597a5;
}

.bsc-messages {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 12px; background: #f8fbfd;
}
.bsc-bubble {
  max-width: 86%; padding: 11px 15px; font-size: 13px; line-height: 1.5;
  word-wrap: break-word;
}
.bsc-assistant {
  align-self: flex-start; background: #ffffff; color: #0b2a4a;
  border: 1px solid #d8ecf0;
  border-radius: 14px 14px 14px 4px;
  box-shadow: 0 2px 6px rgba(11, 42, 74, 0.04);
}
.bsc-user {
  align-self: flex-end; background: #1597a5; color: #ffffff;
  border-radius: 14px 14px 4px 14px;
  box-shadow: 0 2px 8px rgba(21, 151, 165, 0.25);
}

.bsc-msg-wrapper { display: flex; flex-direction: column; gap: 8px; }
.bsc-msg-p { margin: 0 0 6px; }
.bsc-msg-p:last-child { margin-bottom: 0; }
.bsc-msg-list { margin: 4px 0 6px; padding-left: 18px; list-style-type: disc; }
.bsc-msg-list-item { margin-bottom: 3px; font-size: 12.5px; line-height: 1.45; }

.bsc-msg-book-cta {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  align-self: flex-start;
  padding: 6px 12px; margin-top: 4px;
  background: #e8f6f8; color: #0f766e;
  border: 1px solid #99f6e4; border-radius: 8px;
  font-size: 11.5px; font-weight: 700; cursor: pointer;
  transition: all 0.15s ease;
}
.bsc-msg-book-cta:hover {
  background: #1597a5; color: #ffffff; border-color: #1597a5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(21, 151, 165, 0.25);
}

.bsc-typing {
  align-self: flex-start; display: flex; align-items: center; gap: 5px;
  padding: 8px 12px; background: #ffffff; border: 1px solid #e1eef1;
  border-radius: 12px; font-size: 12px; color: #5b6f86;
}
.bsc-dot {
  width: 5px; height: 5px; background: #1597a5; border-radius: 50%;
  animation: bscBounce 1.4s infinite ease-in-out both;
}
.bsc-dot:nth-child(1) { animation-delay: -0.32s; }
.bsc-dot:nth-child(2) { animation-delay: -0.16s; }

.bsc-input-area {
  display: flex; gap: 8px; padding: 12px 14px; background: #ffffff; border-top: 1px solid #e1eef1;
}
.bsc-input {
  flex: 1; min-width: 0; padding: 10px 14px;
  border: 1px solid #cfe3e8; border-radius: 999px;
  background: #f8fcfe; color: #0b2a4a; font: inherit; font-size: 13px;
}
.bsc-input:focus {
  outline: none; border-color: #1597a5; background: #ffffff;
  box-shadow: 0 0 0 3px rgba(21, 151, 165, 0.18);
}
.bsc-send {
  display: grid; place-items: center; flex: none; width: 40px; height: 40px;
  border: 0; border-radius: 50%; background: #1597a5; color: #ffffff; cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
}
.bsc-send:hover:not(:disabled) { background: #0f7f8b; transform: scale(1.05); }
.bsc-send:disabled { opacity: 0.5; cursor: not-allowed; }

@keyframes bscPulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}
@keyframes bscSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes bscFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes bscBounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

@media (max-width: 600px) {
  .bsc-floating-wrap { right: 14px; bottom: 14px; }
  .bsc-box {
    right: 0; bottom: 0; left: 0;
    width: 100%; max-width: 100vw;
    height: 86dvh; max-height: 86dvh;
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -10px 40px rgba(11, 42, 74, 0.25);
  }
  .bsc-greeting-bubble { max-width: calc(100vw - 28px); }
  .bsc-input { font-size: 16px; }
  .bsc-bubble { max-width: 90%; font-size: 13.5px; }
}
@media (max-width: 400px) {
  .bsc-launcher { padding: 6px 12px 6px 8px; gap: 8px; }
  .bsc-launcher-icon { width: 34px; height: 34px; }
  .bsc-launcher-title { font-size: 12.5px; }
  .bsc-launcher-status { font-size: 10px; }
}
`;
