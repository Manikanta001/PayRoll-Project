import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Support both local and cloud MongoDB with fallback
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/payroll";
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const NODE_ENV = process.env.NODE_ENV || "development";

const app = express();

// Enable CORS for frontend (local development or production deployment)
const corsOptions = {
  origin: FRONTEND_URL,
  credentials: false,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};

if (NODE_ENV === "production") {
  console.log(`🔐 CORS enabled for: ${FRONTEND_URL}`);
}

app.use(cors(corsOptions));
app.use(express.json());

// --- Mongoose models ---

const userSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "employee" },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_date", updatedAt: "updated_date" } },
);

const User = mongoose.model("User", userSchema);

// Attendance Schema - Store attendance records for each day
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

// Payslip Schema - Store payslips for employees
const payslipSchema = new mongoose.Schema(
  {
    employee_id: { type: String, required: true },
    employee_name: { type: String, required: true },
    email: { type: String, required: true },
    month: { type: String, required: true }, // Format: YYYY-MM
    basic_salary: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    net_salary: { type: Number, default: 0 },
    present_days: { type: Number, default: 0 },
    total_days: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: { createdAt: "created_date", updatedAt: "updated_date" } }
);

const Payslip = mongoose.model("Payslip", payslipSchema);

// --- Auth routes ---

app.post("/auth/register", async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body || {};
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: "full_name, email and password are required" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() }).exec();
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      full_name,
      email: email.toLowerCase(),
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

// --- MIDDLEWARE: Check if user has required role ---
function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    const userRole = req.headers["x-user-role"];
    if (!allowedRoles.includes(userRole)) {
      return _res.status(403).json({ message: `Access denied. Required role: ${allowedRoles.join(", ")}` });
    }
    next();
  };
}

// --- User management routes ---

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
    
    // Employee can only see their own data
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

// Only HR and Admin can edit users
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

// Only HR and Admin can delete users
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

// --- ATTENDANCE ROUTES ---

// Get all attendance records
app.get("/attendance", async (_req, res) => {
  try {
    const records = await Attendance.find().sort({ date: -1 }).lean().exec();
    res.json(records);
  } catch (err) {
    console.error("Get attendance error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get attendance for a specific employee
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

// Mark attendance for multiple employees on a single day
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
      
      // Find or create attendance record for this date
      const existing = await Attendance.findOne({
        employee_id,
        date: {
          $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
          $lt: new Date(dateObj.setHours(23, 59, 59, 999)),
        },
      }).exec();

      let result;
      if (existing) {
        // Update existing record
        existing.status = status;
        result = await existing.save();
      } else {
        // Create new record
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

// Create single attendance record
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

// Update attendance record
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

// Delete attendance record
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

// --- SEED DATA ENDPOINT ---

app.post("/seed-payslips", async (_req, res) => {
  try {
    // Clear existing payslips
    await Payslip.deleteMany({});

    // Get all users to use as employees
    const users = await User.find().lean().exec();
    
    if (users.length === 0) {
      return res.status(400).json({ message: "No users found. Create users first." });
    }

    // Create sample payslips for each user for the last 3 months
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

// --- PAYSLIP ROUTES ---

// Get all payslips
app.get("/payslips", async (req, res) => {
  try {
    const userRole = req.headers["x-user-role"];
    const userId = req.headers["x-user-id"];
    
    let query;
    if (userRole === "employee") {
      // Employees can only see their own payslips
      query = Payslip.find({ employee_id: userId });
    } else {
      // Admin and HR can see all payslips
      query = Payslip.find();
    }

    const payslips = await query.sort({ month: -1 }).lean().exec();
    res.json(payslips);
  } catch (err) {
    console.error("Get payslips error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create payslip
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

// Update payslip
app.patch("/payslips/:id", requireRole("admin", "hr"), async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Recalculate net salary if any salary component changed
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

// Delete payslip
app.delete("/payslips/:id", requireRole("admin", "hr"), async (req, res) => {
  try {
    const payslip = await Payslip.findByIdAndDelete(req.params.id).lean().exec();
    if (!payslip) return res.status(404).json({ message: "Payslip not found" });
    res.json({ message: "Payslip deleted" });
  } catch (err) {
    console.error("Delete payslip error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- Start server ---

async function start() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    console.log("   URI:", MONGO_URI.replace(/\/\/.*:.*@/, "//***:***@")); // Hide credentials
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connected to MongoDB successfully");
    console.log("📦 Database: payroll | Collection: users");
    
    app.listen(PORT, async () => {
      console.log("🚀 API server started!");
      console.log(`📍 Backend URL: http://localhost:${PORT}`);
      console.log("📍 Frontend URL: http://localhost:5173");
      console.log("\n✨ Authentication ready:");
      console.log("   • POST /auth/register - Create account");
      console.log("   • POST /auth/login - Sign in");
      console.log("   • GET  /auth/me - Get user info");
      console.log("\n🔗 API Endpoints:");
      console.log("   • GET  /users - (Admin/HR only) List all users");
      console.log("   • GET  /users/:id - Get user by ID (Employee can only see own data)");
      console.log("   • PATCH /users/:id - (Admin/HR only) Update user");
      console.log("   • DELETE /users/:id - (Admin/HR only) Delete user");
      console.log("   • POST /users/invite - (Admin/HR) Invite new users");
      console.log("\n🔐 Role-Based Access:");
      console.log("   • admin   - Full access to all features");
      console.log("   • hr      - HR access (manage users, payroll)");
      console.log("   • employee - Limited access (only see own data & payslips)");

      // Auto-seed payslips if none exist
      try {
        const payslipCount = await Payslip.countDocuments().exec();
        if (payslipCount === 0) {
          const users = await User.find().lean().exec();
          if (users.length > 0) {
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

            await Payslip.insertMany(payslips);
            console.log(`📊 Auto-seeded ${payslips.length} sample payslips`);
          }
        }
      } catch (seedErr) {
        console.warn("⚠️ Could not auto-seed payslips:", seedErr.message);
      }
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

