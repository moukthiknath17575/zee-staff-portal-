"use client";

import React, { useState } from "react";
import { useApp, LeaveRequest, ActivityLog } from "@/context/AppContext";
import { 
  Check, 
  X, 
  Activity, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText,
  AlertCircle,
  TrendingUp,
  Search,
  LogOut,
  Bell,
  Calendar,
  Layers
} from "lucide-react";

export function PrincipalDashboard() {
  const { 
    teachers, 
    leaveRequests, 
    activityLogs, 
    notifications,
    approveLeave, 
    rejectLeave,
    dismissNotification,
    logoutSession
  } = useApp();

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDetailsLeave, setSelectedDetailsLeave] = useState<LeaveRequest | null>(null);

  const getTodayDateString = () => {
    return new Date().toISOString().split("T")[0];
  };

  const todayStr = getTodayDateString();

  // Filter logs and leaves based on search query
  const filteredLeaves = leaveRequests.filter(req => {
    if (!searchQuery) return true;
    return (
      req.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.date.includes(searchQuery)
    );
  });

  const filteredLogs = activityLogs.filter(log => {
    if (!searchQuery) return true;
    return log.message.toLowerCase().includes(searchQuery.toLowerCase()) || log.date.includes(searchQuery);
  });

  // Segregate leaves
  const pendingRequests = filteredLeaves.filter(r => r.status === "pending");
  const approvedToday = filteredLeaves.filter(r => r.status === "approved" && r.date === todayStr);
  const rejectedToday = filteredLeaves.filter(r => r.status === "rejected" && r.date === todayStr);
  const teachersOnLeaveToday = teachers.filter(t => 
    leaveRequests.some(l => l.teacherId === t.id && l.date === todayStr && l.status === "approved")
  );

  // Attendance metrics
  const totalTeachers = teachers.length;
  const onLeaveTodayCount = teachersOnLeaveToday.length;
  const presentTodayCount = totalTeachers - onLeaveTodayCount;
  const attendanceRateToday = totalTeachers > 0 ? Math.round((presentTodayCount / totalTeachers) * 100) : 100;

  // Mock historical attendance for weekly/monthly
  const weeklyAttendance = [
    { day: "Mon", rate: 94 },
    { day: "Tue", rate: 98 },
    { day: "Wed", rate: 96 },
    { day: "Thu", rate: 92 },
    { day: "Fri", rate: 98 }
  ];

  // Principal notifications
  const principalNotifications = notifications.filter(n => n.roleId === "principal" && !n.read);

  const handleRejectSubmit = (id: string) => {
    if (!rejectReason.trim()) {
      alert("Please specify a reason for rejecting the leave request.");
      return;
    }
    rejectLeave(id, rejectReason);
    setRejectingId(null);
    setRejectReason("");
  };

  const getLogIcon = (type: ActivityLog["type"]) => {
    switch (type) {
      case "login":
        return <Users className="h-4.5 w-4.5 text-blue-500" />;
      case "logout":
        return <LogOut className="h-4.5 w-4.5 text-slate-400" />;
      case "leave_request":
        return <FileText className="h-4.5 w-4.5 text-amber-500" />;
      case "leave_approved":
        return <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />;
      case "leave_rejected":
        return <XCircle className="h-4.5 w-4.5 text-rose-500" />;
      case "substitute_assigned":
        return <Clock className="h-4.5 w-4.5 text-indigo-500" />;
      case "substitute_accepted":
        return <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />;
      case "substitute_declined":
        return <XCircle className="h-4.5 w-4.5 text-rose-500" />;
      default:
        return <Activity className="h-4.5 w-4.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            PS
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white tracking-tight">Principal Portal</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Poorna Devi Srivastava • School Operations Oversight & Attendance Analytics
            </p>
          </div>
        </div>

        {/* Global Search & Logout */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search leaves & logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 text-xs text-slate-955 dark:text-white w-full md:w-[220px] focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            onClick={logoutSession}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-rose-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>

      {/* Notifications Alert Bar */}
      {principalNotifications.length > 0 && (
        <div className="space-y-2">
          {principalNotifications.map(notif => (
            <div 
              key={notif.id}
              className="p-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900 flex items-center justify-between gap-4 text-xs font-semibold"
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

      {/* Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Today's Attendance rate card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Today's Attendance</span>
            <span className="text-3xl font-black text-slate-950 dark:text-white">{attendanceRateToday}%</span>
            <div className="text-[10px] font-bold text-slate-500">
              {presentTodayCount} of {totalTeachers} Teachers Present Today
            </div>
          </div>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-inner">
            <Users className="h-8 w-8" />
          </div>
        </div>

        {/* Weekly Attendance KPI */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Weekly Attendance Summary</span>
          <div className="flex items-end justify-between h-[45px] px-2 pt-2">
            {weeklyAttendance.map((w, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 w-8">
                <span className="text-[9px] font-bold text-slate-500 font-mono">{w.rate}%</span>
                <div 
                  style={{ height: `${w.rate / 2.5}px` }} 
                  className="w-full bg-blue-600 dark:bg-blue-500 rounded-t-sm shadow-sm"
                />
                <span className="text-[9px] font-bold text-slate-400 uppercase">{w.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Attendance Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Monthly Review (July)</span>
            <span className="text-3xl font-black text-slate-950 dark:text-white">96.5%</span>
            <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Stability target reached
            </div>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Calendar className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Main split view: Left leaves list, Right coverage details & logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Span): Pending leaves & Coverage status */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pending Leave Requests */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Pending Leave Requests ({pendingRequests.length})</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Approved requests will automatically cascade to the coordinator board.</p>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-105 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 font-semibold">Teacher</th>
                    <th className="pb-3 font-semibold">Leave Date & Type</th>
                    <th className="pb-3 font-semibold">Reason</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {pendingRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{req.teacherName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{req.subject} Teacher</div>
                      </td>
                      <td className="py-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-200">{req.date}</div>
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900 mt-1 uppercase">
                          {req.leaveType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 max-w-xs text-slate-600 dark:text-slate-400 italic">
                        "{req.reason}"
                      </td>
                      <td className="py-4 text-right">
                        {rejectingId === req.id ? (
                          <div className="inline-flex flex-col gap-2 text-left bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-[200px]">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rejection Reason *</label>
                            <input
                              type="text"
                              placeholder="e.g. Exam week duty slots"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs text-slate-905 dark:text-white focus:outline-none"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setRejectingId(null)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold rounded text-slate-700 dark:text-slate-350"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectSubmit(req.id)}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-semibold rounded cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              onClick={() => approveLeave(req.id)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-0.5 transition-colors cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingId(req.id)}
                              className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-[11px] flex items-center gap-0.5 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5 text-rose-500" /> Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedDetailsLeave(req)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-850 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-[11px] font-semibold cursor-pointer"
                            >
                              Details
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pendingRequests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-slate-500 italic">
                        No pending leave requests. Staff operations are stable!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Modal Card */}
          {selectedDetailsLeave && (
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 shadow-md space-y-4">
              <div className="flex justify-between items-start pb-2 border-b border-slate-200 dark:border-slate-850">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Leave Request Details</h4>
                <button 
                  onClick={() => setSelectedDetailsLeave(null)}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-400 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <strong className="text-slate-400 font-medium">Teacher Name:</strong>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedDetailsLeave.teacherName}</p>
                </div>
                <div>
                  <strong className="text-slate-400 font-medium">Date requested:</strong>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedDetailsLeave.date}</p>
                </div>
                <div>
                  <strong className="text-slate-400 font-medium">Type:</strong>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5 uppercase">{selectedDetailsLeave.leaveType.replace("_", " ")}</p>
                </div>
                <div>
                  <strong className="text-slate-400 font-medium">Submitted time:</strong>
                  <p className="font-mono mt-0.5">{new Date(selectedDetailsLeave.submittedAt).toLocaleTimeString()}</p>
                </div>
                <div className="col-span-2">
                  <strong className="text-slate-400 font-medium">Absence Reason:</strong>
                  <p className="italic text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 mt-1">
                    "{selectedDetailsLeave.reason}"
                  </p>
                </div>
                {selectedDetailsLeave.notes && (
                  <div className="col-span-2">
                    <strong className="text-slate-400 font-medium">Supporting Notes:</strong>
                    <p className="text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 mt-1">
                      {selectedDetailsLeave.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Today's Leaves lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Today's Approved Leaves */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Today's Approved Leaves ({approvedToday.length})
              </h4>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {approvedToday.map(r => (
                  <div key={r.id} className="p-3 bg-slate-50/60 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-850 text-xs">
                    <div className="font-bold text-slate-900 dark:text-white">{r.teacherName}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{r.leaveType.replace("_", " ")} • {r.subject}</div>
                  </div>
                ))}
                {approvedToday.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-4">No leaves approved for today.</p>
                )}
              </div>
            </div>

            {/* Today's Rejected Leaves */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-205 dark:border-slate-800 p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-rose-500" /> Today's Rejected Leaves ({rejectedToday.length})
              </h4>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {rejectedToday.map(r => (
                  <div key={r.id} className="p-3 bg-slate-50/60 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-850 text-xs">
                    <div className="font-bold text-slate-905 dark:text-white">{r.teacherName}</div>
                    <p className="text-[10px] text-rose-600 dark:text-rose-450 italic mt-0.5">Rejected: "{r.rejectionReason}"</p>
                  </div>
                ))}
                {rejectedToday.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-4">No leaves rejected for today.</p>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Logs, Teachers on leave today roster */}
        <div className="space-y-6">
          
          {/* Teachers on leave today roster */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4.5 w-4.5 text-slate-400" /> Absent Teachers Today ({onLeaveTodayCount})
            </h4>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {teachersOnLeaveToday.map(t => (
                <div key={t.id} className="p-3 bg-rose-50/20 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/30 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{t.name}</span>
                    <span className="text-[10px] text-slate-400">{t.subject} Teacher</span>
                  </div>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">On Leave</span>
                </div>
              ))}
              {teachersOnLeaveToday.length === 0 && (
                <p className="text-xs text-slate-400 italic py-4 text-center">All staff members are present today.</p>
              )}
            </div>
          </div>

          {/* Activity Log timeline */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-slate-50 dark:bg-slate-955 text-slate-500 rounded-xl">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Recent Operations Log</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Records of logins, leaves, and covers.</p>
              </div>
            </div>

            {/* Audit Trail Timeline */}
            <div className="mt-6 relative border-l border-slate-100 dark:border-slate-800 pl-4 space-y-5 max-h-[300px] overflow-y-auto pr-1">
              {filteredLogs.map((log, idx) => (
                <div key={log.id || idx} className="relative text-xs">
                  <span className="absolute -left-[24px] top-0.5 p-0.5 rounded-full border border-white dark:border-slate-900 bg-white dark:bg-slate-900 shadow-sm">
                    {getLogIcon(log.type)}
                  </span>
                  
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-bold block">{log.date} @ {log.timestamp}</span>
                    <p className="text-slate-700 dark:text-slate-350 font-semibold leading-relaxed">
                      {log.message}
                    </p>
                  </div>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 italic">
                  No match found in activity logs.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
