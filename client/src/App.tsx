import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import CreatePurchaseOrder from "./pages/CreatePurchaseOrder";
import EditPurchaseOrder from "./pages/EditPurchaseOrder";
import ViewPurchaseOrder from "./pages/ViewPurchaseOrder";
import SupplierList from "./pages/SupplierList";
import CreateSupplier from "./pages/CreateSupplier";
import EditSupplier from "./pages/EditSupplier";
import SupplierDetails from "./pages/SupplierDetails";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      )} />
      <Route path="/purchase-orders/new" component={() => (
        <DashboardLayout>
          <CreatePurchaseOrder />
        </DashboardLayout>
      )} />
      <Route path="/purchase-orders/:id/edit" component={() => (
        <DashboardLayout>
          <EditPurchaseOrder />
        </DashboardLayout>
      )} />
      <Route path="/purchase-orders/:id" component={() => (
        <DashboardLayout>
          <ViewPurchaseOrder />
        </DashboardLayout>
      )} />
      <Route path="/suppliers" component={() => (
        <DashboardLayout>
          <SupplierList />
        </DashboardLayout>
      )} />
      <Route path="/suppliers/new" component={() => (
        <DashboardLayout>
          <CreateSupplier />
        </DashboardLayout>
      )} />
      <Route path="/suppliers/:id/edit" component={() => (
        <DashboardLayout>
          <EditSupplier />
        </DashboardLayout>
      )} />
      <Route path="/suppliers/:id" component={() => (
        <DashboardLayout>
          <SupplierDetails />
        </DashboardLayout>
      )} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
