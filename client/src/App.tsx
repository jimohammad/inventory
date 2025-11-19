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
import ItemList from "@/pages/ItemList";
import CreateItem from "@/pages/CreateItem";
import EditItem from "@/pages/EditItem";
import StockImport from "@/pages/StockImport";
import BulkOpeningStock from "@/pages/BulkOpeningStock";
import BulkItemImport from "@/pages/BulkItemImport";
import InventoryAnalysis from "@/pages/InventoryAnalysis";
import GoogleSheetsConfig from "@/pages/GoogleSheetsConfig";
import PublicCatalog from "@/pages/PublicCatalog";
import WhatsAppContacts from "@/pages/WhatsAppContacts";
import BulkPriceUpdate from "@/pages/BulkPriceUpdate";

function Router() {
  return (
    <Switch>
      {/* Public catalog routes - no auth required */}
      <Route path="/catalog/:userId/:type" component={PublicCatalog} />
      
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
      <Route path="/items" component={() => (
        <DashboardLayout>
          <ItemList />
        </DashboardLayout>
      )} />
      <Route path="/items/new" component={() => (
        <DashboardLayout>
          <CreateItem />
        </DashboardLayout>
      )} />
      <Route path="/items/:id/edit" component={() => (
        <DashboardLayout>
          <EditItem />
        </DashboardLayout>
      )} />
      <Route path="/items/import" component={() => (
        <DashboardLayout>
          <StockImport />
        </DashboardLayout>
      )} />
      <Route path="/items/bulk-opening-stock" component={() => (
        <DashboardLayout>
          <BulkOpeningStock />
        </DashboardLayout>
      )} />
      <Route path="/items/bulk-import" component={() => (
        <DashboardLayout>
          <BulkItemImport />
        </DashboardLayout>
      )} />
      <Route path="/items/bulk-price-update" component={() => (
        <DashboardLayout>
          <BulkPriceUpdate />
        </DashboardLayout>
      )} />
      <Route path="/inventory-analysis" component={() => (
        <DashboardLayout>
          <InventoryAnalysis />
        </DashboardLayout>
      )} />
      <Route path="/google-sheets" component={() => (
        <DashboardLayout>
          <GoogleSheetsConfig />
        </DashboardLayout>
      )} />
      <Route path="/whatsapp-contacts" component={() => (
        <DashboardLayout>
          <WhatsAppContacts />
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
