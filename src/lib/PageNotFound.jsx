import React from "react";
import { useLocation } from "react-router-dom";

export default function PageNotFound() {
  const location = useLocation();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500">404</h1>
        <p className="text-lg mt-2">Page Not Found</p>
        <p className="text-gray-500 mt-1">
          No match for <code>{location.pathname}</code>
        </p>
      </div>
    </div>
  );
}