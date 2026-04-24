import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  LogOut,
  FileText,
  BarChart3,
  Trash2,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { predictRUL } from "../api/predict";

const SENSOR_COLORS = {
  sensor_02: "#38bdf8",
  sensor_03: "#f97316",
  sensor_04: "#22c55e",
  sensor_07: "#a78bfa",
  sensor_11: "#f43f5e",
  sensor_12: "#facc15",
};

const SENSOR_LABELS = {
  sensor_02: "LPC Outlet Temp (T24)",
  sensor_03: "HPC Outlet Temp (T30)",
  sensor_04: "LPT Outlet Temp (T50)",
  sensor_07: "HPC Outlet Pressure (P30)",
  sensor_11: "HPC Static Pressure (Ps30)",
  sensor_12: "Fuel Flow Ratio (phi)",
};

function StatusBadge({ status }) {
  const config = {
    healthy: {
      color: "#22c55e",
      bg: "rgba(34,197,94,0.1)",
      icon: <CheckCircle size={12} />,
      label: "Healthy",
    },
    warning: {
      color: "#f97316",
      bg: "rgba(249,115,22,0.1)",
      icon: <AlertTriangle size={12} />,
      label: "Warning",
    },
    critical: {
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
      icon: <XCircle size={12} />,
      label: "Critical",
    },
  };
  const c = config[status] || config.healthy;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        background: c.bg,
        color: c.color,
        padding: "3px 10px",
        borderRadius: "99px",
        fontSize: "12px",
        fontWeight: 600,
      }}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

function RULBar({ rul }) {
  const pct = Math.min((rul / 125) * 100, 100);
  const color = rul > 50 ? "#22c55e" : rul > 20 ? "#f97316" : "#ef4444";
  return (
    <div
      style={{
        flex: 1,
        height: "6px",
        background: "rgba(255,255,255,0.08)",
        borderRadius: "99px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: "99px",
          transition: "width 0.5s",
        }}
      />
    </div>
  );
}

function SensorChart({ history }) {
  if (!history) return null;

  const data = history.time_cycle.map((t, i) => {
    const point = { cycle: t };
    Object.keys(SENSOR_COLORS).forEach((s) => {
      if (history[s]) {
        const values = history[s];
        const min = Math.min(...values);
        const max = Math.max(...values);
        point[s] =
          max - min > 0
            ? parseFloat(((values[i] - min) / (max - min)).toFixed(4))
            : 0;
      }
    });
    return point;
  });

  const sensors = Object.keys(SENSOR_COLORS).filter((s) => history[s]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {sensors.map((sensor) => (
        <div
          key={sensor}
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "16px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: SENSOR_COLORS[sensor],
              marginBottom: "4px",
            }}
          >
            {SENSOR_LABELS[sensor]} · {sensor}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--text2)",
              marginBottom: "12px",
            }}
          >
            Normalized degradation trend (0 = min, 1 = max)
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data}>
              <XAxis
                dataKey="cycle"
                tick={{ fontSize: 10, fill: "#475569" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 1]}
                tick={{ fontSize: 10, fill: "#475569" }}
                tickLine={false}
                axisLine={false}
                width={30}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(56,189,248,0.2)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#94a3b8" }}
                labelFormatter={(v) => `Cycle ${v}`}
                formatter={(v) => [v.toFixed(3), SENSOR_LABELS[sensor]]}
              />
              <Line
                type="monotone"
                dataKey={sensor}
                stroke={SENSOR_COLORS[sensor]}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4, fill: SENSOR_COLORS[sensor] }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onUpload }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        padding: "80px 48px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "20px",
          background: "rgba(56,189,248,0.08)",
          border: "1px solid rgba(56,189,248,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#38bdf8",
        }}
      >
        <Upload size={32} />
      </div>
      <div>
        <h3
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "8px",
          }}
        >
          No engine data yet
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text2)",
            lineHeight: 1.7,
            maxWidth: "360px",
          }}
        >
          Upload a CSV or TXT file containing sensor readings to get RUL
          predictions for your engine fleet.
        </p>
      </div>
      <button
        onClick={onUpload}
        style={{
          background: "#38bdf8",
          color: "#060d1a",
          border: "none",
          borderRadius: "10px",
          padding: "12px 28px",
          fontSize: "14px",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 0 20px rgba(56,189,248,0.25)",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        Upload CSV / TXT file
      </button>
      <p style={{ fontSize: "12px", color: "var(--text2)" }}>
        Supports C-MAPSS format · FD001 / FD002 / FD003 / FD004
      </p>
    </div>
  );
}

export default function Dashboard({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [analyses, setAnalyses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedEngine, setSelectedEngine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("analysis");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await predictRUL(file);
      if (result.error) throw new Error(result.error);
      const analysis = {
        id: Date.now(),
        filename: file.name,
        date: new Date().toLocaleString(),
        ...result,
      };
      setAnalyses((prev) => [analysis, ...prev]);
      setSelected(analysis);
      setSelectedEngine(result.engines[0]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const deleteAnalysis = (id, e) => {
    e.stopPropagation();
    setAnalyses((prev) => prev.filter((a) => a.id !== id));
    if (selected?.id === id) {
      setSelected(null);
      setSelectedEngine(null);
    }
  };

  const tabs = [
    { id: "analysis", label: "Analysis", icon: <BarChart3 size={14} /> },
    { id: "documents", label: "Documents", icon: <FileText size={14} /> },
  ];

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      {/* NAVBAR */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: "56px",
          flexShrink: 0,
          borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          <svg width="28" height="28" viewBox="0 0 36 36">
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
          <span
            style={{ fontWeight: 700, fontSize: "18px", color: "var(--text)" }}
          >
            Axial<span style={{ color: "#38bdf8" }}>AI</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={toggleTheme}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "7px",
              cursor: "pointer",
              color: "var(--text2)",
              display: "flex",
              alignItems: "center",
            }}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "7px 14px",
              cursor: "pointer",
              color: "var(--text2)",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </nav>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* SIDEBAR */}
        <div
          style={{
            width: "260px",
            flexShrink: 0,
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            background: "var(--bg2)",
          }}
        >
          <div style={{ padding: "16px" }}>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              style={{ display: "none" }}
              onChange={handleUpload}
            />
            <button
              onClick={() => fileRef.current.click()}
              disabled={loading}
              style={{
                width: "100%",
                background: "#38bdf8",
                color: "#060d1a",
                border: "none",
                borderRadius: "10px",
                padding: "10px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: loading ? 0.7 : 1,
              }}
            >
              <Upload size={15} />
              {loading ? "Analyzing..." : "Upload CSV / TXT"}
            </button>
            {error && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  fontSize: "12px",
                  color: "#ef4444",
                }}
              >
                {error}
              </div>
            )}
          </div>

          {selected && (
            <div
              style={{
                margin: "0 16px 16px",
                padding: "12px",
                background: "rgba(56,189,248,0.05)",
                border: "1px solid rgba(56,189,248,0.1)",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text2)",
                  marginBottom: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Fleet summary
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "8px",
                  textAlign: "center",
                }}
              >
                {[
                  {
                    label: "Critical",
                    value: selected.critical,
                    color: "#ef4444",
                  },
                  {
                    label: "Warning",
                    value: selected.warning,
                    color: "#f97316",
                  },
                  {
                    label: "Healthy",
                    value: selected.healthy,
                    color: "#22c55e",
                  },
                ].map((s) => (
                  <div key={s.label}>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: 800,
                        color: s.color,
                      }}
                    >
                      {s.value}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--text2)" }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
            {analyses.length === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "var(--text2)",
                }}
              >
                No analyses yet
              </div>
            ) : (
              analyses.map((a) => (
                <div
                  key={a.id}
                  onClick={() => {
                    setSelected(a);
                    setSelectedEngine(a.engines[0]);
                  }}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    marginBottom: "4px",
                    background:
                      selected?.id === a.id
                        ? "rgba(56,189,248,0.1)"
                        : "transparent",
                    border: `1px solid ${selected?.id === a.id ? "rgba(56,189,248,0.3)" : "transparent"}`,
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--text)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {a.filename}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text2)",
                          marginTop: "2px",
                        }}
                      >
                        {a.date}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text2)",
                          marginTop: "4px",
                        }}
                      >
                        {a.total} engines · {a.dataset}
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteAnalysis(a.id, e)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text2)",
                        padding: "2px",
                        flexShrink: 0,
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#ef4444")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "var(--text2)")
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {!selected ? (
            <EmptyState onUpload={() => fileRef.current.click()} />
          ) : (
            <>
              {/* ENGINE LIST */}
              <div
                style={{
                  width: "280px",
                  flexShrink: 0,
                  borderRight: "1px solid var(--border)",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text2)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Engine units · {selected.total}
                  </div>
                </div>
                {selected.engines.map((engine) => (
                  <div
                    key={engine.unit_id}
                    onClick={() => setSelectedEngine(engine)}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--border)",
                      background:
                        selectedEngine?.unit_id === engine.unit_id
                          ? "rgba(56,189,248,0.08)"
                          : "transparent",
                      borderLeft:
                        selectedEngine?.unit_id === engine.unit_id
                          ? "2px solid #38bdf8"
                          : "2px solid transparent",
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--text)",
                        }}
                      >
                        Unit {engine.unit_id}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <StatusBadge status={engine.status} />
                        <ChevronRight
                          size={12}
                          style={{ color: "var(--text2)" }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <RULBar rul={engine.rul} />
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--text2)",
                          minWidth: "50px",
                          textAlign: "right",
                        }}
                      >
                        {engine.rul} cyc
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ENGINE DETAIL */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
                {selectedEngine && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "24px",
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            fontSize: "24px",
                            fontWeight: 800,
                            color: "var(--text)",
                            marginBottom: "4px",
                          }}
                        >
                          Engine Unit {selectedEngine.unit_id}
                        </h2>
                        <div
                          style={{ fontSize: "13px", color: "var(--text2)" }}
                        >
                          {selectedEngine.n_cycles} cycles recorded ·{" "}
                          {selected.dataset}
                        </div>
                      </div>
                      <StatusBadge status={selectedEngine.status} />
                    </div>

                    {/* RUL Card */}
                    <div
                      style={{
                        background: "var(--bg2)",
                        border: "1px solid var(--border)",
                        borderRadius: "16px",
                        padding: "24px",
                        marginBottom: "24px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "24px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text2)",
                            marginBottom: "8px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Predicted RUL
                        </div>
                        <div
                          style={{
                            fontSize: "48px",
                            fontWeight: 800,
                            color: "#38bdf8",
                            letterSpacing: "-2px",
                          }}
                        >
                          {selectedEngine.rul}
                        </div>
                        <div
                          style={{ fontSize: "13px", color: "var(--text2)" }}
                        >
                          operational cycles
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text2)",
                            marginBottom: "8px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Health status
                        </div>
                        <div
                          style={{
                            fontSize: "24px",
                            fontWeight: 700,
                            color:
                              selectedEngine.status === "healthy"
                                ? "#22c55e"
                                : selectedEngine.status === "warning"
                                  ? "#f97316"
                                  : "#ef4444",
                          }}
                        >
                          {selectedEngine.status.charAt(0).toUpperCase() +
                            selectedEngine.status.slice(1)}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "var(--text2)",
                            marginTop: "4px",
                          }}
                        >
                          {selectedEngine.status === "healthy"
                            ? "No action required"
                            : selectedEngine.status === "warning"
                              ? "Schedule maintenance"
                              : "Immediate action required"}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text2)",
                            marginBottom: "8px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Cycles recorded
                        </div>
                        <div
                          style={{
                            fontSize: "24px",
                            fontWeight: 700,
                            color: "var(--text)",
                          }}
                        >
                          {selectedEngine.n_cycles}
                        </div>
                        <div
                          style={{ fontSize: "13px", color: "var(--text2)" }}
                        >
                          total cycles in file
                        </div>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        marginBottom: "24px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "10px 16px",
                            fontSize: "13px",
                            fontWeight: 600,
                            color:
                              activeTab === tab.id ? "#38bdf8" : "var(--text2)",
                            borderBottom: `2px solid ${activeTab === tab.id ? "#38bdf8" : "transparent"}`,
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "color 0.2s",
                            marginBottom: "-1px",
                          }}
                        >
                          {tab.icon}
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {activeTab === "analysis" && (
                      <SensorChart history={selectedEngine.sensor_history} />
                    )}

                    {activeTab === "documents" && (
                      <div
                        style={{
                          background: "var(--bg2)",
                          border: "1px solid var(--border)",
                          borderRadius: "16px",
                          padding: "32px",
                          textAlign: "center",
                          color: "var(--text2)",
                        }}
                      >
                        <FileText
                          size={32}
                          style={{ marginBottom: "12px", opacity: 0.4 }}
                        />
                        <div style={{ fontSize: "14px" }}>
                          Document assistant — maintenance manuals and technical
                          reports
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
