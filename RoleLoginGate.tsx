"use client";

import React, { useState } from "react";
import { useApp, Role } from "@/context/AppContext";
import { 
  GraduationCap, 
  User, 
  Users, 
  ShieldCheck, 
  ArrowLeft, 
  Lock,
  Eye,
  EyeOff
} from "lucide-react";

export function RoleLoginGate() {
  const { teachers, loginSession } = useApp();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleClick = (role: Role) => {
    setSelectedRole(role);
    setErrorMsg("");
    setPin("");
  };

  const handleTeacherSelect = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setErrorMsg("");
    setPin("");
  };

  const handleBack = () => {
    if (selectedTeacherId) {
      setSelectedTeacherId(null);
    } else {
      setSelectedRole(null);
    }
    setErrorMsg("");
    setPin("");
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsLoading(true);
    setErrorMsg("");

    setTimeout(() => {
      // Allow any 4-digit PIN, but recommend '1234'
      if (pin.length < 4) {
        setErrorMsg("Please enter a valid 4-digit passcode.");
        setIsLoading(false);
        return;
      }

      if (selectedRole === "teacher" && !selectedTeacherId) {
        setErrorMsg("Please select a teacher account.");
        setIsLoading(false);
        return;
      }

      // Successful login
      loginSession(selectedRole, selectedTeacherId || undefined);
      setIsLoading(false);
    }, 800); // 800ms simulated loader
  };

  // Render role selection screen
  if (!selectedRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] max-w-md mx-auto px-4 text-center">
        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-500/20 mb-4 animate-bounce">
          <GraduationCap className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">ZHS Staff Operations Portal</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Select your staff role to authenticate and access your operational dashboard.
        </p>

        {/* Roles List */}
        <div className="mt-8 space-y-4 w-full">
          {[
            {
              id: "principal",
              title: "Principal Portal",
              desc: "Poorna Devi Srivastava • Operational approvals and stats oversight.",
              icon: ShieldCheck,
              color: "border-blue-200 dark:border-blue-900/40 hover:border-blue-500 hover:ring-blue-500/10 hover:bg-blue-50/10"
            },
            {
              id: "coordinator",
              title: "Coordinator Portal",
              desc: "Madhavi Ma'am • Attendance matrix and coverage planner.",
              icon: Users,
              color: "border-indigo-200 dark:border-indigo-900/40 hover:border-indigo-500 hover:ring-indigo-500/10 hover:bg-indigo-50/10"
            },
            {
              id: "teacher",
              title: "Teachers Area",
              desc: "Staff Login • Cover classes, timetables, and leave history.",
              icon: User,
              color: "border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-500 hover:ring-emerald-500/10 hover:bg-emerald-50/10"
            }
          ].map((roleCard) => {
            const Icon = roleCard.icon;
            return (
              <button
                key={roleCard.id}
                onClick={() => handleRoleClick(roleCard.id as Role)}
                className={`w-full text-left p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm transition-all duration-200 flex items-center gap-4 cursor-pointer group hover:scale-[1.01] hover:shadow-md ${roleCard.color}`}
              >
                <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 text-slate-600 dark:text-slate-350">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <span className="block font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {roleCard.title}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {roleCard.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Render teacher account selection
  if (selectedRole === "teacher" && !selectedTeacherId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] max-w-md mx-auto px-4">
        <button 
          onClick={handleBack}
          className="self-start flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Roles
        </button>

        <h3 className="text-xl font-black text-slate-900 dark:text-white">Select Teacher Profile</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
          Choose your teacher account to open the login verification pin screen.
        </p>

        {/* Teacher list */}
        <div className="mt-6 grid grid-cols-1 gap-3 w-full">
          {teachers.map((teacher) => (
            <button
              key={teacher.id}
              onClick={() => handleTeacherSelect(teacher.id)}
              className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-emerald-500 hover:shadow-md cursor-pointer flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-slate-50 dark:bg-slate-850 rounded-lg flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-350">
                  {teacher.name.split(" ")[0][0] + (teacher.name.split(" ")[1]?.[0] || "")}
                </div>
                <div>
                  <span className="block font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {teacher.name}
                  </span>
                  <span className="block text-[10px] text-slate-400">{teacher.subject} • {teacher.department}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 font-mono">{teacher.employeeId}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Render Passcode Form
  const targetName = selectedRole === "principal" 
    ? "Principal Srivastava" 
    : selectedRole === "coordinator" 
      ? "Madhavi Ma'am (Coordinator)" 
      : teachers.find(t => t.id === selectedTeacherId)?.name || "Teacher";

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] max-w-sm mx-auto px-4">
      <button 
        onClick={handleBack}
        className="self-start flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-md text-center space-y-6">
        <div>
          <div className="mx-auto h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Authentication Required</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Logging in as: <strong className="font-semibold text-slate-800 dark:text-slate-200">{targetName}</strong>
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900">
              {errorMsg}
            </div>
          )}

          <div className="relative">
            <input
              type={showPin ? "text" : "password"}
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/[^0-9]/g, "");
                setPin(numericOnly);
              }}
              disabled={isLoading}
              className="w-full text-center text-2xl tracking-[0.6em] p-3 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-650"
            >
              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="text-[10px] text-slate-400 italic">
            Demo Mode: Enter any 4-digit PIN (e.g. 1234) and submit.
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 dark:disabled:bg-slate-800"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                {/* Micro-loading spinner */}
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              "Confirm & Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
