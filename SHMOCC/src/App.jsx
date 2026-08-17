import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Shared entry point (common across team members)
import Mainpage from "./pages/Home/mainpage";
import DashboardLayout from "./pages/vidura/dashboard/DashboardLayout";
import Login from "./pages/vidura/Login";
import Signup from "./pages/vidura/Signup";
import AuthLayout from "./pages/vidura/AuthLayout";

import FarmMap from "./pages/vidura/FarmMap";
import Home from "./pages/vidura/dashboard/Home";
import Map from "./pages/vidura/dashboard/Map";
import Reports from "./pages/vidura/dashboard/Reports";
import Profile from "./pages/vidura/dashboard/Profile";
import Farmhistory from "./pages/vidura/dashboard/Farmhistory";
import FarmRegister from "./pages/vidura/dashboard/Fields";
import FarmForecast from "./pages/vidura/dashboard/FarmForecast";

const TOKEN_KEY = "token_vidura";
const DASHBOARD_PATH = "/plantation-health/dashboard";
const LOGIN_PATH = "/plantation-health/login";

// ── Auth guard: redirect to login if no token ───────────────────────────────
function PrivateRouteVidura({ children }) {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? children : <Navigate to={LOGIN_PATH} replace />;
}

// ── Keeps logged-in users out of /login and /signup ─────────────────────────
function PublicRouteVidura({ children }) {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? <Navigate to={DASHBOARD_PATH} replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Mainpage />} />

        <Route
          path="/plantation-health/login"
          element={
            <PublicRouteVidura>
              <Login />
            </PublicRouteVidura>
          }
        />
        <Route
          path="/plantation-health/signup"
          element={
            <PublicRouteVidura>
              <Signup />
            </PublicRouteVidura>
          }
        />

        <Route
          path={DASHBOARD_PATH}
          element={
            <PrivateRouteVidura>
              <DashboardLayout />
            </PrivateRouteVidura>
          }
        >
          <Route index element={<Home />} />
          <Route path="fields/register" element={<FarmRegister />} />
          <Route path="fields/farm" element={<FarmMap />} />
          <Route path="map" element={<Map />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Profile />} />
          <Route path="farmhistory" element={<Farmhistory />} />
          <Route path="FarmForecast" element={<FarmForecast />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/plantation-health/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export { TOKEN_KEY, DASHBOARD_PATH, LOGIN_PATH };