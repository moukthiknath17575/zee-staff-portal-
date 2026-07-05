"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// --- TYPES ---

export type Role = "principal" | "coordinator" | "teacher";

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  grades: string[];
  employeeId: string;
  department: string;
  email: string;
  phone: string;
  status: "present" | "leave_requested" | "leave_approved" | "late_arrival" | "half_day" | "early_departure";
  attendanceRate: number;
}

export interface TimetableSlot {
  period: number; // 1 to 6
  time: string; // e.g. "08:30 AM - 09:10 AM"
  subject: string;
  grade: string; // e.g. "Grade 7A"
  room: string; // e.g. "Room 203"
}

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

export interface WeeklyTimetable {
  [day: string]: TimetableSlot[];
}

export interface LeaveRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  date: string; // YYYY-MM-DD
  leaveType: "full_day" | "half_day" | "late_arrival" | "early_departure";
  reason: string;
  notes?: string; // Supporting Notes
  status: "pending" | "approved" | "rejected" | "cancelled";
  submittedAt: string; // e.g., "2026-07-04T08:02:00Z"
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface SubstitutionAssignment {
  id: string;
  leaveRequestId: string;
  date: string;
  period: number;
  grade: string;
  subject: string;
  room: string;
  originalTeacherId: string;
  originalTeacherName: string;
  substituteTeacherId: string;
  substituteTeacherName: string;
  status: "awaiting_response" | "accepted" | "declined" | "expired";
  declineCategory?: string; // e.g., "Meeting", "Paper Correction", "Already Busy", etc.
  declineReason?: string; // Custom details if "Other"
  assignedAt: string;
  respondedAt?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string; // e.g. "08:02 AM"
  date: string; // YYYY-MM-DD
  message: string;
  type: "login" | "logout" | "leave_request" | "leave_approved" | "leave_rejected" | "leave_cancelled" | "substitute_assigned" | "substitute_accepted" | "substitute_declined";
}

export interface Notification {
  id: string;
  roleId: string; // "principal" | "coordinator" | "teacher_t1" | "teacher_t2" etc.
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: string;
  read: boolean;
}

interface AppContextType {
  sessionUserRole: Role | null;
  sessionTeacherId: string | null;
  loginSession: (role: Role, teacherId?: string) => void;
  logoutSession: () => void;

  teachers: Teacher[];
  leaveRequests: LeaveRequest[];
  assignments: SubstitutionAssignment[];
  activityLogs: ActivityLog[];
  timetables: { [teacherId: string]: WeeklyTimetable };
  notifications: Notification[];
  
  applyLeave: (teacherId: string, date: string, type: LeaveRequest["leaveType"], reason: string, notes?: string) => { success: boolean; error?: string };
  cancelLeave: (id: string) => void;
  approveLeave: (id: string) => void;
  rejectLeave: (id: string, reason?: string) => void;
  assignSubstitute: (leaveRequestId: string, period: number, grade: string, subject: string, room: string, originalTeacherId: string, substituteTeacherId: string) => void;
  acceptAssignment: (assignmentId: string) => void;
  declineAssignment: (assignmentId: string, category: string, details?: string) => void;
  dismissNotification: (id: string) => void;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- MOCK DATA ---

const DEMO_TEACHERS: Teacher[] = [
  { id: "t1", name: "Sriveni Ma'am", subject: "English", grades: ["6", "7", "8"], employeeId: "ZHS-ENG-06", department: "Humanities", email: "sriveni@zeehighschool.ac.in", phone: "+91 98480 12345", status: "present", attendanceRate: 94 },
  { id: "t2", name: "Vinod Sir", subject: "Mathematics", grades: ["9", "10", "11"], employeeId: "ZHS-MAT-09", department: "Sciences", email: "vinod@zeehighschool.ac.in", phone: "+91 98480 12346", status: "present", attendanceRate: 98 },
  { id: "t3", name: "Bhavya Ma'am", subject: "Social Studies", grades: ["7", "8"], employeeId: "ZHS-SOC-07", department: "Humanities", email: "bhavya@zeehighschool.ac.in", phone: "+91 98480 12347", status: "present", attendanceRate: 92 },
  { id: "t4", name: "Madhuri Ma'am", subject: "Social Studies", grades: ["9", "10"], employeeId: "ZHS-SOC-09", department: "Humanities", email: "madhuri@zeehighschool.ac.in", phone: "+91 98480 12348", status: "present", attendanceRate: 96 },
  { id: "t5", name: "Kavitha Ma'am", subject: "Mathematics", grades: ["9", "10"], employeeId: "ZHS-MAT-10", department: "Sciences", email: "kavitha@zeehighschool.ac.in", phone: "+91 98480 12349", status: "present", attendanceRate: 97 },
  { id: "t6", name: "Madhavi Ma'am", subject: "Telugu", grades: ["7", "8", "9", "10"], employeeId: "ZHS-TEL-01", department: "Languages", email: "madhavi@zeehighschool.ac.in", phone: "+91 98480 12350", status: "present", attendanceRate: 99 }
];

const PERIOD_TIMES = [
  "08:30 AM - 09:20 AM", // Period 1
  "09:20 AM - 10:10 AM", // Period 2
  "10:10 AM - 11:00 AM", // Period 3
  "11:15 AM - 12:05 PM", // Period 4
  "12:05 PM - 12:55 PM", // Period 5
  "01:40 PM - 02:30 PM"  // Period 6
];

const MOCK_TIMETABLES: { [teacherId: string]: WeeklyTimetable } = {
  t1: { // Sriveni Ma'am - English
    Monday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "English", grade: "Grade 6A", room: "Room 101" },
      { period: 2, time: PERIOD_TIMES[1], subject: "English", grade: "Grade 7B", room: "Room 103" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Free Period", grade: "-", room: "-" },
      { period: 4, time: PERIOD_TIMES[3], subject: "English", grade: "Grade 8A", room: "Room 201" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Free Period", grade: "-", room: "-" },
      { period: 6, time: PERIOD_TIMES[5], subject: "English", grade: "Grade 7A", room: "Room 102" }
    ],
    Tuesday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Free Period", grade: "-", room: "-" },
      { period: 2, time: PERIOD_TIMES[1], subject: "English", grade: "Grade 8A", room: "Room 201" },
      { period: 3, time: PERIOD_TIMES[2], subject: "English", grade: "Grade 6A", room: "Room 101" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Free Period", grade: "-", room: "-" },
      { period: 5, time: PERIOD_TIMES[4], subject: "English", grade: "Grade 7A", room: "Room 102" },
      { period: 6, time: PERIOD_TIMES[5], subject: "English", grade: "Grade 7B", room: "Room 103" }
    ],
    Wednesday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "English", grade: "Grade 7A", room: "Room 102" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Free Period", grade: "-", room: "-" },
      { period: 3, time: PERIOD_TIMES[2], subject: "English", grade: "Grade 8A", room: "Room 201" },
      { period: 4, time: PERIOD_TIMES[3], subject: "English", grade: "Grade 7B", room: "Room 103" },
      { period: 5, time: PERIOD_TIMES[4], subject: "English", grade: "Grade 6A", room: "Room 101" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Free Period", grade: "-", room: "-" }
    ],
    Thursday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "English", grade: "Grade 7B", room: "Room 103" },
      { period: 2, time: PERIOD_TIMES[1], subject: "English", grade: "Grade 6A", room: "Room 101" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Free Period", grade: "-", room: "-" },
      { period: 4, time: PERIOD_TIMES[3], subject: "English", grade: "Grade 7A", room: "Room 102" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Free Period", grade: "-", room: "-" },
      { period: 6, time: PERIOD_TIMES[5], subject: "English", grade: "Grade 8A", room: "Room 201" }
    ],
    Friday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Free Period", grade: "-", room: "-" },
      { period: 2, time: PERIOD_TIMES[1], subject: "English", grade: "Grade 7A", room: "Room 102" },
      { period: 3, time: PERIOD_TIMES[2], subject: "English", grade: "Grade 7B", room: "Room 103" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Free Period", grade: "-", room: "-" },
      { period: 5, time: PERIOD_TIMES[4], subject: "English", grade: "Grade 8A", room: "Room 201" },
      { period: 6, time: PERIOD_TIMES[5], subject: "English", grade: "Grade 6A", room: "Room 101" }
    ]
  },
  t2: { // Vinod Sir - Math
    Monday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Mathematics", grade: "Grade 9A", room: "Room 301" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Free Period", grade: "-", room: "-" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Mathematics", grade: "Grade 10B", room: "Room 304" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Mathematics", grade: "Grade 11A", room: "Room 401" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Free Period", grade: "-", room: "-" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Mathematics", grade: "Grade 9B", room: "Room 302" }
    ],
    Tuesday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Mathematics", grade: "Grade 11A", room: "Room 401" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Mathematics", grade: "Grade 9A", room: "Room 301" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Free Period", grade: "-", room: "-" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Mathematics", grade: "Grade 9B", room: "Room 302" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Mathematics", grade: "Grade 10B", room: "Room 304" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Free Period", grade: "-", room: "-" }
    ],
    Wednesday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Free Period", grade: "-", room: "-" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Mathematics", grade: "Grade 10B", room: "Room 304" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Mathematics", grade: "Grade 11A", room: "Room 401" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Free Period", grade: "-", room: "-" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Mathematics", grade: "Grade 9A", room: "Room 301" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Mathematics", grade: "Grade 9B", room: "Room 302" }
    ],
    Thursday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Mathematics", grade: "Grade 9B", room: "Room 302" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Free Period", grade: "-", room: "-" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Mathematics", grade: "Grade 9A", room: "Room 301" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Mathematics", grade: "Grade 10B", room: "Room 304" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Mathematics", grade: "Grade 11A", room: "Room 401" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Free Period", grade: "-", room: "-" }
    ],
    Friday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Free Period", grade: "-", room: "-" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Mathematics", grade: "Grade 11A", room: "Room 401" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Mathematics", grade: "Grade 9B", room: "Room 302" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Mathematics", grade: "Grade 9A", room: "Room 301" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Free Period", grade: "-", room: "-" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Mathematics", grade: "Grade 10B", room: "Room 304" }
    ]
  },
  t3: { // Bhavya Ma'am - Social Studies
    Monday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Free Period", grade: "-", room: "-" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Social Studies", grade: "Grade 7A", room: "Room 102" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Social Studies", grade: "Grade 8A", room: "Room 201" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Free Period", grade: "-", room: "-" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Social Studies", grade: "Grade 8B", room: "Room 202" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Social Studies", grade: "Grade 7B", room: "Room 103" }
    ],
    Tuesday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Social Studies", grade: "Grade 8A", room: "Room 201" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Free Period", grade: "-", room: "-" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Social Studies", grade: "Grade 7A", room: "Room 102" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Social Studies", grade: "Grade 7B", room: "Room 103" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Free Period", grade: "-", room: "-" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Social Studies", grade: "Grade 8B", room: "Room 202" }
    ],
    Wednesday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Social Studies", grade: "Grade 8B", room: "Room 202" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Social Studies", grade: "Grade 7A", room: "Room 102" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Free Period", grade: "-", room: "-" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Social Studies", grade: "Grade 8A", room: "Room 201" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Social Studies", grade: "Grade 7B", room: "Room 103" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Free Period", grade: "-", room: "-" }
    ],
    Thursday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Free Period", grade: "-", room: "-" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Social Studies", grade: "Grade 8B", room: "Room 202" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Social Studies", grade: "Grade 7B", room: "Room 103" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Free Period", grade: "-", room: "-" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Social Studies", grade: "Grade 7A", room: "Room 102" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Social Studies", grade: "Grade 8A", room: "Room 201" }
    ],
    Friday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Social Studies", grade: "Grade 8A", room: "Room 201" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Free Period", grade: "-", room: "-" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Social Studies", grade: "Grade 8B", room: "Room 202" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Social Studies", grade: "Grade 7A", room: "Room 102" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Social Studies", grade: "Grade 7B", room: "Room 103" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Free Period", grade: "-", room: "-" }
    ]
  },
  t4: { // Madhuri Ma'am - Social Studies
    Monday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Social Studies", grade: "Grade 9A", room: "Room 301" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Social Studies", grade: "Grade 10A", room: "Room 303" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Free Period", grade: "-", room: "-" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Social Studies", grade: "Grade 9B", room: "Room 302" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Social Studies", grade: "Grade 10B", room: "Room 304" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Free Period", grade: "-", room: "-" }
    ],
    Tuesday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Free Period", grade: "-", room: "-" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Social Studies", grade: "Grade 9B", room: "Room 302" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Social Studies", grade: "Grade 10B", room: "Room 304" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Free Period", grade: "-", room: "-" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Social Studies", grade: "Grade 9A", room: "Room 301" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Social Studies", grade: "Grade 10A", room: "Room 303" }
    ],
    Wednesday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Social Studies", grade: "Grade 10A", room: "Room 303" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Free Period", grade: "-", room: "-" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Social Studies", grade: "Grade 9A", room: "Room 301" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Social Studies", grade: "Grade 10B", room: "Room 304" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Free Period", grade: "-", room: "-" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Social Studies", grade: "Grade 9B", room: "Room 302" }
    ],
    Thursday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Free Period", grade: "-", room: "-" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Social Studies", grade: "Grade 10B", room: "Room 304" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Social Studies", grade: "Grade 9B", room: "Room 302" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Social Studies", grade: "Grade 9A", room: "Room 301" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Social Studies", grade: "Grade 10A", room: "Room 303" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Free Period", grade: "-", room: "-" }
    ],
    Friday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Social Studies", grade: "Grade 9A", room: "Room 301" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Social Studies", grade: "Grade 10B", room: "Room 304" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Free Period", grade: "-", room: "-" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Social Studies", grade: "Grade 10A", room: "Room 303" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Social Studies", grade: "Grade 9B", room: "Room 302" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Free Period", grade: "-", room: "-" }
    ]
  },
  t5: { // Kavitha Ma'am - Math
    Monday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Free Period", grade: "-", room: "-" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Mathematics", grade: "Grade 9B", room: "Room 302" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Mathematics", grade: "Grade 10A", room: "Room 303" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Free Period", grade: "-", room: "-" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Mathematics", grade: "Grade 9A", room: "Room 301" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Mathematics", grade: "Grade 10B", room: "Room 304" }
    ],
    Tuesday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Mathematics", grade: "Grade 10A", room: "Room 303" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Free Period", grade: "-", room: "-" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Mathematics", grade: "Grade 9A", room: "Room 301" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Mathematics", grade: "Grade 10B", room: "Room 304" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Free Period", grade: "-", room: "-" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Mathematics", grade: "Grade 9B", room: "Room 302" }
    ],
    Wednesday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Mathematics", grade: "Grade 9B", room: "Room 302" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Mathematics", grade: "Grade 10A", room: "Room 303" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Free Period", grade: "-", room: "-" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Mathematics", grade: "Grade 9A", room: "Room 301" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Mathematics", grade: "Grade 10B", room: "Room 304" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Free Period", grade: "-", room: "-" }
    ],
    Thursday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Free Period", grade: "-", room: "-" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Mathematics", grade: "Grade 9A", room: "Room 301" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Mathematics", grade: "Grade 10B", room: "Room 304" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Free Period", grade: "-", room: "-" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Mathematics", grade: "Grade 10A", room: "Room 303" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Mathematics", grade: "Grade 9B", room: "Room 302" }
    ],
    Friday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Mathematics", grade: "Grade 10B", room: "Room 304" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Free Period", grade: "-", room: "-" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Mathematics", grade: "Grade 9A", room: "Room 301" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Mathematics", grade: "Grade 10A", room: "Room 303" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Mathematics", grade: "Grade 9B", room: "Room 302" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Free Period", grade: "-", room: "-" }
    ]
  },
  t6: { // Madhavi Ma'am - Telugu / Coordinator
    Monday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Telugu", grade: "Grade 7A", room: "Room 102" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Telugu", grade: "Grade 8A", room: "Room 201" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Free Period (Coordination)", grade: "-", room: "-" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Telugu", grade: "Grade 9A", room: "Room 301" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Telugu", grade: "Grade 10A", room: "Room 303" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Free Period (Coordination)", grade: "-", room: "-" }
    ],
    Tuesday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Free Period (Coordination)", grade: "-", room: "-" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Telugu", grade: "Grade 9A", room: "Room 301" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Telugu", grade: "Grade 10A", room: "Room 303" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Free Period (Coordination)", grade: "-", room: "-" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Telugu", grade: "Grade 7A", room: "Room 102" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Telugu", grade: "Grade 8A", room: "Room 201" }
    ],
    Wednesday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Telugu", grade: "Grade 8A", room: "Room 201" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Telugu", grade: "Grade 7A", room: "Room 102" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Free Period (Coordination)", grade: "-", room: "-" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Telugu", grade: "Grade 10A", room: "Room 303" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Telugu", grade: "Grade 9A", room: "Room 301" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Free Period (Coordination)", grade: "-", room: "-" }
    ],
    Thursday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Free Period (Coordination)", grade: "-", room: "-" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Telugu", grade: "Grade 10A", room: "Room 303" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Telugu", grade: "Grade 9A", room: "Room 301" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Free Period (Coordination)", grade: "-", room: "-" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Telugu", grade: "Grade 8A", room: "Room 201" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Telugu", grade: "Grade 7A", room: "Room 102" }
    ],
    Friday: [
      { period: 1, time: PERIOD_TIMES[0], subject: "Telugu", grade: "Grade 7A", room: "Room 102" },
      { period: 2, time: PERIOD_TIMES[1], subject: "Telugu", grade: "Grade 8A", room: "Room 201" },
      { period: 3, time: PERIOD_TIMES[2], subject: "Free Period (Coordination)", grade: "-", room: "-" },
      { period: 4, time: PERIOD_TIMES[3], subject: "Telugu", grade: "Grade 9A", room: "Room 301" },
      { period: 5, time: PERIOD_TIMES[4], subject: "Telugu", grade: "Grade 10A", room: "Room 303" },
      { period: 6, time: PERIOD_TIMES[5], subject: "Free Period (Coordination)", grade: "-", room: "-" }
    ]
  }
};

const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "l1",
    teacherId: "t3",
    teacherName: "Bhavya Ma'am",
    subject: "Social Studies",
    date: "2026-07-03",
    leaveType: "full_day",
    reason: "Attending a family function in Hyderabad.",
    status: "approved",
    submittedAt: "2026-07-02T08:15:00Z",
    approvedAt: "2026-07-02T09:00:00Z"
  },
  {
    id: "l2",
    teacherId: "t1",
    teacherName: "Sriveni Ma'am",
    subject: "English",
    date: "2026-07-06",
    leaveType: "full_day",
    reason: "Scheduled routine health checkup at Appolo Hospital.",
    status: "approved",
    submittedAt: "2026-07-04T08:02:00Z",
    approvedAt: "2026-07-04T08:06:00Z"
  },
  {
    id: "l3",
    teacherId: "t2",
    teacherName: "Vinod Sir",
    subject: "Mathematics",
    date: "2026-07-07",
    leaveType: "half_day",
    reason: "Urgent bank work in the afternoon session.",
    status: "pending",
    submittedAt: "2026-07-04T10:30:00Z"
  },
  {
    id: "l4",
    teacherId: "t4",
    teacherName: "Madhuri Ma'am",
    subject: "Social Studies",
    date: "2026-07-06",
    leaveType: "late_arrival",
    reason: "Car servicing appointment, will arrive 2 hours late.",
    status: "pending",
    submittedAt: "2026-07-04T12:00:00Z"
  }
];

const INITIAL_ASSIGNMENTS: SubstitutionAssignment[] = [
  {
    id: "a1",
    leaveRequestId: "l1",
    date: "2026-07-03",
    period: 2,
    grade: "Grade 7A",
    subject: "Social Studies",
    room: "Room 102",
    originalTeacherId: "t3",
    originalTeacherName: "Bhavya Ma'am",
    substituteTeacherId: "t4",
    substituteTeacherName: "Madhuri Ma'am",
    status: "accepted",
    assignedAt: "2026-07-02T10:00:00Z",
    respondedAt: "2026-07-02T10:15:00Z"
  },
  {
    id: "a2",
    leaveRequestId: "l1",
    date: "2026-07-03",
    period: 3,
    grade: "Grade 8A",
    subject: "Social Studies",
    room: "Room 201",
    originalTeacherId: "t3",
    originalTeacherName: "Bhavya Ma'am",
    substituteTeacherId: "t6",
    substituteTeacherName: "Madhavi Ma'am",
    status: "accepted",
    assignedAt: "2026-07-02T10:02:00Z",
    respondedAt: "2026-07-02T10:05:00Z"
  },
  {
    id: "a3",
    leaveRequestId: "l1",
    date: "2026-07-03",
    period: 5,
    grade: "Grade 8B",
    subject: "Social Studies",
    room: "Room 202",
    originalTeacherId: "t3",
    originalTeacherName: "Bhavya Ma'am",
    substituteTeacherId: "t4",
    substituteTeacherName: "Madhuri Ma'am",
    status: "accepted",
    assignedAt: "2026-07-02T10:03:00Z",
    respondedAt: "2026-07-02T10:16:00Z"
  },
  {
    id: "a4",
    leaveRequestId: "l2",
    date: "2026-07-06",
    period: 1,
    grade: "Grade 6A",
    subject: "English",
    room: "Room 101",
    originalTeacherId: "t1",
    originalTeacherName: "Sriveni Ma'am",
    substituteTeacherId: "t3",
    substituteTeacherName: "Bhavya Ma'am",
    status: "awaiting_response",
    assignedAt: "2026-07-04T08:13:00Z"
  },
  {
    id: "a5",
    leaveRequestId: "l2",
    date: "2026-07-06",
    period: 2,
    grade: "Grade 7B",
    subject: "English",
    room: "Room 103",
    originalTeacherId: "t1",
    originalTeacherName: "Sriveni Ma'am",
    substituteTeacherId: "t4",
    substituteTeacherName: "Madhuri Ma'am",
    status: "declined",
    declineCategory: "Paper Correction",
    declineReason: "Paper Correction load is heavy in the morning.",
    assignedAt: "2026-07-04T08:14:00Z",
    respondedAt: "2026-07-04T08:25:00Z"
  }
];

const INITIAL_LOGS: ActivityLog[] = [
  { id: "log1", timestamp: "08:02 AM", date: "2026-07-04", message: "Sriveni Ma'am requested leave for July 6th.", type: "leave_request" },
  { id: "log2", timestamp: "08:06 AM", date: "2026-07-04", message: "Leave approved for Sriveni Ma'am by Principal Poorna Devi Srivastava.", type: "leave_approved" },
  { id: "log3", timestamp: "08:13 AM", date: "2026-07-04", message: "Coordinator assigned Bhavya Ma'am as substitute for Sriveni Ma'am (Grade 6A, Period 1).", type: "substitute_assigned" },
  { id: "log4", timestamp: "08:14 AM", date: "2026-07-04", message: "Coordinator assigned Madhuri Ma'am as substitute for Sriveni Ma'am (Grade 7B, Period 2).", type: "substitute_assigned" },
  { id: "log5", timestamp: "08:25 AM", date: "2026-07-04", message: "Madhuri Ma'am declined substitution assignment for Period 2: Paper Correction load.", type: "substitute_declined" }
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    roleId: "principal",
    message: "New leave request submitted by Sriveni Ma'am.",
    type: "info",
    timestamp: "2026-07-04T08:02:00Z",
    read: true
  },
  {
    id: "n2",
    roleId: "coordinator",
    message: "Principal approved leave for Sriveni Ma'am on 2026-07-06.",
    type: "success",
    timestamp: "2026-07-04T08:06:00Z",
    read: true
  }
];

// --- PROVIDER ---

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sessionUserRole, setSessionUserRole] = useState<Role | null>(null);
  const [sessionTeacherId, setSessionTeacherId] = useState<string | null>(null);

  const [teachers, setTeachers] = useState<Teacher[]>(DEMO_TEACHERS);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [assignments, setAssignments] = useState<SubstitutionAssignment[]>(INITIAL_ASSIGNMENTS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_LOGS);
  const [timetables, setTimetables] = useState<{ [teacherId: string]: WeeklyTimetable }>(MOCK_TIMETABLES);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  // Sync to/from localStorage & validate session expiry (20 hours)
  useEffect(() => {
    // 1. Session check
    const localSession = localStorage.getItem("zhs-user-session");
    if (localSession) {
      try {
        const { role, teacherId, timestamp } = JSON.parse(localSession);
        const timeElapsed = Date.now() - timestamp;
        const twentyHours = 20 * 60 * 60 * 1000;
        
        if (timeElapsed < twentyHours) {
          setSessionUserRole(role);
          setSessionTeacherId(teacherId || null);
        } else {
          localStorage.removeItem("zhs-user-session");
        }
      } catch (e) {
        localStorage.removeItem("zhs-user-session");
      }
    }

    // 2. Data checks
    const localTeachers = localStorage.getItem("zhs-teachers");
    const localLeaves = localStorage.getItem("zhs-leaves");
    const localAssignments = localStorage.getItem("zhs-assignments");
    const localLogs = localStorage.getItem("zhs-logs");
    const localNotifications = localStorage.getItem("zhs-notifications");

    if (localTeachers) setTeachers(JSON.parse(localTeachers));
    if (localLeaves) setLeaveRequests(JSON.parse(localLeaves));
    if (localAssignments) setAssignments(JSON.parse(localAssignments));
    if (localLogs) setActivityLogs(JSON.parse(localLogs));
    if (localNotifications) setNotifications(JSON.parse(localNotifications));
  }, []);

  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const loginSession = (role: Role, teacherId?: string) => {
    setSessionUserRole(role);
    setSessionTeacherId(teacherId || null);
    
    const sessionObj = {
      role,
      teacherId: teacherId || null,
      timestamp: Date.now()
    };
    localStorage.setItem("zhs-user-session", JSON.stringify(sessionObj));

    // Log Activity
    const userName = role === "principal" ? "Principal" : role === "coordinator" ? "Coordinator Madhavi Ma'am" : teachers.find(t => t.id === teacherId)?.name || "Teacher";
    logActivity(`${userName} logged into the portal.`, "login");
  };

  const logoutSession = () => {
    const userName = sessionUserRole === "principal" ? "Principal" : sessionUserRole === "coordinator" ? "Coordinator Madhavi Ma'am" : teachers.find(t => t.id === sessionTeacherId)?.name || "Teacher";
    logActivity(`${userName} logged out of the portal.`, "logout");

    setSessionUserRole(null);
    setSessionTeacherId(null);
    localStorage.removeItem("zhs-user-session");
  };

  const getFormattedTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const getTodayDateString = () => {
    return new Date().toISOString().split("T")[0];
  };

  const logActivity = (message: string, type: ActivityLog["type"]) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: getFormattedTime(),
      date: getTodayDateString(),
      message,
      type
    };

    setActivityLogs(prev => {
      const updated = [newLog, ...prev];
      saveToStorage("zhs-logs", updated);
      return updated;
    });
  };

  const addNotification = (roleId: string, message: string, type: Notification["type"]) => {
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      roleId,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      saveToStorage("zhs-notifications", updated);
      return updated;
    });
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveToStorage("zhs-notifications", updated);
      return updated;
    });
  };

  // 1. Apply Leave
  const applyLeave = (teacherId: string, date: string, type: LeaveRequest["leaveType"], reason: string, notes?: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return { success: false, error: "Teacher not found." };

    const todayStr = getTodayDateString();
    if (date < todayStr) {
      return { success: false, error: "Cannot submit leave requests for past dates." };
    }

    const isDuplicate = leaveRequests.some(
      r => r.teacherId === teacherId && r.date === date && r.status !== "cancelled"
    );
    if (isDuplicate) {
      return { success: false, error: "A leave request already exists for this date." };
    }

    const newRequest: LeaveRequest = {
      id: `l-${Date.now()}`,
      teacherId,
      teacherName: teacher.name,
      subject: teacher.subject,
      date,
      leaveType: type,
      reason,
      notes,
      status: "pending",
      submittedAt: new Date().toISOString()
    };

    // Update teacher status to leave requested
    const updatedTeachers = teachers.map(t => 
      t.id === teacherId ? { ...t, status: "leave_requested" as const } : t
    );

    const updatedLeaves = [newRequest, ...leaveRequests];

    setLeaveRequests(updatedLeaves);
    setTeachers(updatedTeachers);

    saveToStorage("zhs-leaves", updatedLeaves);
    saveToStorage("zhs-teachers", updatedTeachers);

    logActivity(`${teacher.name} requested ${type.replace("_", " ")} leave for ${date}.`, "leave_request");
    
    // Notify Principal
    addNotification("principal", `New Leave Request: ${teacher.name} has requested leave for ${date}.`, "info");

    return { success: true };
  };

  // 2. Cancel Leave
  const cancelLeave = (id: string) => {
    const req = leaveRequests.find(r => r.id === id);
    if (!req) return;

    const updatedLeaves = leaveRequests.map(r => 
      r.id === id ? { ...r, status: "cancelled" as const } : r
    );

    const updatedTeachers = teachers.map(t => 
      t.id === req.teacherId ? { ...t, status: "present" as const } : t
    );

    setLeaveRequests(updatedLeaves);
    setTeachers(updatedTeachers);

    saveToStorage("zhs-leaves", updatedLeaves);
    saveToStorage("zhs-teachers", updatedTeachers);

    logActivity(`${req.teacherName} cancelled leave request for ${req.date}.`, "leave_cancelled");
  };

  // 3. Approve Leave
  const approveLeave = (id: string) => {
    const req = leaveRequests.find(r => r.id === id);
    if (!req) return;

    const updatedLeaves = leaveRequests.map(r => 
      r.id === id ? { ...r, status: "approved" as const, approvedAt: new Date().toISOString() } : r
    );

    const updatedTeachers = teachers.map(t => 
      t.id === req.teacherId ? { ...t, status: "leave_approved" as const } : t
    );

    setLeaveRequests(updatedLeaves);
    setTeachers(updatedTeachers);

    saveToStorage("zhs-leaves", updatedLeaves);
    saveToStorage("zhs-teachers", updatedTeachers);

    logActivity(`Leave approved for ${req.teacherName} on ${req.date} by Principal.`, "leave_approved");
    
    // Notify Coordinator
    addNotification("coordinator", `Leave Approved: ${req.teacherName} is on leave on ${req.date}. Coverage required.`, "warning");

    // Notify Teacher
    addNotification(`teacher_${req.teacherId}`, `Your leave request for ${req.date} has been approved.`, "success");
  };

  // 4. Reject Leave
  const rejectLeave = (id: string, reason?: string) => {
    const req = leaveRequests.find(r => r.id === id);
    if (!req) return;

    const updatedLeaves = leaveRequests.map(r => 
      r.id === id ? { 
        ...r, 
        status: "rejected" as const, 
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason 
      } : r
    );

    const updatedTeachers = teachers.map(t => 
      t.id === req.teacherId ? { ...t, status: "present" as const } : t
    );

    setLeaveRequests(updatedLeaves);
    setTeachers(updatedTeachers);

    saveToStorage("zhs-leaves", updatedLeaves);
    saveToStorage("zhs-teachers", updatedTeachers);

    logActivity(`Leave rejected for ${req.teacherName} on ${req.date} by Principal.${reason ? ` Reason: ${reason}` : ""}`, "leave_rejected");

    // Notify Teacher
    addNotification(`teacher_${req.teacherId}`, `Your leave request for ${req.date} was rejected.${reason ? ` Reason: ${reason}` : ""}`, "error");
  };

  // 5. Assign Substitute
  const assignSubstitute = (
    leaveRequestId: string,
    period: number,
    grade: string,
    subject: string,
    room: string,
    originalTeacherId: string,
    substituteTeacherId: string
  ) => {
    const origTeacher = teachers.find(t => t.id === originalTeacherId);
    const subTeacher = teachers.find(t => t.id === substituteTeacherId);
    if (!origTeacher || !subTeacher) return;

    // Check if duplicate assignment exists, cancel it first or overwrite it
    const activeAssignments = assignments.filter(
      a => !(a.leaveRequestId === leaveRequestId && a.period === period)
    );

    const newAssignment: SubstitutionAssignment = {
      id: `a-${Date.now()}`,
      leaveRequestId,
      date: leaveRequests.find(r => r.id === leaveRequestId)?.date || getTodayDateString(),
      period,
      grade,
      subject,
      room,
      originalTeacherId,
      originalTeacherName: origTeacher.name,
      substituteTeacherId,
      substituteTeacherName: subTeacher.name,
      status: "awaiting_response",
      assignedAt: new Date().toISOString()
    };

    const updatedAssignments = [newAssignment, ...activeAssignments];
    setAssignments(updatedAssignments);
    saveToStorage("zhs-assignments", updatedAssignments);

    logActivity(`Coordinator assigned ${subTeacher.name} as substitute for ${origTeacher.name} (Grade ${grade}, Period ${period}).`, "substitute_assigned");

    // Notify the substitute teacher
    addNotification(`teacher_${substituteTeacherId}`, `New Substitute Request: Cover Period ${period} (${grade} ${subject}) for ${origTeacher.name} on ${newAssignment.date}.`, "info");
  };

  // 6. Accept Assignment
  const acceptAssignment = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const updatedAssignments = assignments.map(a => 
      a.id === assignmentId ? { ...a, status: "accepted" as const, respondedAt: new Date().toISOString() } : a
    );

    setAssignments(updatedAssignments);
    saveToStorage("zhs-assignments", updatedAssignments);

    logActivity(`${assignment.substituteTeacherName} accepted substitute assignment for ${assignment.originalTeacherName} (Period ${assignment.period}).`, "substitute_accepted");

    // Notify Coordinator
    addNotification("coordinator", `${assignment.substituteTeacherName} accepted substitution for ${assignment.originalTeacherName} (Period ${assignment.period}, ${assignment.date}).`, "success");
  };

  // 7. Decline Assignment
  const declineAssignment = (assignmentId: string, category: string, details?: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const fullReason = details ? `${category}: ${details}` : category;

    const updatedAssignments = assignments.map(a => 
      a.id === assignmentId ? { 
        ...a, 
        status: "declined" as const, 
        declineCategory: category,
        declineReason: details || "",
        respondedAt: new Date().toISOString() 
      } : a
    );

    setAssignments(updatedAssignments);
    saveToStorage("zhs-assignments", updatedAssignments);

    logActivity(`${assignment.substituteTeacherName} declined substitute assignment (Period ${assignment.period}). Reason: ${fullReason}.`, "substitute_declined");

    // Notify Coordinator
    addNotification("coordinator", `Substitution Declined: ${assignment.substituteTeacherName} declined Period ${assignment.period} on ${assignment.date}. Reason: ${fullReason}`, "error");
  };

  const resetDemoData = () => {
    setTeachers(DEMO_TEACHERS);
    setLeaveRequests(INITIAL_LEAVE_REQUESTS);
    setAssignments(INITIAL_ASSIGNMENTS);
    setActivityLogs(INITIAL_LOGS);
    setTimetables(MOCK_TIMETABLES);
    setNotifications(INITIAL_NOTIFICATIONS);

    localStorage.removeItem("zhs-teachers");
    localStorage.removeItem("zhs-leaves");
    localStorage.removeItem("zhs-assignments");
    localStorage.removeItem("zhs-logs");
    localStorage.removeItem("zhs-notifications");
    localStorage.removeItem("zhs-user-session");

    setSessionUserRole(null);
    setSessionTeacherId(null);

    logActivity("Demo data reset to default mock values.", "logout");
  };

  return (
    <AppContext.Provider
      value={{
        sessionUserRole,
        sessionTeacherId,
        loginSession,
        logoutSession,
        teachers,
        leaveRequests,
        assignments,
        activityLogs,
        timetables,
        notifications,
        applyLeave,
        cancelLeave,
        approveLeave,
        rejectLeave,
        assignSubstitute,
        acceptAssignment,
        declineAssignment,
        dismissNotification,
        resetDemoData
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
