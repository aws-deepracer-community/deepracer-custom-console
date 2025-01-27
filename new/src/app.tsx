import { HashRouter, BrowserRouter, Routes, Route} from "react-router-dom";
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

export default function App() {
  const Router = USE_BROWSER_ROUTER ? BrowserRouter : HashRouter;

  return (
    <div style={{ height: "100%" }}>
      <Router>
        <GlobalHeader />
        <div style={{ height: "56px", backgroundColor: "#000716" }}>&nbsp;</div>
        <div>
          <Routes>
            <Route index path="/logs" element={<LogsPage />} />
            <Route index path="/settings" element={<SettingsPage />} />
            <Route index path="/calibration" element={<CalibrationPage />} />
            <Route index path="/recalibrate-steering" element={<RecalibrateSteeringPage />} />
            <Route index path="/recalibrate-speed" element={<RecalibrateSpeedPage />} />
            <Route index path="/models" element={<ModelsPage />} />
            <Route index path="/home" element={<HomePage />} />
            <Route index path="/" element={<HomePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}
