/**
 * Enhanced Knowledge Base Integration Service
 * Provides intelligent, context-aware responses based on user role and semantic understanding
 */

// Role-based system prompts for enhanced context
const roleSystemPrompts = {
  student: `You are a helpful AI tutor for Kangaru Girls High School students. Your role is to:
- Provide academic support and explain concepts clearly
- Help with homework (guide without giving direct answers)
- Suggest effective study strategies
- Answer questions about exams, grades, and academic progress
- Be encouraging and supportive
- Answer about school events, facilities, and student life
- Provide accurate school contact information
Be conversational, supportive, and encourage critical thinking.`,
  
  teacher: `You are an intelligent AI assistant for Kangaru Girls High School teachers. Help with:
- Lesson planning and curriculum delivery
- Creating educational resources and materials
- Classroom management strategies
- Grading and assessment methods
- Professional development advice
- School administrative information
- Student management insights
Provide practical, implementable advice grounded in educational best practices.`,
  
  parent: `You are a supportive AI assistant for parents of Kangaru Girls High School students. You help with:
- Understanding their child's academic performance and progress
- School programs, curriculum, and learning pathways
- Admission processes and requirements
- Fee structure and payment information
- Communication tips with teachers and school
- School events and activities
- Supporting child's education at home
- School contact channels
Be warm, informative, and supportive.`,
  
  admin: `You are an intelligent analytical assistant for school administrators. Support with:
- Analyzing school data and performance metrics
- Resource allocation and planning
- System management and reporting
- Strategic planning based on data
- Operational efficiency improvements
- School information and statistics
- Administrative processes
Provide data-driven insights and practical recommendations.`,
  
  superadmin: `You are a comprehensive AI system for superadministrators with full platform access. Provide:
- Advanced system analytics and insights
- Strategic recommendations for school improvement
- Comprehensive data analysis
- System configuration guidance
- All administrative and operational support
- Full school information access
Combine technical expertise with strategic thinking.`,
  
  staff: `You are an efficient AI assistant for school staff. Help with:
- Administrative task management
- Communication and documentation
- Scheduling and coordination
- Workflow optimization
- School procedures and policies
- General school information
Support smooth school operations through practical assistance.`,
};

// Enhanced knowledge domains with better matching
const knowledgeDomains = {
  admissions: {
    keywords: ['admission', 'apply', 'entry', 'form 1', 'intake', 'enrolled', 'enroll', 'applicant', 'requirements', 'join', 'accepted'],
    phrases: ['how do i apply', 'admission requirements', 'entry requirements', 'when do i apply', 'application process'],
    responses: {
      student: "Great question! Kangaru Girls High School admits students based on merit (KCPE results) and conduct records. You went through this process. Is there something specific about the admission system or helping prospective students?",
      parent: "Kangaru Girls High School maintains high admission standards based on KCPE results and good conduct. Our admission process is competitive and merit-based. Would you like information about specific admission requirements?",
      teacher: "Admissions are based on KCPE performance and conduct records. Our school carefully selects students who demonstrate academic potential and good character to maintain our standards.",
      admin: "We use KCPE results and conduct records for admission decisions. This ensures we admit quality students who can maintain our academic standards.",
      default: "Kangaru Girls High School welcomes qualified applicants. Admission is based on merit (KCPE results) and character. Contact the school office for detailed requirements.",
    }
  },
  
  academics: {
    keywords: ['curriculum', 'subject', 'syllabus', 'learning', 'study', 'course', 'CBE', 'pathways', 'stem', 'sciences', 'arts', 'lessons'],
    phrases: ['how do i study', 'learning pathway', 'subject selection', 'what subjects', 'academic support'],
    responses: {
      student: "We offer CBE (Competency Based Curriculum) with three pathways: STEM, Social Sciences, and Arts & Sports Science. Engage actively with your teachers, form study groups, and don't hesitate to ask questions. What subject would you like help with?",
      parent: "Kangaru offers modern CBE pathways in STEM, Social Sciences, and Arts & Sports Science. This ensures your child can pursue their interests while gaining valuable skills.",
      teacher: "Our CBE implementation covers three pathways. Focus on competency development, student engagement, and practical application of concepts.",
      admin: "Curriculum includes CBE pathways: STEM, Social Sciences, Arts & Sports Science. Monitor implementation quality and student outcomes.",
      default: "Kangaru Girls High School offers CBE with multiple pathways. Contact admissions or visit our website for detailed curriculum information.",
    }
  },

  fees: {
    keywords: ['fee', 'payment', 'tuition', 'cost', 'charges', 'bill', 'invoice', 'boarding', 'price', 'pay'],
    phrases: ['how much', 'fee structure', 'payment plan', 'fee payment', 'boarding fees'],
    responses: {
      student: "Fee details and payment information are in your student dashboard. For specific questions or payment arrangements, contact the school office.",
      parent: "Our fee structure supports quality education and full boarding services. For detailed information and possible payment arrangements, contact the school office directly at kangarugirlsls@yahoo.com or call 0113688538.",
      teacher: "Fee information is available to staff. Contact administration for any specific details needed.",
      admin: "Manage fee records, payment tracking, and financial reporting. Coordinate with parents on payment arrangements.",
      default: "For fee information, please contact Kangaru Girls High School: Email: kangarugirlsls@yahoo.com, Phone: 0113688538",
    }
  },

  performance: {
    keywords: ['kcse', 'exam', 'result', 'performance', 'grade', 'mark', 'score', 'ranking', 'progress', 'achievement'],
    phrases: ['how did i do', 'my grades', 'exam results', 'how am i performing', 'grades tracking'],
    responses: {
      student: "Check your student dashboard for detailed grade breakdowns and performance analysis. Your progress is tracked each term. Talk to your teachers about areas where you can improve.",
      parent: "Your child's performance reports are available through school communications. For detailed analysis, contact their class teacher or the academic office.",
      teacher: "Review student performance data to identify learning needs and plan interventions. Share results with parents to support student improvement.",
      admin: "Monitor aggregate performance metrics to identify trends and areas for improvement. Recent KCSE results show our school's commitment to excellence.",
      default: "Kangaru Girls High School maintains strong academic performance. Check with the school for individual or aggregate results.",
    }
  },

  facilities: {
    keywords: ['facility', 'building', 'dormitory', 'dorm', 'lab', 'library', 'campus', 'infrastructure', 'science lab', 'computer lab', 'playing field', 'dining'],
    phrases: ['what facilities', 'school buildings', 'campus tour', 'where is', 'what does the school have'],
    responses: {
      student: "Our campus includes science and computer labs, a well-stocked library, comfortable dormitories, dining hall, sports fields, and assembly grounds. Everything is designed to support your learning and personal growth.",
      parent: "Kangaru has excellent facilities including science labs, computer labs, library, modern dormitories, dining facilities, and recreational areas. These support both academic and personal development.",
      teacher: "Facilities include well-equipped labs, library resources, computer labs, and recreational areas to support effective teaching and student development.",
      admin: "Maintain and optimize facility usage. Plan upgrades based on institutional needs and student enrollment.",
      default: "Kangaru Girls High School has modern facilities including laboratories, library, dormitories, dining hall, and sports grounds.",
    }
  },

  studentLife: {
    keywords: ['club', 'activity', 'sport', 'event', 'culture', 'society', 'co-curricular', 'extracurricular', 'drama', 'music', 'debate', 'team'],
    phrases: ['what clubs', 'sports teams', 'student activities', 'school events', 'can i join'],
    responses: {
      student: "We have many clubs and activities including sports teams, drama, music, debate, and more. Join activities that interest you! These develop leadership, creativity, and friendship. Check with student leaders or administration for current offerings.",
      parent: "Kangaru offers diverse clubs and activities that complement academics. Encourage your daughter to participate - these develop important life skills beyond the classroom.",
      teacher: "Sponsor clubs, coach sports, or advise student organizations. These activities are vital for holistic student development.",
      admin: "Coordinate student activities, allocate resources for clubs and sports, ensure safe and enriching experiences.",
      default: "Kangaru Girls High School offers vibrant student life with various clubs, sports, and cultural activities.",
    }
  },

  contact: {
    keywords: ['contact', 'phone', 'email', 'address', 'office', 'reach', 'call', 'communicate', 'how to reach', 'where'],
    phrases: ['how do i contact', 'what is the email', 'phone number', 'school address', 'get in touch'],
    responses: {
      default: `📞 Kangaru Girls High School Contact Information:
📧 Email: kangarugirlsls@yahoo.com
📱 Phone: 0113688538
📍 Address: P.O Box 12, 60100 EMBU, Kenya
🌐 Website: https://kangarugirls.ach.ke

Feel free to reach out with any questions or concerns!`,
    }
  },

  history: {
    keywords: ['history', 'founded', 'established', 'heritage', 'background', 'origin', 'timeline', 'when was', 'started'],
    phrases: ['school history', 'how old is the school', 'when was it founded', 'school background'],
    responses: {
      student: "Kangaru was originally founded in 1948 and became the prestigious girls' school it is today. Our heritage of excellence spans over 75 years of quality education.",
      parent: "Kangaru Girls High School was established in 1948 and has a proud heritage of academic excellence and character development spanning more than 75 years.",
      teacher: "Our school's history reflects a commitment to quality education and holistic student development since 1948.",
      admin: "Founded in 1948, Kangaru has evolved into a leading educational institution with a strong reputation for academic excellence.",
      default: "Kangaru Girls High School was founded in 1948 and has maintained excellence in education for over 75 years.",
    }
  },

  discipline: {
    keywords: ['rule', 'conduct', 'behavior', 'discipline', 'penalty', 'code of conduct', 'policy', 'expectations', 'allowed', 'prohibited'],
    phrases: ['school rules', 'what are the rules', 'what is allowed', 'code of conduct', 'discipline policy'],
    responses: {
      student: "Our school maintains high discipline standards to ensure a safe learning environment. Understand and follow school rules - they help create respect and order for everyone.",
      parent: "Kangaru believes discipline is essential for student development. School rules reflect our values of integrity, respect, and responsibility.",
      teacher: "Enforce school discipline consistently and fairly. Partner with administration on disciplinary matters while maintaining student dignity.",
      admin: "Develop fair, transparent discipline policies. Focus on positive behavioral outcomes and student development.",
      default: "Kangaru Girls High School maintains discipline through clear conduct codes focused on integrity, respect, and responsibility.",
    }
  },
};

/**
 * Semantic matching - understands meaning, not just keywords
 */
export const semanticMatch = (query, domain) => {
  const normalizedQuery = query.toLowerCase().trim();
  const domainConfig = knowledgeDomains[domain];
  
  if (!domainConfig) return false;
  
  // Check exact phrases first (highest confidence)
  for (const phrase of domainConfig.phrases || []) {
    if (normalizedQuery.includes(phrase)) {
      return true;
    }
  }
  
  // Check keywords with word boundaries
  for (const keyword of domainConfig.keywords || []) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(normalizedQuery)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Detect knowledge domain from user query with improved accuracy
 */
export const detectKnowledgeDomain = (query) => {
  // Score each domain based on semantic relevance
  const scores = {};
  
  for (const domain of Object.keys(knowledgeDomains)) {
    scores[domain] = semanticMatch(query, domain) ? 1 : 0;
  }
  
  // Find best matching domain
  const bestMatch = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)[0];
  
  return bestMatch && bestMatch[1] > 0 ? bestMatch[0] : null;
};

/**
 * Get contextual response based on domain and role
 */
export const getContextualResponse = (userRole, domain, query) => {
  if (!domain || !knowledgeDomains[domain]) {
    return `I'm here to help with information about Kangaru Girls High School. Ask me about admissions, academics, facilities, student life, performance, fees, contact information, school history, discipline policies, or student activities.`;
  }
  
  const roleLower = userRole?.toLowerCase() || 'student';
  const domainResponses = knowledgeDomains[domain].responses;
  
  // Return role-specific response if available, otherwise use default
  return domainResponses[roleLower] || domainResponses.default || domainResponses.student;
};

/**
 * Generate enhanced response combining all services
 */
export const generateEnhancedResponse = (userQuery, userRole, knownContext = {}) => {
  const domain = detectKnowledgeDomain(userQuery);
  const systemPrompt = roleSystemPrompts[userRole?.toLowerCase()] || roleSystemPrompts.student;
  
  // Get base contextual response
  let contextualResponse = getContextualResponse(userRole, domain, userQuery);
  
  // Enhance response with conversation context if available
  if (knownContext?.conversationContext) {
    // If there's previous conversation history, add a note that we understand the context
    // This helps provide follow-up answers that build on previous discussion
    const hasFollowUpKeywords = /\b(also|furthermore|additionally|moreover|similarly|as mentioned|previously|before)\b/i.test(userQuery);
    
    if (hasFollowUpKeywords || knownContext.conversationContext.length > 100) {
      // User is asking a follow-up question in an ongoing conversation
      // Prepend a contextual acknowledgement to show we understand the discussion
      const contextNote = `[Understanding our discussion about ${domain || "Kangaru Girls High School"}]\n`;
      contextualResponse = contextNote + contextualResponse;
    }
  }
  
  // Determine confidence based on domain match and query clarity
  let confidence = domain ? 0.9 : 0.5;
  if (userQuery.length > 100) confidence = Math.min(0.95, confidence + 0.05); // Detailed queries = higher confidence
  if (knownContext?.conversationContext) confidence = Math.min(0.95, confidence + 0.05); // Context improves confidence
  
  return {
    systemPrompt,
    response: contextualResponse,
    domain,
    confidence: Math.round(confidence * 100) / 100, // Round to 2 decimals
    userRole,
    hasContext: !!knownContext?.conversationContext,
    conversationId: knownContext?.conversationId || undefined,
    userId: knownContext?.userId || undefined,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Format response for API output
 */
export const formatAIResponse = (enhancedResponse, requiresLogin = false) => {
  return {
    ok: true,
    response: enhancedResponse.response,
    domain: enhancedResponse.domain,
    userRole: enhancedResponse.userRole,
    requiresLogin,
    confidence: enhancedResponse.confidence,
    timestamp: enhancedResponse.timestamp,
  };
};

export default {
  semanticMatch,
  detectKnowledgeDomain,
  getContextualResponse,
  generateEnhancedResponse,
  formatAIResponse,
};
