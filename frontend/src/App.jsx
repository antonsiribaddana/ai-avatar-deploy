import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import KidsDashboard from './pages/KidsDashboard';
import TeenDashboard from './pages/TeenDashboard';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import ModeSelection from './pages/ModeSelection';
import AvatarSession from './pages/AvatarSession';

// Protected Route Component
function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect to correct dashboard based on role
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Role-Based Routes */}
        <Route
          path="/kid"
          element={
            <ProtectedRoute allowedRole="kid">
              <KidsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teen"
          element={
            <ProtectedRoute allowedRole="teen">
              <TeenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/professional"
          element={
            <ProtectedRoute allowedRole="professional">
              <ProfessionalDashboard />
            </ProtectedRoute>
          }
        />

        {/* Mode Selection & Session Routes */}
        <Route
          path="/modes"
          element={
            <ProtectedRoute>
              <ModeSelection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session"
          element={
            <ProtectedRoute>
              <AvatarSession />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
