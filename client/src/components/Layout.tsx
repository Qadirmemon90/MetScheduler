import React from "react";
import Sidebar from "./Sidebar";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { MenuIcon, MoonIcon, SunIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const pageTitles: Record<string, string> = {
  "/dashboard" : "Dashboard",
  "/accounts" : "Social Accounts",
  "/schedule" : "Post Scheduler",
  "/ai-composer" : "AI Composer",
  "/settings" : "Profile Settings",
  "/admin" : "Admin Dashboard",
}

const Layout = () => {

    const {isAuthenticated , isLoading}= useAuth();
    const {isDark, toggleTheme} = useTheme();

    const location = useLocation();

    const title = pageTitles[location.pathname] || "SocialAI";
    
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    if(isLoading){
      return(
        <div className="flex h-screen items-center justify-center bg-slate-50">
           <div className="size-8 border-4 border-red-500 border-t-transparent 
           rounded-full animate-spin"/> 
        </div>
      )
    }

    if(!isAuthenticated){
      return <Navigate to="/login" replace/>
    }

  return (
    <div className="flex h-screen bg-slate-50"> 

       {/* Mobile Overlay */}

       {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
       onClick={()=> setIsMobileMenuOpen(false)}></div>}

      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4
        md:px-8 gap-4">
          
          <button className="md:hidden p-2 -ml-2 text-slate-500" 
          onClick={() => setIsMobileMenuOpen(true)}>
            <MenuIcon className="size-6"/>
          </button>

          <div>
            <h1 className="text-slate-900">{title}</h1>
            <p className="text-sm text-slate-400 hidden sm:block">Manage and automate your social presence</p>
          </div>

          <button
            onClick={toggleTheme}
            className="ml-auto inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
          </button>

        </header>

        <main className="flex-1 overflow-auto p-5 sm:p-6 md:p-8 xl:p-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
