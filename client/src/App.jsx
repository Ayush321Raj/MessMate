import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import LandingPage from './pages/LandingPage';

// Student pages
import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/student/Dashboard';
import StudentMenu from './pages/student/Menu';
import StudentPasses from './pages/student/Passes';
import StudentBilling from './pages/student/Billing';
import StudentFeedback from './pages/student/Feedback';
import StudentAssistant from './pages/student/Assistant';
import StudentAnnouncements from './pages/student/Announcements';
import Waste from './pages/Waste';

// Admin pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminMeals from './pages/admin/Meals';
import AdminInventory from './pages/admin/Inventory';
import AdminUsers from './pages/admin/Users';
import AdminBilling from './pages/admin/Billing';
import AdminAnalytics from './pages/admin/Analytics';
import AdminAnnouncements from './pages/admin/Announcements';

// Kitchen pages
import KitchenLayout from './layouts/KitchenLayout';
import KitchenDashboard from './pages/kitchen/Dashboard';
import KitchenScanner from './pages/kitchen/Scanner';
import KitchenInventory from './pages/kitchen/Inventory';
import KitchenInsights from './pages/kitchen/Insights';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, token } = useSelector((s) => s.auth);
  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  return children;
}

function RoleRedirect() {
  const { user, token } = useSelector((s) => s.auth);
  if (!token || !user) return <LandingPage />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'kitchen') return <Navigate to="/kitchen" replace />;
  return <Navigate to="/student" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<RoleRedirect />} />

        {/* Student */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="menu" element={<StudentMenu />} />
          <Route path="passes" element={<StudentPasses />} />
          <Route path="billing" element={<StudentBilling />} />
          <Route path="feedback" element={<StudentFeedback />} />
          <Route path="assistant" element={<StudentAssistant />} />
          <Route path="announcements" element={<StudentAnnouncements />} />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="meals" element={<AdminMeals />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="waste" element={<Waste />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="billing" element={<AdminBilling />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
        </Route>

        {/* Kitchen */}
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allowedRoles={['kitchen', 'admin']}>
              <KitchenLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<KitchenDashboard />} />
          <Route path="scanner" element={<KitchenScanner />} />
          <Route path="inventory" element={<KitchenInventory />} />
          <Route path="insights" element={<KitchenInsights />} />
          <Route path="waste" element={<Waste />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
