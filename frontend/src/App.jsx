import { BrowserRouter, Routes, Route } from "react-router-dom";
import ThemeProvider from './context/ThemeProvider';
import { AuthProvider } from "./context/AuthContext";
import Landing from "./pages/Landing";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import SensorData from "./pages/SensorData";
import PrivateRoute from "./components/PrivateRoute";
import Advisory from "./pages/Advisory";

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />
          <Route path="/sensor-data" element={
            <PrivateRoute><SensorData /></PrivateRoute>
          } />
           <Route path="/advisory" element={<Advisory />} /> 
        </Routes>
      </BrowserRouter>
      
    </AuthProvider>
    </ThemeProvider>
  );
}