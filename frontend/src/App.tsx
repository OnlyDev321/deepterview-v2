import { Routes, Route, BrowserRouter } from "react-router-dom";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import OAuth2Success from "./pages/OAuth2Success";
import DashboardLayout from "./layouts/DashboardLayout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import PracticeLayout from "./layouts/DashboardLayout/PracticeLayout";
import ProcessingLayout from "./layouts/DashboardLayout/ProcessingLayout";
import HistoryLayout from "./layouts/DashboardLayout/HistoryLayout";
import MyinfoLayout from "./layouts/DashboardLayout/MyinfoLayout";
import AnalyticsLayout from "./layouts/DashboardLayout/AnalyticsLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - Anyone can access */}
        <Route path="/" element={<Landing />} />
        <Route path="/oauth2/success" element={<OAuth2Success />} />

        {/* Auth Routes - Only for non-logged in users */}
        <Route element={<PublicRoute />}>
          <Route path="/signin" element={<SignIn />} />
        </Route>

        {/* Protected Routes - Only for logged-in users */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={
              <Dashboard>
                <DashboardLayout />
              </Dashboard>
            }
          />
          <Route
            path="/dashboard/practice"
            element={
              <Dashboard>
                <PracticeLayout />
              </Dashboard>
            }
          />
          <Route
            path="/dashboard/practice/processing"
            element={
              <Dashboard>
                <ProcessingLayout />
              </Dashboard>
            }
          />
          <Route
            path="/dashboard/history"
            element={
              <Dashboard>
                <HistoryLayout />
              </Dashboard>
            }
          />
          <Route
            path="/dashboard/history/:sessionId/analytics"
            element={
              <Dashboard>
                <AnalyticsLayout />
              </Dashboard>
            }
          />
          <Route
            path="/dashboard/myinfo"
            element={
              <Dashboard>
                <MyinfoLayout />
              </Dashboard>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
