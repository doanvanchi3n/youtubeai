import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import VideoAnalytics from './pages/VideoAnalytics/VideoAnalytics.jsx'
import CommentSentiment from './pages/CommentSentiment/CommentSentiment.jsx'
import AISuggestion from './pages/AISuggestion/AISuggestion.jsx'
import CommunityInsights from './pages/CommunityInsights/CommunityInsights.jsx'
import Settings from './pages/Settings/Settings.jsx'
import AppLayout from './components/AppLayout/AppLayout.jsx'
import AdminLayout from './components/AdminLayout/AdminLayout.jsx'
import AdminDashboard from './pages/Admin/AdminDashboard.jsx'
import UserManagement from './pages/Admin/UserManagement.jsx'
import DataManagement from './pages/Admin/DataManagement.jsx'
import AIManagement from './pages/Admin/AIManagement.jsx'
import SystemSettings from './pages/Admin/SystemSettings.jsx'
import SupportTools from './pages/Admin/SupportTools.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/video-analytics" element={<VideoAnalytics />} />
        <Route path="/sentiment" element={<CommentSentiment />} />
        <Route path="/ai-content" element={<AISuggestion />} />
        <Route path="/community" element={<CommunityInsights />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/data" element={<DataManagement />} />
        <Route path="/admin/ai" element={<AIManagement />} />
        <Route path="/admin/settings" element={<SystemSettings />} />
        <Route path="/admin/support" element={<SupportTools />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
