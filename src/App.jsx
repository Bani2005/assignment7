import { useEffect, useState } from "react";
import {
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";

import { auth } from "./firebase";
import "./App.css";

/* =========================
   PASSWORD STRENGTH
========================= */

function getPasswordStrength(password) {
  if (!password) {
    return {
      label: "Enter a password",
      level: 0,
    };
  }

  let score = 0;

  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) {
    return {
      label: "Weak",
      level: 1,
    };
  }

  if (score <= 3) {
    return {
      label: "Medium",
      level: 2,
    };
  }

  return {
    label: "Strong",
    level: 3,
  };
}

/* =========================
   APP
========================= */

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function handleLogin(email, password, remember) {
    try {
      if (remember) {
        await setPersistence(auth, browserLocalPersistence);
      } else {
        await setPersistence(auth, browserSessionPersistence);
      }

      await signInWithEmailAndPassword(auth, email, password);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: "Invalid email or password.",
      };
    }
  }

  async function handleLogout() {
    await signOut(auth);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user}>
            <DashboardLayout
              user={user}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Dashboard user={user} />}
        />

        <Route
          path="security"
          element={<SecurityInfo user={user} />}
        />
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to={user ? "/dashboard" : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}

/* =========================
   PROTECTED ROUTE
========================= */

function ProtectedRoute({ user, children }) {
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
}

/* =========================
   LOGIN PAGE
========================= */

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState("");

  const strength = getPasswordStrength(password);

  function validate() {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoginError("");

    if (!validate()) return;

    const result = await onLogin(
      email.trim(),
      password,
      remember
    );

    if (!result.success) {
      setLoginError(result.message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-background-shape shape-one"></div>
      <div className="auth-background-shape shape-two"></div>

      <div className="auth-card">

        <div className="auth-brand">
          <div className="auth-logo">🛡️</div>

          <div>
            <h1>SecureTask</h1>
            <p>Protected Workspace</p>
          </div>
        </div>

        <div className="auth-heading">
          <span className="eyebrow">
            SECURE LOGIN
          </span>

          <h2>Welcome back</h2>

          <p>
            Sign in to access your protected dashboard.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="login-form"
        >

          <div className="form-group">
            <label htmlFor="email">
              Email
            </label>

            <div className="input-with-icon">
              <span>📧</span>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);

                  if (errors.email) {
                    setErrors({
                      ...errors,
                      email: "",
                    });
                  }

                  setLoginError("");
                }}
              />
            </div>

            {errors.email && (
              <small className="error-text">
                ⚠️ {errors.email}
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <div className="input-with-icon password-input">
              <span>🔑</span>

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);

                  if (errors.password) {
                    setErrors({
                      ...errors,
                      password: "",
                    });
                  }

                  setLoginError("");
                }}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {errors.password && (
              <small className="error-text">
                ⚠️ {errors.password}
              </small>
            )}

            <div className="password-strength">

              <div className="strength-bars">
                <span
                  className={
                    strength.level >= 1
                      ? "filled"
                      : ""
                  }
                ></span>

                <span
                  className={
                    strength.level >= 2
                      ? "filled"
                      : ""
                  }
                ></span>

                <span
                  className={
                    strength.level >= 3
                      ? "filled"
                      : ""
                  }
                ></span>
              </div>

              <span
                className={`strength-label strength-${strength.level}`}
              >
                {strength.label}
              </span>

            </div>
          </div>

          <label className="remember-row">

            <input
              type="checkbox"
              checked={remember}
              onChange={(event) =>
                setRemember(
                  event.target.checked
                )
              }
            />

            <span>Remember me</span>

          </label>

          {loginError && (
            <div className="login-error">
              ⚠️ {loginError}
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
          >
            🔐 Sign In
          </button>

        </form>

        <div className="auth-security-note">
          <span>🔒</span>

          <div>
            <strong>
              Firebase Authentication
            </strong>

            <p>
              Your account is securely authenticated
              using Firebase.
            </p>
          </div>
        </div>

        <div className="auth-footer">
          <span>🛡️ Protected</span>
          <span>•</span>
          <span>Firebase Auth</span>
          <span>•</span>
          <span>Secure Session</span>
        </div>

      </div>
    </div>
  );
}

/* =========================
   DASHBOARD LAYOUT
========================= */

function DashboardLayout({
  user,
  onLogout,
}) {
  const username =
    user?.email?.split("@")[0] || "User";

  return (
    <div className="dashboard-app">

      <aside className="dashboard-sidebar">

        <div>

          <div className="sidebar-brand">

            <div className="sidebar-logo">
              🛡️
            </div>

            <div>
              <h2>SecureTask</h2>
              <span>
                Protected Workspace
              </span>
            </div>

          </div>

          <div className="sidebar-security">
            <span className="online-dot"></span>
            Security Active
          </div>

          <nav className="dashboard-nav">

            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                isActive ? "active" : ""
              }
            >
              <span>🏠</span>
              Dashboard
            </NavLink>

            <NavLink
              to="/dashboard/security"
              className={({ isActive }) =>
                isActive ? "active" : ""
              }
            >
              <span>🔐</span>
              Security
            </NavLink>

          </nav>

        </div>

        <div className="sidebar-bottom">

          <div className="fraud-card">
            <div className="fraud-icon">
              🚨
            </div>

            <strong>
              Fraud Protection
            </strong>

            <p>
              Your Firebase session is securely
              authenticated.
            </p>
          </div>

          <div className="sidebar-profile">

            <div className="profile-avatar">
              {username
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="profile-info">
              <strong>{username}</strong>
              <span>
                Authenticated User
              </span>
            </div>

            <button
              type="button"
              className="logout-small"
              onClick={onLogout}
              title="Logout"
            >
              ↪
            </button>

          </div>

        </div>

      </aside>

      <main className="dashboard-main">

        <header className="dashboard-topbar">

          <div>
            <span className="topbar-label">
              AUTHENTICATED SESSION
            </span>

            <h1>Dashboard</h1>
          </div>

          <div className="topbar-actions">

            <div className="session-status">
              <span>🔒</span>
              Secure Session
            </div>

            <div className="topbar-user">
              {username
                .charAt(0)
                .toUpperCase()}
            </div>

          </div>

        </header>

        <section className="dashboard-content">
          <Outlet
            context={{
              user,
              onLogout,
            }}
          />
        </section>

      </main>

    </div>
  );
}

/* =========================
   DASHBOARD
========================= */

function Dashboard({ user }) {
  const username =
    user?.email?.split("@")[0] || "User";

  return (
    <>

      <div className="welcome-banner">

        <div className="welcome-icon">
          🛡️
        </div>

        <div>

          <span>
            PROTECTED DASHBOARD
          </span>

          <h2>
            Welcome, {username}
          </h2>

          <p>
            Your Firebase authentication session
            is active and your dashboard is protected.
          </p>

        </div>

        <div className="protected-pill">
          ✓ PROTECTED
        </div>

      </div>

      <div className="dashboard-heading">

        <div>

          <span className="eyebrow">
            AUTHENTICATION SYSTEM
          </span>

          <h2>
            Security Overview
          </h2>

          <p>
            Monitor your current authentication
            and session information.
          </p>

        </div>

      </div>

      <div className="dashboard-stats">

        <div className="dashboard-stat">
          <div className="stat-icon purple">
            🔐
          </div>

          <span>Authentication</span>
          <strong>Active</strong>
          <small>Firebase verified</small>
        </div>

        <div className="dashboard-stat">
          <div className="stat-icon brown">
            🔑
          </div>

          <span>Auth Token</span>
          <strong>Active</strong>
          <small>Firebase managed</small>
        </div>

        <div className="dashboard-stat warning-stat">
          <div className="stat-icon red">
            🚨
          </div>

          <span>Security</span>
          <strong>Protected</strong>
          <small>Unauthorized access blocked</small>
        </div>

        <div className="dashboard-stat">
          <div className="stat-icon green">
            ✓
          </div>

          <span>Remember User</span>
          <strong>Firebase</strong>
          <small>Session persistence enabled</small>
        </div>

      </div>

      <div className="dashboard-grid">

        <div className="dashboard-panel">

          <div className="panel-heading">

            <div>

              <span className="eyebrow">
                SESSION
              </span>

              <h3>
                Authentication Status
              </h3>

            </div>

            <span className="verified-badge">
              ✓ VERIFIED
            </span>

          </div>

          <div className="security-check-list">

            <div>
              <span>✓</span>

              <div>
                <strong>
                  Email validation
                </strong>

                <small>
                  Firebase account verified
                </small>
              </div>
            </div>

            <div>
              <span>✓</span>

              <div>
                <strong>
                  Password validation
                </strong>

                <small>
                  Firebase authentication
                </small>
              </div>
            </div>

            <div>
              <span>✓</span>

              <div>
                <strong>
                  Route protection
                </strong>

                <small>
                  Protected dashboard is active
                </small>
              </div>
            </div>

            <div>
              <span>✓</span>

              <div>
                <strong>
                  Firebase authentication
                </strong>

                <small>
                  Real authentication service active
                </small>
              </div>
            </div>

          </div>

        </div>

        <div className="dashboard-panel security-overview">

          <div className="large-shield">
            🔐
          </div>

          <h3>
            Workspace Protected
          </h3>

          <p>
            Only authenticated users can access
            this dashboard.
          </p>

          <div className="protection-line">
            <span className="online-dot"></span>
            Firebase Authentication Active
          </div>

        </div>

      </div>

      <div className="dashboard-note">

        <span>🔒</span>

        <div>

          <strong>
            Security Note
          </strong>

          <p>
            This project uses Firebase Authentication
            for secure login, session persistence,
            logout and protected routes.
          </p>

        </div>

      </div>

    </>
  );
}

/* =========================
   SECURITY PAGE
========================= */

function SecurityInfo({ user }) {

  return (
    <div>

      <div className="dashboard-heading">

        <div>

          <span className="eyebrow">
            SECURITY CENTER
          </span>

          <h2>
            Authentication Details
          </h2>

          <p>
            View the Firebase authentication
            mechanisms used in this assignment.
          </p>

        </div>

      </div>

      <div className="security-page-grid">

        <div className="dashboard-panel">

          <div className="security-page-icon">
            🔑
          </div>

          <h3>
            Firebase Authentication
          </h3>

          <p>
            User login is handled by Firebase
            Authentication using email and password.
          </p>

          <div className="storage-status">
            <span>✓</span>
            Firebase authentication active
          </div>

        </div>

        <div className="dashboard-panel">

          <div className="security-page-icon">
            💾
          </div>

          <h3>
            Session Persistence
          </h3>

          <p>
            Remember me controls whether the
            Firebase session persists locally.
          </p>

          <div className="storage-status">
            <span>✓</span>
            Session persistence active
          </div>

        </div>

        <div className="dashboard-panel">

          <div className="security-page-icon">
            🛡️
          </div>

          <h3>
            Route Protection
          </h3>

          <p>
            Users without a valid Firebase
            authentication session are redirected
            to the login page.
          </p>

          <div className="storage-status">
            <span>✓</span>
            Protected route active
          </div>

        </div>

        <div className="dashboard-panel fraud-security">

          <div className="security-page-icon">
            🚨
          </div>

          <h3>
            Authenticated User
          </h3>

          <p>
            Current authenticated account:
          </p>

          <div className="token-box">

            <span>Email</span>

            <code>
              {user?.email || "No user"}
            </code>

          </div>

        </div>

      </div>

    </div>
  );
}

export default App;