import React, { useState } from "react";
import Cinnamon from "./Cinnamon";
import Login from "./Login";
import Register from "./Register";

export default function GradeMarketAuth() {
  const [showRegister, setShowRegister] = useState(false);

  const token = localStorage.getItem("cinnamonToken");

  // Already logged in
  if (token) {
    return <Cinnamon />;
  }

  // Not logged in
  return showRegister ? (
    <Register onLogin={() => setShowRegister(false)} />
  ) : (
    <Login onRegister={() => setShowRegister(true)} />
  );
}