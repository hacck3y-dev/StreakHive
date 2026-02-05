import { Routes, Route } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Utility from './pages/Utility';
import Chat from './pages/Chat';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UtilityProvider } from './contexts/UtilityContext';

function App() {
  return (
    <UtilityProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/utility"
          element={
            <ProtectedRoute>
              <Utility />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
      </Routes>
    </UtilityProvider>
  );
}

export default App;
