// src/pages/AdminPage.tsx

import { useState, useMemo } from "react";
import { ethers } from "ethers";
import {
  Lock, Users, Activity, AlertTriangle, CheckCircle,
  XCircle, Loader, ExternalLink, Zap, Info, BarChart2, PieChart as PieIcon,
  PlusCircle, Copy, Check,
} from "lucide-react";
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useContractInfo } from "../hooks/useContractInfo";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config/contract";
import type { WalletState } from "../types";

interface Props {
  wallet: WalletState;
  getSigner: () => Promise<ethers.Signer | null>;
}

interface TxResult { type: "success" | "error" | "pending"; message: string; hash?: string; }

export default function AdminPage({ wallet, getSigner }: Props) {
  const { info, loading, refetch } = useContractInfo();
  const [tx, setTx] = useState<TxResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [fundAmount, setFundAmount] = useState("0.1");
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!wallet.isConnected) return (
    <div className="page">
      <div className="alert alert-info">
        <Lock size={16} className="alert-icon" />
        <p>Connect your admin wallet to access this panel.</p>
      </div>
    </div>
  );

  if (!wallet.isOwner) return (
    <div className="page">
      <div className="alert alert-danger">
        <XCircle size={16} className="alert-icon" />
        <p>
          Access denied — this panel is reserved for the contract owner.<br />
          <span style={{ opacity: 0.7, fontSize: "0.78rem" }}>Connected: {wallet.address}</span>
        </p>
      </div>
    </div>
  );

  if (wallet.wrongNetwork) return (
    <div className="page">
      <div className="alert alert-warning">
        <AlertTriangle size={16} className="alert-icon" />
        <p>Please switch to the Sepolia testnet.</p>
      </div>
    </div>
  );

  async function handleDeclareSinister() {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    setBusy(true); setTx(null);
    try {
      const signer = await getSigner();
      if (!signer) return;
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const txObj = await contract.declareSinister();
      setTx({ type: "pending", message: "Transaction submitted — waiting for confirmation…" });
      await txObj.wait();
      setTx({ type: "success", message: "Sinister declared successfully. Payouts are now open.", hash: txObj.hash });
      setShowConfirm(false);
      refetch();
    } catch (err: unknown) {
      const msg = (err as { reason?: string; message?: string }).reason || (err as { message?: string }).message || "Transaction failed";
      setTx({ type: "error", message: msg });
    } finally { setBusy(false); }
  }

  async function handleFundContract() {
    setBusy(true); setTx(null);
    try {
      const signer = await getSigner();
      if (!signer) return;
      // Send ETH directly to contract via receive() function
      const txObj = await signer.sendTransaction({
        to: CONTRACT_ADDRESS,
        value: ethers.parseEther(fundAmount),
      });
      setTx({ type: "pending", message: "Funding contract — waiting for confirmation…" });
      await txObj.wait();
      setTx({ type: "success", message: `Sent ${fundAmount} ETH to contract!`, hash: txObj.hash });
      refetch();
    } catch (err: unknown) {
      const msg = (err as { reason?: string; message?: string }).reason || (err as { message?: string }).message || "Transaction failed";
      setTx({ type: "error", message: msg });
    } finally { setBusy(false); }
  }

  const copyContractAddress = async () => {
    await navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ethNeeded = info
    ? (parseFloat(info.payoutEth) * parseInt(info.insuredCount)).toFixed(4)
    : "…";
  const isSolvent = info
    ? parseFloat(info.contractBalanceEth) >= parseFloat(ethNeeded)
    : null;

  // ── Chart data ─────────────────────────────────────────────────────────────
  const solvencyPercent = useMemo(() => {
    if (!info) return 0;
    const needed = parseFloat(ethNeeded);
    if (needed === 0) return 100;
    return Math.min(100, Math.round((parseFloat(info.contractBalanceEth) / needed) * 100));
  }, [info, ethNeeded]);

  const radialData = useMemo(() => [
    { name: "Coverage", value: solvencyPercent, fill: solvencyPercent >= 100 ? "#22c55e" : solvencyPercent >= 50 ? "#f59e0b" : "#ef4444" },
  ], [solvencyPercent]);

  const ethPieData = useMemo(() => {
    if (!info) return [];
    const balance = parseFloat(info.contractBalanceEth);
    const needed  = parseFloat(ethNeeded);
    const surplus = Math.max(0, balance - needed);
    const locked  = Math.min(balance, needed);
    return [
      { name: "Locked for payouts", value: parseFloat(locked.toFixed(4)),   color: "#6366f1" },
      { name: "Surplus",            value: parseFloat(surplus.toFixed(4)),  color: "#22c55e" },
    ].filter(d => d.value > 0);
  }, [info, ethNeeded]);

  const ethBarData = useMemo(() => {
    if (!info) return [];
    return [
      { name: "Balance",  eth: parseFloat(info.contractBalanceEth), fill: "#6366f1" },
      { name: "Required", eth: parseFloat(ethNeeded),               fill: "#f59e0b" },
      { name: "Premium",  eth: parseFloat(info.premiumEth),         fill: "#38bdf8" },
      { name: "Payout",   eth: parseFloat(info.payoutEth),          fill: "#22c55e" },
    ];
  }, [info, ethNeeded]);

  return (
    <div className="page">

      {/* Header */}
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Owner Controls</p>
          <h2>Admin Panel</h2>
          <p className="page-description">
            Connected as <strong>{wallet.address?.slice(0, 10)}…{wallet.address?.slice(-6)}</strong>
          </p>
        </div>
        <span className="badge-admin" style={{ alignSelf: "flex-start", marginTop: "0.5rem" }}>Admin</span>
      </div>

      {/* Contract overview */}
      {loading ? (
        <div className="loading-container">
          <Loader size={18} className="spinner" />
          <span>Loading…</span>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label"><Users size={12} /> Insured users</div>
              <div className="stat-value accent">{info?.insuredCount}</div>
              <div className="stat-sub">active policies</div>
            </div>
            <div className="stat-item">
              <div className="stat-label"><Activity size={12} /> Pool balance</div>
              <div className="stat-value">{info?.contractBalanceEth} ETH</div>
              <div className="stat-sub">in contract</div>
            </div>
            <div className="stat-item">
              <div className="stat-label"><Zap size={12} /> Required payout</div>
              <div className="stat-value">{ethNeeded} ETH</div>
              <div className="stat-sub">to cover all users</div>
            </div>
            <div className="stat-item">
              <div className="stat-label"><AlertTriangle size={12} /> Sinister status</div>
              <div className={`stat-value ${info?.sinisterDeclared ? "danger" : "safe"}`}>
                {info?.sinisterDeclared ? "Declared" : "None"}
              </div>
              <div className="stat-sub">{info?.sinisterDeclared ? "payouts open" : "no incident"}</div>
            </div>
          </div>

          {/* ── Charts ──────────────────────────────────────────────────── */}
          <div className="charts-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>

            {/* Radial — pool coverage % */}
            <div className="card chart-card">
              <div className="card-header">
                <div className="card-header-icon icon-blue"><Activity size={17} /></div>
                <div>
                  <div className="card-title">Pool Coverage</div>
                  <div className="card-subtitle">Balance vs required payout</div>
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius="60%" outerRadius="90%"
                    startAngle={90} endAngle={-270}
                    data={radialData}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "rgba(255,255,255,0.05)" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center", pointerEvents: "none",
                }}>
                  <div style={{ fontSize: "1.6rem", fontWeight: 700, color: radialData[0]?.fill }}>
                    {solvencyPercent}%
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>covered</div>
                </div>
              </div>
            </div>

            {/* Pie — ETH allocation */}
            <div className="card chart-card">
              <div className="card-header">
                <div className="card-header-icon icon-blue"><PieIcon size={17} /></div>
                <div>
                  <div className="card-title">ETH Allocation</div>
                  <div className="card-subtitle">How pool funds are distributed</div>
                </div>
              </div>
              {ethPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={ethPieData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" innerRadius={50} outerRadius={78}
                      paddingAngle={3} strokeWidth={0}>
                      {ethPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
                      formatter={(v: any) => [`${v ?? 0} ETH`, ""]}
                    />
                    <Legend iconType="circle" iconSize={9}
                      wrapperStyle={{ fontSize: "0.78rem", color: "var(--text-muted)" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state" style={{ padding: "2rem" }}>
                  <p>No funds in contract yet.</p>
                </div>
              )}
            </div>

            {/* Bar — key ETH figures */}
            <div className="card chart-card">
              <div className="card-header">
                <div className="card-header-icon icon-blue"><BarChart2 size={17} /></div>
                <div>
                  <div className="card-title">ETH Overview</div>
                  <div className="card-subtitle">Balance, required, premium &amp; payout</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ethBarData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={36}
                    tickFormatter={(v: any) => `${v ?? ""}`} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
                    formatter={(v: any) => [`${v ?? 0} ETH`, ""]}
                  />
                  <Bar dataKey="eth" radius={[4, 4, 0, 0]}>
                    {ethBarData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Fund Contract Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-icon icon-green"><PlusCircle size={17} /></div>
              <div>
                <div className="card-title">Fund Contract</div>
                <div className="card-subtitle">Add ETH to cover payouts</div>
              </div>
            </div>

            <div className="action-card">
              <p className="action-description">
                Send ETH directly to the contract address. This ETH will be used to pay insured users when they claim.
              </p>

              <div className="action-meta" style={{ marginBottom: "1rem", cursor: "pointer" }} onClick={copyContractAddress}>
                <span style={{ fontFamily: "monospace" }}>{CONTRACT_ADDRESS}</span>
                {copied ? <Check size={12} style={{ color: "var(--success)" }} /> : <Copy size={12} />}
              </div>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem" }}>
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  step="0.01"
                  min="0.001"
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.5rem 0.75rem",
                    color: "var(--text)",
                    fontSize: "0.9rem",
                    width: "100px",
                  }}
                />
                <span style={{ color: "var(--text-muted)" }}>ETH</span>
              </div>

              <button
                className="btn btn-success"
                onClick={handleFundContract}
                disabled={busy || parseFloat(fundAmount) <= 0}
              >
                {busy
                  ? <><Loader size={14} className="spinner" /> Processing…</>
                  : <><PlusCircle size={15} /> Fund Contract</>}
              </button>
            </div>
          </div>

          {/* Solvency check */}
          {isSolvent === false && (
            <div className="alert alert-warning">
              <AlertTriangle size={16} className="alert-icon" />
              <p>
                <strong>Underfunded:</strong> The contract only has {info?.contractBalanceEth} ETH
                but needs {ethNeeded} ETH to pay all {info?.insuredCount} insured users.
                <br />
                <strong>Shortage: {(parseFloat(ethNeeded) - parseFloat(info?.contractBalanceEth || "0")).toFixed(4)} ETH</strong>
              </p>
            </div>
          )}

          {/* Declare sinister card */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-icon icon-red"><Zap size={17} /></div>
              <div>
                <div className="card-title">Declare a Sinister</div>
                <div className="card-subtitle">Irreversible on-chain action</div>
              </div>
            </div>

            {info?.sinisterDeclared ? (
              <div className="alert alert-success">
                <CheckCircle size={16} className="alert-icon" />
                <p>Sinister already declared. All insured users can now claim their payout of <strong>{info.payoutEth} ETH</strong>.</p>
              </div>
            ) : showConfirm ? (
              <div className="action-card">
                <div className="alert alert-danger" style={{ borderColor: "rgba(248,113,113,0.5)" }}>
                  <AlertTriangle size={18} className="alert-icon" />
                  <p>
                    <strong>⚠️ FINAL WARNING</strong><br /><br />
                    You are about to declare a sinister. This will allow <strong>{info?.insuredCount}</strong> users 
                    to claim <strong>{ethNeeded} ETH</strong> total.<br /><br />
                    {!isSolvent && (
                      <span style={{ color: "var(--danger)" }}>
                        ⚠️ Contract is UNDERFUNDED! You need {(parseFloat(ethNeeded) - parseFloat(info?.contractBalanceEth || "0")).toFixed(4)} more ETH.<br /><br />
                      </span>
                    )}
                    This action <strong>CANNOT BE UNDONE</strong>.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setShowConfirm(false)}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleDeclareSinister}
                    disabled={busy}
                  >
                    {busy
                      ? <><Loader size={14} className="spinner" /> Processing…</>
                      : <><Zap size={15} /> Yes, Declare Sinister</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="action-card">
                <p className="action-description">
                  Declaring a sinister will allow all <strong>{info?.insuredCount}</strong> insured
                  users to claim a payout of <strong>{info?.payoutEth} ETH</strong> each
                  (total: <strong>{ethNeeded} ETH</strong>).
                </p>

                <div className="alert alert-warning">
                  <Info size={15} className="alert-icon" />
                  <p>This action is <strong>irreversible</strong>. Once declared, you cannot undo it.
                  Ensure the contract contains sufficient funds.</p>
                </div>

                <button
                  className="btn btn-danger"
                  onClick={handleDeclareSinister}
                  disabled={busy}
                >
                  <Zap size={15} /> Declare Sinister
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* TX feedback */}
      {tx && (
        <div className={`tx-status ${tx.type}`}>
          {tx.type === "pending" && <Loader size={15} className="spinner" style={{ flexShrink: 0 }} />}
          {tx.type === "success" && <CheckCircle size={15} style={{ flexShrink: 0 }} />}
          {tx.type === "error"   && <XCircle size={15} style={{ flexShrink: 0 }} />}
          <div className="tx-status-body">
            <span>{tx.message}</span>
            {tx.hash && (
              <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
                View on Etherscan <ExternalLink size={11} style={{ display: "inline", verticalAlign: "middle" }} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}