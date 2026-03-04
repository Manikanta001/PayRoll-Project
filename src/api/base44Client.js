import axios from "axios";

const STORAGE_PREFIX = "local_base44_mock_v1:";
const API_BASE = "http://localhost:4000";

function safeParseJson(raw, fallback) {
  try {
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getStorage() {
  if (typeof window === "undefined") {
    const mem = new Map();
    return {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, v),
      removeItem: (k) => mem.delete(k),
    };
  }
  return window.localStorage;
}

const storage = getStorage();

function storageKey(entityName) {
  return `${STORAGE_PREFIX}${entityName}`;
}

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readAll(entityName) {
  return safeParseJson(storage.getItem(storageKey(entityName)), []);
}

function writeAll(entityName, rows) {
  storage.setItem(storageKey(entityName), JSON.stringify(rows));
}

function matchesQuery(value, condition) {
  if (condition && typeof condition === "object" && !Array.isArray(condition)) {
    if (typeof condition.$regex === "string") {
      const flags = typeof condition.$options === "string" ? condition.$options : "";
      const re = new RegExp(condition.$regex, flags);
      return re.test(String(value ?? ""));
    }
  }
  return value === condition;
}

function filterRows(rows, query) {
  if (!query || typeof query !== "object") return rows;
  const entries = Object.entries(query);
  return rows.filter((row) =>
    entries.every(([field, cond]) => matchesQuery(row?.[field], cond)),
  );
}

function entityApi(entityName) {
  return {
    async list() {
      return readAll(entityName);
    },

    async create(data) {
      const rows = readAll(entityName);
      const row = {
        id: newId(),
        created_date: nowIso(),
        ...data,
      };
      rows.unshift(row);
      writeAll(entityName, rows);
      return row;
    },

    async bulkCreate(items) {
      const rows = readAll(entityName);
      const created = (items ?? []).map((data) => ({
        id: newId(),
        created_date: nowIso(),
        ...data,
      }));
      writeAll(entityName, [...created, ...rows]);
      return created;
    },

    async update(id, data) {
      const rows = readAll(entityName);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) {
        const created = {
          id,
          created_date: nowIso(),
          ...data,
        };
        writeAll(entityName, [created, ...rows]);
        return created;
      }
      const updated = { ...rows[idx], ...data, updated_date: nowIso() };
      const next = [...rows];
      next[idx] = updated;
      writeAll(entityName, next);
      return updated;
    },

    async delete(id) {
      const rows = readAll(entityName);
      const next = rows.filter((r) => r.id !== id);
      writeAll(entityName, next);
      return { success: next.length !== rows.length };
    },

    async filter(query) {
      const rows = readAll(entityName);
      return filterRows(rows, query);
    },
  };
}

function ensureSeedData() {
  const employees = readAll("Employee");
  if (employees.length === 0) {
    const seedEmployees = [
      {
        id: "emp_1",
        emp_id: "EMP0001",
        name: "Ajay Kumar",
        email: "ajay@company.com",
        phone: "555-0101",
        department: "Engineering",
        designation: "Software Engineer",
        basic_salary: 60000,
        joining_date: "2024-01-10",
        status: "Active",
        created_date: nowIso(),
      },
      {
        id: "emp_2",
        emp_id: "EMP0002",
        name: "Nani Reddy",
        email: "nani@company.com",
        phone: "555-0102",
        department: "Human Resources",
        designation: "HR Executive",
        basic_salary: 45000,
        joining_date: "2024-02-05",
        status: "Active",
        created_date: nowIso(),
      },
      {
        id: "emp_3",
        emp_id: "EMP0003",
        name: "Srinadh Varma",
        email: "srinadh@company.com",
        phone: "555-0103",
        department: "Finance",
        designation: "Accounts Manager",
        basic_salary: 55000,
        joining_date: "2023-11-20",
        status: "Active",
        created_date: nowIso(),
      },
      {
        id: "emp_4",
        emp_id: "EMP0004",
        name: "Vivek Sharma",
        email: "vivek@company.com",
        phone: "555-0104",
        department: "Marketing",
        designation: "Marketing Lead",
        basic_salary: 52000,
        joining_date: "2023-09-15",
        status: "Active",
        created_date: nowIso(),
      },
      {
        id: "emp_5",
        emp_id: "EMP0005",
        name: "Pavan Kumar",
        email: "pavan@company.com",
        phone: "555-0105",
        department: "Sales",
        designation: "Sales Executive",
        basic_salary: 48000,
        joining_date: "2024-03-01",
        status: "Active",
        created_date: nowIso(),
      },
      {
        id: "emp_6",
        emp_id: "EMP0006",
        name: "Sathwik Rao",
        email: "sathwik@company.com",
        phone: "555-0106",
        department: "IT Support",
        designation: "Support Engineer",
        basic_salary: 42000,
        joining_date: "2023-12-10",
        status: "Active",
        created_date: nowIso(),
      },
      {
        id: "emp_7",
        emp_id: "EMP0007",
        name: "Varun Tej",
        email: "varun@company.com",
        phone: "555-0107",
        department: "Operations",
        designation: "Operations Manager",
        basic_salary: 58000,
        joining_date: "2023-08-22",
        status: "Active",
        created_date: nowIso(),
      },
      {
        id: "emp_8",
        emp_id: "EMP0008",
        name: "Virat Kohli",
        email: "virat@company.com",
        phone: "555-0108",
        department: "Administration",
        designation: "Admin Officer",
        basic_salary: 50000,
        joining_date: "2024-01-01",
        status: "Active",
        created_date: nowIso(),
      },
      {
        id: "emp_9",
        emp_id: "EMP0009",
        name: "Anil Kapoor",
        email: "anil@company.com",
        phone: "555-0109",
        department: "Engineering",
        designation: "Senior Engineer",
        basic_salary: 65000,
        joining_date: "2022-06-18",
        status: "Active",
        created_date: nowIso(),
      },
      {
        id: "emp_10",
        emp_id: "EMP0010",
        name: "HR Admin",
        email: "hr@company.com",
        phone: "555-0110",
        department: "Human Resources",
        designation: "HR Manager",
        basic_salary: 70000,
        joining_date: "2021-04-12",
        status: "Active",
        created_date: nowIso(),
      },
    ];
    writeAll("Employee", seedEmployees);
  }

  const salary = readAll("SalaryRecord");
  if (salary.length === 0) {
    writeAll("SalaryRecord", []);
  }
  const attendance = readAll("Attendance");
  if (attendance.length === 0) {
    writeAll("Attendance", []);
  }
}

ensureSeedData();

const AUTH_KEY = `${STORAGE_PREFIX}auth_user_id`;

function getCurrentUserId() {
  const stored = storage.getItem(AUTH_KEY);
  if (stored) return stored;
  return null;
}

function setCurrentUserId(id) {
  if (!id) return;
  storage.setItem(AUTH_KEY, id);
}

export const base44 = {
  entities: {
    Employee: entityApi("Employee"),
    SalaryRecord: entityApi("SalaryRecord"),
    Attendance: entityApi("Attendance"),
    User: {
      async list() {
        const res = await axios.get(`${API_BASE}/users`);
        return res.data;
      },
      async update(id, data) {
        const res = await axios.patch(`${API_BASE}/users/${id}`, data);
        return res.data;
      },
    },
  },

  auth: {
    async me() {
      const meId = getCurrentUserId();
      if (!meId) return null;
      const res = await axios.get(`${API_BASE}/auth/me`, { params: { userId: meId } });
      return res.data;
    },

    async loginWithEmailPassword(email, password) {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      const user = res.data;
      setCurrentUserId(user._id || user.id);
      return user;
    },

    async registerWithEmailPassword(full_name, email, password, role = "employee") {
      try {
        console.log("📝 Registering user:", { full_name, email, role });
        console.log("🔗 Calling API:", `${API_BASE}/auth/register`);
        const res = await axios.post(`${API_BASE}/auth/register`, {
          full_name,
          email,
          password,
          role,
        });
        console.log("✅ Registration successful! User:", res.data);
        const user = res.data;
        setCurrentUserId(user._id || user.id);
        return user;
      } catch (error) {
        console.error("❌ Registration API error");
        console.error("  Status:", error.response?.status);
        console.error("  Message:", error.response?.data?.message);
        console.error("  Full error:", error.response?.data || error.message);
        throw error;
      }
    },

    async verifyPassword(password) {
      const userId = getCurrentUserId();
      if (!userId) return false;
      const res = await axios.post(`${API_BASE}/auth/verify-password`, { userId, password });
      return !!res.data?.ok;
    },

    logout() {
      storage.removeItem(AUTH_KEY);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    },
  },

  users: {
    async inviteUser(email, role = "employee") {
      const res = await axios.post(`${API_BASE}/users/invite`, { email, role });
      return res.data;
    },
  },

  integrations: {
    Core: {
      async SendEmail({ to, subject, body }) {
        // Local stub so UI flows keep working without Base44.
        if (typeof console !== "undefined") {
          console.log("[MockEmail] to=", to, "subject=", subject, "body=", body);
        }
        return { success: true };
      },
    },
  },
};

