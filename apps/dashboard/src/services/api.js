import axios from "axios";

export const API_BASE_URL = "http://localhost:3000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3000,
});

export async function fetchMetrics() {
  try {
    const res = await api.get("/metrics/public");
    return res.data;
  } catch (err) {
    console.error("Metrics error:", err);
    return null;
  }
}

export async function fetchGates() {
  try {
    const res = await api.get("/gates/public");
    return res.data;
  } catch (err) {
    console.error("Gates error:", err);
    return null;
  }
}

export async function fetchTickets() {
  return [];
}

export async function simulateTicketScan(payload = {}) {
  try {
    const code = payload.ticketCode || "VIP-001";
    const res = await api.get(`/tickets/validate/${code}`);
    return res.data;
  } catch (err) {
    console.error("Ticket scan error:", err);
    return null;
  }
}

export async function resetTickets() {
  try {
    const res = await api.post("/tickets/reset");
    return res.data;
  } catch (err) {
    console.error("Reset error:", err);
    return null;
  }
}

export async function simulateValidScanAPI() {
  try {
    const res = await api.post("/tickets/simulate");
    return res.data;
  } catch (err) {
    console.error("Simulation error:", err);
    return null;
  }
}

export async function bulkSimulateTickets(count) {
  try {
    const res = await api.post(`/tickets/bulk-simulate/${count}`);
    return res.data;
  } catch (err) {
    console.error("Bulk simulation error:", err);
    return null;
  }
}

export async function togglePeakTraffic(enabled) {
  try {
    const res = await api.post("/tickets/toggle-peak", { enabled });
    return res.data;
  } catch (err) {
    console.error("Toggle peak error:", err);
    return null;
  }
}

export async function toggleAutoTrafficAPI(enabled) {
  try {
    const res = await api.post("/tickets/toggle-auto", { enabled });
    return res.data;
  } catch (err) {
    console.error("Toggle auto error:", err);
    return null;
  }
}

export async function fetchAlerts() {
  try {
    const res = await api.get("/alerts");
    return res.data;
  } catch (err) {
    console.error("Alerts error:", err);
    return [];
  }
}

export async function triggerGateFailureAlert() {
  try {
    const res = await api.post("/alerts/gate-failure");
    return res.data;
  } catch (err) {
    console.error("Gate failure alert error:", err);
    return null;
  }
}

export async function triggerHighLatencyAlert() {
  try {
    const res = await api.post("/alerts/high-latency");
    return res.data;
  } catch (err) {
    console.error("High latency alert error:", err);
    return null;
  }
}

export async function resolveAlertAPI(id) {
  try {
    const res = await api.post(`/alerts/${id}/resolve`);
    return res.data;
  } catch (err) {
    console.error("Resolve alert error:", err);
    return null;
  }
}