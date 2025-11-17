// src/ProtectedRoute.js
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute({ isAuthenticated, loading }) {
  if (loading) return <div className="loading">Ładowanie...</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
}

export default ProtectedRoute;
