import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ReportPayload = {
  title: string;
  period: string;
  rows: Array<{ label: string; orders: number; items: number; sales: string }>;
  totalSales: string;
  totalOrders: number;
};

type PrintContextValue = {
  mode: "receipt" | "report";
  report: ReportPayload | null;
  printReport: (payload: ReportPayload) => void;
};

const PrintContext = createContext<PrintContextValue | null>(null);

export function PrintProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<"receipt" | "report">("receipt");
  const [report, setReport] = useState<ReportPayload | null>(null);

  const printReport = useCallback((payload: ReportPayload) => {
    setReport(payload);
    setMode("report");
    setTimeout(() => {
      window.print();
      setMode("receipt");
    }, 80);
  }, []);

  const value = useMemo(
    () => ({ mode, report, printReport }),
    [mode, report, printReport],
  );

  return <PrintContext.Provider value={value}>{children}</PrintContext.Provider>;
}

export function usePrint(): PrintContextValue {
  const ctx = useContext(PrintContext);
  if (!ctx) throw new Error("usePrint harus dipakai di dalam PrintProvider");
  return ctx;
}
