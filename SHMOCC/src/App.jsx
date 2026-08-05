import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Shared entry point (common across team members)
import Mainpage from "./pages/Home/mainpage";

// vidura's part only
import Landing from "./pages/vidura/Landing";
import Login from "./pages/vidura/Login";
import Signup from "./pages/vidura/Signup";
import AuthLayout from "./pages/vidura/AuthLayout";
import FarmMap from "./pages/vidura/FarmMap";
import Home from "./pages/vidura/dashboard/Home";
import Fields from "./pages/vidura/dashboard/Fields";
import Map from "./pages/vidura/dashboard/Map";
import Predict from "./pages/vidura/dashboard/Predict";
import Reports from "./pages/vidura/dashboard/Reports";
import Profile from "./pages/vidura/dashboard/Profile";
import Farmhistory from "./pages/vidura/dashboard/Farmhistory";
///Nimesha's part 
import Cinnamon from "./pages/Nimesha/Cinnamon";
import GradeMarketAuth from "./pages/Nimesha/GradeMarketAuth";
import History from "./pages/Nimesha/History";
import Admin from "./pages/Nimesha/Admin";

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

//cinnamon auth 
function CinnamonPrivateRoute({ children }) {
  const token = localStorage.getItem("cinnamonToken");

  return token ? children : <Navigate to="/cinnamon/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Shared entry point */}
        <Route path="/" element={<Mainpage />} />

        {/*<Route path="/cinnamon" element={<Cinnamon />} />*/}

        {/* vidura's landing, kept reachable separately */}
        <Route path="/landing" element={<Landing />} />

        {/* Public */}
        <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

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

        {/* Protected — all wrapped inside vidura's AuthLayout */}
        <Route
          path="/dashboard"
          element={<PrivateRoute><AuthLayout /></PrivateRoute>}
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}