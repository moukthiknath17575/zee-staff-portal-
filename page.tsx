"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { RoleLoginGate } from "./components/RoleLoginGate";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { CoordinatorDashboard } from "./components/CoordinatorDashboard";
import { PrincipalDashboard } from "./components/PrincipalDashboard";
import { 
  GraduationCap, 
  RotateCcw, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Users, 
  User
} from "lucide-react";

export default function Home() {
  const { 
    sessionUserRole, 
    sessionTeacherId,
    teachers,
    resetDemoData 
  } = useApp();

  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleResetData = () => {
    if (confirm("Are you sure you want to reset all demo data and sessions? This will log you out and restore initial mock settings.")) {
      resetDemoData();
      alert("Demo data has been reset to defaults!");
    }
  };

  const getHeaderIcon = () => {
    switch (sessionUserRole) {
      case "principal":
        return <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case "coordinator":
        return <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
      case "teacher":
        return <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getUserName = () => {
    if (sessionUserRole === "principal") return "Principal Srivastava";
    if (sessionUserRole === "coordinator") return "Madhavi Ma'am (Coordinator)";
    if (sessionUserRole === "teacher") {
      return teachers.find(t => t.id === sessionTeacherId)?.name || "Teacher Profile";
    }
    return "Staff Member";
  };

  // 1. If not authenticated, render Role Gate
  if (!sessionUserRole) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase text-blue-600 tracking-wider">Zee High School</span>
                <h1 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight -mt-0.5">Staff Operations Portal</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetData}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer transition-colors"
                title="Reset Portal Data"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-350 cursor-pointer transition-colors"
                title="Toggle Theme"
              >
                {resolvedTheme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <RoleLoginGate />
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/60 py-6 text-center text-xs text-slate-400 dark:text-slate-500 transition-colors">
          <p>© 2026 Zee High School. Internal Operations & Substitution Planning System.</p>
        </footer>
      </div>
    );
  }

  // 2. Render Dashboards if session exists
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Branding with current role indicator */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase text-blue-600 tracking-wider">Zee High School</span>
                <h1 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight -mt-0.5">Staff Portal</h1>
              </div>
            </div>

            {/* Current Active User Profile Card */}
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs">
              {getHeaderIcon()}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {getUserName()}
              </span>
            </div>

            {/* General Settings Controls */}
            <div className="flex items-center gap-3">
              {/* Reset Data */}
              <button
                type="button"
                onClick={handleResetData}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors"
                title="Reset Portal Data"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors"
                title="Toggle Theme"
              >
                {resolvedTheme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="fade-in">
          {sessionUserRole === "teacher" && <TeacherDashboard />}
          {sessionUserRole === "coordinator" && <CoordinatorDashboard />}
          {sessionUserRole === "principal" && <PrincipalDashboard />}
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/60 py-6 text-center text-xs text-slate-400 dark:text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Zee High School. Internal Operations & Substitution Planning System.</p>
          <div className="flex justify-center gap-4 mt-2">
            <span>Security Audited</span>
            <span>•</span>
            <span>Version 1.1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
