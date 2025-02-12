import { HashRouter, BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { USE_BROWSER_ROUTER } from "./common/constants";
import GlobalHeader from "./components/global-header";
import HomePage from "./pages/home";
import "./styles/app.scss";
import NotFound from "./pages/not-found";
import ModelsPage from "./pages/models";
import CalibrationPage from "./pages/calibration";
import SettingsPage from "./pages/settings";
import LogsPage from "./pages/logs";
import RecalibrateSteeringPage from "./pages/recalibrate-steering";
import RecalibrateSpeedPage from "./pages/recalibrate-speed";
import LoginPage from "./pages/login";

// Protected Route wrapper component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = () => {
    const cookies = document.cookie.split(';');
    return cookies.some(cookie => 
      cookie.trim().startsWith('deepracer_token=')
    );
  };

  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  const Router = USE_BROWSER_ROUTER ? BrowserRouter : HashRouter;

  return (
    <div style={{ height: "100%" }}>
      <Router>
        <GlobalHeader />
        <div style={{ height: "56px", backgroundColor: "#000716" }}>&nbsp;</div>
        <div>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/test_login" element={<LoginPage />} />
            <Route path="/logout" element={<LoginPage />} />

            {/* Protected routes */}
            <Route path="/logs" element={
              <ProtectedRoute>
                <LogsPage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/calibration" element={
              <ProtectedRoute>
                <CalibrationPage />
              </ProtectedRoute>
            } />
            <Route path="/recalibrate-steering" element={
              <ProtectedRoute>
                <RecalibrateSteeringPage />
              </ProtectedRoute>
            } />
            <Route path="/recalibrate-speed" element={
              <ProtectedRoute>
                <RecalibrateSpeedPage />
              </ProtectedRoute>
            } />
            <Route path="/models" element={
              <ProtectedRoute>
                <ModelsPage />
              </ProtectedRoute>
            } />
            <Route path="/home" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}
