import { createTRPCReact } from "@trpc/react-query";

type AppRouter = {
  chat: {
    guestChat: {
      input: {
        message: string;
        conversationHistory: { role: "user" | "assistant"; content: string }[];
      };
      output: { success: boolean; message: string };
    };
    studentRevision: {
      input: {
        message: string;
        curriculum: "8-4-4" | "CBE";
        subject?: string;
        conversationHistory: { role: "user" | "assistant"; content: string }[];
      };
      output: { success: boolean; message: string };
    };
    teacherLessonPlan: {
      input: {
        message: string;
        subject: string;
        gradeLevel: string;
        conversationHistory: { role: "user" | "assistant"; content: string }[];
      };
      output: { success: boolean; message: string };
    };
    teacherTimetable: {
      input: {
        message: string;
        subjects: string[];
        classes: string[];
        availability?: string;
        conversationHistory: { role: "user" | "assistant"; content: string }[];
      };
      output: { success: boolean; message: string };
    };
    loadChatHistory: {
      input: { portalType: "guest" | "student" | "teacher" };
      output: { role: "user" | "assistant"; content: string }[];
    };
  };
};

export const trpc = createTRPCReact<AppRouter>();
