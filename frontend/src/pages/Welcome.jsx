import { useNavigate } from "react-router-dom";
import { Sun, Moon, BarChart3, Zap, Shield, FileText, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function AnimatedBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animFrame,
      rotation = 0;
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.5 + 0.1,
    }));
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2,
        cy = canvas.height / 2;
      const rings = [
        { r: 80, speed: 0.002, blades: 8, color: "rgba(56,189,248,0.55)" },
        { r: 140, speed: -0.0015, blades: 12, color: "rgba(56,189,248,0.40)" },
        { r: 210, speed: 0.001, blades: 16, color: "rgba(56,189,248,0.28)" },
        { r: 290, speed: -0.0008, blades: 20, color: "rgba(249,115,22,0.22)" },
        { r: 380, speed: 0.0006, blades: 24, color: "rgba(56,189,248,0.15)" },
      ];
      rings.forEach((ring) => {
        const angle = rotation * ring.speed * 500;
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        for (let i = 0; i < ring.blades; i++) {
          const a = angle + (i / ring.blades) * Math.PI * 2;
          const innerR = ring.r - 20,
            outerR = ring.r,
            spread = 0.15;
          ctx.beginPath();
          ctx.moveTo(
            cx + innerR * Math.cos(a - spread),
            cy + innerR * Math.sin(a - spread),
          );
          ctx.quadraticCurveTo(
            cx + ((innerR + outerR) / 2) * Math.cos(a + 0.05),
            cy + ((innerR + outerR) / 2) * Math.sin(a + 0.05),
            cx + outerR * Math.cos(a + spread),
            cy + outerR * Math.sin(a + spread),
          );
          ctx.strokeStyle = ring.color;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
      grad.addColorStop(0, "rgba(56,189,248,0.35)");
      grad.addColorStop(0.5, "rgba(56,189,248,0.10)");
      grad.addColorStop(1, "rgba(56,189,248,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) p.y = canvas.height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56,189,248,${p.opacity})`;
        ctx.fill();
      });
      rotation++;
      animFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    />
  );
}

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function AboutModal({ onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0f172a",
          border: "1px solid rgba(56,189,248,0.2)",
          borderRadius: "24px",
          padding: "48px",
          maxWidth: "680px",
          width: "100%",
          position: "relative",
          animation: "modalUp 0.35s cubic-bezier(.22,1,.36,1)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "8px",
            cursor: "pointer",
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
          }
        >
          <X size={16} />
        </button>

        {/* Logo small */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "32px",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="17"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            <circle cx="18" cy="18" r="3" fill="#38bdf8" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 18 + 5 * Math.cos(rad),
                y1 = 18 + 5 * Math.sin(rad);
              const x2 = 18 + 13 * Math.cos(rad),
                y2 = 18 + 13 * Math.sin(rad);
              const cx1 = 18 + 7 * Math.cos(rad - 0.4),
                cy1 = 18 + 7 * Math.sin(rad - 0.4);
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2}`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={i % 2 === 0 ? "1.8" : "1"}
                  strokeLinecap="round"
                  opacity={i % 2 === 0 ? "1" : "0.5"}
                />
              );
            })}
          </svg>
          <span style={{ fontWeight: 700, fontSize: "20px", color: "#f0f9ff" }}>
            Axial<span style={{ color: "#38bdf8" }}>AI</span>
          </span>
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: "32px",
            fontWeight: 800,
            color: "#f0f9ff",
            letterSpacing: "-1px",
            marginBottom: "16px",
          }}
        >
          What is AxialAI?
        </h2>

        <p
          style={{
            fontSize: "16px",
            color: "#94a3b8",
            lineHeight: 1.8,
            marginBottom: "32px",
          }}
        >
          AxialAI is an industrial AI platform built specifically for
          <span style={{ color: "#38bdf8" }}>
            {" "}
            turbofan engine prognostics and predictive maintenance
          </span>
          . It bridges the gap between raw sensor data and actionable
          maintenance decisions — giving engineers the information they need,
          exactly when they need it.
        </p>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "rgba(56,189,248,0.1)",
            marginBottom: "32px",
          }}
        />

        {/* Who is it for */}
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#f0f9ff",
            marginBottom: "16px",
          }}
        >
          Who is it for?
        </h3>
        <p
          style={{
            fontSize: "15px",
            color: "#94a3b8",
            lineHeight: 1.8,
            marginBottom: "32px",
          }}
        >
          AxialAI is designed for{" "}
          <span style={{ color: "#f0f9ff" }}>maintenance engineers</span>{" "}
          working with turbofan jet engines — in commercial aviation, military
          aviation, and industrial gas turbine applications. No data science
          background required. If you can read a sensor report, you can use
          AxialAI.
        </p>

        <div
          style={{
            height: "1px",
            background: "rgba(56,189,248,0.1)",
            marginBottom: "32px",
          }}
        />

        {/* What it does */}
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#f0f9ff",
            marginBottom: "20px",
          }}
        >
          What does it do?
        </h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {[
            {
              num: "01",
              title: "Predicts Remaining Useful Life",
              desc: "Analyzes sensor streams to estimate exactly how many operational cycles remain before an engine requires maintenance.",
            },
            {
              num: "02",
              title: "Detects degradation early",
              desc: "Identifies subtle patterns in temperature, pressure, and fan speed data that indicate the beginning of engine wear — long before alarms trigger.",
            },
            {
              num: "03",
              title: "Understands your documents",
              desc: "Reads and summarizes maintenance manuals and technical reports. Ask any question about your documentation and get a direct answer instantly.",
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
                background: "rgba(56,189,248,0.04)",
                border: "1px solid rgba(56,189,248,0.1)",
                borderRadius: "12px",
                padding: "16px 20px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#38bdf8",
                  background: "rgba(56,189,248,0.1)",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              >
                {item.num}
              </span>
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#f0f9ff",
                    marginBottom: "4px",
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    lineHeight: 1.6,
                  }}
                >
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            height: "1px",
            background: "rgba(56,189,248,0.1)",
            marginBottom: "32px",
          }}
        />

        {/* Technology */}
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#f0f9ff",
            marginBottom: "16px",
          }}
        >
          Built on proven technology
        </h3>
        <p
          style={{
            fontSize: "15px",
            color: "#94a3b8",
            lineHeight: 1.8,
            marginBottom: "32px",
          }}
        >
          The prediction engine is trained on the{" "}
          <span style={{ color: "#f0f9ff" }}>NASA C-MAPSS dataset</span> — the
          industry benchmark for turbofan engine degradation modeling. The
          document intelligence layer processes technical documentation in any
          format, making institutional knowledge instantly searchable.
        </p>

        {/* CTA */}
        <button
          style={{
            width: "100%",
            background: "#38bdf8",
            color: "#060d1a",
            border: "none",
            borderRadius: "12px",
            padding: "14px",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Get started with AxialAI →
        </button>
      </div>
    </div>
  );
}

function Welcome({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const [showAbout, setShowAbout] = useState(false);
  useScrollReveal();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <style>{`
        .reveal {
          opacity: 0;
          transition: opacity 0.8s cubic-bezier(.22,1,.36,1), transform 0.8s cubic-bezier(.22,1,.36,1);
        }
        .reveal.from-left   { transform: translateX(-60px); }
        .reveal.from-right  { transform: translateX(60px); }
        .reveal.from-bottom { transform: translateY(50px); }
        .reveal.revealed    { opacity: 1 !important; transform: none !important; }
        .delay-1 { transition-delay: 0.1s; }
        .delay-2 { transition-delay: 0.2s; }
        .delay-3 { transition-delay: 0.3s; }
        .delay-4 { transition-delay: 0.4s; }
        @keyframes heroUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalUp {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* ABOUT MODAL */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      {/* NAVBAR */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
          height: "64px",
          borderBottom: "1px solid rgba(56,189,248,0.15)",
          background: "rgba(6,13,26,0.95)",
          backdropFilter: "blur(12px)",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="36" height="36" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="17"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            <circle cx="18" cy="18" r="3" fill="#38bdf8" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 18 + 5 * Math.cos(rad),
                y1 = 18 + 5 * Math.sin(rad);
              const x2 = 18 + 13 * Math.cos(rad),
                y2 = 18 + 13 * Math.sin(rad);
              const cx1 = 18 + 7 * Math.cos(rad - 0.4),
                cy1 = 18 + 7 * Math.sin(rad - 0.4);
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2}`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={i % 2 === 0 ? "1.8" : "1"}
                  strokeLinecap="round"
                  opacity={i % 2 === 0 ? "1" : "0.5"}
                />
              );
            })}
            <circle
              cx="18"
              cy="18"
              r="7"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="0.5"
              opacity="0.4"
            />
          </svg>
          <span
            style={{
              fontWeight: 700,
              fontSize: "20px",
              letterSpacing: "-0.5px",
              color: "#f0f9ff",
            }}
          >
            Axial<span style={{ color: "#38bdf8" }}>AI</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <span
            style={{
              fontSize: "14px",
              color: "#94a3b8",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.color = "#f0f9ff")}
            onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
            onClick={() => setShowAbout(true)}
          >
            About
          </span>
          <span
            style={{
              fontSize: "14px",
              color: "#94a3b8",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.color = "#f0f9ff")}
            onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
            onClick={() => navigate("/login")}
          >
            Platform
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={toggleTheme}
            style={{
              background: "none",
              border: "1px solid rgba(56,189,248,0.3)",
              borderRadius: "8px",
              padding: "8px",
              cursor: "pointer",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
            }}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "none",
              border: "1px solid rgba(56,189,248,0.3)",
              borderRadius: "8px",
              padding: "8px 18px",
              cursor: "pointer",
              color: "#f0f9ff",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Sign in
          </button>
          <button
            onClick={() => navigate("/register")}
            style={{
              background: "#38bdf8",
              border: "none",
              borderRadius: "8px",
              padding: "8px 18px",
              cursor: "pointer",
              color: "#060d1a",
              fontSize: "14px",
              fontWeight: "700",
            }}
          >
            Get started
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          minHeight: "100vh",
          background: "#060d1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          textAlign: "center",
          padding: "120px 48px 80px",
        }}
      >
        <AnimatedBackground />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            style={{
              fontSize: "clamp(40px, 6vw, 76px)",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-2px",
              color: "#f0f9ff",
              maxWidth: "820px",
              margin: "0 auto 24px",
              animation: "heroUp 0.9s cubic-bezier(.22,1,.36,1) both",
            }}
          >
            Predict engine failure
            <br />
            <span
              style={{
                color: "#38bdf8",
                textShadow: "0 0 40px rgba(56,189,248,0.4)",
              }}
            >
              before it happens
            </span>
          </h1>
          <p
            style={{
              fontSize: "18px",
              color: "#64748b",
              maxWidth: "500px",
              margin: "0 auto 48px",
              lineHeight: 1.7,
              animation: "heroUp 0.9s cubic-bezier(.22,1,.36,1) 0.15s both",
            }}
          >
            AI-powered platform for maintenance engineers. Upload sensor data
            and know exactly when your engine needs attention.
          </p>
          <div
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              animation: "heroUp 0.9s cubic-bezier(.22,1,.36,1) 0.3s both",
            }}
          >
            <button
              onClick={() => navigate("/register")}
              style={{
                background: "#38bdf8",
                color: "#060d1a",
                border: "none",
                borderRadius: "10px",
                padding: "14px 36px",
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 0 30px rgba(56,189,248,0.3)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.04)";
                e.currentTarget.style.boxShadow =
                  "0 0 50px rgba(56,189,248,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 0 30px rgba(56,189,248,0.3)";
              }}
            >
              Start now →
            </button>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            animation: "heroUp 1s ease 0.6s both",
          }}
        >
          <span style={{ fontSize: "12px", color: "#475569" }}>
            Scroll to explore
          </span>
          <div
            style={{
              width: "1px",
              height: "40px",
              background: "linear-gradient(to bottom, #38bdf8, transparent)",
            }}
          />
        </div>
      </section>

      {/* FEATURES */}
      <section
        style={{ padding: "120px 48px", maxWidth: "1100px", margin: "0 auto" }}
      >
        <div
          className="reveal from-bottom"
          style={{ textAlign: "center", marginBottom: "72px" }}
        >
          <h2
            style={{
              fontSize: "40px",
              fontWeight: 800,
              color: "var(--text)",
              letterSpacing: "-1px",
              marginBottom: "16px",
            }}
          >
            Built for maintenance engineers
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          {[
            {
              icon: <BarChart3 size={22} />,
              title: "RUL Prediction",
              desc: "Upload your engine sensor data and instantly know how many cycles remain before maintenance is required.",
              anim: "from-left",
            },
            {
              icon: <Zap size={22} />,
              title: "Live Monitoring",
              desc: "Watch sensor data play back in real time. Health alerts trigger automatically as degradation is detected.",
              anim: "from-bottom delay-2",
            },
            {
              icon: <Shield size={22} />,
              title: "Health Alerts",
              desc: "Clear Healthy, Warning, and Critical status for every engine unit. Know which ones need immediate action.",
              anim: "from-right",
            },
          ].map((f, i) => (
            <div
              key={i}
              className={`reveal ${f.anim}`}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "20px",
                padding: "32px",
                transition: "transform 0.3s, border-color 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "#38bdf855";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "#38bdf815",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#38bdf8",
                  marginBottom: "20px",
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: "12px",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text2)",
                  lineHeight: 1.7,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Document Assistant horizontal */}
        <div
          className="reveal from-bottom delay-3"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            padding: "40px 48px",
            display: "grid",
            gridTemplateColumns: "64px 1fr auto",
            alignItems: "center",
            gap: "32px",
            transition: "transform 0.3s, border-color 0.3s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.borderColor = "#38bdf855";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "#38bdf815",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#38bdf8",
              flexShrink: 0,
            }}
          >
            <FileText size={28} />
          </div>
          <div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "10px",
              }}
            >
              Document Assistant
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text2)",
                lineHeight: 1.7,
                maxWidth: "680px",
              }}
            >
              Stop searching through hundreds of pages manually. Upload any
              maintenance manual, technical report, or safety document and let
              AxialAI do the work. Get instant summaries and ask direct
              questions in plain language — the platform finds the right answer
              from your documents in seconds.
            </p>
          </div>
          <div style={{ flexShrink: 0, textAlign: "center" }}>
            <div
              style={{
                background: "rgba(56,189,248,0.08)",
                border: "1px solid rgba(56,189,248,0.2)",
                borderRadius: "12px",
                padding: "16px 24px",
              }}
            >
              <div
                style={{ fontSize: "24px", fontWeight: 800, color: "#38bdf8" }}
              >
                10x
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text2)",
                  marginTop: "4px",
                }}
              >
                faster than
                <br />
                manual search
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: "#060d1a", padding: "120px 48px" }}>
        <div
          style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}
        >
          <h2
            className="reveal from-bottom"
            style={{
              fontSize: "40px",
              fontWeight: 800,
              color: "#f0f9ff",
              letterSpacing: "-1px",
              marginBottom: "72px",
            }}
          >
            Three steps to zero surprises
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "48px",
            }}
          >
            {[
              {
                num: "01",
                title: "Upload",
                desc: "Export sensor data from your system as CSV and upload it to the platform.",
              },
              {
                num: "02",
                title: "Analyze",
                desc: "Our model processes every engine unit and computes remaining useful life instantly.",
              },
              {
                num: "03",
                title: "Act",
                desc: "See health status per engine. Schedule maintenance at exactly the right moment.",
              },
            ].map((step, i) => (
              <div
                key={i}
                className={`reveal ${i === 0 ? "from-left" : i === 2 ? "from-right" : "from-bottom"} delay-${i + 1}`}
              >
                <div
                  style={{
                    fontSize: "48px",
                    fontWeight: 800,
                    color: "rgba(56,189,248,0.25)",
                    letterSpacing: "-2px",
                    marginBottom: "16px",
                  }}
                >
                  {step.num}
                </div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#f0f9ff",
                    marginBottom: "12px",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#64748b",
                    lineHeight: 1.7,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "120px 48px",
          textAlign: "center",
          background: "var(--bg)",
        }}
      >
        <div
          className="reveal from-bottom"
          style={{ maxWidth: "600px", margin: "0 auto" }}
        >
          <h2
            style={{
              fontSize: "48px",
              fontWeight: 800,
              color: "var(--text)",
              letterSpacing: "-2px",
              marginBottom: "20px",
            }}
          >
            Ready to prevent
            <br />
            <span style={{ color: "#38bdf8" }}>the next failure?</span>
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "var(--text2)",
              marginBottom: "40px",
              lineHeight: 1.7,
            }}
          >
            Join maintenance teams already using AxialAI to stay ahead of engine
            degradation.
          </p>
          <button
            onClick={() => navigate("/register")}
            style={{
              background: "#38bdf8",
              color: "#060d1a",
              border: "none",
              borderRadius: "12px",
              padding: "16px 48px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 0 40px rgba(56,189,248,0.25)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.04)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Get started for free →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "32px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="24" height="24" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="17"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            <circle cx="18" cy="18" r="3" fill="#38bdf8" />
            {[0, 90, 180, 270].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <path
                  key={i}
                  d={`M ${18 + 5 * Math.cos(rad)} ${18 + 5 * Math.sin(rad)} L ${18 + 12 * Math.cos(rad)} ${18 + 12 * Math.sin(rad)}`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          <span
            style={{ fontWeight: 700, fontSize: "16px", color: "var(--text)" }}
          >
            Axial<span style={{ color: "#38bdf8" }}>AI</span>
          </span>
        </div>
        <span style={{ fontSize: "13px", color: "var(--text2)" }}>
          © 2025 AxialAI · Predictive Maintenance Platform
        </span>
        <span
          style={{ fontSize: "13px", color: "var(--text2)", cursor: "pointer" }}
          onMouseEnter={(e) => (e.target.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.target.style.color = "var(--text2)")}
        >
          Privacy
        </span>
      </footer>
    </div>
  );
}

export default Welcome;
