import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./components/PageTransition";

import ItemList from "@/pages/ItemList";
import CreateItem from "@/pages/CreateItem";
import EditItem from "@/pages/EditItem";
import StockImport from "@/pages/StockImport";
import BulkOpeningStock from "@/pages/BulkOpeningStock";
import BulkItemImport from "@/pages/BulkItemImport";
import GoogleSheetsConfig from "@/pages/GoogleSheetsConfig";
import PublicCatalog from "@/pages/PublicCatalog";

import BulkPriceUpdate from "@/pages/BulkPriceUpdate";
import ReorderAlerts from "@/pages/ReorderAlerts";
import StockHistory from "@/pages/StockHistory";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Customers from "@/pages/Customers";
import BulkMessaging from "@/pages/BulkMessaging";
import CustomerImport from "@/pages/CustomerImport";


function Router() {
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Switch location={location} key={location}>
      {/* Public routes - no auth required */}
      <Route path="/catalog/:userId/:type" component={PublicCatalog} />
      <Route path="/order/:orderNumber" component={OrderDetail} />
      

      
      {/* Orders route */}
      <Route path="/orders" component={() => (
        <DashboardLayout>
          <PageTransition>
            <Orders />
          </PageTransition>
        </DashboardLayout>
      )} />
      
      <Route path="/" component={() => (
        <DashboardLayout>
          <ItemList />
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
      <Route path="/reorder-alerts" component={() => (
        <DashboardLayout>
          <PageTransition>
            <ReorderAlerts />
          </PageTransition>
        </DashboardLayout>
      )} />
      <Route path="/stock-history" component={() => (
        <DashboardLayout>
          <PageTransition>
            <StockHistory />
          </PageTransition>
        </DashboardLayout>
      )} />
      <Route path="/google-sheets" component={() => (
        <DashboardLayout>
          <GoogleSheetsConfig />
        </DashboardLayout>
      )} />

      <Route path="/customers" component={() => (
        <DashboardLayout>
          <PageTransition>
            <Customers />
          </PageTransition>
        </DashboardLayout>
      )} />
      <Route path="/bulk-messaging" component={() => (
        <DashboardLayout>
          <PageTransition>
            <BulkMessaging />
          </PageTransition>
        </DashboardLayout>
      )} />
      <Route path="/customers/import" component={() => (
        <DashboardLayout>
          <PageTransition>
            <CustomerImport />
          </PageTransition>
        </DashboardLayout>
      )} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </AnimatePresence>
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
