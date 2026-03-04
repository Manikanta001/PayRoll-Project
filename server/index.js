import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Support both local and cloud MongoDB with fallback
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/payroll";
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: false }));
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

// --- User management routes ---

app.get("/users", async (_req, res) => {
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
    const user = await User.findById(req.params.id).lean().exec();
    if (!user) return res.status(404).json({ message: "User not found" });
    delete user.passwordHash;
    res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.patch("/users/:id", async (req, res) => {
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
    
    app.listen(PORT, () => {
      console.log("🚀 API server started!");
      console.log(`📍 Backend URL: http://localhost:${PORT}`);
      console.log("📍 Frontend URL: http://localhost:5173");
      console.log("\n✨ Authentication ready:");
      console.log("   • POST /auth/register - Create account");
      console.log("   • POST /auth/login - Sign in");
      console.log("   • GET  /auth/me - Get user info");
      console.log("\n🔗 API Endpoints:");
      console.log("   • POST /auth/register");
      console.log("   • POST /auth/login");
      console.log("   • GET  /auth/me?userId=<id>");
      console.log("   • POST /auth/verify-password");
      console.log("   • GET  /users");
      console.log("   • POST /users/invite");
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

