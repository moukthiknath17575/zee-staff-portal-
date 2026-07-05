"use client";

import React, { useState } from "react";
import { useApp, Teacher, LeaveRequest, DayOfWeek, TimetableSlot, SubstitutionAssignment } from "@/context/AppContext";
import { 
  Users, 
  Check, 
  X, 
  Search, 
  BookOpen, 
  AlertCircle, 
  MapPin, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Sparkles,
  ArrowRight,
  LogOut,
  Bell,
  RefreshCw,
  TrendingDown
} from "lucide-react";

export function CoordinatorDashboard() {
  const { 
    teachers, 
    leaveRequests, 
    assignments, 
    timetables, 
    notifications,
    assignSubstitute,
    dismissNotification,
    logoutSession
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(null);
  
  // Selection state for planning substitution
  const [selectedSlotToPlan, setSelectedSlotToPlan] = useState<{
    leave: LeaveRequest;
    slot: TimetableSlot;
    dayOfWeek: string;
  } | null>(null);

  // Confirmation state before assigning
  const [candidateToConfirm, setCandidateToConfirm] = useState<Teacher | null>(null);

  const getTodayDateString = () => {
    return new Date().toISOString().split("T")[0];
  };

  const todayStr = getTodayDateString();

  const getDayOfWeek = (dateString: string): DayOfWeek => {
    const date = new Date(dateString);
    const days: string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[date.getDay()];
    if (dayName === "Saturday" || dayName === "Sunday") return "Monday";
    return dayName as DayOfWeek;
  };

  const todayDay = getDayOfWeek(todayStr);

  // Toggle teacher schedule accordion
  const toggleTeacherSchedule = (id: string) => {
    setExpandedTeacherId(expandedTeacherId === id ? null : id);
  };

  // Filter lists based on global search query
  const filteredTeachers = teachers.filter(t => {
    if (!searchQuery) return true;
    return (
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredAssignments = assignments.filter(asg => {
    if (!searchQuery) return true;
    return (
      asg.substituteTeacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asg.originalTeacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asg.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asg.date.includes(searchQuery)
    );
  });

  // Segregate leave requests & active coverage
  const approvedLeaves = leaveRequests.filter(l => l.status === "approved");
  const teachersOnLeaveToday = teachers.filter(t => 
    approvedLeaves.some(l => l.teacherId === t.id && l.date === todayStr)
  );

  // Calculate Urgent Tasks (uncovered periods for today or future approved leaves)
  let urgentTasksCount = 0;
  approvedLeaves.forEach(leave => {
    const day = getDayOfWeek(leave.date);
    const slots = timetables[leave.teacherId]?.[day] || [];
    const classes = slots.filter(s => s.subject !== "Free Period" && !s.subject.includes("Free Period"));
    
    classes.forEach(c => {
      const cover = assignments.find(
        a => a.leaveRequestId === leave.id && a.period === c.period
      );
      if (!cover || cover.status === "declined") {
        urgentTasksCount++;
      }
    });
  });

  // Madhavi Ma'am's own timetable slots for today
  const madhaviProfile = teachers.find(t => t.employeeId === "ZHS-TEL-01") || teachers[5]; // Madhavi Ma'am id is t6
  const madhaviSlots = timetables[madhaviProfile.id]?.[todayDay] || [];

  // Coordinator Notifications
  const coordinatorNotifications = notifications.filter(n => n.roleId === "coordinator" && !n.read);

  // Matching Engine
  const calculateWorkloadScore = (teacherId: string) => {
    // Number of coverages currently accepted or awaiting this week
    return assignments.filter(
      a => a.substituteTeacherId === teacherId && (a.status === "accepted" || a.status === "awaiting_response")
    ).length;
  };

  const getRankedCandidates = (date: string, day: string, period: number, originalTeacherId: string, subjectNeeded: string, departmentNeeded: string) => {
    const candidates = teachers.filter(t => {
      if (t.id === originalTeacherId) return false;

      // Not on leave
      const isOnLeave = leaveRequests.some(l => 
        l.teacherId === t.id && 
        l.date === date && 
        (l.status === "approved" || l.status === "pending")
      );
      if (isOnLeave) return false;

      // Must be free at that period
      const slot = timetables[t.id]?.[day]?.find(s => s.period === period);
      const isFree = slot ? (slot.subject === "Free Period" || slot.subject.includes("Free Period")) : true;
      if (!isFree) return false;

      // Not already assigned to another cover
      const isAssigned = assignments.some(a => 
        a.substituteTeacherId === t.id && 
        a.date === date && 
        a.period === period && 
        a.status !== "declined"
      );
      if (isAssigned) return false;

      return true;
    });

    // Score and rank
    return candidates.map(c => {
      const isSubjectMatch = c.subject.toLowerCase() === subjectNeeded.toLowerCase();
      const isDepartmentMatch = c.department.toLowerCase() === departmentNeeded.toLowerCase();
      const load = calculateWorkloadScore(c.id);

      let rankCategory: "Highly Recommended" | "Recommended" | "Alternative" = "Alternative";
      if (isSubjectMatch) {
        rankCategory = "Highly Recommended";
      } else if (isDepartmentMatch) {
        rankCategory = "Recommended";
      }

      return {
        teacher: c,
        rankCategory,
        load
      };
    }).sort((a, b) => {
      // Prioritize Category first, then sort by lower workload to balance burden
      const rankOrder = { "Highly Recommended": 0, "Recommended": 1, "Alternative": 2 };
      if (rankOrder[a.rankCategory] !== rankOrder[b.rankCategory]) {
        return rankOrder[a.rankCategory] - rankOrder[b.rankCategory];
      }
      return a.load - b.load;
    });
  };

  const handleConfirmAssignmentClick = () => {
    if (!selectedSlotToPlan || !candidateToConfirm) return;

    const { leave, slot } = selectedSlotToPlan;
    assignSubstitute(
      leave.id,
      slot.period,
      slot.grade,
      slot.subject,
      slot.room,
      leave.teacherId,
      candidateToConfirm.id
    );

    setCandidateToConfirm(null);
    setSelectedSlotToPlan(null);
  };

  const getStatusBadge = (status: Teacher["status"]) => {
    switch (status) {
      case "present":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">Present</span>;
      case "leave_requested":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900">Leave Requested</span>;
      case "leave_approved":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900">On Leave</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">{status}</span>;
    }
  };

  const getAssignmentBadge = (status: SubstitutionAssignment["status"]) => {
    switch (status) {
      case "accepted":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Accepted</span>;
      case "awaiting_response":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-805 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse">Awaiting Response</span>;
      case "declined":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-105 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">Declined / Reassign</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950 dark:text-white tracking-tight">Good Morning Madhavi Ma'am</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ZHS Operations Coordinator • Roster Scheduling & Substitution Planning Board
          </p>
        </div>

        {/* Global Search & Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search matrix & assignments..."
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

      {/* Notifications banner */}
      {coordinatorNotifications.length > 0 && (
        <div className="space-y-2">
          {coordinatorNotifications.map(notif => (
            <div 
              key={notif.id}
              className="p-4 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900 flex items-center justify-between gap-4 text-xs font-semibold"
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

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Urgent Tasks */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Urgent Cover Tasks</span>
            <span className="text-3xl font-black text-slate-955 dark:text-white flex items-center gap-2">
              {urgentTasksCount}
              {urgentTasksCount > 0 && (
                <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
              )}
            </span>
            <div className="text-[10px] font-bold text-slate-500">
              Uncovered classes requiring substitute assignment
            </div>
          </div>
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl">
            <AlertCircle className="h-8 w-8" />
          </div>
        </div>

        {/* Teachers On Leave Today */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Teachers On Leave Today</span>
            <span className="text-3xl font-black text-slate-955 dark:text-white">{teachersOnLeaveToday.length}</span>
            <div className="text-[10px] text-slate-500">
              Approved absences for today's date ({todayStr})
            </div>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Users className="h-8 w-8" />
          </div>
        </div>

        {/* Today's Timetable (Madhavi Ma'am's schedule) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Your Today's Schedule</span>
            <span className="text-3xl font-black text-slate-955 dark:text-white">
              {madhaviSlots.filter(s => s.subject !== "Free Period" && !s.subject.includes("Free Period")).length} Classes
            </span>
            <div className="text-[10px] text-slate-500">
              For Madhavi Ma'am • Language Department
            </div>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl">
            <BookOpen className="h-8 w-8" />
          </div>
        </div>

      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Span): Substitution Planner & Availability Matrix */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Leave coverage mapping planner */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Coverage Coverage & Planner</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Assign ranked substitutes for periods of teachers on approved leave.</p>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {approvedLeaves.map(leave => {
                const day = getDayOfWeek(leave.date);
                const slots = timetables[leave.teacherId]?.[day] || [];
                const teachingSlots = slots.filter(s => s.subject !== "Free Period" && !s.subject.includes("Free Period"));

                return (
                  <div key={leave.id} className="border border-slate-100 dark:border-slate-800/80 rounded-xl p-5 bg-slate-50/20 dark:bg-slate-900/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">{leave.date} ({day})</span>
                        <h4 className="text-sm font-bold text-slate-950 dark:text-white mt-0.5">
                          {leave.teacherName} <span className="font-normal text-slate-500">({leave.subject})</span>
                        </h4>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900">
                        Absence Approved
                      </span>
                    </div>

                    {/* Classes slots listing */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Absent Teacher Classes ({teachingSlots.length})</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {teachingSlots.map((slot, sIdx) => {
                          const cover = assignments.find(
                            a => a.leaveRequestId === leave.id && a.period === slot.period
                          );

                          return (
                            <div 
                              key={sIdx} 
                              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between gap-3"
                            >
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white">Period {slot.period}</span>
                                  <span className="text-[10px] text-slate-400">{slot.time}</span>
                                </div>
                                <div className="text-xs text-slate-700 dark:text-slate-300">
                                  <strong>{slot.grade}</strong> • {slot.subject} (Room {slot.room})
                                </div>
                              </div>

                              {cover ? (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-500">Substitute: <strong className="font-bold text-slate-700 dark:text-slate-300">{cover.substituteTeacherName}</strong></span>
                                    {getAssignmentBadge(cover.status)}
                                  </div>
                                  {cover.status === "declined" && (
                                    <div className="space-y-2">
                                      <p className="text-[10px] text-rose-600 dark:text-rose-400 italic">
                                        Declined: "{cover.declineCategory}{cover.declineReason ? ` - ${cover.declineReason}` : ""}"
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedSlotToPlan({ leave, slot, dayOfWeek: day });
                                          setCandidateToConfirm(null);
                                        }}
                                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                      >
                                        Reassign Cover
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSlotToPlan({ leave, slot, dayOfWeek: day });
                                    setCandidateToConfirm(null);
                                  }}
                                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                                >
                                  <Plus className="h-3.5 w-3.5" /> Assign Substitute
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              {approvedLeaves.length === 0 && (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 italic">
                  No leaves require scheduling at this time.
                </div>
              )}
            </div>
          </div>

          {/* Roster & Availability matrix accordion */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-blue-50 dark:bg-blue-955 text-blue-600 dark:text-blue-400 rounded-xl">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Teacher Availability Matrix</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Live roster status and detailed weekly timetables.</p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {filteredTeachers.map(t => {
                const isExpanded = expandedTeacherId === t.id;
                return (
                  <div 
                    key={t.id} 
                    className="border border-slate-150 dark:border-slate-800/60 rounded-xl overflow-hidden bg-white dark:bg-slate-900"
                  >
                    {/* Header Row */}
                    <div 
                      onClick={() => toggleTeacherSchedule(t.id)}
                      className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-slate-50 dark:bg-slate-850 rounded-lg flex items-center justify-center font-bold text-slate-700 dark:text-slate-350">
                          {t.name.split(" ")[0][0] + (t.name.split(" ")[1]?.[0] || "")}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</h4>
                          <p className="text-xs text-slate-505 dark:text-slate-400 mt-0.5">
                            {t.subject} • {t.department}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {getStatusBadge(t.status)}
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Schedule Grid */}
                    {isExpanded && (
                      <div className="p-5 bg-slate-50/40 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-850">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Weekly Slots</h5>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => {
                            const slots = timetables[t.id]?.[day] || [];
                            return (
                              <div key={day} className="space-y-1.5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-3 rounded-lg">
                                <span className="block text-[11px] font-bold text-blue-600 dark:text-blue-400 pb-1 border-b border-slate-50 dark:border-slate-800">{day}</span>
                                <div className="space-y-1 pt-1">
                                  {slots.map(s => {
                                    const isFree = s.subject === "Free Period" || s.subject.includes("Free Period");
                                    return (
                                      <div 
                                        key={s.period} 
                                        className={`p-1.5 rounded text-[10px] ${
                                          isFree 
                                            ? "bg-emerald-50/60 text-emerald-800 dark:bg-emerald-950/10 dark:text-emerald-450 font-medium" 
                                            : "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-350"
                                        }`}
                                      >
                                        <span className="font-bold">P{s.period}: </span>
                                        {isFree ? "Free" : `${s.grade}`}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Planner details match box & History log */}
        <div className="space-y-6">
          
          {/* Planner Matcher drawer */}
          {selectedSlotToPlan && !candidateToConfirm && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-indigo-500 p-6 shadow-md space-y-4">
              <div className="flex justify-between items-start pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400 px-2 py-0.5 rounded">
                    Coverage Matcher
                  </span>
                  <h3 className="text-sm font-bold text-slate-950 dark:text-white mt-1.5">Select Cover Teacher</h3>
                </div>
                <button 
                  onClick={() => setSelectedSlotToPlan(null)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Class info info */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1.5 text-xs text-slate-650 dark:text-slate-400">
                <div>
                  <strong>Original Class:</strong> {selectedSlotToPlan.slot.grade} • {selectedSlotToPlan.slot.subject}
                </div>
                <div>
                  <strong>Absent Teacher:</strong> {selectedSlotToPlan.leave.teacherName}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-450 mt-1">
                  <span className="flex items-center gap-0.5"><Clock className="h-3.5 w-3.5" /> Period {selectedSlotToPlan.slot.period}</span>
                  <span className="flex items-center gap-0.5"><MapPin className="h-3.5 w-3.5" /> Room {selectedSlotToPlan.slot.room}</span>
                </div>
              </div>

              {/* Recommendation engine list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ranked Recommendations</h4>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {(() => {
                    const cands = getRankedCandidates(
                      selectedSlotToPlan.leave.date,
                      selectedSlotToPlan.dayOfWeek,
                      selectedSlotToPlan.slot.period,
                      selectedSlotToPlan.leave.teacherId,
                      selectedSlotToPlan.slot.subject,
                      selectedSlotToPlan.leave.subject // assuming department is similar or match subject department
                    );
                    
                    return cands.map(({ teacher: candidate, rankCategory, load }) => (
                      <div 
                        key={candidate.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                          rankCategory === "Highly Recommended"
                            ? "bg-emerald-50/20 border-emerald-350 dark:bg-emerald-950/10 dark:border-emerald-900/60"
                            : rankCategory === "Recommended"
                              ? "bg-blue-50/20 border-blue-300 dark:bg-blue-950/10 dark:border-blue-900/60"
                              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white">{candidate.name}</span>
                            <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${
                              rankCategory === "Highly Recommended"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : rankCategory === "Recommended"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                            }`}>
                              {rankCategory}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-450 dark:text-slate-400">
                            {candidate.subject} • Burden: {load} cover(s) this week
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCandidateToConfirm(candidate)}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-0.5 transition-colors cursor-pointer"
                        >
                          Select
                        </button>
                      </div>
                    ));
                  })()}
                  {getRankedCandidates(
                    selectedSlotToPlan.leave.date,
                    selectedSlotToPlan.dayOfWeek,
                    selectedSlotToPlan.slot.period,
                    selectedSlotToPlan.leave.teacherId,
                    selectedSlotToPlan.slot.subject,
                    selectedSlotToPlan.leave.subject
                  ).length === 0 && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl text-center text-xs text-slate-500 italic flex items-center justify-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-slate-400" /> No available teachers free.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Confirm Assignment panel */}
          {selectedSlotToPlan && candidateToConfirm && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500 p-6 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white">Confirm Assignment</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Please verify substitute coverage details before sending formal request.</p>
              
              <div className="bg-slate-50 dark:bg-slate-955 p-4 rounded-xl space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
                <div>
                  <strong className="text-slate-450 block uppercase text-[9px] tracking-wider font-bold">Covering Teacher</strong>
                  <span className="font-bold text-slate-955 dark:text-white">{candidateToConfirm.name} ({candidateToConfirm.subject})</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <strong className="text-slate-450 block uppercase text-[9px] tracking-wider font-bold">Replacing</strong>
                    <span>{selectedSlotToPlan.leave.teacherName}</span>
                  </div>
                  <div>
                    <strong className="text-slate-450 block uppercase text-[9px] tracking-wider font-bold">Date & Time</strong>
                    <span>{selectedSlotToPlan.leave.date} (P{selectedSlotToPlan.slot.period})</span>
                  </div>
                  <div>
                    <strong className="text-slate-450 block uppercase text-[9px] tracking-wider font-bold">Class / Room</strong>
                    <span>{selectedSlotToPlan.slot.grade} • {selectedSlotToPlan.slot.room}</span>
                  </div>
                  <div>
                    <strong className="text-slate-450 block uppercase text-[9px] tracking-wider font-bold">Subject</strong>
                    <span>{selectedSlotToPlan.slot.subject}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setCandidateToConfirm(null)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-xs font-bold text-slate-750 dark:text-slate-350 cursor-pointer"
                >
                  Back to List
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAssignmentClick}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm shadow-emerald-500/10"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          )}

          {/* Assignments History lists */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-slate-50 dark:bg-slate-955 text-slate-500 rounded-xl">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Substitution History</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Records of coverage assignments sent this week.</p>
              </div>
            </div>

            <div className="mt-6 space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {filteredAssignments.map(asg => (
                <div 
                  key={asg.id} 
                  className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/30 space-y-2.5 text-xs animate-fade-in"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-909 dark:text-white block">{asg.date} • Period {asg.period}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{asg.grade} • {asg.subject}</span>
                    </div>
                    {getAssignmentBadge(asg.status)}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                    <div>
                      Absent Teacher: <span className="font-semibold text-slate-700 dark:text-slate-300">{asg.originalTeacherName}</span>
                    </div>
                    <div>
                      Substitute Assigned: <span className="font-semibold text-slate-700 dark:text-slate-300">{asg.substituteTeacherName}</span>
                    </div>
                  </div>

                  {asg.status === "declined" && asg.declineCategory && (
                    <div className="p-2.5 bg-rose-50/60 dark:bg-rose-950/10 rounded text-[10px] text-rose-800 dark:text-rose-450 border border-rose-100/50 dark:border-rose-950/30">
                      <strong>Decline Reason:</strong> "{asg.declineCategory}"
                      {asg.declineReason && ` - ${asg.declineReason}`}
                    </div>
                  )}
                </div>
              ))}
              {filteredAssignments.length === 0 && (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 italic">
                  No substitution requests sent yet.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
