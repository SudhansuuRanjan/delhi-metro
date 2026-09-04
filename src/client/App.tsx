import { Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LinePage from "./pages/LinePage";
import StationPage from "./pages/StationPage";
import NetworkMapPage from "./pages/NetworkMapPage";

export default function App() {
  return (
    <main className="min-h-screen text-white relative z-10">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<NetworkMapPage />} />
        <Route path="/line/:code" element={<LinePage />} />
        <Route path="/station/:code" element={<StationPage />} />
        <Route
          path="*"
          element={
            <div className="max-w-4xl mx-auto px-4 py-24 text-center">
              <h1 className="text-4xl font-bold mb-4">Page not found</h1>
              <Link to="/" className="text-emerald-400 underline">
                Back to planner
              </Link>
            </div>
          }
        />
      </Routes>
    </main>
  );
}
