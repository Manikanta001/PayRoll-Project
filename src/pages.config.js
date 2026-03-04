import Layout from "./Layout.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Employees from "./pages/Employees.jsx";
import Attendance from "./pages/Attendance.jsx";
import Payroll from "./pages/Payroll.jsx";
import Payslips from "./pages/Payslips.jsx";
import Reports from "./pages/Reports.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import SignIn from "./pages/SignIn.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";

export const pagesConfig = {
  Layout,
  mainPage: "Dashboard",
  Pages: {
    Dashboard,
    Employees,
    Attendance,
    Payroll,
    Payslips,
    Reports,
    UserManagement,
    SignIn,
    Register,
    Profile,
  },
};
