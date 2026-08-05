import React, { useState } from "react";

export default function Register({ onBackToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:9000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            role: "user",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration failed");
        setLoading(false);
        return;
      }

      setMessage("Registration Successful! Redirecting to Login...");

      setTimeout(() => {
        onBackToLogin();
      }, 1200);

    } catch (error) {
      setMessage("Server connection failed.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF9F5]">

      <form
        onSubmit={handleRegister}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8"
      >

        <h1 className="text-3xl font-bold text-center mb-8">
          Grade & Market Register
        </h1>

        <div className="mb-4">
          <label>Name</label>

          <input
            type="text"
            className="w-full border rounded-lg p-3 mt-2"
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

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
          <p
            className={`text-sm mb-4 ${
              message.includes("Successful")
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg py-3"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="text-center mt-6">
          Already have an account?{" "}
          <button
            type="button"
            className="text-orange-600 font-semibold"
            onClick={onBackToLogin}
          >
            Login
          </button>
        </p>

      </form>

    </div>
  );
}