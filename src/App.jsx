import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ReferrerDashboard from "./pages/ReferrerDashboard.jsx";
import CreateReferral from "./pages/CreateReferral.jsx";
import Referrers from "./pages/Referrers.jsx";
import MyReferrals from "./pages/MyReferrals.jsx";
import Analytics from "./pages/Analytics.jsx";
import Messages from "./pages/Messages.jsx";
import AIAssistant from "./pages/AIAssistant.jsx";
import Settings from "./pages/Settings.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import AuthProvider from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute requiredRole="student"><Dashboard /></ProtectedRoute>} />
          <Route path="/referrer-dashboard" element={<ProtectedRoute requiredRole="referrer"><ReferrerDashboard /></ProtectedRoute>} />
          <Route path="/create-referral" element={<ProtectedRoute requiredRole="student"><CreateReferral /></ProtectedRoute>} />
          <Route path="/referrers" element={<ProtectedRoute><Referrers /></ProtectedRoute>} />
          <Route path="/opportunities" element={<ProtectedRoute><Referrers /></ProtectedRoute>} />
          <Route path="/my-referrals" element={<ProtectedRoute><MyReferrals /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;