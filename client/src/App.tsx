import { Route, Switch } from "wouter";
import { Toaster } from "sonner";
import { PosProvider } from "./components/PosContext";
import { PrintProvider } from "./components/PrintContext";
import { AuthProvider } from "./components/AuthContext";
import { MobileNav, Sidebar } from "./components/Sidebar";
import { PrintLayer } from "./components/PrintLayer";
import { QuickSwitchRoleModal } from "./components/QuickSwitchRoleModal";
import { RouteGuard } from "./components/RouteGuard";
import Home from "./pages/Home";
import Orders from "./pages/Orders";
import Tables from "./pages/Tables";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Kitchen from "./pages/Kitchen";
import CustomerSelfOrder from "./pages/CustomerSelfOrder";
import WaiterOrder from "./pages/WaiterOrder";
import CashDrawer from "./pages/CashDrawer";

export default function App() {
  return (
    <AuthProvider>
      <PosProvider>
        <PrintProvider>
          <Switch>
            {/* 1. Standalone Customer Self-Order QR */}
            <Route path="/order" component={CustomerSelfOrder} />
            <Route path="/order/:tableId" component={CustomerSelfOrder} />

            {/* 2. Standalone Fullscreen Focus Mode for Waiter */}
            <Route path="/pelayan" component={WaiterOrder} />

            {/* 3. Standalone Fullscreen Focus Mode for Kitchen KDS */}
            <Route path="/dapur" component={Kitchen} />

            {/* 4. Standard Dashboard with Dynamic Role-Filtered Sidebar */}
            <Route>
              <div className="screen-root flex min-h-screen bg-mineral">
                <Sidebar />
                <main className="min-w-0 flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
                  <Switch>
                    <Route path="/">
                      <RouteGuard path="/" moduleName="POS Kasir Utama">
                        <Home />
                      </RouteGuard>
                    </Route>
                    <Route path="/laci-kas">
                      <RouteGuard path="/laci-kas" moduleName="Laci Kas & Rekonsiliasi">
                        <CashDrawer />
                      </RouteGuard>
                    </Route>
                    <Route path="/pesanan">
                      <RouteGuard path="/pesanan" moduleName="Daftar Pesanan">
                        <Orders />
                      </RouteGuard>
                    </Route>
                    <Route path="/meja">
                      <RouteGuard path="/meja" moduleName="Manajemen Meja">
                        <Tables />
                      </RouteGuard>
                    </Route>
                    <Route path="/produk">
                      <RouteGuard path="/produk" moduleName="Katalog & Produk">
                        <Products />
                      </RouteGuard>
                    </Route>
                    <Route path="/laporan">
                      <RouteGuard path="/laporan" moduleName="Laporan Penjualan">
                        <Reports />
                      </RouteGuard>
                    </Route>
                    <Route path="/pengaturan">
                      <RouteGuard path="/pengaturan" moduleName="Pengaturan Sistem">
                        <Settings />
                      </RouteGuard>
                    </Route>
                    <Route>
                      <RouteGuard path="/" moduleName="POS Kasir Utama">
                        <Home />
                      </RouteGuard>
                    </Route>
                  </Switch>
                </main>
                <MobileNav />
              </div>
            </Route>
          </Switch>

          <QuickSwitchRoleModal />
          <PrintLayer />
          <Toaster position="top-center" richColors closeButton duration={3200} />
        </PrintProvider>
      </PosProvider>
    </AuthProvider>
  );
}
