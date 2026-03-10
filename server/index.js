import dns from "node:dns";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/payroll";
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const NODE_ENV = process.env.NODE_ENV || "development";
const extraLocalFrontends = ["http://localhost:5174", "http://localhost:5175"];
const allowedOrigins = [
  ...new Set([
    ...(FRONTEND_URL.split(",").map((url) => url.trim()).filter(Boolean)),
    ...extraLocalFrontends,
  ]),
];

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const msg = `CORS error: origin ${origin} is not allowed`;
    return callback(new Error(msg), false);
  },
  credentials: false,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-user-role", "x-user-id", "x-confirm-password"],
};

if (NODE_ENV === "production") {
}

app.use(cors(corsOptions));
app.use(express.json());

const userSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "employee" },
    is_active: { type: Boolean, default: true },
    is_employee: { type: Boolean, default: false },
    phone: { type: String },
    department: { type: String },
    designation: { type: String },
    basic_salary: { type: Number },
    joining_date: { type: String },
    bank_account: { type: String },
    pan_number: { type: String },
    address: { type: String },
  },
  { timestamps: { createdAt: "created_date", updatedAt: "updated_date" } },
);

const User = mongoose.model("User", userSchema);

const attendanceSchema = new mongoose.Schema(
  {
    employee_id: { type: String, required: true },
    employee_name: { type: String, required: true },
    date: { type: Date, required: true }, // Mark attendance for a specific date
    status: { type: String, enum: ["Present", "Absent", "Leave"], default: "Present" },
    notes: { type: String },
  },
  { timestamps: { createdAt: "created_date", updatedAt: "updated_date" } }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);

const payslipSchema = new mongoose.Schema(
  {
    employee_id: { type: String, required: true },
    employee_name: { type: String, required: true },
    email: { type: String },
    department: { type: String },
    month: { type: String, required: true }, // Format: YYYY-MM
    basic_salary: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    gross_salary: { type: Number, default: 0 },
    pf_deduction: { type: Number, default: 0 },
    tax_deduction: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    net_salary: { type: Number, default: 0 },
    present_days: { type: Number, default: 0 },
    working_days: { type: Number, default: 22 },
    notes: { type: String },
  },
  { timestamps: { createdAt: "created_date", updatedAt: "updated_date" } }
);

const Payslip = mongoose.model("Payslip", payslipSchema);

app.post("/auth/register", async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body || {};
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: "full_name, email and password are required" });
    }
    
    const emailLower = email.toLowerCase();
    
    if (!role || role === "employee") {
      const employeeRecord = await User.findOne({ email: emailLower, is_employee: true }).exec();
      if (!employeeRecord) {
        return res.status(403).json({ message: "This email is not registered as an employee. Please contact HR to add you first." });
      }
      employeeRecord.passwordHash = await bcrypt.hash(password, 10);
      employeeRecord.full_name = full_name;
      await employeeRecord.save();
      const plain = employeeRecord.toObject();
      delete plain.passwordHash;
      return res.status(201).json(plain);
    }
    
    const existing = await User.findOne({ email: emailLower }).exec();
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      full_name,
      email: emailLower,
      passwordHash,
      role: role || "employee",
      is_active: true,
    });
    const plain = user.toObject();
    delete plain.passwordHash;
    res.status(201).json(plain);
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).exec();
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const plain = user.toObject();
    delete plain.passwordHash;
    res.json(plain);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/auth/me", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const user = await User.findById(userId).exec();
    if (!user) return res.status(404).json({ message: "User not found" });
    const plain = user.toObject();
    delete plain.passwordHash;
    res.json(plain);
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/auth/verify-password", async (req, res) => {
  try {
    const { userId, password } = req.body || {};
    if (!userId || !password) {
      return res.status(400).json({ message: "userId and password are required" });
    }
    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    res.json({ ok });
  } catch (err) {
    console.error("Verify password error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    const userRole = req.headers["x-user-role"];
    if (!allowedRoles.includes(userRole)) {
      return _res.status(403).json({ message: `Access denied. Required role: ${allowedRoles.join(", ")}` });
    }
    next();
  };
}

app.get("/users", requireRole("admin", "hr"), async (_req, res) => {
  try {
    const users = await User.find().sort({ created_date: -1 }).lean().exec();
    users.forEach((u) => delete u.passwordHash);
    res.json(users);
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const userRole = req.headers["x-user-role"];
    const userId = req.headers["x-user-id"];
    const requestedId = req.params.id;
    
    if (userRole === "employee" && userId !== requestedId) {
      return res.status(403).json({ message: "You can only access your own data" });
    }
    
    const user = await User.findById(requestedId).lean().exec();
    if (!user) return res.status(404).json({ message: "User not found" });
    delete user.passwordHash;
    res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.patch("/users/:id", requireRole("admin", "hr"), async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.passwordHash;
    delete updates.email;
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    })
      .lean()
      .exec();
    if (!user) return res.status(404).json({ message: "User not found" });
    delete user.passwordHash;
    res.json(user);
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/users/:id", requireRole("admin", "hr"), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id).lean().exec();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/users/invite", async (req, res) => {
  try {
    const { email, role } = req.body || {};
    if (!email) return res.status(400).json({ message: "email is required" });
    const existing = await User.findOne({ email: email.toLowerCase() }).exec();
    if (existing) {
      const plainExisting = existing.toObject();
      delete plainExisting.passwordHash;
      return res.json({ success: true, alreadyExists: true, user: plainExisting });
    }
    const generatedPassword = Math.random().toString(36).slice(2, 10);
    const passwordHash = await bcrypt.hash(generatedPassword, 10);
    const full_name = email.split("@")[0]?.replace(/[._-]+/g, " ") || "Invited User";
    const user = await User.create({
      full_name: full_name.replace(/\b\w/g, (c) => c.toUpperCase()),
      email: email.toLowerCase(),
      passwordHash,
      role: role || "employee",
      is_active: true,
    });
    const plain = user.toObject();
    delete plain.passwordHash;
    res.status(201).json({ success: true, user: plain });
  } catch (err) {
    console.error("Invite user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/employees", requireRole("admin", "hr"), async (req, res) => {
  try {
    const { name, email, phone, department, designation, basic_salary, joining_date, status, bank_account, pan_number, address } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: "name and email are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() }).exec();
    if (existing) {
      return res.status(400).json({ message: "Employee with this email already exists" });
    }

    const defaultPassword = name.trim().split(' ')[0] + '9878';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const user = await User.create({
      full_name: name,
      email: email.toLowerCase(),
      passwordHash,
      role: "employee",
      is_active: status !== "Inactive",
      is_employee: true,
      phone,
      department: department || "General",
      designation: designation || "Employee",
      basic_salary: parseFloat(basic_salary) || 50000,
      joining_date: joining_date || new Date().toISOString(),
      bank_account,
      pan_number,
      address,
    });

    const employees = await User.find({ is_employee: true }).lean().exec();
    const empIndex = employees.findIndex(u => u._id.toString() === user._id.toString());
    
    const employee = {
      id: user._id.toString(),
      emp_id: `EMP${String(empIndex + 1).padStart(4, '0')}`,
      name: user.full_name,
      email: user.email,
      phone: user.phone || "N/A",
      department: user.department || "General",
      designation: user.designation || "Employee",
      basic_salary: user.basic_salary || 50000,
      joining_date: user.joining_date || new Date().toISOString(),
      status: user.is_active ? "Active" : "Inactive",
    };

    res.status(201).json({ success: true, employee, tempPassword: defaultPassword });
  } catch (err) {
    console.error("Create employee error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/employees", async (req, res) => {
  try {
    const users = await User.find({ is_employee: true }).lean().exec();
    const employees = users.map((u, idx) => ({
      id: u._id.toString(),
      emp_id: `EMP${String(idx + 1).padStart(4, '0')}`,
      name: u.full_name,
      email: u.email,
      phone: u.phone || "N/A",
      department: u.department || "General",
      designation: u.designation || "Employee",
      basic_salary: u.basic_salary || 50000,
      joining_date: u.joining_date || new Date().toISOString(),
      status: u.is_active ? "Active" : "Inactive",
    }));
    res.json(employees);
  } catch (err) {
    console.error("Get employees error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/employees/:id", requireRole("admin", "hr"), async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const password = req.headers["x-confirm-password"];
    
    if (!password) {
      return res.status(400).json({ message: "Password confirmation is required" });
    }
    
    const currentUser = await User.findById(userId).exec();
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }
    
    const passwordOk = await bcrypt.compare(password, currentUser.passwordHash);
    if (!passwordOk) {
      return res.status(403).json({ message: "Incorrect password" });
    }
    
    const user = await User.findByIdAndDelete(req.params.id).lean().exec();
    if (!user) return res.status(404).json({ message: "Employee not found" });
    
    await Payslip.deleteMany({ employee_id: req.params.id });
    await Attendance.deleteMany({ employee_id: req.params.id });
    
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("Delete employee error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/attendance", async (_req, res) => {
  try {
    const records = await Attendance.find().sort({ date: -1 }).lean().exec();
    res.json(records);
  } catch (err) {
    console.error("Get attendance error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/attendance/:employeeId", async (req, res) => {
  try {
    const records = await Attendance.find({ employee_id: req.params.employeeId })
      .sort({ date: -1 })
      .lean()
      .exec();
    res.json(records);
  } catch (err) {
    console.error("Get employee attendance error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/attendance/mark-day", requireRole("admin", "hr"), async (req, res) => {
  try {
    const { date, attendanceRecords } = req.body; // attendanceRecords: [{ employee_id, employee_name, status }, ...]
    if (!date || !attendanceRecords || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({ message: "date and attendanceRecords array are required" });
    }

    const dateObj = new Date(date);
    const results = [];

    for (const record of attendanceRecords) {
      const { employee_id, employee_name, status } = record;
      
      const existing = await Attendance.findOne({
        employee_id,
        date: {
          $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
          $lt: new Date(dateObj.setHours(23, 59, 59, 999)),
        },
      }).exec();

      let result;
      if (existing) {
        existing.status = status;
        result = await existing.save();
      } else {
        result = await Attendance.create({
          employee_id,
          employee_name,
          date: dateObj,
          status: status || "Present",
        });
      }
      results.push(result);
    }

    res.status(201).json({ message: "Attendance marked successfully", records: results });
  } catch (err) {
    console.error("Mark attendance error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/attendance", requireRole("admin", "hr"), async (req, res) => {
  try {
    const { employee_id, employee_name, date, status, notes } = req.body;
    if (!employee_id || !employee_name || !date) {
      return res.status(400).json({ message: "employee_id, employee_name, and date are required" });
    }

    const record = await Attendance.create({
      employee_id,
      employee_name,
      date: new Date(date),
      status: status || "Present",
      notes,
    });
    res.status(201).json(record);
  } catch (err) {
    console.error("Create attendance error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.patch("/attendance/:id", requireRole("admin", "hr"), async (req, res) => {
  try {
    const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    })
      .lean()
      .exec();
    if (!record) return res.status(404).json({ message: "Attendance record not found" });
    res.json(record);
  } catch (err) {
    console.error("Update attendance error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/attendance/:id", requireRole("admin", "hr"), async (req, res) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id).lean().exec();
    if (!record) return res.status(404).json({ message: "Attendance record not found" });
    res.json({ message: "Attendance record deleted" });
  } catch (err) {
    console.error("Delete attendance error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/seed-payslips", async (_req, res) => {
  try {
    await Payslip.deleteMany({});

    const users = await User.find().lean().exec();
    
    if (users.length === 0) {
      return res.status(400).json({ message: "No users found. Create users first." });
    }

    const payslips = [];
    const months = ["2026-01", "2025-12", "2025-11"];
    
    users.forEach(user => {
      months.forEach(month => {
        payslips.push({
          employee_id: user._id.toString(),
          employee_name: user.full_name,
          email: user.email,
          month: month,
          basic_salary: 50000,
          allowances: 5000,
          deductions: 5000,
          net_salary: 50000,
          present_days: 22,
          total_days: 22,
          notes: `Payslip for ${month}`,
        });
      });
    });

    const created = await Payslip.insertMany(payslips);
    res.json({ message: `Created ${created.length} sample payslips`, count: created.length });
  } catch (err) {
    console.error("Seed payslips error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/reset-data", async (req, res) => {
  try {
    const password = req.body?.password;
    if (password !== "reset123") {
      return res.status(403).json({ message: "Invalid password" });
    }

    await User.deleteMany({});
    await Payslip.deleteMany({});
    await Attendance.deleteMany({});
    
    const passwordHash = await bcrypt.hash("password123", 10);
    const sampleUsers = [
      { full_name: 'Vivek Sharma', email: 'vivek.sharma@company.com', role: 'employee' },
      { full_name: 'Srinadh Varma', email: 'srinadh.varma@company.com', role: 'employee' },
      { full_name: 'Priya Patel', email: 'priya.patel@company.com', role: 'employee' },
      { full_name: 'Rajesh Kumar', email: 'rajesh.kumar@company.com', role: 'employee' },
    ];

    const createdUsers = await Promise.all(
      sampleUsers.map(user => 
        User.create({ ...user, passwordHash, is_active: true })
      )
    );

    const payslips = [];
    const months = ["2026-01", "2025-12", "2025-11"];
    
    createdUsers.forEach(user => {
      months.forEach(month => {
        const basicSalary = 50000;
        const hra = Math.round(basicSalary * 0.20);
        const da = Math.round(basicSalary * 0.10);
        const grossSalary = basicSalary + hra + da;
        const pfDeduction = Math.round(basicSalary * 0.12);
        const taxDeduction = Math.round(grossSalary * 0.05);
        const netSalary = grossSalary - pfDeduction - taxDeduction;

        payslips.push({
          employee_id: user._id.toString(),
          employee_name: user.full_name,
          email: user.email,
          month: month,
          basic_salary: basicSalary,
          hra: hra,
          da: da,
          allowances: 0,
          gross_salary: grossSalary,
          pf_deduction: pfDeduction,
          tax_deduction: taxDeduction,
          deductions: pfDeduction + taxDeduction,
          net_salary: netSalary,
          present_days: 22,
          working_days: 22,
          notes: `Payslip for ${month}`,
        });
      });
    });

    await Payslip.insertMany(payslips);
    
    res.json({ 
      message: `✅ Reset complete! Created ${createdUsers.length} employees and ${payslips.length} payslips`,
      employees: createdUsers.map(u => u.full_name)
    });
  } catch (err) {
    console.error("Reset data error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/salaries", async (req, res) => {
  try {
    const userRole = req.headers["x-user-role"];
    const userId = req.headers["x-user-id"];
    
    let query;
    if (userRole === "employee") {
      query = Payslip.find({ employee_id: userId });
    } else {
      query = Payslip.find();
    }
    
    const payslips = await query.sort({ month: -1 }).lean().exec();
    
    const salaryRecords = payslips.map(p => ({
      id: p._id.toString(),
      employee_id: p.employee_id,
      employee_name: p.employee_name,
      department: p.department || '',
      month: p.month,
      basic_salary: p.basic_salary,
      hra: p.hra || 0,
      da: p.da || 0,
      gross_salary: p.gross_salary || 0,
      pf_deduction: p.pf_deduction || 0,
      tax_deduction: p.tax_deduction || 0,
      total_deductions: (p.pf_deduction || 0) + (p.tax_deduction || 0),
      net_salary: p.net_salary,
      working_days: p.working_days,
      attendance_days: p.present_days,
      status: 'Processed',
      created_date: p.created_date,
    }));
    
    res.json(salaryRecords);
  } catch (err) {
    console.error("Get salaries error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/salaries", requireRole("admin", "hr"), async (req, res) => {
  try {
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.patch("/salaries/:id", requireRole("admin", "hr"), async (req, res) => {
  try {
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/payslips", async (req, res) => {
  try {
    const userRole = req.headers["x-user-role"];
    const userId = req.headers["x-user-id"];
    
    let query;
    if (userRole === "employee") {
      query = Payslip.find({ employee_id: userId });
    } else {
      query = Payslip.find();
    }

    const payslips = await query.sort({ month: -1 }).lean().exec();
    res.json(payslips);
  } catch (err) {
    console.error("Get payslips error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/payslips/bulk-create", requireRole("admin", "hr"), async (req, res) => {
  try {
    const payslips = req.body;
    if (!Array.isArray(payslips) || payslips.length === 0) {
      return res.status(400).json({ message: "Expected an array of payslips" });
    }

    const created = [];
    const skippedDuplicates = [];
    for (const data of payslips) {
      const { employee_id, employee_name, email, department, month, basic_salary, hra, da, gross_salary, pf_deduction, tax_deduction, total_deductions, net_salary, working_days, attendance_days, other_allowances, other_deductions, notes } = data;
      
      if (!employee_id || !employee_name || !month) {
        continue;
      }

      const existing = await Payslip.findOne({ employee_id, month }).exec();
      if (existing) {
        skippedDuplicates.push(employee_name);
        continue;
      }

      const payslip = await Payslip.create({
        employee_id,
        employee_name,
        email: email || '',
        department: department || '',
        month,
        basic_salary,
        hra: hra || 0,
        da: da || 0,
        allowances: other_allowances || 0,
        gross_salary: gross_salary || 0,
        pf_deduction: pf_deduction || 0,
        tax_deduction: tax_deduction || 0,
        deductions: (pf_deduction || 0) + (tax_deduction || 0) + (other_deductions || 0),
        net_salary: net_salary || (gross_salary - (pf_deduction || 0) - (tax_deduction || 0) - (other_deductions || 0)),
        present_days: attendance_days,
        working_days: working_days,
        notes,
      });
      created.push(payslip);
    }

    res.status(201).json({ message: `Created ${created.length} payslips${skippedDuplicates.length ? `, skipped ${skippedDuplicates.length} duplicates` : ''}`, payslips: created });
  } catch (err) {
    console.error("Bulk create payslips error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/payslips", requireRole("admin", "hr"), async (req, res) => {
  try {
    const { employee_id, employee_name, email, month, basic_salary, allowances, deductions, present_days, total_days, notes } = req.body;
    if (!employee_id || !employee_name || !month) {
      return res.status(400).json({ message: "employee_id, employee_name, and month are required" });
    }

    const net_salary = (basic_salary || 0) + (allowances || 0) - (deductions || 0);

    const payslip = await Payslip.create({
      employee_id,
      employee_name,
      email,
      month,
      basic_salary,
      allowances,
      deductions,
      net_salary,
      present_days,
      total_days,
      notes,
    });
    res.status(201).json(payslip);
  } catch (err) {
    console.error("Create payslip error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.patch("/payslips/:id", requireRole("admin", "hr"), async (req, res) => {
  try {
    const updates = { ...req.body };
    
    if (updates.basic_salary !== undefined || updates.allowances !== undefined || updates.deductions !== undefined) {
      const payslip = await Payslip.findById(req.params.id).exec();
      const basic = updates.basic_salary !== undefined ? updates.basic_salary : payslip.basic_salary;
      const allowances = updates.allowances !== undefined ? updates.allowances : payslip.allowances;
      const deductions = updates.deductions !== undefined ? updates.deductions : payslip.deductions;
      updates.net_salary = basic + allowances - deductions;
    }

    const payslip = await Payslip.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    })
      .lean()
      .exec();
    if (!payslip) return res.status(404).json({ message: "Payslip not found" });
    res.json(payslip);
  } catch (err) {
    console.error("Update payslip error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/payslips/:id", requireRole("admin", "hr"), async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const password = req.headers["x-confirm-password"];
    
    if (!password) {
      return res.status(400).json({ message: "Password confirmation is required" });
    }
    
    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      return res.status(403).json({ message: "Incorrect password" });
    }
    
    const payslip = await Payslip.findByIdAndDelete(req.params.id).lean().exec();
    if (!payslip) return res.status(404).json({ message: "Payslip not found" });
    res.json({ message: "Payslip deleted" });
  } catch (err) {
    console.error("Delete payslip error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

async function start() {
  try {
    console.log("   URI:", MONGO_URI.replace(/\/\/.*:.*@/, "//***:***@")); // Hide credentials
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    app.listen(PORT, async () => {
    });
  } catch (err) {
    console.error("\n❌ Failed to start server:");
    if (err.message.includes("ECONNREFUSED")) {
      console.error("   🔴 MongoDB connection refused!");
      console.error("   Make sure MongoDB is running:");
      console.error("   1. Install from: https://www.mongodb.com/try/download/community");
      console.error("   2. Run: mongod (or verify service is running)");
      console.error("   3. Connection URI:", MONGO_URI);
    } else if (err.message.includes("connect ENOTFOUND")) {
      console.error("   🔴 MongoDB host not found!");
      console.error("   Check MONGO_URI in .env file");
    } else {
      console.error("   ", err.message);
    }
    console.error("\n📝 For help, see MONGODB_SETUP.md");
    process.exit(1);
  }
}

start();
