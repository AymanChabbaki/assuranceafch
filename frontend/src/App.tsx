import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Shield, BarChart2, Lock } from "lucide-react";
import { useWallet } from "./hooks/useWallet";
import WalletConnect from "./components/WalletConnect";
import UserPage from "./pages/UserPage";
import AdminPage from "./pages/AdminPage";
import DashboardPage from "./pages/DashboardPage";
import "./App.css";

function App() {
  const { wallet, connect, switchToSepolia, getSigner } = useWallet();

  return (
    <BrowserRouter>
      <header className="navbar">
        <div className="navbar-brand">
          <div className="brand-icon">
            <Shield size={17} strokeWidth={2.5} />
          </div>
          <span className="brand-name">DeFi Insurance</span>
        </div>

        <nav className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Shield size={15} />
            <span>My Insurance</span>
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <BarChart2 size={15} />
            <span>Dashboard</span>
          </NavLink>
          {wallet.isOwner && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <Lock size={15} />
              <span>Admin</span>
            </NavLink>
          )}
        </nav>

        <div className="navbar-wallet">
          <WalletConnect wallet={wallet} onConnect={connect} onSwitch={switchToSepolia} />
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<UserPage wallet={wallet} getSigner={getSigner} />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/admin" element={<AdminPage wallet={wallet} getSigner={getSigner} />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>
          Contract&nbsp;&nbsp;·&nbsp;&nbsp;
          <a
            href={`https://sepolia.etherscan.io/address/${import.meta.env.VITE_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {import.meta.env.VITE_CONTRACT_ADDRESS}
          </a>
          &nbsp;&nbsp;·&nbsp;&nbsp;Sepolia Testnet
        </p>
      </footer>
    </BrowserRouter>
  );
}

export default App;
