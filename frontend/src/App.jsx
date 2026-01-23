import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Artifacts from "./pages/Artifacts";
import ProtectedRoute from "./components/ProtectedRoute";
import ArtifactDetail from "./pages/ArtifactDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/artifacts"
          element={
            <ProtectedRoute>
              <Artifacts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/artifacts/:artifactId"
          element={
            <ProtectedRoute>
              <ArtifactDetail />
            </ProtectedRoute>
          }/>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}