import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import PublicLinkPage from './pages/PublicLinkPage';
import DriveLayout from './components/DriveLayout';
import DrivePage from './pages/DrivePage';
import SharedPage from './pages/SharedPage';
import StarredPage from './pages/StarredPage';
import TrashPage from './pages/TrashPage';
import SearchResultsPage from './pages/SearchResultsPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public / unauthenticated */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/oauth2/callback" element={<OAuthCallbackPage />} />
          <Route path="/shared-link/:token" element={<PublicLinkPage />} />

          {/* Authenticated app shell — DriveLayout guards these with a redirect to /login */}
          <Route element={<DriveLayout />}>
            <Route path="/drive" element={<DrivePage />} />
            <Route path="/drive/:folderId" element={<DrivePage />} />
            <Route path="/shared" element={<SharedPage />} />
            <Route path="/starred" element={<StarredPage />} />
            <Route path="/trash" element={<TrashPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/drive" replace />} />
          <Route path="*" element={<Navigate to="/drive" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}