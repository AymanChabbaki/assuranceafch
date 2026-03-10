// src/pages/DashboardPage.tsx
// Public transparency dashboard — insured users list + full event history.

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config/contract";
import type { InsuredUser, BlockchainEvent } from "../types";

export default function DashboardPage() {
  const [users, setUsers]     = useState<InsuredUser[]>([]);
  const [events, setEvents]   = useState<BlockchainEvent[]>([]);
  const [usersLoading, setUsersLoading]   = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchEvents();
    const interval = setInterval(() => { fetchUsers(); fetchEvents(); }, 15_000);
    return () => clearInterval(interval);
  }, [fetchUsers, fetchEvents]);

  function shortAddr(addr: string | undefined | null) {
    if (!addr) return "—";
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  }

  return (
    <div className="page">
      <h2>📊 Transparency Dashboard</h2>

      {error && <p className="hint error">{error}</p>}

      {/* Insured users */}
      <div className="card">
        <h3>Insured Users ({usersLoading ? "…" : users.length})</h3>
        {usersLoading ? (
          <p>Loading…</p>
        ) : users.length === 0 ? (
          <p className="hint">No insured users yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Address</th>
                  <th>Sinister</th>
                  <th>Claimed</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.address}>
                    <td>{i + 1}</td>
                    <td>
                      <a
                        href={`https://sepolia.etherscan.io/address/${u.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={u.address}
                      >
                        {shortAddr(u.address)}
                      </a>
                    </td>
                    <td>—</td>
                    <td>{u.hasClaimed ? "💸 Yes" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Event history */}
      <div className="card">
        <h3>Transaction History</h3>
        {eventsLoading ? (
          <p>Loading…</p>
        ) : events.length === 0 ? (
          <p className="hint">No on-chain events yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Address</th>
                  <th>Block</th>
                  <th>TxHash</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, i) => {
                  const userAddr = ev.user ?? ev.declaredBy;
                  return (
                    <tr key={i}>
                      <td>
                        <span className={`event-badge event-${ev.type.toLowerCase()}`}>
                          {ev.type}
                        </span>
                      </td>
                      <td>
                        {userAddr ? (
                          <a
                            href={`https://sepolia.etherscan.io/address/${userAddr}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={userAddr}
                          >
                            {shortAddr(userAddr)}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{ev.blockNumber}</td>
                      <td>
                        <a
                          href={ev.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={ev.txHash}
                        >
                          {shortAddr(ev.txHash)}
                        </a>
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
