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

          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data}>
              <XAxis dataKey="cycle" />
              <YAxis domain={[0, 1]} />
              <Tooltip />

              <Line
                type="monotone"
                dataKey={sensor}
                stroke={SENSOR_COLORS[sensor]}
                strokeWidth={2}
                dot={false}
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
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button
        onClick={onUpload}
        style={{
          background: "#38bdf8",
          color: "#000",
          border: "none",
          padding: "14px 24px",
          borderRadius: "12px",
          cursor: "pointer",
          fontWeight: "700",
        }}
      >
        Upload CSV / TXT
      </button>
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

      const analysis = {
        id: Date.now(),
        filename: file.name,
        date: new Date().toLocaleString(),
        ...result,
      };

      setAnalyses((prev) => [analysis, ...prev]);

      setSelected(analysis);

      if (result.engines?.length > 0) {
        setSelectedEngine(result.engines[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: "analysis",
      label: "Analysis",
      icon: <BarChart3 size={14} />,
    },
    {
      id: "documents",
      label: "Documents",
      icon: <FileText size={14} />,
    },
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
          height: "60px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            fontSize: "20px",
            fontWeight: "700",
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          AxialAI
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button onClick={() => navigate("/")}>
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      {/* BODY */}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* SIDEBAR */}

        <div
          style={{
            width: "260px",
            borderRight: "1px solid var(--border)",
            padding: "16px",
            overflowY: "auto",
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            style={{ display: "none" }}
            onChange={handleUpload}
          />

          <button
            onClick={() => fileRef.current.click()}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              background: "#38bdf8",
              color: "#000",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            {loading ? "Analyzing..." : "Upload File"}
          </button>

          {error && (
            <div
              style={{
                marginTop: "12px",
                color: "#ef4444",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginTop: "20px" }}>
            {analyses.map((a) => (
              <div
                key={a.id}
                onClick={() => {
                  setSelected(a);
                  setSelectedEngine(a.engines[0]);
                }}
                style={{
                  padding: "12px",
                  marginBottom: "8px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  background:
                    selected?.id === a.id
                      ? "rgba(56,189,248,0.1)"
                      : "transparent",
                }}
              >
                <div style={{ fontWeight: "600" }}>{a.filename}</div>

                <div style={{ fontSize: "12px", opacity: 0.7 }}>
                  {a.total} engines
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN */}

        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "24px",
          }}
        >
          {!selected ? (
            <EmptyState onUpload={() => fileRef.current.click()} />
          ) : (
            <>
              {/* TABS */}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "24px",
                }}
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "10px",
                      border: "none",
                      cursor: "pointer",
                      background:
                        activeTab === tab.id ? "#38bdf8" : "var(--bg2)",
                      color: activeTab === tab.id ? "#000" : "var(--text)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ANALYSIS */}

              {activeTab === "analysis" && selectedEngine && (
                <>
                  <h2
                    style={{
                      fontSize: "28px",
                      marginBottom: "16px",
                    }}
                  >
                    Engine {selectedEngine.unit_id}
                  </h2>

                  <div
                    style={{
                      marginBottom: "24px",
                      display: "flex",
                      gap: "20px",
                    }}
                  >
                    <StatusBadge status={selectedEngine.status} />

                    <div>
                      RUL: <strong>{selectedEngine.rul}</strong>
                    </div>

                    <div>
                      Cycles: <strong>{selectedEngine.n_cycles}</strong>
                    </div>
                  </div>

                  <SensorChart history={selectedEngine.sensor_history} />
                </>
              )}

              {/* DOCUMENTS */}

              {activeTab === "documents" && (
                <div
                  style={{
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                    borderRadius: "16px",
                    padding: "24px",
                  }}
                >
                  <h2
                    style={{
                      marginBottom: "12px",
                    }}
                  >
                    Documents Page
                  </h2>

                  <p
                    style={{
                      color: "var(--text2)",
                    }}
                  >
                    Documents section is working correctly.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
