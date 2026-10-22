import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { chatAPI } from '../services/api';
import { Send, ChevronDown, Sparkles, X, MessageSquare, Bot } from 'lucide-react';

const SUGGESTIONS = [
  'What are your service prices?',
  'Who are your clinic dentists?',
  'What are your opening hours?',
  'Do you accept dental insurance?'
];

const WELCOME = {
  role: 'assistant',
  content: "👋 Hello! I'm Bright Smile Dental's 24/7 AI Receptionist.\n\nI can help you check prices, learn about our dentists, view office hours, or request an appointment. What can I help you with today?",
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Listen for global 'open-ai-chat' event from buttons on the site
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-ai-chat', handleOpen);
    return () => window.removeEventListener('open-ai-chat', handleOpen);
  }, []);

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
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please check your backend connection or try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    sendMessage(input);
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
                <Bot size={20} />
                <span className="bsc-avatar-dot" />
              </div>
              <div>
                <div className="bsc-name">
                  Bright Smile AI Receptionist
                  <span className="bsc-badge-ai">AI Helper</span>
                </div>
                <div className="bsc-status">● Live 24/7 Assistant • Instant Answers</div>
              </div>
            </div>
            <button
              type="button"
              className="bsc-minimize"
              onClick={() => setIsOpen(false)}
              aria-label="Minimize chat"
              title="Minimize chat"
            >
              <ChevronDown size={20} />
            </button>
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
                {m.content}
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
  font-size: 13.5px; font-weight: 700; line-height: 1.2;
}
.bsc-launcher-sub {
  font-size: 11px; opacity: 0.85; display: flex; align-items: center; gap: 4px;
}
.bsc-box {
  position: fixed; right: 24px; bottom: 24px; z-index: 9999;
  display: flex; flex-direction: column;
  width: 390px; max-width: calc(100vw - 32px); height: 530px; max-height: calc(100vh - 48px);
  overflow: hidden; background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(11, 42, 74, 0.3);
  border: 1px solid #d6e8ec;
  font-family: inherit;
  animation: bscSlideUp 0.25s ease;
}
.bsc-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; background: #0b2a4a; color: #ffffff;
}
.bsc-header-info { display: flex; align-items: center; gap: 10px; }
.bsc-avatar {
  position: relative;
  display: grid; place-items: center;
  width: 38px; height: 38px;
  border-radius: 50%; background: #1597a5; color: #fff;
}
.bsc-avatar-dot {
  position: absolute; bottom: 0; right: 0;
  width: 9px; height: 9px;
  background: #22c55e; border: 1.5px solid #0b2a4a; border-radius: 50%;
}
.bsc-name {
  font-size: 13.5px; font-weight: 700; display: flex; align-items: center; gap: 6px;
}
.bsc-badge-ai {
  font-size: 10px; background: #1597a5; color: #fff;
  padding: 1px 6px; border-radius: 4px; font-weight: 600;
}
.bsc-status { font-size: 11px; color: #5eead4; margin-top: 1px; }
.bsc-minimize {
  display: grid; place-items: center; width: 32px; height: 32px;
  border: 0; border-radius: 50%; background: transparent; color: #b8c9dc; cursor: pointer;
}
.bsc-minimize:hover { background: rgba(255, 255, 255, 0.12); color: #ffffff; }

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
  max-width: 85%; padding: 11px 15px; font-size: 13.5px; line-height: 1.5;
  white-space: pre-wrap; word-wrap: break-word;
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
  transition: background 0.15s ease;
}
.bsc-send:hover:not(:disabled) { background: #0f7f8b; }
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
@media (max-width: 480px) {
  .bsc-floating-wrap { right: 16px; bottom: 16px; }
  .bsc-box { right: 16px; bottom: 16px; height: 75vh; }
  .bsc-greeting-bubble { max-width: calc(100vw - 32px); }
}
`;
