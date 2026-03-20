// src/pages/DashboardPage.tsx

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart2, Users, Hash, ExternalLink, Loader,
  CheckCircle, Clock, AlertCircle, RefreshCw, PieChart as PieIcon,
  Copy, Check,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import axios from "axios";
import { API_URL } from "../config/contract";
import type { InsuredUser, BlockchainEvent } from "../types";


export default function DashboardPage() {
  const [users, setUsers]     = useState<InsuredUser[]>([]);
  const [events, setEvents]   = useState<BlockchainEvent[]>([]);
  const [usersLoading, setUsersLoading]   = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/insured-users`);
      setUsers(res.data.users ?? []);
    } catch {
      setError("Failed to load insured users list.");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/transactions`);
      setEvents(res.data.events ?? []);
    } catch {
      // 503 while cache is loading — silent retry
    } finally {
      setEventsLoading(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchEvents();
    const interval = setInterval(() => { fetchUsers(); fetchEvents(); }, 30_000);
    return () => clearInterval(interval);
  }, [fetchUsers, fetchEvents]);

  // Copyable address component
  function CopyableAddr({ addr, isTx = false }: { addr: string | undefined | null; isTx?: boolean }) {
    const [copied, setCopied] = useState(false);

    if (!addr) return <span>—</span>;

    const handleCopy = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(addr);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    };

    const display = isTx 
      ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
      : `${addr.slice(0, 6)}…${addr.slice(-4)}`;

    return (
      <span 
        onClick={handleCopy}
        style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
        title={copied ? "Copied!" : "Click to copy"}
      >
        {display}
        {copied ? (
          <Check size={11} style={{ color: "var(--success)" }} />
        ) : (
          <Copy size={11} style={{ opacity: 0.4 }} />
        )}
      </span>
    );
  }

  // Legacy shortAddr for non-interactive uses
  function shortAddr(addr: string | undefined | null) {
    if (!addr) return "—";
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  }

  function eventLabel(type: string) {
    if (type === "SUBSCRIPTION")      return "Subscribed";
    if (type === "SINISTER_DECLARED") return "Sinister";
    if (type === "PAYOUT")            return "Payout";
    return type;
  }

  // ── Chart data ──────────────────────────────────────────────────────────────

  const claimPieData = useMemo(() => {
    const claimed  = users.filter(u => u.hasClaimed).length;
    const pending  = users.length - claimed;
    return [
      { name: "Claimed",  value: claimed,  color: "#22c55e" },
      { name: "Pending",  value: pending,  color: "#6366f1" },
    ].filter(d => d.value > 0);
  }, [users]);

  const eventBarData = useMemo(() => {
    const counts: Record<string, number> = { Subscriptions: 0, Sinisters: 0, Payouts: 0 };
    events.forEach(ev => {
      if (ev.type === "SUBSCRIPTION")      counts.Subscriptions++;
      if (ev.type === "SINISTER_DECLARED") counts.Sinisters++;
      if (ev.type === "PAYOUT")            counts.Payouts++;
    });
    return [
      { name: "Subscriptions", count: counts.Subscriptions, fill: "#6366f1" },
      { name: "Sinisters",     count: counts.Sinisters,     fill: "#f59e0b" },
      { name: "Payouts",       count: counts.Payouts,        fill: "#22c55e" },
    ];
  }, [events]);

  const chartReady = !usersLoading && !eventsLoading;

  return (
    <div className="page">

      {/* Header */}
      <div className="page-header">
        <div>
          <p className="page-eyebrow">On-chain Transparency</p>
          <h2>Dashboard</h2>
          <p className="page-description">
            Live view of all insured addresses and on-chain event history.
            Updates every 15 seconds.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
          {lastUpdated && (
            <span className="hint" style={{ fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <RefreshCw size={11} /> Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={15} className="alert-icon" />
          <p>{error}</p>
        </div>
      )}

      {/* ── Charts row ────────────────────────────────────────────────────── */}
      {chartReady && (events.length > 0 || users.length > 0) && (
        <div className="charts-grid">

          {/* Pie — claim status */}
          {users.length > 0 && (
            <div className="card chart-card">
              <div className="card-header">
                <div className="card-header-icon icon-green"><PieIcon size={17} /></div>
                <div>
                  <div className="card-title">Payout Status</div>
                  <div className="card-subtitle">Claimed vs pending</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={claimPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {claimPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
                    formatter={(v: any) => { const n = Number(v ?? 0); return [`${n} user${n !== 1 ? "s" : ""}`, ""]; }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={9}
                    wrapperStyle={{ fontSize: "0.78rem", color: "var(--text-muted)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bar — event breakdown */}
          {events.length > 0 && (
            <div className="card chart-card">
              <div className="card-header">
                <div className="card-header-icon icon-blue"><BarChart2 size={17} /></div>
                <div>
                  <div className="card-title">Event Breakdown</div>
                  <div className="card-subtitle">Events by type</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={eventBarData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={24}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
                    formatter={(v: any) => [v ?? "", "events"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {eventBarData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

        </div>
      )}

      {/* Insured users */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-icon icon-blue"><Users size={17} /></div>
          <div>
            <div className="card-title">Insured Users</div>
            <div className="card-subtitle">All addresses holding an active policy</div>
          </div>
          <div className="section-count" style={{ marginLeft: "auto" }}>
            {usersLoading ? "…" : users.length}
          </div>
        </div>

        {usersLoading ? (
          <div className="loading-container" style={{ padding: "2rem" }}>
            <Loader size={16} className="spinner" />
            <span>Loading…</span>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <Users size={28} strokeWidth={1.5} />
            <p>No insured users yet.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Address</th>
                  <th>Payout claimed</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.address}>
                    <td style={{ color: "var(--text-muted)", width: 40 }}>{i + 1}</td>
                    <td>
                      <span className="addr-chip">
                        <ExternalLink size={11} />
                        <CopyableAddr addr={u.address} />
                      </span>
                    </td>
                    <td>
                      {u.hasClaimed
                        ? <span className="claimed-yes"><CheckCircle size={13} /> Claimed</span>
                        : <span className="claimed-no"><Clock size={13} style={{ display: "inline", verticalAlign: "middle" }} /> &nbsp;Pending</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Event history */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-icon icon-blue"><Hash size={17} /></div>
          <div>
            <div className="card-title">Transaction History</div>
            <div className="card-subtitle">All contract events since deployment</div>
          </div>
          <div className="section-count" style={{ marginLeft: "auto" }}>
            {eventsLoading ? "…" : events.length}
          </div>
        </div>

        {eventsLoading ? (
          <div className="loading-container" style={{ padding: "2rem" }}>
            <Loader size={16} className="spinner" />
            <span>Scanning blockchain…</span>
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <Hash size={28} strokeWidth={1.5} />
            <p>No on-chain events yet.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Address</th>
                  <th>Block</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, i) => {
                  const userAddr = ev.user ?? ev.declaredBy;
                  return (
                    <tr key={i}>
                      <td>
                        <span className={`event-badge event-${ev.type.toLowerCase()}`}>
                          {eventLabel(ev.type)}
                        </span>
                      </td>
                      <td>
                        {userAddr ? (
                          <span className="addr-chip">
                            <ExternalLink size={11} />
                            <CopyableAddr addr={userAddr} />
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-dim)" }}>—</span>
                        )}
                      </td>
                      <td style={{ color: "var(--text-muted)", fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {ev.blockNumber}
                      </td>
                      <td>
                        <span className="addr-chip">
                          <ExternalLink size={11} />
                          <CopyableAddr addr={ev.txHash} isTx />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
