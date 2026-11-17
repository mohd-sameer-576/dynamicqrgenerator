import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [destination, setDestination] = useState("");
  const [qrs, setQrs] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  }

  async function login(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const data = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password })
      });
      setToken(data.token);
      setPassword("");
      setMessage("Login successful.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function loadQRs() {
    try {
      const data = await request("/api/qr");
      setQrs(data);
    } catch (error) {
      setMessage(error.message);
      if (error.message.toLowerCase().includes("token")) setToken("");
    }
  }

  useEffect(() => {
    if (token) loadQRs();
  }, [token]);

  async function createQR(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await request("/api/qr", {
        method: "POST",
        body: JSON.stringify({ destinationUrl: destination.trim() })
      });
      setDestination("");
      setMessage("QR code created.");
      await loadQRs();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateQR(qr) {
    const nextUrl = window.prompt("Enter the new HTTPS destination URL:", qr.destinationUrl);
    if (nextUrl === null) return;

    setBusy(true);
    try {
      await request(`/api/qr/${encodeURIComponent(qr.qrId)}`, {
        method: "PUT",
        body: JSON.stringify({ destinationUrl: nextUrl.trim() })
      });
      setMessage("Destination updated. The printed QR stays the same.");
      await loadQRs();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleQR(qr) {
    setBusy(true);
    try {
      await request(`/api/qr/${encodeURIComponent(qr.qrId)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !qr.isActive })
      });
      setMessage(qr.isActive ? "QR disabled." : "QR enabled.");
      await loadQRs();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setToken("");
    setQrs([]);
    setMessage("Logged out.");
  }

  if (!token) {
    return (
      <main className="page narrow">
        <div className="brand">TapEpo<span>.</span></div>
        <section className="panel">
          <p className="eyebrow">ADMIN ACCESS</p>
          <h1>Dynamic QR dashboard</h1>
          <p className="muted">Sign in to create and manage your dynamic QR codes.</p>
          <form onSubmit={login}>
            <label htmlFor="password">Admin password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button disabled={busy}>{busy ? "Please wait..." : "Sign in"}</button>
          </form>
          {message && <p className="message" role="status">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <div className="brand">TapEpo<span>.</span></div>
          <p className="muted">Dynamic QR management</p>
        </div>
        <button className="secondary" onClick={logout}>Log out</button>
      </header>

      <section className="panel">
        <p className="eyebrow">CREATE</p>
        <h1>Create a dynamic QR code</h1>
        <p className="muted">Use an HTTPS link. You can change its destination later without reprinting the QR.</p>
        <form onSubmit={createQR}>
          <label htmlFor="destination">Destination URL</label>
          <input
            id="destination"
            type="url"
            inputMode="url"
            placeholder="https://example.com/review"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            required
          />
          <button disabled={busy}>{busy ? "Please wait..." : "Generate QR code"}</button>
        </form>
        {message && <p className="message" role="status">{message}</p>}
      </section>

      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR CODES</p>
          <h2>QR codes <span className="count">{qrs.length}</span></h2>
        </div>
        <button className="secondary" onClick={loadQRs} disabled={busy}>Refresh</button>
      </div>

      {qrs.length === 0 ? (
        <section className="empty">No QR codes yet. Create your first one above.</section>
      ) : (
        <section className="qr-grid">
          {qrs.map((qr) => {
            const qrUrl = `${API}/q/${qr.qrId}`;
            return (
              <article className="qr-card" key={qr.qrId}>
                <div className="qr-top">
                  <span className="id">ID: {qr.qrId.slice(0, 10)}...</span>
                  <span className={`status ${qr.isActive ? "active" : "inactive"}`}>
                    {qr.isActive ? "Active" : "Disabled"}
                  </span>
                </div>
                <div className="qr-image">
                  <QRCodeSVG value={qrUrl} size={176} level="H" includeMargin />
                </div>
                <p className="destination" title={qr.destinationUrl}>{qr.destinationUrl}</p>
                <div className="scans"><strong>{qr.totalScans}</strong><span>Recorded scans</span></div>
                <div className="actions">
                  <button onClick={() => updateQR(qr)} disabled={busy}>Change link</button>
                  <button className="secondary" onClick={() => toggleQR(qr)} disabled={busy}>
                    {qr.isActive ? "Disable" : "Enable"}
                  </button>
                </div>
                <a className="qr-link" href={qrUrl} target="_blank" rel="noreferrer">Open redirect link ↗</a>
              </article>
            );
          })}
        </section>
      )}
      <footer>TapEpo Dynamic QR · Scan counts are total redirects, not unique visitors.</footer>
    </main>
  );
}
