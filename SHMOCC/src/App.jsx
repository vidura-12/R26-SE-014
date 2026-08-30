import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ThemeProvider from "./context/ThemeProvider";
import { AuthProvider } from "./context/AuthContext";
import PrivateRouteUthara from "./components/PrivateRoute";

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

// Nimesha's part
import Cinnamon from "./pages/Nimesha/Cinnamon";
import GradeMarketAuth from "./pages/Nimesha/GradeMarketAuth";
import History from "./pages/Nimesha/History";
import Admin from "./pages/Nimesha/Admin";

// Uthara's part (disease prediction)
import Landing from "./pages/Uthara/Landing";
import SignUp from "./pages/Uthara/Signup";
import LoginUthara from "./pages/Uthara/Login";
import ForgotPassword from "./pages/Uthara/ForgotPassword";
import Advisory from "./pages/dashboard/Advisory";
import DashboardLayoutUthara from "./pages/dashboard/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Devices from "./pages/dashboard/Devices";
import HistoryUthara from "./pages/dashboard/History";
import SensorData from "./pages/dashboard/SensorData";

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

// cinnamon auth
function CinnamonPrivateRoute({ children }) {
  const token = localStorage.getItem("cinnamonToken");
  return token ? children : <Navigate to="/cinnamon/login" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Mainpage />} />

            {/* Vidura public routes */}
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

            {/* Vidura dashboard */}
            <Route
              path={DASHBOARD_PATH}
              element={
                <PrivateRouteVidura>
                  <DashboardLayout />
                </PrivateRouteVidura>
              }
            >
              <Route index element={<FarmRegister />} />
              <Route path="fields/register" element={<FarmRegister />} />
              <Route path="fields/farm" element={<FarmMap />} />
              <Route path="map" element={<Map />} />
              <Route path="reports" element={<Reports />} />
              <Route path="profile" element={<Profile />} />
              <Route path="farmhistory" element={<Farmhistory />} />
              <Route path="FarmForecast" element={<FarmForecast />} />
            </Route>

            {/* Cinnamon auth */}
            <Route
              path="/cinnamon/login"
              element={
                localStorage.getItem("cinnamonToken") ? (
                  <Navigate to="/cinnamon" replace />
                ) : (
                  <GradeMarketAuth />
                )
              }
            />
            <Route
              path="/cinnamon"
              element={
                <CinnamonPrivateRoute>
                  <Cinnamon />
                </CinnamonPrivateRoute>
              }
            />
            <Route
              path="/cinnamon/history"
              element={
                <CinnamonPrivateRoute>
                  <History />
                </CinnamonPrivateRoute>
              }
            />
            <Route
              path="/cinnamon/admin"
              element={
                <CinnamonPrivateRoute>
                  <Admin />
                </CinnamonPrivateRoute>
              }
            />

            {/* Uthara — disease prediction */}
            <Route path="/disease-prediction/home" element={<Landing />} />
            <Route path="/disease-prediction/signup" element={<SignUp />} />
            <Route path="/disease-prediction/login" element={<LoginUthara />} />
            <Route path="/disease-prediction/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/disease-prediction/dashboard"
              element={
                <PrivateRouteUthara>
                  <DashboardLayoutUthara />
                </PrivateRouteUthara>
              }
            >
              <Route index element={<Overview />} />
              <Route path="devices" element={<Devices />} />
              <Route path="history" element={<HistoryUthara />} />
              <Route path="sensor-data" element={<SensorData />} />
              <Route path="advisory" element={<Advisory />} />
            </Route>

            {/* Catch unknown URLs */}
            <Route path="*" element={<Navigate to="/plantation-health/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export { TOKEN_KEY, DASHBOARD_PATH, LOGIN_PATH };