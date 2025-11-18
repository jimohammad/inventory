import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import PurchaseOrderList from "./pages/PurchaseOrderList";
import CreatePurchaseOrder from "./pages/CreatePurchaseOrder";
import EditPurchaseOrder from "./pages/EditPurchaseOrder";
import ViewPurchaseOrder from "./pages/ViewPurchaseOrder";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <DashboardLayout>
          <PurchaseOrderList />
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
