
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";

import { Layout } from "@/components/layout";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import UsersList from "@/pages/users-list";
import UserDetail from "@/pages/user-detail";
import LanguagesList from "@/pages/languages-list";
import PromotionsList from "@/pages/promotions-list";
import PromotionForm from "@/pages/promotion-form";
import BannersPage from "@/pages/banners";
import BannerForm from "@/pages/banner-form";
import BannerShowDetail from "@/pages/banner-show-detail";
import CategoriesPage from "@/pages/categories";
import CategoryForm from "@/pages/category-form";
import CategoryShowsPage from "@/pages/category-shows";
import CategoryShowForm from "@/pages/category-show-form";
import CategoryShowDetail from "@/pages/category-show-detail";
import ShowsPage from "@/pages/shows";
import ShowForm from "@/pages/show-form";
import ShowDetail from "@/pages/show-detail";
import PagesPage from "@/pages/pages";
import PageForm from "@/pages/page-form";
import AdsPage from "@/pages/ads";
import AdForm from "@/pages/ad-form";
import Settings from "@/pages/settings";
import Branding from "@/pages/branding";
import IconsPage from "@/pages/icons";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }: { component: any; [key: string]: any }) {
  const [location, setLocation] = useLocation();
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    if (!token) {
      setLocation("/login");
    }
  }, [token, setLocation]);

  if (!token) return null;

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function Router() {
  const token = localStorage.getItem("accessToken");
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (token && location === "/login") {
      setLocation("/");
    }
  }, [token, location, setLocation]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
          <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
          <Route path="/users" component={() => <ProtectedRoute component={UsersList} />} />
          <Route path="/users/:id" component={() => <ProtectedRoute component={UserDetail} />} />
          <Route path="/languages" component={() => <ProtectedRoute component={LanguagesList} />} />
          <Route path="/promotions/new" component={() => <ProtectedRoute component={PromotionForm} />} />
          <Route path="/promotions/:id" component={() => <ProtectedRoute component={PromotionForm} />} />
          <Route path="/promotions" component={() => <ProtectedRoute component={PromotionsList} />} />
          <Route path="/banners/new" component={() => <ProtectedRoute component={BannerForm} />} />
          <Route path="/banners/:id" component={() => <ProtectedRoute component={BannerForm} />} />
          <Route path="/banners/shows/:contentId" component={() => <ProtectedRoute component={BannerShowDetail} />} />
          <Route path="/banners" component={() => <ProtectedRoute component={BannersPage} />} />
          <Route path="/categories/new" component={() => <ProtectedRoute component={CategoryForm} />} />
          <Route path="/categories/:id" component={() => <ProtectedRoute component={CategoryForm} />} />
          <Route path="/categories/:categoryId/shows/new" component={() => <ProtectedRoute component={CategoryShowForm} />} />
          <Route path="/categories/shows/:contentId" component={() => <ProtectedRoute component={CategoryShowDetail} />} />
          <Route path="/categories/:categoryId/shows" component={() => <ProtectedRoute component={CategoryShowsPage} />} />
          <Route path="/categories" component={() => <ProtectedRoute component={CategoriesPage} />} />
          <Route path="/shows/new" component={() => <ProtectedRoute component={ShowForm} />} />
          <Route path="/shows/:id/edit" component={() => <ProtectedRoute component={ShowForm} />} />
          <Route path="/shows/:id" component={() => <ProtectedRoute component={ShowDetail} />} />
          <Route path="/shows" component={() => <ProtectedRoute component={ShowsPage} />} />
          <Route path="/ads/:id" component={() => <ProtectedRoute component={AdForm} />} />
          <Route path="/ads" component={() => <ProtectedRoute component={AdsPage} />} />
          <Route path="/pages/:id" component={() => <ProtectedRoute component={PageForm} />} />
          <Route path="/pages" component={() => <ProtectedRoute component={PagesPage} />} />
          <Route path="/settings/icons" component={() => <ProtectedRoute component={IconsPage} />} />
          <Route path="/settings/branding" component={() => <ProtectedRoute component={Branding} />} />
          <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
          <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const theme = storedTheme === "light" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, []);

  return (
    <LanguageProvider>
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </SettingsProvider>
    </LanguageProvider>
  );
}

export default App;
