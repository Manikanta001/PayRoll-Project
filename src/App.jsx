import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import RequireElevated from "@/components/RequireElevated";

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const RequireAuth = ({ children }) => {
  const { user, isLoadingAuth } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/SignIn" replace state={{ from: location.pathname }} />;

  return children;
};

const RequireRole = ({ children, pageName }) => {
  const { user } = useAuth();
  
  const pageRoles = {
    UserManagement: ["admin"],
    Payroll: ["admin", "hr"],
    Employees: ["admin", "hr"],
    Reports: ["admin", "hr"],
    Attendance: ["admin", "hr", "employee"],
    Dashboard: ["admin", "hr", "employee"],
    Profile: ["admin", "hr", "employee"],
    Leaves: ["admin", "hr", "employee"],
  };

  const allowedRoles = pageRoles[pageName] || ["admin", "hr", "employee"];
  const userRole = user?.role || "employee";

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/Dashboard" replace />;
  }

  return children;
};

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to={`/${mainPageKey}`} replace /> : <Navigate to="/SignIn" replace />}
      />

      <Route path="/SignIn" element={<Pages.SignIn />} />
      <Route path="/Register" element={<Pages.Register />} />

      {Object.entries(Pages).map(([path, Page]) => {
        if (path === "SignIn" || path === "Register") return null;

        const isSensitivePage = path === "UserManagement" || path === "Payroll";

        const pageElement = (
          <LayoutWrapper currentPageName={path}>
            <Page />
          </LayoutWrapper>
        );

        return (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <RequireAuth>
                <RequireRole pageName={path}>
                  {isSensitivePage ? (
                    <RequireElevated>
                      {pageElement}
                    </RequireElevated>
                  ) : (
                    pageElement
                  )}
                </RequireRole>
              </RequireAuth>
            }
          />
        );
      })}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
