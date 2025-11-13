import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import VideoAnalytics from './pages/VideoAnalytics/VideoAnalytics.jsx'
import CommentSentiment from './pages/CommentSentiment/CommentSentiment.jsx'
import AISuggestion from './pages/AISuggestion/AISuggestion.jsx'
import CommunityInsights from './pages/CommunityInsights/CommunityInsights.jsx'
import Settings from './pages/Settings/Settings.jsx'
import AppLayout from './components/AppLayout/AppLayout.jsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/video-analytics" element={<VideoAnalytics />} />
        <Route path="/sentiment" element={<CommentSentiment />} />
        <Route path="/ai-content" element={<AISuggestion />} />
        <Route path="/community" element={<CommunityInsights />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
