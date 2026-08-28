import { Route, Switch } from "wouter";
import { Toaster } from "sonner";
import { PosProvider } from "./components/PosContext";
import { PrintProvider } from "./components/PrintContext";
import { MobileNav, Sidebar } from "./components/Sidebar";
import { PrintLayer } from "./components/PrintLayer";
import Home from "./pages/Home";
import Orders from "./pages/Orders";
import Tables from "./pages/Tables";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <PosProvider>
      <PrintProvider>
        <div className="screen-root flex min-h-screen bg-mineral">
          <Sidebar />
          <main className="min-w-0 flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/pesanan" component={Orders} />
              <Route path="/meja" component={Tables} />
              <Route path="/produk" component={Products} />
              <Route path="/laporan" component={Reports} />
              <Route path="/pengaturan" component={Settings} />
              <Route component={Home} />
            </Switch>
          </main>
          <MobileNav />
        </div>
        <PrintLayer />
        <Toaster position="top-center" richColors closeButton duration={3200} />
      </PrintProvider>
    </PosProvider>
  );
}
