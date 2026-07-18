import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "@/components/Layout";
import AddFunds from "@/pages/AddFunds";
import WalletInfo from "@/pages/WalletInfo";
import UploadEnergy from "@/pages/UploadEnergy";
import BuyEnergy from "@/pages/BuyEnergy";
import DonateEnergy from "@/pages/DonateEnergy";
import Login from "@/pages/auth/Login";
import { AuthProvider } from "@/context/AuthContext";
import { AnimatePresence } from "framer-motion";
import { SiteConfigProvider } from "@/context/SiteConfigContext";
import { WalletProvider } from "@/context/WalletContext";
import { ListingsProvider } from "@/context/ListingsContext";
import { DonationsProvider } from "@/context/DonationsContext";
import Forecast from "@/pages/Forecast";
// Settings removed per latest requirements
import Profile from "@/pages/Profile";
import Help from "@/pages/Help";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import WalletSuccess from "@/pages/WalletSuccess";

const queryClient = new QueryClient();

function RoutesWithTransitions() {
  const location = useLocation();
  return (
    <Layout>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Index />} />
          <Route path="/add-funds" element={<AddFunds />} />
          <Route path="/wallet" element={<WalletInfo />} />
          <Route path="/wallet/success" element={<WalletSuccess />} />
          <Route path="/upload" element={<UploadEnergy />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/buy" element={<BuyEnergy />} />
          <Route path="/donate" element={<DonateEnergy />} />
          <Route path="/profile" element={<Profile />} />
          {/* Settings route removed */}
          <Route path="/help" element={<Help />} />
          <Route path="/auth" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <SiteConfigProvider>
          <WalletProvider>
            <ListingsProvider>
              <DonationsProvider>
                <BrowserRouter>
                  <RoutesWithTransitions />
                </BrowserRouter>
              </DonationsProvider>
            </ListingsProvider>
          </WalletProvider>
        </SiteConfigProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
