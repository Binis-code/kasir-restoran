import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export type StaffRole = "admin" | "kasir" | "pelayan" | "dapur" | "manajer";

export interface StaffUser {
  id: string;
  name: string;
  role: StaffRole;
  pin: string;
  avatarColor: string;
  initials: string;
  title: string;
  description: string;
}

export const DEFAULT_STAFF_LIST: StaffUser[] = [
  {
    id: "staff-1",
    name: "Jamie Morgan",
    role: "kasir",
    pin: "1234",
    avatarColor: "bg-counterlime text-ink",
    initials: "JM",
    title: "Kasir & Admin",
    description: "Akses lengkap: POS kasir, produk, laporan, meja, laci kas & sistem",
  },
  {
    id: "staff-2",
    name: "Budi Santoso",
    role: "pelayan",
    pin: "2222",
    avatarColor: "bg-emerald-500 text-white",
    initials: "BS",
    title: "Pelayan 1 (Waitstaff)",
    description: "Input pesanan keliling, status meja, & notifikasi siap saji",
  },
  {
    id: "staff-3",
    name: "Siti Rahma",
    role: "pelayan",
    pin: "2223",
    avatarColor: "bg-teal-500 text-white",
    initials: "SR",
    title: "Pelayan 2 (Waitstaff)",
    description: "Input pesanan keliling, status meja, & notifikasi siap saji",
  },
  {
    id: "staff-4",
    name: "Agus Pratama",
    role: "pelayan",
    pin: "2224",
    avatarColor: "bg-cyan-600 text-white",
    initials: "AP",
    title: "Pelayan 3 (Waitstaff)",
    description: "Input pesanan keliling, status meja, & notifikasi siap saji",
  },
  {
    id: "staff-5",
    name: "Chef Junaedi",
    role: "dapur",
    pin: "3333",
    avatarColor: "bg-amber-500 text-white",
    initials: "CJ",
    title: "Kepala Dapur (KDS)",
    description: "Layar antrean memasak, timer pesanan, & tombol siap saji",
  },
  {
    id: "staff-6",
    name: "Hendra Wijaya",
    role: "manajer",
    pin: "8888",
    avatarColor: "bg-sky-500 text-white",
    initials: "HW",
    title: "Manajer Restoran",
    description: "Analisis laporan keuangan, ringkasan pesanan, laci kas & shift",
  },
];

const STORAGE_STAFF_KEY = "kasa_staff_list_v1";
const STORAGE_CURRENT_STAFF_KEY = "kasa_current_staff_id_v1";

interface AuthContextType {
  currentStaff: StaffUser;
  staffList: StaffUser[];
  isSwitchModalOpen: boolean;
  openSwitchModal: () => void;
  closeSwitchModal: () => void;
  switchStaffByPin: (pin: string, targetStaffId?: string) => { success: boolean; staff?: StaffUser; error?: string };
  switchStaffDirect: (staffId: string) => void;
  hasAccessTo: (path: string) => boolean;
  getAllowedDefaultRoute: (role: StaffRole) => string;
  updateStaff: (staff: StaffUser) => void;
  addStaff: (staff: Omit<StaffUser, "id">) => void;
  deleteStaff: (staffId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialStaffList(): StaffUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_STAFF_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("Failed to load staff list from localStorage", err);
  }
  return DEFAULT_STAFF_LIST;
}

function getInitialCurrentStaff(list: StaffUser[]): StaffUser {
  try {
    const activeId = localStorage.getItem(STORAGE_CURRENT_STAFF_KEY);
    if (activeId) {
      const found = list.find((s) => s.id === activeId);
      if (found) return found;
    }
  } catch (err) {
    console.warn("Failed to load current staff", err);
  }
  return list[0] || DEFAULT_STAFF_LIST[0];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staffList, setStaffList] = useState<StaffUser[]>(getInitialStaffList);
  const [currentStaff, setCurrentStaff] = useState<StaffUser>(() => getInitialCurrentStaff(staffList));
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_STAFF_KEY, JSON.stringify(staffList));
    } catch (err) {
      console.warn("Could not save staff list", err);
    }
  }, [staffList]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CURRENT_STAFF_KEY, currentStaff.id);
    } catch (err) {
      console.warn("Could not save current staff id", err);
    }
  }, [currentStaff]);

  const openSwitchModal = useCallback(() => setIsSwitchModalOpen(true), []);
  const closeSwitchModal = useCallback(() => setIsSwitchModalOpen(false), []);

  const getAllowedDefaultRoute = useCallback((role: StaffRole): string => {
    switch (role) {
      case "pelayan":
        return "/pelayan";
      case "dapur":
        return "/dapur";
      case "manajer":
        return "/laporan";
      case "admin":
      case "kasir":
      default:
        return "/";
    }
  }, []);

  const hasAccessTo = useCallback(
    (path: string): boolean => {
      const role = currentStaff.role;

      // Admin & Kasir have full access
      if (role === "admin" || role === "kasir") return true;

      // Pelayan only accesses /pelayan and public order
      if (role === "pelayan") {
        return path === "/pelayan" || path.startsWith("/order/");
      }

      // Dapur only accesses /dapur and public order
      if (role === "dapur") {
        return path === "/dapur" || path.startsWith("/order/");
      }

      // Manajer accesses reports, orders, cash drawer, settings, tables
      if (role === "manajer") {
        const allowed = ["/laporan", "/pesanan", "/laci-kas", "/pengaturan", "/meja"];
        return allowed.includes(path) || path.startsWith("/order/");
      }

      return false;
    },
    [currentStaff.role],
  );

  const switchStaffByPin = useCallback(
    (pin: string, targetStaffId?: string) => {
      let matched: StaffUser | undefined;

      if (targetStaffId) {
        const candidate = staffList.find((s) => s.id === targetStaffId);
        if (candidate && candidate.pin === pin) {
          matched = candidate;
        }
      } else {
        matched = staffList.find((s) => s.pin === pin);
      }

      if (!matched) {
        return { success: false, error: "PIN salah! Silakan coba lagi." };
      }

      setCurrentStaff(matched);
      setIsSwitchModalOpen(false);

      const targetRoute = getAllowedDefaultRoute(matched.role);
      setLocation(targetRoute);

      toast.success(`Login berhasil: ${matched.name} (${matched.title})`);
      return { success: true, staff: matched };
    },
    [staffList, getAllowedDefaultRoute, setLocation],
  );

  const switchStaffDirect = useCallback(
    (staffId: string) => {
      const found = staffList.find((s) => s.id === staffId);
      if (found) {
        setCurrentStaff(found);
        setIsSwitchModalOpen(false);
        const targetRoute = getAllowedDefaultRoute(found.role);
        setLocation(targetRoute);
        toast.info(`Beralih ke: ${found.name} (${found.title})`);
      }
    },
    [staffList, getAllowedDefaultRoute, setLocation],
  );

  const updateStaff = useCallback((updated: StaffUser) => {
    setStaffList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setCurrentStaff((curr) => (curr.id === updated.id ? updated : curr));
    toast.success(`Data staf ${updated.name} berhasil diperbarui`);
  }, []);

  const addStaff = useCallback((newStaffData: Omit<StaffUser, "id">) => {
    const newStaff: StaffUser = {
      ...newStaffData,
      id: `staff-${Date.now()}`,
    };
    setStaffList((prev) => [...prev, newStaff]);
    toast.success(`Staf baru ${newStaff.name} ditambahkan`);
  }, []);

  const deleteStaff = useCallback((staffId: string) => {
    setStaffList((prev) => {
      if (prev.length <= 1) {
        toast.error("Minimal harus ada 1 akun staf di sistem");
        return prev;
      }
      return prev.filter((s) => s.id !== staffId);
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentStaff,
        staffList,
        isSwitchModalOpen,
        openSwitchModal,
        closeSwitchModal,
        switchStaffByPin,
        switchStaffDirect,
        hasAccessTo,
        getAllowedDefaultRoute,
        updateStaff,
        addStaff,
        deleteStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
