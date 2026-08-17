import React, { useState } from "react";
import Cinnamon from "./Cinnamon";
import Login from "./Login";
import Register from "./Register";

export default function GradeMarketAuth() {
  const [showRegister, setShowRegister] = useState(false);

  const token = localStorage.getItem("cinnamonToken");

  if (token) {
    return <Cinnamon />;
  }

  return showRegister ? (
    <Register onBackToLogin={() => setShowRegister(false)} />
  ) : (
    <Login onRegister={() => setShowRegister(true)} />
  );
}