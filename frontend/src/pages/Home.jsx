import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { setToken } from "../api/token";
import "../style/Home.css";

export default function Home() {
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState("login"); // "login" or "register"
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regErr, setRegErr] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginErr("");
    setLoginLoading(true);

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      setToken(data.access_token);
      nav("/artifacts");
    } catch (ex) {
      setLoginErr(ex.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setRegErr("");
    setRegSuccess("");

    if (regPassword !== regConfirmPassword) {
      setRegErr("Passwords do not match");
      return;
    }

    if (regPassword.length < 8) {
      setRegErr("Password must be at least 8 characters long");
      return;
    }

    setRegLoading(true);

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: regEmail, password: regPassword }),
      });

      const loginData = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: regEmail, password: regPassword }),
      });

      setToken(loginData.access_token);
      setRegSuccess("Registration successful! Redirecting...");
      
      setTimeout(() => {
        nav("/artifacts");
      }, 1500);
    } catch (ex) {
      if (ex.message.includes("409")) {
        setRegErr("An account with this email already exists");
      } else {
        setRegErr(ex.message || "Registration failed");
      }
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-left">
            <h1 className="hero-title">
              Secure Artifact Registry
            </h1>
            <p className="hero-description">
              A powerful, enterprise-grade platform for managing and storing your artifacts securely. 
              Built with cutting-edge security features to protect your valuable data.
            </p>
            <div className="feature-grid">
              <div className="feature-item">
                <div className="feature-icon">🔐</div>
                <h3>End-to-End Encryption</h3>
                <p>Your artifacts are encrypted at rest and in transit</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <h3>Lightning Fast</h3>
                <p>Optimized performance for quick access and deployment</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🛡️</div>
                <h3>Enterprise Security</h3>
                <p>Bank-level security protocols and compliance</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📦</div>
                <h3>Version Control</h3>
                <p>Track and manage different versions of your artifacts</p>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="auth-card">
              <div className="auth-tabs">
                <button
                  className={`tab-btn ${activeTab === "login" ? "active" : ""}`}
                  onClick={() => setActiveTab("login")}
                >
                  Sign In
                </button>
                <button
                  className={`tab-btn ${activeTab === "register" ? "active" : ""}`}
                  onClick={() => setActiveTab("register")}
                >
                  Sign Up
                </button>
              </div>

              {activeTab === "login" ? (
                <form onSubmit={handleLogin} className="auth-form">
                  {loginErr && (
                    <div className="alert-error">
                      
                      <span>{loginErr}</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="login-email" className="form-label">Email Address</label>
                    <input
                      id="login-email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="form-input"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="login-password" className="form-label">Password</label>
                    <input
                      id="login-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="form-input"
                      type="password"
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <button type="submit" disabled={loginLoading} className="btn-primary">
                    {loginLoading ? (
                      <>
                        <span className="spinner"></span>
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="auth-form">
                  {regErr && (
                    <div className="alert-error">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <span>{regErr}</span>
                    </div>
                  )}

                  {regSuccess && (
                    <div className="alert-success">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      <span>{regSuccess}</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="reg-email" className="form-label">Email Address</label>
                    <input
                      id="reg-email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="form-input"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-password" className="form-label">Password</label>
                    <input
                      id="reg-password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="form-input"
                      type="password"
                      placeholder="At least 8 characters"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-confirm" className="form-label">Confirm Password</label>
                    <input
                      id="reg-confirm"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="form-input"
                      type="password"
                      placeholder="Re-enter your password"
                      required
                    />
                  </div>

                  <button type="submit" disabled={regLoading} className="btn-primary">
                    {regLoading ? (
                      <>
                        <span className="spinner"></span>
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-content">
          <h2 className="section-title">Why Choose Our Registry?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">🗄️</div>
              <h3>Research Artifact Management</h3>
              <p>Store and organize your ML models, datasets, experiment runs, and research papers in one secure location</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🔐</div>
              <h3>Role-Based Access Control</h3>
              <p>Fine-grained permissions with owner, collaborator, and organization roles. Control who can view, edit, or download your artifacts</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📦</div>
              <h3>Version Control Built-In</h3>
              <p>Track every version of your artifacts with changelogs, timestamps, and full audit trails of who did what and when</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🔒</div>
              <h3>JWT Authentication</h3>
              <p>Industry-standard JWT-based authentication with protected API routes ensures your research stays secure</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">👥</div>
              <h3>Granular Sharing</h3>
              <p>Choose between private, shared, or public visibility. Grant specific users viewer or editor access to individual artifacts</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📊</div>
              <h3>Complete Audit Logging</h3>
              <p>Every action is tracked and logged. Know exactly who accessed, modified, or downloaded your artifacts and when</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2024 Secure Artifact Registry. Built with security in mind.</p>
      </footer>
    </div>
  );
}