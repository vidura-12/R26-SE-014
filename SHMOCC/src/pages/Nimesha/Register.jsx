import React from "react";

export default function Register({ onBackToLogin }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF9F5]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">

        <h1 className="text-3xl font-bold mb-6">
          Grade & Market Register
        </h1>

        <p className="mb-6">
          Register page coming soon...
        </p>

        <button
          className="bg-orange-600 text-white px-6 py-3 rounded-lg"
          onClick={onBackToLogin}
        >
          Back to Login
        </button>

      </div>
    </div>
  );
}