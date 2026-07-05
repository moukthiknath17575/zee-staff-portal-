"use client";

import React, { useState } from "react";
import { useApp, LeaveRequest, DayOfWeek, Teacher, Notification } from "@/context/AppContext";
import { 
  Calendar, 
  Clock, 
  Check, 
  X, 
  BookOpen, 
  AlertCircle, 
  Send, 
  FileText,
  MapPin,
  Search,
  LogOut,
  User,
  Bell
} from "lucide-react";

export function TeacherDashboard() {
  const { 
    sessionTeacherId,
    teachers, 
    timetables, 
    assignments, 
    leaveRequests, 
    notifications,
    applyLeave, 
    cancelLeave,
    acceptAssignment,
    declineAssignment,
    dismissNotification,
    logoutSession
  } = useApp();

  const [leaveDate, setLeaveDate] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveRequest["leaveType"]>("full_day");
  const [leaveReason, setLeaveReason] = useState("");
  const [supportingNotes, setSupportingNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // States for declining
  const [activeDeclineId, setActiveDeclineId] = useState<string | null>(null);
  const [declineCategory, setDeclineCategory] = useState("Paper Correction");
  const [declineOtherDetails, setDeclineOtherDetails] = useState("");

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to determine today's Day of Week
  const getTodayDayOfWeek = (): DayOfWeek => {
    const days: string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[new Date().getDay()];
    if (dayName === "Saturday" || dayName === "Sunday") return "Monday"; // Fallback for weekend testing
    return dayName as DayOfWeek;
  };

  const todayDay = getTodayDayOfWeek();

  // Find active teacher profile
  const teacher = teachers.find(t => t.id === sessionTeacherId);
  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white font-sans">Teacher Session Expired</h3>
        <button 
          onClick={logoutSession}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-all cursor-pointer"
        >
          Return to Login
        </button>
      </div>
    );
  }

  // Filter today's timetable slots
  const todaySlots = timetables[teacher.id]?.[todayDay] || [];

  // Filter pending substitute requests assigned to this teacher
  const pendingRequests = assignments.filter(
    a => a.substituteTeacherId === teacher.id && a.status === "awaiting_response"
  );

  // Filter leaves for this teacher
  const teacherLeaves = leaveRequests.filter(l => l.teacherId === teacher.id);

  // Filter notifications for this teacher
  const teacherNotifications = notifications.filter(
    n => n.roleId === `teacher_${teacher.id}` && !n.read
  );

  // Global Search: searches own timetable (subject/grade/room) & own leave history (reason/date)
  const filteredTodaySlots = todaySlots.filter(s => {
    if (!searchQuery) return true;
    const isFree = s.subject === "Free Period" || s.subject.includes("Free Period");
    if (isFree) return false;
    return (
      s.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.room.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredLeaves = teacherLeaves.filter(l => {
    if (!searchQuery) return true;
    return (
      l.date.includes(searchQuery) ||
      l.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.leaveType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleApplyLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!leaveDate) {
      setFormError("Please select a date.");
      return;
    }
    if (!leaveReason.trim()) {
      setFormError("Please provide a reason for leave.");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate short loader
    setTimeout(() => {
      const res = applyLeave(teacher.id, leaveDate, leaveType, leaveReason, supportingNotes || undefined);
      
      if (!res.success) {
        setFormError(res.error || "Failed to submit leave request.");
        setIsSubmitting(false);
        return;
      }

      setLeaveDate("");
      setLeaveType("full_day");
      setLeaveReason("");
      setSupportingNotes("");
      setFormSuccess("Leave request submitted successfully! Pending Principal Approval.");
      setIsSubmitting(false);
      
      // Auto dismiss success banner
      setTimeout(() => setFormSuccess(""), 5000);
    }, 600);
  };

  const handleDeclineSubmit = (assignmentId: string) => {
    if (declineCategory === "Other" && !declineOtherDetails.trim()) {
      alert("Please provide the specific details for 'Other' reason.");
      return;
    }

    const detailText = declineCategory === "Other" ? declineOtherDetails : "";
    declineAssignment(assignmentId, declineCategory, detailText);

    setActiveDeclineId(null);
    setDeclineCategory("Paper Correction");
    setDeclineOtherDetails("");
  };

  const getLeaveStatusBadge = (status: LeaveRequest["status"]) => {
    switch (status) {
      case "approved":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">Approved</span>;
      case "pending":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900">Pending Principal Approval</span>;
      case "rejected":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900">Rejected</span>;
      case "cancelled":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">Cancelled</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {teacher.name.split(" ")[0][0] + (teacher.name.split(" ")[1]?.[0] || "")}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white tracking-tight">Welcome, {teacher.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {teacher.subject} Teacher • {teacher.department} • <strong className="font-mono">{teacher.employeeId}</strong>
            </p>
          </div>
        </div>

        {/* Search & Actions block */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Global Dashboard Search */}
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search schedule & leaves..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-955 dark:text-white w-full md:w-[220px] focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Logout Button */}
          <button
            onClick={logoutSession}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-rose-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>

      {/* 2. Real-time Notifications Alert Box */}
      {teacherNotifications.length > 0 && (
        <div className="space-y-2">
          {teacherNotifications.map(notif => (
            <div 
              key={notif.id}
              className={`p-4 rounded-xl border flex items-center justify-between gap-4 text-xs font-semibold ${
                notif.type === "success" 
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                  : notif.type === "error"
                    ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900"
                    : "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 shrink-0" />
                <span>{notif.message}</span>
              </div>
              <button 
                onClick={() => dismissNotification(notif.id)}
                className="text-[10px] font-bold hover:underline cursor-pointer hover:text-slate-950 dark:hover:text-white"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 3. New Substitute Assignment Requests Alerts */}
      {pendingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/15 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-800 dark:text-amber-400 mt-0.5">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">New Substitute Requests ({pendingRequests.length})</h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Click Accept to cover the class or select a reason if you need to Decline.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map(asg => (
              <div 
                key={asg.id} 
                className="bg-white dark:bg-slate-900 border border-amber-250 dark:border-amber-900/40 rounded-xl p-4 shadow-sm flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400">
                      Period {asg.period}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{asg.date}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {asg.grade} • {asg.subject}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Teacher replacing: <strong className="font-semibold text-slate-700 dark:text-slate-300">{asg.originalTeacherName}</strong>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 font-medium">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>{asg.room}</span>
                    </p>
                  </div>
                </div>

                {activeDeclineId === asg.id ? (
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Reason for declining (Mandatory):</label>
                      <select 
                        value={declineCategory}
                        onChange={(e) => setDeclineCategory(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="Meeting">Meeting scheduled</option>
                        <option value="Paper Correction">Paper Correction load</option>
                        <option value="Already Busy">Already Busy with another class</option>
                        <option value="Administrative Work">Administrative Work load</option>
                        <option value="Coordinator Duty">Coordinator Duty slots</option>
                        <option value="Personal">Personal reasons</option>
                        <option value="Other">Other (specify below)</option>
                      </select>
                    </div>

                    {declineCategory === "Other" && (
                      <input 
                        type="text" 
                        placeholder="Provide details..."
                        value={declineOtherDetails}
                        onChange={(e) => setDeclineOtherDetails(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
                      />
                    )}

                    <div className="flex gap-2 justify-end">
                      <button 
                        type="button"
                        onClick={() => setActiveDeclineId(null)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeclineSubmit(asg.id)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      type="button"
                      onClick={() => acceptAssignment(asg.id)}
                      className="flex-1 text-xs font-bold py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" /> Accept
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveDeclineId(asg.id)}
                      className="flex-1 text-xs font-bold py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5 text-rose-500" /> Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Dashboard Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Today's Schedule (Only) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Today's Timetable</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Showing scheduled periods for today ({todayDay}).</p>
              </div>
            </div>

            {/* Timetable slots */}
            <div className="mt-6 space-y-3">
              {filteredTodaySlots.map((slot) => {
                const isFree = slot.subject === "Free Period" || slot.subject.includes("Free Period");
                
                return (
                  <div 
                    key={slot.period} 
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
                      isFree 
                        ? "bg-slate-50/40 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/40 opacity-70"
                        : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isFree 
                          ? "bg-slate-100 text-slate-500 dark:bg-slate-850 dark:text-slate-400"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                      }`}>
                        P{slot.period}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-bold ${
                            isFree ? "text-slate-500 dark:text-slate-400" : "text-slate-955 dark:text-white"
                          }`}>
                            {slot.subject}
                          </h4>
                          {!isFree && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-805 dark:bg-slate-800 dark:text-slate-300">
                              {slot.grade}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {slot.time}
                          </span>
                          {!isFree && (
                            <span className="flex items-center gap-1 font-medium">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {slot.room}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 sm:mt-0 text-right">
                      {isFree ? (
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Free Period
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/20 px-2 py-1 rounded-md">
                          Core Class
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredTodaySlots.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 italic">
                  No match found or schedule is empty for today.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Apply Leave & Leave History */}
        <div className="space-y-6">
          
          {/* Apply Leave Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Apply for Leave</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">All details required except supporting notes.</p>
              </div>
            </div>

            <form onSubmit={handleApplyLeaveSubmit} className="mt-6 space-y-4">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900 flex items-center gap-1.5">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">Select Date *</label>
                <input 
                  type="date" 
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">Leave Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: "full_day", label: "Full Day" },
                    { val: "half_day", label: "Half Day" },
                    { val: "late_arrival", label: "Late Arrival" },
                    { val: "early_departure", label: "Early Leave" }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setLeaveType(opt.val as LeaveRequest["leaveType"])}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                        leaveType === opt.val
                          ? "bg-blue-600 border-blue-600 text-white font-bold shadow-md shadow-blue-500/10"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">Reason for Absence *</label>
                <textarea 
                  rows={2} 
                  placeholder="Explain why absence is needed..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">Supporting Notes (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. medical certificates or details"
                  value={supportingNotes}
                  onChange={(e) => setSupportingNotes(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:bg-slate-300"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Submit Request
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Leave History List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-slate-50 dark:bg-slate-950 text-slate-650 rounded-xl">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Leave History</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pending requests cannot be edited once submitted.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {filteredLeaves.map(req => (
                <div 
                  key={req.id} 
                  className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/20 space-y-2 text-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-909 dark:text-white block">{req.date}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5 block">
                        {req.leaveType.replace("_", " ")}
                      </span>
                    </div>
                    {getLeaveStatusBadge(req.status)}
                  </div>

                  <p className="text-slate-650 dark:text-slate-400 italic">"{req.reason}"</p>
                  {req.notes && (
                    <p className="text-[10px] text-slate-450 dark:text-slate-500">
                      <strong>Notes:</strong> {req.notes}
                    </p>
                  )}

                  {req.status === "rejected" && req.rejectionReason && (
                    <div className="p-2 bg-rose-50/50 dark:bg-rose-950/10 rounded text-[10px] text-rose-800 dark:text-rose-400 border border-rose-100/50 dark:border-rose-950/30">
                      <strong>Rejection Reason:</strong> {req.rejectionReason}
                    </div>
                  )}

                  {req.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => cancelLeave(req.id)}
                      className="text-rose-600 hover:text-rose-700 dark:text-rose-455 font-bold hover:underline flex items-center gap-1 cursor-pointer transition-all"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              ))}
              {filteredLeaves.length === 0 && (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 italic">
                  No leave requests found.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
