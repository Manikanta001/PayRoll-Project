import dns from "node:dns";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";

dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const MONGO_URI = process.env.MONGO_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://localhost:5173";

if (!MONGO_URI) {
  console.error("MONGO_URI environment variable is required");
}

const allowedOrigins = [
  ...new Set(
    FRONTEND_URL.split(",")
      .map((url) => url.trim())
      .filter(Boolean)
  ),
];

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: false,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "x-user-role",
      "x-user-id",
      "x-confirm-password",
    ],
  })
);
app.use(express.json());

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
}

const userSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: ["admin", "hr", "employee"],
      default: "employee",
    },
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
  { timestamps: { createdAt: "created_date", updatedAt: "updated_date" } }
);

const attendanceSchema = new mongoose.Schema(
  {
    employee_id: { type: String, required: true },
    employee_name: { type: String },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Present", "Absent", "Half Day", "Leave"],
      default: "Present",
    },
    check_in: { type: String },
    check_out: { type: String },
    notes: { type: String },
  },
  { timestamps: { createdAt: "created_date", updatedAt: "updated_date" } }
);

const payslipSchema = new mongoose.Schema(
  {
    employee_id: { type: String, required: true },
    employee_name: { type: String, required: true },
    email: { type: String },
    department: { type: String },
    month: { type: String, required: true },
    basic_salary: { type: Number, required: true },
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    gross_salary: { type: Number, required: true },
    pf_deduction: { type: Number, default: 0 },
    tax_deduction: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    net_salary: { type: Number, required: true },
    present_days: { type: Number },
    working_days: { type: Number },
    status: {
      type: String,
      enum: ["Generated", "Processed", "Paid", "Pending"],
      default: "Generated",
    },
    notes: { type: String },
  },
  { timestamps: { createdAt: "created_date", updatedAt: "updated_date" } }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Attendance =
  mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
const Payslip =
  mongoose.models.Payslip || mongoose.model("Payslip", payslipSchema);

function requireRole(...roles) {
  return (req, res, next) => {
    const userRole = req.headers["x-user-role"];
    if (!userRole || !roles.includes(userRole)) {
      return res
        .status(403)
        .json({ message: "Insufficient permissions. Required: " + roles.join(", ") });
    }
    next();
  };
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body || {};
    if (!full_name || !email || !password) {
      return res
        .status(400)
        .json({ message: "full_name, email and password are required" });
    }

    const emailLower = email.toLowerCase();

    if (!role || role === "employee") {
      const employeeRecord = await User.findOne({
        email: emailLower,
        is_employee: true,
      }).exec();
      if (!employeeRecord) {
        return res.status(403).json({
          message:
            "This email is not registered as an employee. Please contact HR to add you first.",
        });
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

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email and password are required" });
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

app.get("/api/auth/me", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.json(null);
    const user = await User.findById(userId).exec();
    if (!user) return res.json(null);
    const plain = user.toObject();
    delete plain.passwordHash;
    res.json(plain);
  } catch (err) {
    res.json(null);
  }
});

app.post("/api/auth/verify-password", async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) return res.json({ ok: false });
    const user = await User.findById(userId).exec();
    if (!user) return res.json({ ok: false });
    const ok = await bcrypt.compare(password, user.passwordHash);
    res.json({ ok });
  } catch (err) {
    res.json({ ok: false });
  }
});

app.get("/api/employees", requireRole("admin", "hr"), async (req, res) => {
  try {
    const employees = await User.find({ is_employee: true }).lean().exec();
    const mapped = employees.map((u, i) => ({
      id: u._id.toString(),
      emp_id: `EMP${String(i + 1).padStart(4, "0")}`,
      name: u.full_name,
      email: u.email,
      phone: u.phone || "N/A",
      department: u.department || "General",
      designation: u.designation || "Employee",
      basic_salary: u.basic_salary || 50000,
      joining_date: u.joining_date || u.created_date?.toISOString(),
      status: u.is_active ? "Active" : "Inactive",
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Get employees error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/employees", requireRole("admin", "hr"), async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      department,
      designation,
      basic_salary,
      joining_date,
      status,
      bank_account,
      pan_number,
      address,
    } = req.body;

    if (!name || !email) {
      return res
        .status(400)
        .json({ message: "name and email are required" });
    }

    const existing = await User.findOne({
      email: email.toLowerCase(),
    }).exec();
    if (existing) {
      return res
        .status(400)
        .json({ message: "Employee with this email already exists" });
    }

    const defaultPassword = name.trim().split(" ")[0] + "9878";
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
    const empIndex = employees.findIndex(
      (u) => u._id.toString() === user._id.toString()
    );

    const employee = {
      id: user._id.toString(),
      emp_id: `EMP${String(empIndex + 1).padStart(4, "0")}`,
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

app.delete(
  "/api/employees/:id",
  requireRole("admin", "hr"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const password = req.headers["x-confirm-password"];
      const userRole = req.headers["x-user-role"];
      const userId = req.headers["x-user-id"];

      if (!password) {
        return res
          .status(400)
          .json({ message: "Password confirmation is required" });
      }

      const requestingUser = await User.findById(userId).exec();
      if (!requestingUser) {
        return res.status(401).json({ message: "User not found" });
      }

      const passwordOk = await bcrypt.compare(
        password,
        requestingUser.passwordHash
      );
      if (!passwordOk) {
        return res.status(403).json({ message: "Incorrect password" });
      }

      const deletedUser = await User.findByIdAndDelete(id).exec();
      if (!deletedUser) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.json({ success: true, message: "Employee deleted successfully" });
    } catch (err) {
      console.error("Delete employee error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.get("/api/attendance", async (req, res) => {
  try {
    const records = await Attendance.find().sort({ date: -1 }).lean().exec();
    const mapped = records.map((r) => ({
      id: r._id.toString(),
      employee_id: r.employee_id,
      employee_name: r.employee_name,
      date: r.date,
      status: r.status,
      check_in: r.check_in,
      check_out: r.check_out,
      notes: r.notes,
      created_date: r.created_date,
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Get attendance error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post(
  "/api/attendance",
  requireRole("admin", "hr"),
  async (req, res) => {
    try {
      const record = await Attendance.create(req.body);
      res.status(201).json(record);
    } catch (err) {
      console.error("Create attendance error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.post(
  "/api/attendance/mark-day",
  requireRole("admin", "hr"),
  async (req, res) => {
    try {
      const { date, attendanceRecords } = req.body;
      if (!date || !Array.isArray(attendanceRecords)) {
        return res.status(400).json({ message: "date and attendanceRecords required" });
      }

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const results = [];
      for (const record of attendanceRecords) {
        const existing = await Attendance.findOne({
          employee_id: record.employee_id,
          date: { $gte: dayStart, $lte: dayEnd },
        }).exec();

        if (existing) {
          existing.status = record.status;
          existing.check_in = record.check_in;
          existing.check_out = record.check_out;
          existing.notes = record.notes;
          await existing.save();
          results.push(existing);
        } else {
          const newRecord = await Attendance.create({
            ...record,
            date: dayEnd,
          });
          results.push(newRecord);
        }
      }

      res.json({ success: true, records: results });
    } catch (err) {
      console.error("Mark day error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.patch(
  "/api/attendance/:id",
  requireRole("admin", "hr"),
  async (req, res) => {
    try {
      const updated = await Attendance.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      ).exec();
      if (!updated)
        return res.status(404).json({ message: "Attendance record not found" });
      res.json(updated);
    } catch (err) {
      console.error("Update attendance error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.delete(
  "/api/attendance/:id",
  requireRole("admin", "hr"),
  async (req, res) => {
    try {
      await Attendance.findByIdAndDelete(req.params.id).exec();
      res.json({ success: true });
    } catch (err) {
      console.error("Delete attendance error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.get("/api/payslips", async (req, res) => {
  try {
    const userRole = req.headers["x-user-role"];
    const userId = req.headers["x-user-id"];

    let payslips;
    if (userRole === "admin" || userRole === "hr") {
      payslips = await Payslip.find().sort({ created_date: -1 }).lean().exec();
    } else {
      const user = await User.findById(userId).exec();
      if (!user) {
        return res.json([]);
      }
      payslips = await Payslip.find({
        $or: [
          { employee_id: userId },
          { email: user.email },
          { employee_name: user.full_name },
        ],
      })
        .sort({ created_date: -1 })
        .lean()
        .exec();
    }

    const mapped = payslips.map((p) => ({
      id: p._id.toString(),
      employee_id: p.employee_id,
      employee_name: p.employee_name,
      email: p.email,
      department: p.department,
      month: p.month,
      basic_salary: p.basic_salary,
      hra: p.hra,
      da: p.da,
      allowances: p.allowances,
      gross_salary: p.gross_salary,
      pf_deduction: p.pf_deduction,
      tax_deduction: p.tax_deduction,
      deductions: p.deductions,
      net_salary: p.net_salary,
      present_days: p.present_days,
      working_days: p.working_days,
      status: p.status,
      notes: p.notes,
      created_date: p.created_date,
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Get payslips error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/payslips", requireRole("admin", "hr"), async (req, res) => {
  try {
    const payslip = await Payslip.create(req.body);
    res.status(201).json(payslip);
  } catch (err) {
    console.error("Create payslip error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post(
  "/api/payslips/bulk-create",
  requireRole("admin", "hr"),
  async (req, res) => {
    try {
      const data = req.body;
      if (!Array.isArray(data) || data.length === 0) {
        return res
          .status(400)
          .json({ message: "Expected non-empty array of payslip data" });
      }

      const duplicates = [];
      const toCreate = [];
      for (const item of data) {
        const existing = await Payslip.findOne({
          employee_id: item.employee_id,
          month: item.month,
        }).exec();
        if (existing) {
          duplicates.push(`${item.employee_name} - ${item.month}`);
        } else {
          toCreate.push(item);
        }
      }

      if (toCreate.length === 0) {
        return res.status(409).json({
          message: `All payslips already exist: ${duplicates.join(", ")}`,
          duplicates,
        });
      }

      const mapped = toCreate.map((item) => ({
        employee_id: item.employee_id,
        employee_name: item.employee_name,
        email: item.email || '',
        department: item.department || '',
        month: item.month,
        basic_salary: item.basic_salary,
        hra: item.hra || 0,
        da: item.da || 0,
        allowances: item.other_allowances || 0,
        gross_salary: item.gross_salary || 0,
        pf_deduction: item.pf_deduction || 0,
        tax_deduction: item.tax_deduction || 0,
        deductions: (item.pf_deduction || 0) + (item.tax_deduction || 0) + (item.other_deductions || 0),
        net_salary: item.net_salary || 0,
        present_days: item.attendance_days || item.present_days,
        working_days: item.working_days,
        status: item.status || 'Processed',
        notes: item.notes,
      }));
      const payslips = await Payslip.insertMany(mapped);

      res.status(201).json({
        payslips,
        duplicatesSkipped: duplicates,
        message:
          duplicates.length > 0
            ? `Created ${payslips.length} payslips. Skipped duplicates: ${duplicates.join(", ")}`
            : `Created ${payslips.length} payslips successfully`,
      });
    } catch (err) {
      console.error("Bulk create payslip error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.patch(
  "/api/payslips/:id",
  requireRole("admin", "hr"),
  async (req, res) => {
    try {
      const updated = await Payslip.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      ).exec();
      if (!updated)
        return res.status(404).json({ message: "Payslip not found" });
      res.json(updated);
    } catch (err) {
      console.error("Update payslip error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.delete(
  "/api/payslips/:id",
  requireRole("admin", "hr"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const password = req.headers["x-confirm-password"];
      const userId = req.headers["x-user-id"];

      if (!password) {
        return res
          .status(400)
          .json({ message: "Password confirmation is required" });
      }

      const requestingUser = await User.findById(userId).exec();
      if (!requestingUser) {
        return res.status(401).json({ message: "User not found" });
      }

      const passwordOk = await bcrypt.compare(
        password,
        requestingUser.passwordHash
      );
      if (!passwordOk) {
        return res.status(403).json({ message: "Incorrect password" });
      }

      const deleted = await Payslip.findByIdAndDelete(id).exec();
      if (!deleted)
        return res.status(404).json({ message: "Payslip not found" });

      res.json({ success: true, message: "Payslip deleted successfully" });
    } catch (err) {
      console.error("Delete payslip error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.get("/api/salaries", async (req, res) => {
  try {
    const userRole = req.headers["x-user-role"];
    const userId = req.headers["x-user-id"];

    let query;
    if (userRole === "employee") {
      query = Payslip.find({ employee_id: userId });
    } else {
      query = Payslip.find();
    }

    const payslips = await query.sort({ created_date: -1 }).lean().exec();
    const mapped = payslips.map((p) => ({
      id: p._id.toString(),
      employee_id: p.employee_id,
      employee_name: p.employee_name,
      department: p.department || '',
      month: p.month,
      basic_salary: p.basic_salary,
      hra: p.hra || 0,
      da: p.da || 0,
      allowances: p.allowances || 0,
      gross_salary: p.gross_salary,
      pf_deduction: p.pf_deduction || 0,
      tax_deduction: p.tax_deduction || 0,
      total_deductions: (p.pf_deduction || 0) + (p.tax_deduction || 0),
      deductions: p.deductions || 0,
      net_salary: p.net_salary,
      working_days: p.working_days,
      attendance_days: p.present_days,
      status: p.status || "Generated",
      created_date: p.created_date,
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Get salaries error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.patch(
  "/api/salaries/:id",
  requireRole("admin", "hr"),
  async (req, res) => {
    try {
      const updated = await Payslip.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      ).exec();
      if (!updated)
        return res.status(404).json({ message: "Salary record not found" });
      res.json(updated);
    } catch (err) {
      console.error("Update salary error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.get("/api/users", requireRole("admin", "hr"), async (req, res) => {
  try {
    const users = await User.find().lean().exec();
    const mapped = users.map((u) => ({
      id: u._id.toString(),
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      is_active: u.is_active,
      is_employee: u.is_employee,
      created_date: u.created_date,
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.patch("/api/users/:id", requireRole("admin", "hr"), async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData.passwordHash;
    delete updateData.password;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).exec();
    if (!user) return res.status(404).json({ message: "User not found" });

    const plain = user.toObject();
    delete plain.passwordHash;
    res.json(plain);
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/api/users/:id", requireRole("admin", "hr"), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id).exec();
    res.json({ success: true });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/users/invite", requireRole("admin", "hr"), async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }
    const existing = await User.findOne({
      email: email.toLowerCase(),
    }).exec();
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }
    const user = await User.create({
      full_name: email.split("@")[0],
      email: email.toLowerCase(),
      role: role || "employee",
      is_active: true,
    });
    const plain = user.toObject();
    delete plain.passwordHash;
    res.status(201).json(plain);
  } catch (err) {
    console.error("Invite user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
