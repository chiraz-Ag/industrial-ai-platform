import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

function BackgroundCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationId;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random(), y: Math.random(),
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.0007 + 0.0002,
      opacity: Math.random() * 0.35 + 0.1,
    }));
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#020617");
      bg.addColorStop(1, "#0b1220");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) { p.y = 1; p.x = Math.random(); }
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56,189,248,${p.opacity})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0 }} />;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Login failed"); return; }
      localStorage.setItem("token", data.access_token);
      window.location.href = "/dashboard";
    } catch {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "http://localhost:5173/dashboard",
      queryParams: {
        prompt: "select_account",  // ← force le choix du compte
      },
    },
  });
  if (error) setError("Google login failed");
};

  return (
    <>
      <style>{`
        body { margin: 0; font-family: Inter, sans-serif; background: #020617; }
        .wrap { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 10; }
        .card { width: 100%; max-width: 420px; background: #0f172a; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 38px; }
        .input { width: 100%; padding: 14px; margin-bottom: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: #0b1220; color: white; outline: none; box-sizing: border-box; }
        .forgot { text-align: right; font-size: 12px; margin-bottom: 14px; }
        .forgot a { color: #38bdf8; cursor: pointer; text-decoration: none; }
        .btn { width: 100%; padding: 14px; border-radius: 10px; border: none; background: #38bdf8; color: #060d1a; font-weight: 700; cursor: pointer; font-size: 15px; }
        .btn:hover { opacity: 0.9; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .divider { display: flex; align-items: center; margin: 18px 0; color: rgba(148,163,184,0.5); font-size: 12px; }
        .divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: rgba(255,255,255,0.08); }
        .divider span { margin: 0 10px; }
        .google-btn { width: 100%; padding: 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: white; color: #111; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 15px; }
        .google-btn:hover { background: #f1f5f9; }
        .footer { margin-top: 18px; text-align: center; font-size: 13px; color: rgba(148,163,184,0.6); }
        .footer a { color: #38bdf8; text-decoration: none; }
        .error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #f87171; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 14px; }
      `}</style>

      <BackgroundCanvas />

      <div className="wrap">
        <div className="card">
          <div style={{ textAlign: "center", marginBottom: "26px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
              <svg width="40" height="40" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="17" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="18" cy="18" r="3" fill="#38bdf8" />
                {[0,45,90,135,180,225,270,315].map((angle, i) => {
                  const rad = (angle * Math.PI) / 180;
                  const x1 = 18 + 5 * Math.cos(rad), y1 = 18 + 5 * Math.sin(rad);
                  const x2 = 18 + 13 * Math.cos(rad), y2 = 18 + 13 * Math.sin(rad);
                  const cx1 = 18 + 7 * Math.cos(rad - 0.4), cy1 = 18 + 7 * Math.sin(rad - 0.4);
                  return <path key={i} d={`M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2}`} fill="none" stroke="#38bdf8" strokeWidth={i % 2 === 0 ? "1.6" : "1"} opacity={i % 2 === 0 ? "1" : "0.5"} />;
                })}
              </svg>
            </div>
            <div style={{ fontSize: "40px", fontWeight: "800", color: "#f0f9ff", letterSpacing: "2px", marginBottom: "8px" }}>
              Axial<span style={{ color: "#38bdf8" }}>AI</span>
            </div>
            <div style={{ fontSize: "12px", color: "rgba(148,163,184,0.7)", letterSpacing: "0.08em" }}>
              Predictive Maintenance & NLP Diagnostics Platform
            </div>
          </div>

          {error && <div className="error">⚠️ {error}</div>}

          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />

          <div className="forgot"><a onClick={() => window.location.href = "/forgot-password"}>Forgot password?</a></div>

          <button className="btn" onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="divider"><span>OR</span></div>

          <button className="google-btn" onClick={handleGoogleLogin}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" />
            Sign in with Google
          </button>

          <div className="footer">
            Don't have an account? <a href="/register">Create account</a>
          </div>
        </div>
      </div>
    </>
  );
}