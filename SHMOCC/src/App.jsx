import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Layout from "./components/Layout";
import Home from "./pages/dashboard/Home";
import Fields from "./pages/dashboard/Fields";
import Map from "./pages/dashboard/Map";
import Predict from "./pages/dashboard/Predict";
import Reports from "./pages/dashboard/Reports";
import Profile from "./pages/dashboard/Profile";
import Farmhistory from "./pages/dashboard/Farmhistory";
import FarmMap from "./pages/FarmMap";
import Cinnamon from "./pages/Cinnamon";


// ── Auth guard: redirect to /login if no token ──────────────────────────────
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

// ── Public-only route: redirect to /dashboard if already logged in ───────────
function PublicRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        {/* Protected — all wrapped inside the sidebar Layout */}
        <Route
          path="/dashboard"
          element={<PrivateRoute><Layout /></PrivateRoute>}
        >
          <Route index          element={<Home />} />
          <Route path="fields"  element={<Fields />} />
          <Route path="map"     element={<Map />} />
          <Route path="predict" element={<Predict />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Profile />} />
          <Route path="Farmhistory" element={<Farmhistory />} />
          <Route path="fields/farm" element={<FarmMap />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />

        <Route path="/cinnamon" element={<Cinnamon />} /> 
      </Routes>
    </BrowserRouter>
  );
}