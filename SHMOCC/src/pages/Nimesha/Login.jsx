import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
export default function Login({ onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:9000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // Save login details
      localStorage.setItem("cinnamonToken", data.token);
      localStorage.setItem("cinnamonRole", data.role);
      localStorage.setItem("cinnamonUserId", data.userId);
      localStorage.setItem("cinnamonUserName", data.userName);

      navigate("/cinnamon", { replace: true });

    } catch (error) {
      setMessage("Server connection failed.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF9F5]">

      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8"
      >

        <h1 className="text-3xl font-bold text-center mb-8">
          Grade & Market Login
        </h1>

        <div className="mb-4">
          <label>Email</label>

          <input
            type="email"
            className="w-full border rounded-lg p-3 mt-2"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-5">
          <label>Password</label>

          <input
            type="password"
            className="w-full border rounded-lg p-3 mt-2"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {message && (
          <p className="text-red-500 text-sm mb-4">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg py-3"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center mt-6">
          Don't have an account?{" "}
          <button
            type="button"
            className="text-orange-600 font-semibold"
            onClick={onRegister}
          >
            Register
          </button>
        </p>

      </form>

    </div>
  );
}