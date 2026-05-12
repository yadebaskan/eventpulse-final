import React, { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";
import {
  Users, Ticket, Zap, AlertTriangle, CheckCircle,
  Database, Clock, Bell, Shield, Radio,
  RefreshCw, DollarSign, ArrowUpRight, Terminal, X, Map, Package,
  MessageSquare, UserCheck, Cpu, Activity
} from "lucide-react";

import {
  fetchMetrics,
  simulateTicketScan,
  resetTickets,
  simulateValidScanAPI,
  bulkSimulateTickets,
  togglePeakTraffic,
  toggleAutoTrafficAPI,
  fetchAlerts,
  triggerGateFailureAlert,
  triggerHighLatencyAlert,
  resolveAlertAPI,
} from "./services/api";
import { socket } from "./services/socket";

const COLORS = {
  primary: "#8b5cf6",
  secondary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
};

const generateInitialData = () => {
  const data = [];
  const now = Date.now();

  for (let i = 20; i > 0; i--) {
    const time = new Date(now - i * 2000);
    data.push({
      time: `${time.getHours().toString().padStart(2, "0")}:${time
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${time.getSeconds().toString().padStart(2, "0")}`,
      value: 3000 + Math.random() * 1000,
    });
  }

  return data;
};

const App = () => {
  const [backendStatus, setBackendStatus] = useState("checking");
  const [apiHealth, setApiHealth] = useState(false);
  const [lastScanResult, setLastScanResult] = useState(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPeakLoad, setIsPeakLoad] = useState(false);
  const [isNetworkOutage, setIsNetworkOutage] = useState(false);
  const [isGateCFixed, setIsGateCFixed] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [isAutoTrafficEnabled, setIsAutoTrafficEnabled] = useState(true);
  const [isAlertMenuOpen, setIsAlertMenuOpen] = useState(false);
  const [realtimeData, setRealtimeData] = useState(generateInitialData());
  const [syncQueue, setSyncQueue] = useState(0);
  const [alerts, setAlerts] = useState([]);

  const [notifications, setNotifications] = useState([]);
  const isNetworkOutageRef = useRef(isNetworkOutage);

  useEffect(() => {
    isNetworkOutageRef.current = isNetworkOutage;
  }, [isNetworkOutage]);
  const [inventory, setInventory] = useState([
    { id: "burger", name: "Burger Station", stock: 85, autoOrder: false },
    { id: "beverage", name: "Beverage Bar", stock: 45, autoOrder: true },
    { id: "merch", name: "Official Merch", stock: 70, autoOrder: false },
  ]);

  const [stats, setStats] = useState({
    tickets: 47283,
    activeGates: "23/24",
    latency: 120,
    errorRate: 0.03,
    concurrent: 18492,
    pods: 8,
    efficiency: 92,
    revenue: 2847392,
  });

  const addNotification = (title, message, type = "info") => {
    const id = Date.now();
    setNotifications((prev) => [{ id, title, message, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 5));
    
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const staffMembers = [
    { id: 1, name: "Lead Architect", role: "Technical HQ", shift: "All Day", time: "10:00 - 00:00", progress: 82, status: "Active" },
    { id: 2, name: "Ops Director", role: "Operations HQ", shift: "All Day", time: "10:00 - 00:00", progress: 82, status: "Active" },
    { id: 10, name: "Unit-M1", role: "Field Technician", shift: "Morning", time: "10:00 - 18:00", progress: 100, status: "Ended" },
    { id: 11, name: "Unit-M2", role: "Security Unit", shift: "Morning", time: "10:00 - 18:00", progress: 100, status: "Ended" },
    { id: 3, name: "Project Lead", role: "Shift Coordination", shift: "Afternoon", time: "14:00 - 22:00", progress: 68, status: "Active" },
    { id: 4, name: "Quality Unit", role: "QA Tester", shift: "Afternoon", time: "14:00 - 22:00", progress: 68, status: "Active" },
    { id: 13, name: "Night Supervisor", role: "Night Operations", shift: "Night", time: "18:00 - 02:00", progress: 22, status: "Active" },
    { id: 14, name: "Crowd Unit-N1", role: "Field Security", shift: "Night", time: "18:00 - 02:00", progress: 18, status: "Patrolling" },
    { id: 18, name: "Infra Unit-N1", role: "Network Support", shift: "Night", time: "18:00 - 02:00", progress: 18, status: "Active" },
    { id: 19, name: "Logistics Unit", role: "Stock Management", shift: "Night", time: "18:00 - 02:00", progress: 12, status: "Active" },
  ];

  const intercomMessages = [
    { id: 1, from: "Admin HQ", msg: "Handover complete. Afternoon units logging off.", time: "18:05" },
    { id: 2, from: "Tech Unit", msg: "Gate C hardware fail confirmed. Standby for sensor repair.", time: "18:22" },
    { id: 3, from: "Central Admin", msg: "Sync threshold adjusted for high-load Night Phase.", time: "18:45" },
  ];

  useEffect(() => {
    const connectBackend = async () => {
      const metrics = await fetchMetrics();
      const alertsData = await fetchAlerts();

if (alertsData) {
  setAlerts(alertsData);
}

      if (metrics) {
        setBackendStatus("connected");
        setApiHealth(true);

        setStats((prev) => ({
          ...prev,
          tickets: metrics.totalEntries ?? prev.tickets,
          latency: metrics.latency ?? prev.latency,
          errorRate: metrics.errorRate ?? prev.errorRate,
          concurrent: metrics.concurrentUsers ?? prev.concurrent,
          activeGates: metrics.activeGates ?? prev.activeGates,
          revenue: metrics.revenue ?? prev.revenue,
        }));
      } else {
        setBackendStatus("demo");
        setApiHealth(false);
      }
    };

    connectBackend();

    socket.connect();

    socket.on("connect", () => {
      setBackendStatus("connected");
    });

    socket.on("connect_error", () => {
      setBackendStatus("demo");
      setApiHealth(false);
    });

    socket.on("metrics:update", (data) => {
      console.log("Metrics received from backend:", data);
      setApiHealth(true);
      setStats((prev) => ({
        ...prev,
        // Use ref to check outage status to avoid closure issues in socket listener
        tickets: isNetworkOutageRef.current ? prev.tickets : (data.totalEntries ?? prev.tickets),
        latency: data.latency ?? prev.latency,
        errorRate: data.errorRate ?? prev.errorRate,
        concurrent: data.concurrentUsers ?? prev.concurrent,
        activeGates: data.activeGates ?? prev.activeGates,
        revenue: data.revenue ?? prev.revenue,
        pods: data.pods ?? prev.pods,
      }));
    });

    socket.on("ticket:scanned", (data) => {
      setLastScanResult(data);
      if (data.success) {
        addNotification("Ticket Verified", `${data.ticketCode} has successfully entered.`, "success");
      } else {
        addNotification("INVALID TICKET", `${data.ticketCode} was rejected!`, "danger");
      }
    });
    socket.on("alert:created", (alert) => {
      setAlerts((prev) => {
        if (prev.find((a) => a.id === alert.id)) return prev;
        return [alert, ...prev];
      });
      addNotification("New System Alert", alert.title, "warning");
    });

    socket.on("alert:updated", (alert) => {
      setAlerts((prev) =>
        prev.map((item) => (item.id === alert.id ? alert : item))
      );
      if (alert.status === "RESOLVED") {
        addNotification("Alert Resolved", alert.title, "success");
      }
    });

    // Initial Gate Alert
    if (!isGateCFixed) {
      addNotification("Critical Fault", "Gate C sensor module failure detected!", "danger");
    }

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("metrics:update");
      socket.off("ticket:scanned");
      socket.off("alert:created");
      socket.disconnect();
    };
  }, []);

  // Sync Peak Mode with Backend
  useEffect(() => {
    togglePeakTraffic(isPeakLoad);
    if (isPeakLoad) {
      addNotification("Peak Load", "System entering high-traffic mode!", "warning");
    }
  }, [isPeakLoad]);


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());

      const multiplier = isPeakLoad ? 12 : 1;
      let syncBurst = 0;

      if (isNetworkOutage) {
        setSyncQueue((prev) => prev + Math.floor(Math.random() * 12 + 6));
      } else if (syncQueue > 0) {
        syncBurst = Math.min(syncQueue, 45);
        setSyncQueue((prev) => Math.max(0, prev - syncBurst));
        // Push these to backend for real persistence
        bulkSimulateTickets(syncBurst);
      }

      setStats((prev) => {
        return {
          ...prev,
          tickets: prev.tickets + syncBurst,
          concurrent: prev.concurrent + syncBurst,
          activeGates: isNetworkOutage ? "OFFLINE" : isGateCFixed ? "24/24" : "23/24",
        };
      });

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

      setRealtimeData((prev) => {
        const base = isPeakLoad ? 7500 : 3500;
        const variation = Math.random() * 1800;
        const newVal = isNetworkOutage ? 20 + Math.random() * 50 : base + variation + syncBurst * 180;

        return [...prev, { time: timeStr, value: newVal }].slice(-20);
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [isPeakLoad, isNetworkOutage, syncQueue, isGateCFixed]);

  const handleValidScan = async () => {
    const result = await simulateValidScanAPI();

    if (result) {

  if (result.status === "DUPLICATE") {
    setAlerts((prev) => [
      {
        id: `duplicate-${Date.now()}`,
        title: "Duplicate Ticket Scan",
        message: `Duplicate scan attempt detected for ticket ${result.ticketCode}.`,
        severity: "HIGH",
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  setLastScanResult({
    status: result.success ? "VALID" : "INVALID",
    message: result.message || "Ticket processed by backend",
  });

      if (result.success) {
        addNotification("Ticket Confirmed", "VIP Access granted successfully.", "success");
        
        // Update Stats
        setStats((prev) => ({
          ...prev,
          tickets: prev.tickets + 1,
          concurrent: prev.concurrent + 1,
        }));

        // Reduce Inventory
        setInventory((prev) => prev.map(item => {
          if (item.id === "beverage") {
            const newStock = Math.max(0, item.stock - 2);
            if (newStock < 20) addNotification("Low Inventory", "Beverage bar supplies are critically low!", "warning");
            return { ...item, stock: newStock };
          }
          return item;
        }));
      }
    } else {
      addNotification("Demo Mode", "Simulated ticket scan accepted.", "success");
      setStats((prev) => ({
        ...prev,
        tickets: prev.tickets + 1,
        concurrent: prev.concurrent + 1,
      }));
    }
  };

  const handleInvalidScan = async () => {
    const result = await simulateTicketScan({
      ticketCode: "INVALID-001",
      gateId: "Gate-A",
    });

    addNotification("SECURITY ALERT", "Invalid ticket attempt blocked!", "danger");

    if (result) {
      setLastScanResult({
        status: "INVALID",
        message: result.message || "Invalid or duplicate ticket detected",
      });
    }
  };

  const handleReset = async () => {
    await resetTickets();
    setInventory([
      { id: "burger", name: "Burger Station", stock: 85, autoOrder: false },
      { id: "beverage", name: "Beverage Bar", stock: 45, autoOrder: true },
      { id: "merch", name: "Official Merch", stock: 70, autoOrder: false },
    ]);
    addNotification("System Reset", "All records and inventories have been cleared.", "info");
  };

  const StatCard = ({ icon: Icon, title, value, subValue, trend, color, highlight, pulse, warning }) => (
    <div
      className={`bg-slate-800/60 border ${
        highlight
          ? "border-violet-500 ring-2 ring-violet-500/20"
          : warning
          ? "border-rose-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
          : "border-slate-700"
      } p-4 rounded-xl transition-all duration-300 relative overflow-hidden shadow-lg shadow-black/20`}
    >
      {pulse && <div className="absolute top-0 right-0 w-1 h-full bg-violet-500 animate-pulse" />}
      <div className="flex justify-between items-start mb-2 text-white">
        <div className="p-2 rounded-lg bg-opacity-20" style={{ backgroundColor: `${color}20`, color }}>
          <Icon size={18} />
        </div>
        {trend && (
          <span className={`text-[10px] font-bold ${trend.startsWith("+") ? "text-emerald-400" : "text-rose-400"}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">{title}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
        {subValue && <span className={`text-[10px] ${warning ? "text-rose-400 font-bold" : "text-slate-500"}`}>{subValue}</span>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-200 font-sans p-4 md:p-6 pb-20 overflow-x-hidden">
      {/* Notification Sidebar */}
      {isAlertMenuOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAlertMenuOpen(false)} />
          <div className="relative w-80 h-full bg-[#0f172a] border-l border-slate-800 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <Bell size={16} className="text-violet-500" /> Alert Feed
              </h2>
              <button onClick={() => setIsAlertMenuOpen(false)} className="text-slate-500 hover:text-white transition-colors p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50 space-y-4">
                  <Shield size={48} strokeWidth={1} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No active alerts</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`p-4 rounded-xl border ${
                    n.type === "danger" ? "bg-rose-500/5 border-rose-500/20" : 
                    n.type === "success" ? "bg-emerald-500/5 border-emerald-500/20" : 
                    "bg-slate-800/40 border-slate-700"
                  } transition-all`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        n.type === "danger" ? "bg-rose-500 text-white" : 
                        n.type === "success" ? "bg-emerald-500 text-white" : 
                        "bg-violet-600 text-white"
                      }`}>
                        {n.type}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">{n.time}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1">{n.title}</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="text-violet-500 animate-pulse" size={24} />
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic leading-none">
              EventPulse <span className="text-violet-500 not-italic uppercase font-bold opacity-80">Command</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-slate-500">
            <span
              className={`w-2 h-2 rounded-full ${
                apiHealth ? "bg-emerald-500" : backendStatus === "demo" ? "bg-amber-500" : "bg-slate-500"
              } animate-pulse`}
            />
            {apiHealth
              ? "BACKEND_CONNECTED // LIVE_API_STREAM"
              : backendStatus === "demo"
              ? "DEMO_MODE // SIMULATION_FALLBACK"
              : "CHECKING_BACKEND_CONNECTION"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 border border-slate-700 p-1 rounded-xl gap-1 mr-2 shadow-inner">
            <button
              onClick={() => setIsPeakLoad(!isPeakLoad)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                isPeakLoad ? "bg-violet-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
              }`}
            >
              Sim_Peak
            </button>
            <button
              onClick={() => setIsNetworkOutage(!isNetworkOutage)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                isNetworkOutage ? "bg-rose-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
              }`}
            >
              Sim_Net
            </button>
          </div>

          <button
            onClick={() => setIsAlertMenuOpen(!isAlertMenuOpen)}
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 relative hover:text-white"
          >
            <Bell size={18} />
            {!isGateCFixed && !isNetworkOutage && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-600 text-[8px] flex items-center justify-center rounded-full text-white font-bold border-2 border-[#0b0f19]">
                3
              </span>
            )}
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-700 ml-2">
            <div className="text-right">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1 leading-none">Night Command Center</p>
              <p className="text-[9px] text-white font-bold uppercase tracking-tighter">Unified Operations HQ</p>
            </div>
            <div className="p-2 bg-slate-800 border border-slate-700 rounded-lg shadow-inner">
              <Cpu size={20} className="text-violet-500" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-1 bg-slate-900/40 p-1 rounded-xl w-fit mb-6 border border-slate-800 shadow-md">
        {["overview", "technical", "management", "analysis"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all uppercase ${
              activeTab === tab ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40" : "text-slate-400 hover:text-white"
            }`}
          >
            {tab === "management" ? "Operations / Staff" : tab}
          </button>
        ))}
      </div>

      <main>
      <div className="mb-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xs uppercase tracking-[0.2em] text-slate-400 font-black">
      Live Alert Feed
    </h2>

    <div className="flex gap-2">
      <button
        onClick={async () => {
          const alert = await triggerGateFailureAlert();

          if (alert) {
            setAlerts((prev) => {
              if (prev.find((a) => a.id === alert.id)) return prev;
              return [alert, ...prev];
            });
            addNotification("Action Processed", "Gate Failure Triggered", "info");
          }
        }}
        className="px-3 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-[10px] font-black uppercase tracking-widest"
      >
        Trigger Gate Failure
      </button>

      <button
        onClick={async () => {
          const alert = await triggerHighLatencyAlert();

          if (alert) {
            setAlerts((prev) => {
              if (prev.find((a) => a.id === alert.id)) return prev;
              return [alert, ...prev];
            });
            addNotification("Action Processed", "Latency Triggered", "info");
          }
        }}
        className="px-3 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-[10px] font-black uppercase tracking-widest"
      >
        Trigger Latency
      </button>
    </div>
  </div>

  <div className="space-y-3 max-h-[260px] overflow-y-auto">
    {alerts.length === 0 ? (
      <div className="text-slate-500 text-xs uppercase tracking-widest">
        No active alerts
      </div>
    ) : (
      alerts.map((alert) => (
        <div
          key={alert.id}
          className={`border rounded-xl p-4 ${
            alert.severity === "CRITICAL"
              ? "border-rose-500/50 bg-rose-500/10"
              : alert.severity === "HIGH"
              ? "border-amber-500/40 bg-amber-500/10"
              : "border-slate-700 bg-slate-800/40"
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-black uppercase tracking-widest text-white">
              {alert.title}
            </span>

            <span
              className={`text-[10px] font-black uppercase ${
                alert.severity === "CRITICAL"
                  ? "text-rose-400"
                  : alert.severity === "HIGH"
                  ? "text-amber-400"
                  : "text-slate-400"
              }`}
            >
              {alert.severity}
            </span>
          </div>

          <p className="text-xs text-slate-300">
            {alert.message}
          </p>
          {alert.status !== "RESOLVED" ? (
            <button
              onClick={async () => {
                // Local alerts (not in DB) should be resolved locally
                if (alert.id.startsWith("duplicate-")) {
                  setAlerts((prev) =>
                    prev.map((item) =>
                      item.id === alert.id ? { ...item, status: "RESOLVED" } : item
                    )
                  );
                  return;
                }

                try {
                  addNotification("Processing", "Resolving alert...", "info");
                  const updated = await resolveAlertAPI(alert.id);

                  if (updated) {
                    setAlerts((prev) =>
                      prev.map((item) => (item.id === updated.id ? updated : item))
                    );
                  } else {
                    console.error("Failed to resolve alert on backend");
                    // Fallback to local resolve if backend fails
                    setAlerts((prev) =>
                      prev.map((item) =>
                        item.id === alert.id ? { ...item, status: "RESOLVED" } : item
                      )
                    );
                  }
                } catch (err) {
                  console.error("Error resolving alert:", err);
                }
              }}
              className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-[10px] font-black uppercase tracking-widest text-white"
            >
              Resolve
            </button>
          ) : (
            <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Resolved
            </div>
          )}
        </div>
      ))
    )}
  </div>
</div>
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <StatCard icon={Ticket} title="Total Entries" value={stats.tickets.toLocaleString()} trend="+4.1%" color={COLORS.secondary} />
              <StatCard
                icon={Zap}
                title="Active Gates"
                value={stats.activeGates}
                subValue={!isGateCFixed && !isNetworkOutage ? "Gate C: Unit Fail" : "All 24 Operational"}
                color={!isGateCFixed && !isNetworkOutage ? COLORS.danger : COLORS.primary}
                pulse={!isNetworkOutage && !isGateCFixed}
                warning={!isGateCFixed && !isNetworkOutage}
              />
              <StatCard icon={Users} title="Live Crowd" value={stats.concurrent.toLocaleString()} highlight={isPeakLoad} color={COLORS.primary} />
              <StatCard
                icon={Database}
                title="Sync Queue"
                value={syncQueue}
                subValue={syncQueue > 0 ? (isNetworkOutage ? "Data Buffering" : "Uploading...") : "Fully Synced"}
                pulse={syncQueue > 0}
                color={syncQueue > 0 ? COLORS.warning : COLORS.success}
              />
              <StatCard icon={UserCheck} title="Staff Efficiency" value={`%${stats.efficiency}`} subValue="Monitoring" color={COLORS.success} />
              <StatCard icon={Clock} title="API Latency" value={`${stats.latency}ms`} trend={stats.latency > 200 ? "+12%" : "-2%"} color={stats.latency > 200 ? COLORS.danger : COLORS.success} />
              <StatCard icon={DollarSign} title="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} color={COLORS.success} />
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={handleValidScan} className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">
                Simulate Valid Ticket Scan
              </button>

              <button onClick={handleInvalidScan} className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">
                Simulate Invalid Scan
              </button>

              {lastScanResult && (
                <div className="bg-slate-800/60 border border-slate-700 px-5 py-3 rounded-xl text-xs flex items-center">
                  <span className="font-black uppercase text-violet-400">Last Scan Result:&nbsp;</span>
                  <span className={lastScanResult.status === "INVALID" ? "text-rose-400" : "text-emerald-400"}>
                    {lastScanResult.status || "VALID"}
                  </span>
                  <span className="text-slate-400 ml-2">{lastScanResult.message || "Ticket processed successfully"}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700 p-6 rounded-2xl h-[400px] shadow-lg shadow-black/20">
                <h2 className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest text-center italic opacity-80">
                  Real-time Verification Flow (RPS)
                </h2>

                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={realtimeData}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis dataKey="time" hide />
                      <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px" }} />
                      <Area type="monotone" dataKey="value" stroke={COLORS.primary} fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl h-[400px]">
                <h2 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2 font-black">
                  <Map size={14} /> Zone Density Monitoring
                </h2>

                <div className="space-y-6">
                  {[
                    { zone: "Main Stage (Zone A)", level: isPeakLoad ? 95 : 78, color: isPeakLoad ? COLORS.danger : COLORS.primary },
                    { zone: "Food Court (Zone B)", level: 62, color: COLORS.secondary },
                    { zone: "Entrance (Zone C)", level: isPeakLoad ? 88 : 34, color: COLORS.warning },
                    { zone: "VIP Lounge (Zone D)", level: 41, color: COLORS.success },
                  ].map((z, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-end text-[10px] font-bold">
                        <span className="text-slate-300 uppercase tracking-tighter">{z.zone}</span>
                        <span className="text-white">%{z.level}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full transition-all duration-1000" style={{ width: `${z.level}%`, backgroundColor: z.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "technical" && (
          <div className="space-y-6">
            {!isGateCFixed && !isNetworkOutage && (
              <div className="bg-rose-500/10 border border-rose-500/40 p-4 rounded-2xl flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-4 text-rose-500 font-black text-sm uppercase tracking-tighter">
                  <div className="p-2 bg-rose-500 text-white rounded-full shadow-lg shadow-rose-900/40">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="leading-none">Critical Fault: Gate C Sensor Module failure</h3>
                    <p className="text-rose-400 text-[10px] font-medium mt-1 uppercase tracking-widest italic">
                      Leads notified via internal push protocol.
                    </p>
                  </div>
                </div>

                <button onClick={() => setIsGateCFixed(true)} className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all">
                  Repair Node
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all">
                <RefreshCw size={14} /> Clear All Records & Reset System
              </button>

              <button 
                onClick={() => {
                  const newState = !isAutoTrafficEnabled;
                  setIsAutoTrafficEnabled(newState);
                  toggleAutoTrafficAPI(newState);
                }} 
                className={`flex items-center gap-2 px-6 py-3 border rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all ${
                  isAutoTrafficEnabled 
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" 
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                <Activity size={14} /> 
                Auto-Traffic: {isAutoTrafficEnabled ? "ON" : "OFF"}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center text-violet-400 font-mono text-xs font-bold uppercase">
                  <Terminal size={14} /> System_Infra_Logs
                </div>

                <div className="p-4 space-y-2 h-[450px] overflow-y-auto font-mono text-[10px]">
                  {isNetworkOutage && (
                    <div className="p-2 mb-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded font-bold uppercase tracking-tighter">
                      !!! CRITICAL: NET_OUTAGE // EDGE_CACHE !!!
                    </div>
                  )}

                  {syncQueue > 0 && !isNetworkOutage && (
                    <div className="p-2 mb-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded font-bold uppercase italic animate-pulse">
                      UPLOADING {syncQueue} RECORDS TO CLOUD POSTGRES...
                    </div>
                  )}

                  {[...Array(15)].map((_, i) => (
                    <div key={i} className="flex gap-4 border-l border-slate-800 pl-4 opacity-70 hover:opacity-100 transition-opacity">
                      <span className="text-slate-600">[{currentTime.toLocaleTimeString()}]</span>
                      <span className="text-emerald-500 uppercase font-black">Auth_OK</span>
                      <span className="text-slate-400">Node_{Math.random().toString(36).substring(7).toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Diagnostic Grid (IoT Nodes)</h3>

                <div className="grid grid-cols-2 gap-4">
                  {["Gate A", "Gate B", "Gate C", "Gate D", "AP-ZONE-A", "PAY-TRM-01"].map((id) => {
                    const isFail = id === "Gate C" && !isGateCFixed && !isNetworkOutage;

                    return (
                      <div key={id} className={`p-4 rounded-xl border transition-all duration-300 ${isFail ? "bg-rose-500/10 border-rose-500/50 shadow-lg shadow-rose-900/20" : "bg-slate-800/40 border-slate-700 shadow-lg"}`}>
                        <div className="flex justify-between items-center mb-1 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                          <span>Unit ID</span>
                          {isFail ? <AlertTriangle size={12} className="text-rose-500 animate-pulse" /> : <CheckCircle size={12} className="text-emerald-500" />}
                        </div>
                        <p className={`text-[11px] font-black uppercase ${isFail ? "text-rose-500" : "text-white"}`}>{id}</p>
                        <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase">{isFail ? "FAULT" : "OPERATIONAL"}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="p-6 bg-slate-800/20 border border-slate-800 rounded-2xl text-center relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.1em]">HPA Infrastructure (Auto-Scaling)</h4>
                    {isPeakLoad && (
                      <div className="flex items-center gap-2 px-2 py-0.5 bg-violet-500/20 border border-violet-500/40 rounded-full animate-pulse">
                        <Cpu size={10} className="text-violet-500" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-violet-400">Scaling Active</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-around items-end h-16 gap-1.5">
                    {[...Array(stats.pods)].map((_, i) => (
                      <div key={i} className="w-full bg-violet-500/40 border border-violet-500/60 rounded-t h-full transition-all duration-700 shadow-[0_0_10px_rgba(139,92,246,0.3)]" />
                    ))}
                  </div>
                  <p className="text-[10px] text-violet-400 mt-4 font-black uppercase tracking-widest">{stats.pods} ACTIVE K8S NODES</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "management" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl shadow-xl">
                <div className="flex justify-between items-center mb-6 text-sm font-bold text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <Users size={16} /> Live Shift Monitoring
                  </div>
                  <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded animate-pulse uppercase font-black">
                    Night Phase Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[550px] overflow-y-auto pr-2">
                  {staffMembers.map((staff) => (
                    <div key={staff.id} className={`p-4 rounded-xl border transition-all ${staff.status === "Ended" ? "opacity-20 border-slate-800 grayscale" : "bg-slate-900/50 border-slate-800 hover:border-violet-500/50 shadow-md shadow-black/20"}`}>
                      <div className="flex justify-between items-start mb-3 text-xs font-black uppercase tracking-tight">
                        <div>
                          <p className={staff.shift === "All Day" ? "text-violet-400 underline underline-offset-4" : "text-white"}>{staff.name}</p>
                          <p className="text-[9px] text-slate-500 font-bold tracking-tighter">{staff.role}</p>
                        </div>
                        <span className={`text-[8px] ${staff.status === "Ended" ? "text-slate-600" : "text-emerald-500"}`}>{staff.status}</span>
                      </div>

                      <div className="flex justify-between text-[9px] text-slate-400 mb-1.5 font-mono italic">
                        <span>{staff.time}</span>
                        <span className={staff.status === "Ended" ? "" : "text-violet-400"}>{staff.shift}</span>
                      </div>

                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${staff.status === "Ended" ? "bg-slate-700" : "bg-violet-600"}`} style={{ width: `${staff.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl shadow-xl">
                <h2 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                  <Package size={16} /> Night Inventory Control
                </h2>

                <div className="grid grid-cols-3 gap-6">
                  {inventory.map((item, i) => (
                    <div key={i} className="space-y-2 uppercase font-black">
                      <p className="text-[10px] text-slate-400 tracking-tighter">{item.name}</p>
                      <div className="flex justify-between items-center">
                        <span className={item.stock < 20 ? "text-rose-500" : "text-white"}>%{item.stock}</span>
                        {item.autoOrder && <RefreshCw size={12} className={`text-emerald-500 ${item.stock < 20 ? "animate-spin" : ""}`} />}
                      </div>
                      <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden shadow-inner">
                        <div className={`h-full transition-all duration-500 ${item.stock < 20 ? "bg-rose-500" : "bg-violet-600"}`} style={{ width: `${item.stock}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden h-[540px] flex flex-col shadow-2xl">
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center text-violet-400 font-mono text-xs font-black uppercase">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} /> Unit_Radio_Net
                  </div>
                  <span className="text-[7px] text-slate-500">ENCRYPTED</span>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto flex-grow bg-black/10 font-sans">
                  {intercomMessages.map((m) => (
                    <div key={m.id} className="space-y-1">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-600 tracking-tight">
                        <span>{m.from}</span>
                        <span className="opacity-50 font-mono">{m.time}</span>
                      </div>
                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50 text-[10px] text-slate-300 leading-tight shadow-md">
                        {m.msg}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-800/50 border-t border-slate-700">
                  <input
                    type="text"
                    placeholder="Direct transmission..."
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-lg py-2.5 px-3 text-[10px] focus:outline-none focus:border-violet-500 text-slate-300 shadow-inner"
                  />
                </div>
              </div>

              <button className="w-full py-4 bg-violet-600 rounded-2xl text-white font-black text-xs shadow-xl uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-violet-500 transition-all active:scale-95 shadow-violet-900/40">
                <Shield size={16} /> Global Re-Deployment
              </button>
            </div>
          </div>
        )}

        {activeTab === "analysis" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <StatCard icon={DollarSign} title="Total Revenue" value={`€${stats.revenue.toLocaleString()}`} color={COLORS.success} />
              <StatCard icon={ArrowUpRight} title="Breakeven Point" value="10.4 Months" subValue="ROI Projection" color={COLORS.secondary} />
              <StatCard icon={Zap} title="Efficiency Gain" value="%94.2" trend="+35%" color={COLORS.primary} />
            </div>

            <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-2xl h-[400px] shadow-2xl text-center">
              <h3 className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-[0.2em] opacity-70 italic font-black">
                Strategic ROI Framework
              </h3>

              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { month: "Setup", cost: 12250, benefit: 15950 },
                      { month: "Year 1", cost: 4280, benefit: 17105 },
                      { month: "Year 2", cost: 4364, benefit: 18436 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#475569" fontSize={10} />
                    <YAxis stroke="#475569" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px" }} />
                    <Bar dataKey="cost" fill={COLORS.danger} name="Costs" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="benefit" fill={COLORS.success} name="Benefits" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-[#0b0f19]/95 backdrop-blur-xl border-t border-slate-800 p-3 flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] z-[120] px-6">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${apiHealth ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
            {apiHealth ? "LIVE_BACKEND" : "DEMO_FALLBACK"}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500" /> EDGE_REDIS
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${syncQueue > 0 ? "bg-amber-500 animate-pulse" : "bg-blue-500"}`} />
            QUEUED: {syncQueue}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline opacity-30 italic font-bold tracking-tight uppercase">
            EventPulse // Command_v3.1
          </span>
          <span className="bg-slate-800 px-3 py-1 rounded border border-slate-700 text-white font-mono font-black shadow-inner">
            {currentTime.toLocaleTimeString()}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;