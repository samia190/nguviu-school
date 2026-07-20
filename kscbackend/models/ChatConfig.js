import mongoose from "mongoose";

/* ─── Sub‑schemas ─────────────────────────────────────────────── */

const actionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["link", "whatsapp", "contact-admin"], required: true },
    label: { type: String, default: "" },
    route: { type: String, default: "" },        // for type:"link"
    url: { type: String, default: "" },           // for external links
    prefillMessage: { type: String, default: "" }, // for whatsapp
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },          // e.g. "admissions"
    icon: { type: String, default: "📌" },
    label: { type: String, required: true },       // display text
    keywords: [{ type: String }],                  // matching keywords
    reply: { type: String, default: "" },          // static answer (optional)
    dataSource: { type: String, default: "" },     // e.g. "admissions-page" → fetch from that singleton
    dataField: { type: String, default: "" },      // e.g. "overview"
    actions: [actionSchema],                       // buttons shown after answer
    children: [
      {
        id: { type: String, required: true },
        icon: { type: String, default: "" },
        label: { type: String, required: true },
        keywords: [{ type: String }],
        reply: { type: String, default: "" },
        dataSource: { type: String, default: "" },
        dataField: { type: String, default: "" },
        actions: [actionSchema],
      },
    ],
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

/* ─── Main schema ─────────────────────────────────────────────── */

const chatConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "chat-config-singleton" },

    // Greeting & branding
    botName: { type: String, default: "Kangaru Assistant" },
    greeting: { type: String, default: "Hi! 👋 Welcome to Kangaru Girls School.\nHow can I help you today?" },
    noMatchReply: { type: String, default: "I'm sorry, I didn't quite understand that. You can pick a topic below or talk to an admin." },
    thankYouReply: { type: String, default: "You're welcome! Is there anything else I can help with?" },

    // Office hours
    officeHours: {
      enabled: { type: Boolean, default: true },
      start: { type: String, default: "08:00" },   // 24h format
      end: { type: String, default: "17:00" },
      days: { type: [Number], default: [1, 2, 3, 4, 5] }, // 0=Sun … 6=Sat
      timezone: { type: String, default: "Africa/Nairobi" },
    },
    closedMessage: {
      type: String,
      default: "Our office is currently closed (Mon–Fri, 8 AM – 5 PM). Please leave your name and number, and we'll get back to you.",
    },

    // WhatsApp escalation  (falls back to contact page whatsapp if empty)
    whatsappNumber: { type: String, default: "" },

    // Knowledge tree
    categories: { type: [categorySchema], default: [] },

    // Quick replies shown alongside categories
    quickReplies: {
      type: [{ label: String, value: String }],
      default: [
        { label: "What are the school hours?", value: "school-hours" },
        { label: "How do I apply?", value: "admissions" },
        { label: "Fee structure", value: "fees" },
      ],
    },

    // Feature toggles
    enabled: { type: Boolean, default: true },
    showOnMobile: { type: Boolean, default: true },
    position: { type: String, enum: ["bottom-right", "bottom-left"], default: "bottom-right" },
    primaryColor: { type: String, default: "#1e40af" },
  },
  { timestamps: true }
);

const ChatConfig = mongoose.model("ChatConfig", chatConfigSchema);

/* ─── Defaults ────────────────────────────────────────────────── */

const defaultCategories = [
  {
    id: "admissions",
    icon: "📝",
    label: "Admissions",
    keywords: ["admission", "admissions", "apply", "join", "enroll", "enrolment", "form one", "grade 10", "application", "transfer", "new student", "registration"],
    reply: "",
    dataSource: "admissions-page",
    dataField: "overview",
    actions: [
      { type: "link", label: "📝 Apply Online", route: "admissions" },
    ],
    children: [
      { id: "admissions.requirements", label: "Requirements", icon: "📋", keywords: ["requirements", "need", "documents", "qualification"], dataSource: "admissions-page", dataField: "requirements", actions: [] },
      { id: "admissions.dates", label: "Important Dates", icon: "📅", keywords: ["date", "deadline", "when", "closing"], dataSource: "admissions-page", dataField: "importantDates", actions: [] },
      { id: "admissions.process", label: "Application Process", icon: "📄", keywords: ["process", "steps", "how to", "procedure"], dataSource: "admissions-page", dataField: "process", actions: [] },
      { id: "admissions.apply", label: "Apply Online", icon: "📝", keywords: ["apply", "form", "online"], reply: "You can apply online through our admissions portal.", actions: [{ type: "link", label: "📝 Go to Application Form", route: "admissions" }] },
    ],
    sortOrder: 1,
  },
  {
    id: "fees",
    icon: "💰",
    label: "Fee Structure",
    keywords: ["fee", "fees", "pay", "payment", "cost", "money", "mpesa", "bank", "school fees", "tuition", "charges", "amount"],
    reply: "For detailed fee information, please visit the Fee Structure page or contact the school office.",
    dataSource: "",
    dataField: "",
    actions: [
      { type: "link", label: "💰 View Fee Structure", route: "fees" },
      { type: "whatsapp", label: "📱 Ask via WhatsApp", prefillMessage: "Hi, I'd like to inquire about the school fee structure." },
    ],
    children: [],
    sortOrder: 2,
  },
  {
    id: "contact",
    icon: "📞",
    label: "Contact Us",
    keywords: ["contact", "phone", "call", "email", "address", "location", "where", "direction", "map", "reach", "office"],
    reply: "",
    dataSource: "",
    dataField: "",
    actions: [
      { type: "link", label: "📞 Contact Page", route: "contact" },
      { type: "whatsapp", label: "📱 WhatsApp Us", prefillMessage: "Hi, I'm reaching out from the school website." },
    ],
    children: [
      { id: "contact.address", label: "School Address", icon: "📍", keywords: ["address", "location", "where", "direction", "map"], reply: "Kangaru Girls Senior School\nP.O. BOX 1094-60100, EMBU, KENYA", actions: [] },
      { id: "contact.phone", label: "Phone Number", icon: "📞", keywords: ["phone", "call", "number", "telephone"], reply: "You can reach us at: +254796214804", actions: [] },
      { id: "contact.email", label: "Email", icon: "📧", keywords: ["email", "mail"], reply: "Email us at: kangarugirls@yahoo.com", actions: [] },
    ],
    sortOrder: 3,
  },
  {
    id: "academics",
    icon: "📚",
    label: "Academics",
    keywords: ["academic", "academics", "subject", "subjects", "curriculum", "CBE", "8-4-4", "course", "class", "stream", "pathway", "STEM", "arts"],
    reply: "",
    dataSource: "curriculum-page",
    dataField: "overview",
    actions: [
      { type: "link", label: "📚 View Curriculum", route: "curriculum" },
    ],
    children: [
      { id: "academics.performance", label: "School Performance", icon: "📊", keywords: ["performance", "results", "KCSE", "grades", "mean score", "ranking"], dataSource: "performance-page", dataField: "overview", actions: [{ type: "link", label: "📊 View Performance", route: "performance" }] },
    ],
    sortOrder: 4,
  },
  {
    id: "events",
    icon: "📅",
    label: "Events & Calendar",
    keywords: ["event", "events", "calendar", "open day", "visiting", "sports", "activity", "function", "ceremony", "prize", "graduation"],
    reply: "",
    dataSource: "events-page",
    dataField: "overview",
    actions: [
      { type: "link", label: "📅 View Events", route: "events" },
    ],
    children: [],
    sortOrder: 5,
  },
  {
    id: "student-life",
    icon: "🎓",
    label: "Student Life",
    keywords: ["student life", "boarding", "dormitory", "hostel", "food", "meals", "diet", "uniform", "rules", "clubs", "sports", "co-curricular"],
    reply: "",
    dataSource: "student-life-page",
    dataField: "overview",
    actions: [
      { type: "link", label: "🎓 Student Life Page", route: "student-life" },
    ],
    children: [],
    sortOrder: 6,
  },
  {
    id: "school-hours",
    icon: "🕐",
    label: "School Hours & Info",
    keywords: ["hours", "time", "schedule", "open", "close", "term", "holiday", "vacation", "break", "reporting", "report date"],
    reply: "School operates Monday to Friday. For specific term dates and reporting schedules, please check the Events page or contact the school office.",
    dataSource: "",
    dataField: "",
    actions: [
      { type: "link", label: "📅 Check Events", route: "events" },
      { type: "contact-admin", label: "💬 Ask Admin" },
    ],
    children: [],
    sortOrder: 7,
  },
];

export { ChatConfig, defaultCategories };
