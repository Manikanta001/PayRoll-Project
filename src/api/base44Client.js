import axios from "axios";

const STORAGE_PREFIX = "local_base44_mock_v1:";

// API base: in production (Vercel) use relative /api path, in dev use localhost:4000
const API_BASE = (import.meta?.env?.VITE_API_BASE) || (import.meta?.env?.PROD ? "/api" : "http://localhost:4000");

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
  // No seed data - employees are managed by HR only
  const salary = readAll("SalaryRecord");
  if (salary.length === 0) {
    writeAll("SalaryRecord", []);
  }
  const attendance = readAll("Attendance");
  if (attendance.length === 0) {
    writeAll("Attendance", []);
  }
  // Clear any existing seed employees from localStorage
  writeAll("Employee", []);
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
    Employee: {
      async list() {
        try {
          console.log("📥 Fetching employees from:", `${API_BASE}/employees`);
          const res = await axios.get(`${API_BASE}/employees`, {
            headers: {
              "x-user-role": localStorage.getItem(`${STORAGE_PREFIX}user_role`) || "admin",
              "x-user-id": getCurrentUserId() || "",
            },
          });
          console.log("✅ Fetched employees:", res.data?.length || 0, "records");
          return res.data || [];
        } catch (error) {
          console.error("❌ Error fetching employees:", error.response?.status, error.response?.data || error.message);
          // Fallback to local storage if API fails
          console.log("⏮ Falling back to local employee data");
          return readAll("Employee") || [];
        }
      },
      async create(data) {
        try {
          console.log("📤 Creating employee:", data.name);
          const res = await axios.post(`${API_BASE}/employees`, {
            name: data.name,
            email: data.email,
            phone: data.phone,
            department: data.department,
            designation: data.designation,
            basic_salary: data.basic_salary,
            joining_date: data.joining_date,
            status: data.status,
            bank_account: data.bank_account,
            pan_number: data.pan_number,
            address: data.address,
          }, {
            headers: {
              "x-user-role": localStorage.getItem(`${STORAGE_PREFIX}user_role`) || "admin",
              "x-user-id": getCurrentUserId() || "",
            },
          });
          console.log("✅ Employee created successfully:", res.data?.employee?.name);
          return res.data?.employee || res.data;
        } catch (error) {
          console.error("❌ Error creating employee:", error.response?.data || error.message);
          throw error;
        }
      },
      async update(id, data) {
        try {
          console.log("📤 Updating employee:", id);
          const res = await axios.patch(`${API_BASE}/users/${id}`, {
            full_name: data.name,
            email: data.email,
            phone: data.phone,
            department: data.department,
            designation: data.designation,
            basic_salary: data.basic_salary,
            joining_date: data.joining_date,
            is_active: data.status !== "Inactive",
            bank_account: data.bank_account,
            pan_number: data.pan_number,
            address: data.address,
          }, {
            headers: {
              "x-user-role": localStorage.getItem(`${STORAGE_PREFIX}user_role`) || "admin",
              "x-user-id": getCurrentUserId() || "",
            },
          });
          console.log("✅ Employee updated successfully");
          return res.data;
        } catch (error) {
          console.error("❌ Error updating employee:", error.response?.data || error.message);
          throw error;
        }
      },
      async delete(id, password) {
        try {
          console.log("📤 Deleting employee:", id);
          const res = await axios.delete(`${API_BASE}/employees/${id}`, {
            headers: {
              "x-user-role": localStorage.getItem(`${STORAGE_PREFIX}user_role`) || "admin",
              "x-user-id": getCurrentUserId() || "",
              "x-confirm-password": password || "",
            },
          });
          console.log("✅ Employee deleted successfully");
          return { success: true };
        } catch (error) {
          console.error("❌ Error deleting employee:", error.response?.data || error.message);
          throw error;
        }
      },
    },
    SalaryRecord: {
      async list() {
        try {
          console.log("📥 Fetching salaries from:", `${API_BASE}/salaries`);
          const res = await axios.get(`${API_BASE}/salaries`, {
            headers: {
              "x-user-role": localStorage.getItem(`${STORAGE_PREFIX}user_role`) || "admin",
              "x-user-id": getCurrentUserId() || "",
            },
          });
          console.log("✅ Fetched salaries:", res.data?.length || 0, "records");
          return res.data || [];
        } catch (error) {
          console.error("❌ Error fetching salaries:", error.response?.status, error.response?.data || error.message);
          return []; // Return empty instead of throwing to avoid breaking entire page
        }
      },
      async bulkCreate(records) {
        // Fallback to local storage if API fails, but attempt API first
        try {
          // The backend /salaries endpoint we added only returns success
          // but we still want to keep local records for UI feedback
          const rows = readAll("SalaryRecord");
          const created = (records ?? []).map((data) => ({
            id: newId(),
            created_date: nowIso(),
            ...data,
          }));
          writeAll("SalaryRecord", [...created, ...rows]);
          return created;
        } catch (error) {
          console.error("Local storage error:", error);
          return [];
        }
      },
      async update(id, data) {
        try {
          await axios.patch(`${API_BASE}/salaries/${id}`, data, {
            headers: {
              "x-user-role": localStorage.getItem(`${STORAGE_PREFIX}user_role`) || "admin",
              "x-user-id": getCurrentUserId() || "",
            },
          });
          // Also update local copy
          const rows = readAll("SalaryRecord");
          const idx = rows.findIndex((r) => r.id === id);
          if (idx !== -1) {
            rows[idx] = { ...rows[idx], ...data, updated_date: nowIso() };
            writeAll("SalaryRecord", rows);
          }
          return { success: true };
        } catch (error) {
          console.error("Error updating salary:", error);
          return { success: false };
        }
      }
    },
    Attendance: {
      async list() {
        try {
          console.log("📥 Fetching attendance from:", `${API_BASE}/attendance`);
          const res = await axios.get(`${API_BASE}/attendance`);
          console.log("✅ Fetched attendance:", res.data?.length || 0, "records");
          return res.data || [];
        } catch (error) {
          console.error("❌ Error fetching attendance:", error.response?.status, error.response?.data || error.message);
          throw error;
        }
      },
      async create(data) {
        try {
          const res = await axios.post(`${API_BASE}/attendance`, data, {
            headers: {
              "x-user-role": localStorage.getItem(`${STORAGE_PREFIX}user_role`) || "admin",
              "x-user-id": getCurrentUserId() || "",
            },
          });
          return res.data;
        } catch (error) {
          console.error("Error creating attendance:", error);
          throw error;
        }
      },
      async update(id, data) {
        try {
          const res = await axios.patch(`${API_BASE}/attendance/${id}`, data, {
            headers: {
              "x-user-role": localStorage.getItem(`${STORAGE_PREFIX}user_role`) || "admin",
              "x-user-id": getCurrentUserId() || "",
            },
          });
          return res.data;
        } catch (error) {
          console.error("Error updating attendance:", error);
          throw error;
        }
      },
      async delete(id) {
        try {
          const res = await axios.delete(`${API_BASE}/attendance/${id}`, {
            headers: {
              "x-user-role": localStorage.getItem(`${STORAGE_PREFIX}user_role`) || "admin",
              "x-user-id": getCurrentUserId() || "",
            },
          });
          return { success: true };
        } catch (error) {
          console.error("Error deleting attendance:", error);
          throw error;
        }
      },
      async markDay(date, attendanceRecords) {
        try {
          const res = await axios.post(`${API_BASE}/attendance/mark-day`, {
            date,
            attendanceRecords,
          }, {
            headers: {
              "x-user-role": localStorage.getItem(`${STORAGE_PREFIX}user_role`) || "admin",
              "x-user-id": getCurrentUserId() || "",
            },
          });
          return res.data?.records || [];
        } catch (error) {
          console.error("Error marking attendance:", error);
          throw error;
        }
      },
    },
    Payslip: {
      async list() {
        try {
          console.log("📥 Fetching payslips from:", `${API_BASE}/payslips`);
          const userRole = localStorage.getItem(`${STORAGE_PREFIX}user_role`) || "employee";
          const userId = getCurrentUserId() || "";
          console.log("🔐 User role:", userRole, "| UserID:", userId);
          
          const res = await axios.get(`${API_BASE}/payslips`, {
            headers: {
              "x-user-role": userRole,
              "x-user-id": userId,
            },
          });
          console.log("✅ Fetched payslips:", res.data?.length || 0, "records");
          return res.data || [];
        } catch (error) {
          console.error("❌ Error fetching payslips:", error.response?.status, error.response?.data || error.message);
          return []; // Return empty instead of throwing
        }
      },
      async bulkCreate(data) {
        try {
          console.log("📤 Creating", data.length, "payslips...");
          const res = await axios.post(`${API_BASE}/payslips/bulk-create`, data, {
            headers: {
              "x-user-role": localStorage.getItem(`${STORAGE_PREFIX}user_role`) || "admin",
              "x-user-id": getCurrentUserId() || "",
            },
          });
          console.log("✅ Payslips created successfully:", res.data?.payslips?.length || 0);
          return res.data?.payslips || [];
        } catch (error) {
          console.error("❌ Error creating payslips:", error.response?.data || error.message);
          throw error;
        }
      },
      async create(data) {
        try {
          const res = await axios.post(`${API_BASE}/payslips`, data, {
            headers: {
              "x-user-role": localStorage.getItem(`${STORAGE_PREFIX}user_role`) || "admin",
              "x-user-id": getCurrentUserId() || "",
            },
          });
          return res.data;
        } catch (error) {
          console.error("Error creating payslip:", error);
          throw error;
        }
      },
      async update(id, data) {
        try {
          const res = await axios.patch(`${API_BASE}/payslips/${id}`, data, {
            headers: {
              "x-user-role": localStorage.getItem(`${STORAGE_PREFIX}user_role`) || "admin",
              "x-user-id": getCurrentUserId() || "",
            },
          });
          return res.data;
        } catch (error) {
          console.error("Error updating payslip:", error);
          throw error;
        }
      },
      async delete(id, password) {
        try {
          const res = await axios.delete(`${API_BASE}/payslips/${id}`, {
            headers: {
              "x-user-role": localStorage.getItem(`${STORAGE_PREFIX}user_role`) || "admin",
              "x-user-id": getCurrentUserId() || "",
              "x-confirm-password": password || "",
            },
          });
          return { success: true };
        } catch (error) {
          console.error("Error deleting payslip:", error);
          throw error;
        }
      },
    },
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
      const user = res.data;
      // Store user role for API headers
      if (user?.role) {
        localStorage.setItem(`${STORAGE_PREFIX}user_role`, user.role);
      }
      return user;
    },

    async loginWithEmailPassword(email, password) {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      const user = res.data;
      setCurrentUserId(user._id || user.id);
      // Store user role for API headers
      if (user?.role) {
        localStorage.setItem(`${STORAGE_PREFIX}user_role`, user.role);
      }
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
        // Store user role for API headers
        if (user?.role) {
          localStorage.setItem(`${STORAGE_PREFIX}user_role`, user.role);
        }
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
      localStorage.removeItem(`${STORAGE_PREFIX}user_role`);
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

