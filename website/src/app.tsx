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
import EditNetworkPage from "./pages/edit-network";
import UpdateNetworkPage from "./pages/update-network";
import SystemUnavailablePage from "./pages/system-unavailable";
import { ContextProvider, AuthProvider, ApiProvider } from "./components/context-provider";

// Protected Route wrapper component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const cookies = document.cookie.split(";");
  const authStatus = cookies.some((cookie) => cookie.trim().startsWith("deepracer_token="));

  if (!authStatus) {
    console.debug("User is not authenticated, redirecting to login page");
    return <Navigate to="/login" />;
  }

  return children;
};

export default function App() {
  const Router = USE_BROWSER_ROUTER ? BrowserRouter : HashRouter;
  const isDeepracerAws = window.location.hostname === "deepracer.aws";

  return (
    <div style={{ height: "100%" }}>
      <AuthProvider>
        <Router>
          <ApiProvider>
            <ContextProvider>
              <GlobalHeader />
              <div style={{ height: "56px", backgroundColor: "#000716" }}>&nbsp;</div>
              <div>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/system-unavailable" element={<SystemUnavailablePage />} />
                  <Route path="/logout" element={<LoginPage />} />

                  {/* Protected routes */}
                  {isDeepracerAws ? (
                    <Route
                      path="*"
                      element={
                        <ProtectedRoute>
                          <UpdateNetworkPage />
                        </ProtectedRoute>
                      }
                    />
                  ) : (
                    <>
                      <Route
                        path="/logs"
                        element={
                          <ProtectedRoute>
                            <LogsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <SettingsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/edit-network"
                        element={
                          <ProtectedRoute>
                            <EditNetworkPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/calibration"
                        element={
                          <ProtectedRoute>
                            <CalibrationPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/recalibrate-steering"
                        element={
                          <ProtectedRoute>
                            <RecalibrateSteeringPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/ground"
                        element={
                          <ProtectedRoute>
                            <RecalibrateSteeringPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/center"
                        element={
                          <ProtectedRoute>
                            <RecalibrateSteeringPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/left"
                        element={
                          <ProtectedRoute>
                            <RecalibrateSteeringPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/right"
                        element={
                          <ProtectedRoute>
                            <RecalibrateSteeringPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/recalibrate-speed"
                        element={
                          <ProtectedRoute>
                            <RecalibrateSpeedPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/raise"
                        element={
                          <ProtectedRoute>
                            <RecalibrateSpeedPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/stopped"
                        element={
                          <ProtectedRoute>
                            <RecalibrateSpeedPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/direction"
                        element={
                          <ProtectedRoute>
                            <RecalibrateSpeedPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/forward"
                        element={
                          <ProtectedRoute>
                            <RecalibrateSpeedPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/backward"
                        element={
                          <ProtectedRoute>
                            <RecalibrateSpeedPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/models"
                        element={
                          <ProtectedRoute>
                            <ModelsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/home"
                        element={
                          <ProtectedRoute>
                            <HomePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute>
                            <HomePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<NotFound />} />
                    </>
                  )}
                </Routes>
              </div>
            </ContextProvider>
          </ApiProvider>
        </Router>
      </AuthProvider>
    </div>
  );
}
