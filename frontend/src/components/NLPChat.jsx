import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Send, Bot, User } from "lucide-react";

export default function NLPChat() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!query.trim()) return;

    const userMsg = {
      role: "user",
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/nlp/ask", {
        question: userMsg.text,
      });

      const botMsg = {
        role: "bot",
        text: res.data.answer || "No response available.",
        sources: res.data.sources || [],
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);

      const fallbackMsg = {
        role: "bot",
        text: "The AI assistant is temporarily unavailable.",
        sources: [],
      };

      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="chatPage"
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      {/* HEADER */}
      <div className="chatHeader">
        <div className="title">Engine Copilot</div>
        <div className="subtitle">
          AI-powered maintenance assistant for turbofan diagnostics
        </div>
      </div>

      {/* CHAT */}
      <div className="chatBox">
        {messages.length === 0 && (
          <div className="emptyState">
            <Bot size={28} />
            <div className="emptyTitle">
              Ask questions or summarize maintenance reports
            </div>

            <div className="exampleList">
              <div
                className="exampleCard"
                onClick={() => setQuery("Summarize the maintenance report")}
              >
                Summarize maintenance logs
              </div>

              <div
                className="exampleCard"
                onClick={() => setQuery("What causes low engine efficiency?")}
              >
                Ask technical questions
              </div>

              <div
                className="exampleCard"
                onClick={() =>
                  setQuery("Explain the predicted engine degradation")
                }
              >
                Analyze degradation trends
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role === "user" ? "user" : "bot"}`}>
            <div className="icon">
              {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>

            <div className="bubble">
              <div className="text">{m.text}</div>

              {m.sources?.length > 0 && (
                <div className="sources">
                  <div className="sourcesTitle">Sources</div>

                  {m.sources.slice(0, 3).map((s, idx) => (
                    <div key={idx} className="sourceItem">
                      {typeof s === "string" ? s.slice(0, 140) : ""}
                      ...
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="msg bot">
            <div className="icon">
              <Bot size={14} />
            </div>

            <div className="bubble typing">Processing request...</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="chatInput">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about engines, failures, maintenance reports..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button onClick={sendMessage}>
          <Send size={16} />
        </button>
      </div>

      {/* STYLE */}
      <style jsx>{`
        .chatPage {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          background: var(--bg);
          color: var(--text);
          overflow: hidden;
        }

        .chatHeader {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
        }

        .subtitle {
          font-size: 12px;
          color: var(--text2);
          margin-top: 4px;
        }

        .chatBox {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .emptyState {
          margin: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 18px;
          color: var(--text2);
          max-width: 520px;
        }

        .emptyTitle {
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
        }

        .exampleList {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          width: 100%;
        }

        .exampleCard {
          padding: 12px 14px;
          border-radius: 12px;
          background: var(--bg2);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 13px;
        }

        .exampleCard:hover {
          border-color: rgba(56, 189, 248, 0.3);
          background: rgba(56, 189, 248, 0.05);
        }

        .msg {
          display: flex;
          gap: 10px;
          max-width: 85%;
        }

        .msg.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .icon {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          background: var(--bg2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #38bdf8;
          flex-shrink: 0;
        }

        .bubble {
          padding: 12px 14px;
          border-radius: 14px;
          background: var(--bg2);
          border: 1px solid var(--border);
          font-size: 13px;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .msg.user .bubble {
          background: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(56, 189, 248, 0.2);
        }

        .sources {
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .sourcesTitle {
          font-size: 11px;
          font-weight: 700;
          color: var(--text2);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sourceItem {
          padding: 8px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
          margin-bottom: 6px;
          font-size: 11px;
          color: var(--text2);
        }

        .chatInput {
          display: flex;
          gap: 10px;
          padding: 16px;
          border-top: 1px solid var(--border);
          background: var(--bg);
          flex-shrink: 0;
        }

        .chatInput input {
          flex: 1;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--bg2);
          color: var(--text);
          outline: none;
          font-size: 13px;
        }

        .chatInput input:focus {
          border-color: rgba(56, 189, 248, 0.4);
        }

        .chatInput button {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: none;
          background: #38bdf8;
          color: #06111f;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .chatInput button:hover {
          transform: scale(1.05);
        }

        .typing {
          opacity: 0.7;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
