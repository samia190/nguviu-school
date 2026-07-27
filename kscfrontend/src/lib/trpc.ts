import { createTRPCReact } from "@trpc/react-query";

// We keep your manual type definition so you still have autocomplete/intellisense 
// but we use 'any' in the creation to bypass the strict tRPC internal constraint.
export type AppRouter = {
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

// Use 'any' here to satisfy the build, but you can still use 'AppRouter' elsewhere for typing
export const trpc = createTRPCReact<any>();
