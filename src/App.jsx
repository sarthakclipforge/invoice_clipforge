import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import InvoiceApp from "./pages/InvoiceApp.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem('invoicekit_auth') === 'true';
  return isAuth ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/app" element={<ProtectedRoute><InvoiceApp /></ProtectedRoute>} />
      <Route path="/app/:id" element={<ProtectedRoute><InvoiceApp /></ProtectedRoute>} />
    </Routes>
  );
}
