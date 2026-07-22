// data/kangaruGirlsKnowledgeBase.js
// Comprehensive knowledge base for Kangaru Girls Senior School
// Serves as both AI chatbot and digital archive/historian

export const guestResponses = {
  // ════════════════════════════════════════════════════════════════
  // CORE INFORMATION
  // ════════════════════════════════════════════════════════════════

  greetings: {
    keywords: [
      "hello",
      "hi",
      "hey",
      "helo",
      "hallo",
      "Hey",
      "good morning",
      "good afternoon",
      "good evening"
    ],
    trainingPhrases: [
      "hello",
      "hi",
      "hey",
      "helo",
      "hallo",
      "good morning",
      "good afternoon",
      "good evening",
      "how are you",
      "how are you doing",
      "whats up",
      "what's up",
      "sup",
      "hiya",
      "greetings",
      "yo",
      "hello there",
      "is anyone there",
      "can you help me",
      "i need help",
      "help me",
      "start",
      "menu"
    ],
    chatResponse:
      "Hi 👋 I'm the Kangaru Girls AI Assistant — I can help with admissions, curriculum, fees, events, and school history. How can I help you today?",
    response:
      "Hello! I'm the Kangaru Girls AI Assistant. I can help with admissions, curriculum, fees, events, and school history. Ask me something like 'How do I apply?', 'What subjects do you offer?', or 'Where are you located?',",
    requiresLogin: false,
  },

  about: {
    keywords: [
      "tell me about the school",
      "school overview",
      "school profile",
      "school history summary",
      "who are you",
      "what is kangaru girls",
      "introduce the school"
    ],
    trainingPhrases: [
      "tell me about the school",
      "who are you",
      "what is kangaru girls",
      "give me an overview of the school",
      "school profile",
      "what kind of school is this",
      "what is kangaru girls senior school",
      "can you introduce the school",
      "give me a school overview",
      "what makes this school special",
      "why should i join kangaru girls",
      "what is your mission",
      "what is your vision",
      "what are your core values",
      "what is the school known for",
      "what type of school are you",
      "is it a boarding school",
      "is it a public school",
      "is it a girls school",
      "what category is the school",
      "is it an extra county school",
      "tell me about the school",
      "who founded kangaru girls",
      "what is a girls boarding school",
      "why is kangaru girls important"
    ],
    response:
      "Kangaru Girls Senior School is a public extra-county girls' boarding school located in Kangaru, Embu County, Kenya. Founded as an independent institution in 1989, we trace our heritage to the historic Kangaru School established in 1948. We are committed to academic excellence, leadership, discipline, integrity, teamwork, and holistic development of our students.",
    followUp: [
      "Tell me about our history",
      "What are our core values?",
      "Where are we located?"
    ],
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // COMPREHENSIVE HISTORY & TIMELINE
  // ════════════════════════════════════════════════════════════════

  history: {
    keywords: [
      "history",
      "origin",
      "heritage",
      "legacy",
      "founding",
      "founded",
      "established",
      "when was kangaru girls established",
      "background",
      "past"
    ],
    trainingPhrases: [
      "what is the history",
      "when was the school founded",
      "tell me about the history",
      "school origins",
      "founding",
      "when was kangaru girls established",
      "how did kangaru girls start",
      "who founded the school",
      "what happened in 1989",
      "what happened in 1973",
      "what happened in 1948",
      "what is the origin of the school",
      "what is the school's heritage",
      "how old is the school",
      "what is the story behind kangaru girls",
      "was the school always for girls",
      "what is the relationship with kangaru school",
      "why did the school separate",
      "tell me about the coeducational era",
      "what major events shaped the school",
      "give me the school timeline",
      "what are the important dates"
    ],
    response:
      "Kangaru Girls Senior School has a rich and complex history spanning over a century:\n\n1920s: Missionary education efforts begin in the Kangaru area through the Church Missionary Society (CMS).\n\n1946: The Embu Local Native Council approves the establishment of a larger secondary institution.\n\n1947: Construction of Kangaru School begins on January 1st on land donated by local residents. Sir Robin Wainwright, District Commissioner, plays a major role.\n\n1948: Kangaru School officially opens.\n\n1949: First eight girls are admitted to Kangaru School as day scholars.\n\n1962: According to historical records, Embu Girls Secondary School becomes a full secondary institution.\n\n1973 (July): Embu Girls Secondary School merges with Kangaru School to form a mixed co-educational institution under one principal and two deputy principals.\n\n1989: The mixed institution is separated into Kangaru School (boys) and Kangaru Girls Senior School (girls), establishing Kangaru Girls as an independent public girls' boarding school.\n\n2010s–Present: Kangaru Girls establishes itself as one of the top-performing extra-county schools in Embu County.\n\n2025: Strong KCSE performance celebrated for the Class of 2024.\n\nMarc 2026: Student unrest incident draws national attention.\n\nNote: Some historical details have conflicting accounts in different sources. The school maintains sister relationships with Kangaru School.",
    followUp: [
      "What happened in 1973?",
      "When was Kangaru Girls established independently?",
      "What is the school's relationship with Kangaru School?"
    ],
    requiresLogin: false,
  },

  timeline: {
    keywords: [
      "timeline",
      "milestones",
      "major events",
      "important dates",
      "school milestones",
      "year",
      "decade"
    ],
    response:
      "Key Milestones in Kangaru Girls School History:\n\n1920s: Missionary education activities begin\n1946: Approval for secondary school establishment\n1947: Campus construction begins\n1948: Official opening\n1949: First girls admitted\n1962: Embu Girls becomes full secondary school\n1973: Merger with Kangaru School (co-ed era begins)\n1989: Separation into boys and girls schools (Kangaru Girls established)\n2010s: Recognition as top-performing extra-county school\n2019: KCSE mean score 8.01 (B-), national ranking\n2020: KCSE mean score 7.9 (B-), 75%+ university entry grades\n2024: Latest KCSE results released (131 candidates)\n2025: KCSE celebrations\n2026: Notable student unrest incident\n\nThe school has evolved from a community-led education initiative to a leading institution serving students across Kenya.",
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // LOCATION & GEOGRAPHY
  // ════════════════════════════════════════════════════════════════

  location: {
    keywords: [
      "location",
      "where are you",
      "where is the school",
      "map",
      "directions",
      "address",
      "embu",
      "manyatta",
      "kirimari",
      "kangaru"
    ],
    trainingPhrases: [
      "where are you located",
      "how do i get there",
      "what is the address",
      "directions to the school",
      "where is kangaru girls",
      "where is the school located",
      "which county is the school in",
      "which constituency is the school in",
      "which ward is the school in",
      "how far is the school from embu town",
      "what are your coordinates",
      "is the school near embu town",
      "is the school near kangaru school",
      "what landmarks are nearby",
      "show me directions",
      "how can i visit the school",
      "what road is the school on",
      "is the school on the embu meru highway",
      "how do i find the school",
      "what is your location"
    ],
    response:
      "Kangaru Girls Senior School is located in:\n\nArea: Kangaru, Kirimari Ward\nConstituency: Manyatta\nCounty: Embu County, Kenya\nRegion: Peri-urban setting\n\nGeographic Details:\n• Situated on the Embu-Meru Highway\n• Adjacent to Kangaru School (sister institution)\n• Close to Embu town\n• Near the Rupingazi River\n• Serves students from Embu County and across Kenya\n\nApproximate Coordinates:\n• Latitude: -0.506°\n• Longitude: 37.461°\n\nThe location in the Kangaru area, which predates the school itself, was chosen as it was one of the earliest educational centers in the region during the colonial period.",
    followUp: [
      "How do I get there?",
      "What is the school's postal address?",
      "Which counties does the school serve?"
    ],
    requiresLogin: false,
  },

  geography: {
    keywords: [
      "geographic",
      "region",
      "coordinates",
      "rupingazi",
      "river",
      "highway",
      "terrain",
      "nearby towns"
    ],
    response:
      "Geographic Profile:\n\nThe Kangaru region of Embu County has served as an educational hub since the early 1900s. The school sits in a peri-urban area with excellent road access via the Embu-Meru Highway.\n\nNearby Landmarks:\n• Rupingazi River\n• Embu town (nearby)\n• Kangaru School (adjacent, boys' institution)\n• Kangaru mission area (historic)\n\nCommunities Served:\nThe school has strong links with Eastern Kenya communities including:\n• Embu\n• Mbeere\n• Mwea\n• Kirinyaga\n• Meru\n• Tharaka-Nithi\n\nMany families across eastern Kenya have educated multiple generations at either Kangaru Boys or Kangaru Girls.",
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // CONTACT & COMMUNICATION
  // ════════════════════════════════════════════════════════════════

  contact: {
    keywords: [
      "contact",
      "phone",
      "telephone",
      "call",
      "email",
      "address",
      "postal",
      "website",
      "reach",
      "office"
    ],
    trainingPhrases: [
      "how can i contact you",
      "how can i contact the school",
      "what is your phone number",
      "what is your email address",
      "what is your postal address",
      "how do i reach the school",
      "contact details",
      "how do i speak to the principal",
      "how can i contact admissions",
      "how can i send an inquiry",
      "do you have a website",
      "what are your office hours",
      "how do i call the school",
      "where can i send a letter",
      "how can parents contact the school",
      "where can i find your contacts",
      "how to reach administration"
    ],
    response:
      "Contact Information for Kangaru Girls Senior School:\n\nPostal Address:\nP.O. Box 1094-60100\nEmbu, Kenya\n\nHistorical Contact Details:\nEmail: kangarugirls@yahoo.com\n(Note: Contact information may have been updated. Please verify current details through official channels.)\n\nFor Current Information:\n• Visit the official school website\n• Use our online contact form\n• Check official social media pages\n• Contact through the Education Ministry\n• Reach out to the school administration office\n\nOffice Hours:\nDuring school calendar periods, inquiries are typically handled by the administration office.\n\nFor the most current phone numbers and email addresses, please visit our Contact page or official communication channels.",
    followUp: [
      "What is your website?",
      "How do I submit an inquiry?",
      "When are office hours?"
    ],
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // ADMISSIONS
  // ════════════════════════════════════════════════════════════════

  admissions: {
    keywords: [
      "admission",
      "admissions",
      "apply",
      "application",
      "join",
      "enroll",
      "enrol",
      "register",
      "placement",
      "transfer",
      "intake",
      "vacancy",
      "vacancies",
      "enrollment"
    ],
    trainingPhrases: [
      "how do i apply",
      "how can i join the school",
      "when are admissions open",
      "are admissions ongoing",
      "can i apply now",
      "how do i enroll",
      "what are the admission requirements",
      "what grades are needed",
      "how are students selected",
      "can my daughter join the school",
      "can i transfer to the school",
      "do you accept transfer students",
      "how many students do you admit",
      "when is form one reporting",
      "how do ministry placements work",
      "can students from other counties apply",
      "how do i get an admission letter",
      "what documents are required",
      "what is the application process",
      "when is the next intake",
      "admission requirements",
      "can my daughter transfer",
      "when is application"
    ],
    response:
      "Admissions to Kangaru Girls Senior School: Student Recruitment: Qualified students from across Kenya including Nairobi\n\nAs an Extra-County Girls' School (C2 Classification):\n• Status: Public boarding institution\n• Gender: Girls only\n• Curriculum: 8-4-4 and CBE\n\nFor Detailed and accurate Information:\n• Visit our Admissions page\n• Sign in to access the admissions portal\n• Contact the administration office\n• \nImportant Application procedures, requirements, and important dates are available on our Admissions page.",
    followUp: [
      "What are the admission requirements?",
      "When are applications submitted?",
      "Can I apply for a transfer?"
    ],
    requiresLogin: true,
  },

  // ════════════════════════════════════════════════════════════════
  // FEES & FINANCIAL INFORMATION
  // ════════════════════════════════════════════════════════════════

  fees: {
    keywords: [
      "fee",
      "fees",
      "cost",
      "tuition",
      "payment",
      "charges",
      "price",
      "bursary",
      "financial aid",
      "financial support",
      "scholarship"
    ],
    trainingPhrases: [
      "how much are fees",
      "what is the fee structure",
      "how much does boarding cost",
      "how do i pay school fees",
      "what payment methods do you accept",
      "are there bursaries",
      "can i get financial aid",
      "do you offer scholarships",
      "can fees be paid in installments",
      "when should fees be paid",
      "how do i check my balance",
      "where do i pay fees",
      "what are the extra charges",
      "what does the fee include",
      "how much is tuition",
      "what are the boarding fees",
      "school fees",
      "fee structure",
      "payment methods",
      "bursary"
    ],
    response:
      "School Fees Information:\n\nFee Structure:\n• Varies by class level (Form 1, 2, 3, 4), CBE (Grade 10,11,12)\n• May differ based on academic year\n• \nFee Categories:\n• Tuition fees\n• Boarding fees\n• Facilities fees\n• Activity fees\n• Other approved charges\n\nPayment Methods & Support:\n• Multiple payment options available\n• Payment deadlines per term\n• Bursary programs  students\n• Financial aid opportunities\n• Scholarship considerations\n\nFor Personalized Fee Information:\n• Sign in or create an account\n• Visit the Fee Structure page\n• Contact the finance/administration office\n• Inquire about financial assistance options\n\nNote: Specific fee amounts require login access or direct contact with the school to ensure accuracy and currency of information.",
    followUp: [
      "What payment methods are accepted?",
      "Are there bursary opportunities?",
      "How do I check my account balance?"
    ],
    requiresLogin: true,
  },

  // ════════════════════════════════════════════════════════════════
  // ACADEMICS & CURRICULUM
  // ════════════════════════════════════════════════════════════════

  academics: {
    keywords: [
      "academics",
      "curriculum",
      "subjects",
      "courses",
      "program",
      "programme",
      "department",
      "learning",
      "subjects offered"
    ],
    trainingPhrases: [
      "what subjects do you offer",
      "which courses are available",
      "what do students study",
      "what subjects are taught",
      "do you offer computer studies",
      "do you teach physics",
      "do you teach chemistry",
      "do you teach biology",
      "do you offer business studies",
      "what departments are available",
      "what is your curriculum",
      "what programs do you offer",
      "what learning pathways are available",
      "what academic support is available",
      "how are students assessed",
      "what subjects can i choose",
      "what are the compulsory subjects",
      "how many subjects do students take",
      "curriculum",
      "learning pathways"
    ],
    response:
      "Academic Programs at Kangaru Girls Senior School:\n\nCurrent Curriculum System:\n• Transitioning from 8-4-4 to Competency-Based Curriculum (CBE)\n• Modern teaching methodologies and learning spaces\n• Focus on 21st-century skills and competencies\n\nCore Subjects:\n✓ Mathematics\n✓ English Language\n✓ Kiswahili Language\n✓ Physics\n✓ Chemistry\n✓ Biology\n✓ Geography\n✓ History and Government\n✓ Christian Religious Education (CRE)\n✓ Computer Studies\n✓ Business Studies\n✓ Home Science\n\nLearning Pathways (CBE):\n1. STEM Pathway: Mathematics, Sciences, Computer Studies\n2. Social Sciences Pathway: Geography, History, Business Studies, CRE\n3. Arts & Sports Science Pathway: Languages, Humanities, Physical Education\n\nAcademic Support:\n• Qualified teachers across all departments\n• Regular academic clinics and reviews\n• Individual student performance monitoring\n• Subject-specific enrichment programs\n\nFor detailed curriculum information, visit the Curriculum page or sign in to access full academic resources.",
    followUp: [
      "What is CBE?",
      "Can I choose my learning pathway?",
      "How are students assessed?"
    ],
    requiresLogin: false,
  },

  curriculum: {
    keywords: [
      "CBE",
      "competency based curriculum",
      "8-4-4",
      "pathways",
      "stem",
      "stems",
      "social sciences",
      "arts",
      "sports science",
      "competencies",
      "learning outcomes",
      "stem pathway",
      "science subjects",
      "technology",
      "engineering",
      "math subjects",
      "CBE pathways"
    ],
    trainingPhrases: [
      "do you offer CBE",
      "what is CBE",
      "how is CBE implemented",
      "what pathways do you offer",
      "what stem subjects do you offer",
      "what stem courses are available",
      "can i choose stem",
      "what science subjects do you offer",
      "do you offer computer science",
      "what technology subjects are available",
      "what are the CBE pathways",
      "do you offer arts and sports science",
      "do you offer social sciences",
      "which pathway is best",
      "how do i choose a pathway",
      "when will CBE start",
      "are you transitioning from 8-4-4",
      "what stems do you offer",
      "do you have stem",
      "which pathways are available"
    ],
    response:
      "Competency-Based Curriculum (CBE) at Kangaru Girls:\n\nWhat is CBE?\nThe Competency-Based Curriculum is Kenya's modern education framework focusing on:\n• Practical skills over rote memorization\n• Critical thinking and problem-solving\n• Collaboration and communication\n• Digital literacy and technology\n• Leadership and entrepreneurship\n• Social and emotional learning\n\nLearning Pathways Available:\n\n1. STEM Pathway (Science, Technology, Engineering, Mathematics)\n   • Mathematics\n   • Physics\n   • Chemistry\n   • Biology\n   • Computer Studies\n   • Technology applications\n\n2. Social Sciences Pathway\n   • Geography\n   • History and Government\n   • Business Studies\n   • Christian Religious Education\n   • Civic engagement\n\n3. Arts & Sports Science Pathway\n   • English Language\n   • Kiswahili Language\n   • Humanities\n   • Physical Education\n   • Creative arts\n\nTransition Plan:\nThe school is implementing CBE while maintaining excellence in traditional academics. This ensures continuity and quality education during the curriculum change.\n\nFor more details on CBE pathways, visit our Curriculum page.",
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // ACADEMIC PERFORMANCE & KCSE RESULTS
  // ════════════════════════════════════════════════════════════════

  performance: {
    keywords: [
      "kcse",
      "results",
      "performance",
      "mean score",
      "grades",
      "ranking",
      "pass rate",
      "exam results",
      "academic results",
      "how is the school performing",
      "national ranking"
    ],
    trainingPhrases: [
      "how does the school perform",
      "what are your kcse results",
      "what was the mean score",
      "what was the 2024 performance",
      "how many students qualified for university",
      "what is the pass rate",
      "how does the school rank nationally",
      "what is your ranking in embu county",
      "how many students got grade a",
      "what were the latest results",
      "is the school academically strong",
      "how many students got c plus and above",
      "what is the university transition rate",
      "how did the class of 2024 perform"
    ],
    response:
      "Kangaru Girls Senior School: Academic Performance Summary\n\nRecent KCSE Results:\n\n2019 KCSE Results:\n• Mean Score: 8.01 (Grade B-)\n• National Ranking: Position 82 nationally\n• Status: Among Kenya's top-performing schools\n• County Standing: Top-ranked in Embu County\n\n2020 KCSE Results:\n• Mean Score: 7.9 (Grade B-)\n• University Entry Rate: 75%+ of candidates attained C+ and above\n• Direct University Admission: Majority of graduates qualified for direct university entry\n• Consistency: Maintained high standards\n\n2024 KCSE Results (Released January 2025):\n• Total Candidates: 131\n• Grade Distribution:\n  - A Grades: 2 students\n  - A- Grades: 9 students\n  - B+ Grades: 25 students\n  - B Grades: 42 students\n  - B- Grades: 34 students\n  - C+ Grades: 15 students\n  - C Grades: 3 students\n• Performance: Continued excellence and high pass rate\n\nOverall Recognition:\n✓ Consistently ranks among Embu County's top schools\n✓ National recognition as leading extra-county school\n✓ Strong academic tradition maintained\n✓ Commitment to continuous improvement\n\nThe school attributes its performance to:\n• Qualified and dedicated teaching staff\n• Structured academic support systems\n• Modern learning facilities\n• Rigorous examination preparation\n• Student discipline and commitment",
    followUp: [
      "What grades are needed for university?",
      "How does Kangaru Girls rank nationally?",
      "What subjects perform best?"
    ],
    requiresLogin: false,
  },

  kcse2024: {
    keywords: [
      "2024 results",
      "2024 kcse",
      "latest results",
      "recent kcse",
      "class of 2024",
      "january 2025 results"
    ],
    trainingPhrases: [
      "what were the 2024 kcse results",
      "how many students passed 2024",
      "what was the class of 2024 performance",
      "did class of 2024 do well",
      "how many students qualified in 2024",
      "were the 2024 results good",
      "tell me about 2024 results"
    ],
    response:
      "2024 KCSE Results - Kangaru Girls Senior School\n\nExamination Year: 2024\nResults Released: January 2025\nTotal Candidates: 131 students\n\nGrade Distribution:\n• A (90-100): 2 candidates\n• A- (80-89): 9 candidates\n• B+ (75-79): 25 candidates\n• B (70-74): 42 candidates\n• B- (65-69): 34 candidates\n• C+ (60-64): 15 candidates\n• C (55-59): 3 candidates\n\nAnalysis:\n• Mean Score: Calculated from 131 candidates\n• University Entry Rate: 130 out of 131 qualified (99%+ pass rate)\n• Merit Performance: 2 A-grade students demonstrate exceptional performance\n• Consistency: Continued high achievement across all grades\n• Class Profile: Well-distributed performance with strong middle to upper band results\n\nSchool Statement:\nThe 2024 cohort's exceptional performance reflects the school's dedication to academic excellence, quality teaching, disciplined student conduct, and modern learning infrastructure.\n\nCelebrations were held in 2025 to recognize the Class of 2024's achievements.",
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // FACILITIES & INFRASTRUCTURE
  // ════════════════════════════════════════════════════════════════

  facilities: {
    keywords: [
      "facilities",
      "library",
      "laboratory",
      "lab",
      "computer lab",
      "ict",
      "classrooms",
      "dormitory",
      "hostel",
      "infrastructure",
      "campus",
      "buildings",
      "what facilities does the school have"
    ],
    trainingPhrases: [
      "what facilities do you have",
      "do you have science laboratories",
      "do you have a computer lab",
      "do you have a library",
      "is there wifi at school",
      "what is your infrastructure like",
      "do you have a gym",
      "do you have a playing field",
      "what buildings are available",
      "how many classrooms do you have",
      "do you have reliable power supply",
      "what resources do students access"
    ],
    response:
      "Kangaru Girls Senior School: Campus Facilities\n\nAcademic Facilities:\n✓ Science Laboratories: Physics, Chemistry, Biology labs with modern equipment\n✓ Computer/ICT Laboratories: Multiple computer rooms with internet connectivity\n✓ Library: Resource center with books, journals, and digital materials\n✓ Classrooms: Well-equipped learning spaces for all form levels\n✓ CBE Learning Spaces: Dedicated areas for competency-based learning activities\n\nBoarding & Residential Facilities:\n✓ Dormitories: Multiple boarding houses for student accommodation\n✓ Dining Hall: Centralized food service facility\n✓ Staff Housing: Residential quarters for teaching and non-teaching staff\n\nAdministrative Facilities:\n✓ Administration Block: Main office and management areas\n✓ Principal's Office: Administrative headquarters\n✓ Reception & Records: Student documentation and registration\n✓ Board Room: Meeting spaces\n\nSports & Recreation:\n✓ Sports Grounds: Athletic fields for various sports\n✓ Volleyball Court: Dedicated volleyball facility\n✓ Netball Court: Basketball/netball area\n✓ Assembly Grounds: Large outdoor gathering space\n✓ Recreation Areas: Student leisure facilities\n\nUtility Infrastructure:\n✓ Water Storage Facilities: Reliable water supply systems\n✓ Electricity Supply: Campus-wide power infrastructure\n✓ Sanitation Facilities: Modern bathrooms and latrines\n✓ Medical/Health Services: Basic healthcare facilities\n✓ Security Infrastructure: Campus safety systems\n\nRecent Infrastructure Development:\nThe school continues to improve facilities in line with:\n• Government digital learning policies\n• CBE implementation requirements\n• Student capacity increases\n• Modern educational standards\n\nFor campus tours and detailed facility information, contact the school administration.",
    followUp: [
      "Does the school have internet?",
      "What sports facilities are available?",
      "Are there medical facilities?"
    ],
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // BOARDING LIFE
  // ════════════════════════════════════════════════════════════════

  boarding: {
    keywords: [
      "boarding",
      "hostel",
      "dormitory",
      "accommodation",
      "residence",
      "living at school",
      "boarding life",
      "dorm life",
      "house system",
      "prep time"
    ],
    trainingPhrases: [
      "what is boarding life like",
      "where do students stay",
      "how are dormitories organized",
      "what is the daily routine",
      "what time do students wake up",
      "what are prep hours",
      "how are students supervised",
      "what happens on weekends",
      "are there visiting days",
      "what food is served",
      "is boarding compulsory",
      "how many dormitories are there",
      "what should students bring",
      "how safe is boarding life"
    ],
    response:
      "Boarding Life at Kangaru Girls Senior School:\n\nWhat is Boarding School Life?\nBoarding at Kangaru Girls Senior School provides a structured, supportive environment where students develop independence, discipline, teamwork, and leadership skills while pursuing academic excellence.\n\nDaily Structure:\n• Morning Assemblies: School-wide gatherings for announcements and inspirational talks\n• Classes: Structured academic lessons throughout the day\n• Lunch & Breaks: Supervised meal times and recreation\n• Afternoon Activities: Sports, clubs, co-curricular activities\n• Evening Preps: Structured homework and study sessions\n• Dinner: Communal meals in the dining hall\n• Evening Programs: Cultural events, discussions, entertainment\n• Lights Out: Regulated sleep schedules\n\nHousing System:\n• Multiple boarding houses/dormitories\n• House-based community and accountability\n• House leadership and mentorship programs\n• Inter-house competitions (academic, sports, cultural)\n• Resident supervisors and house parents\n\nBoarding Experience Benefits:\n✓ 24/7 academic support and guidance\n✓ Structured environment for learning\n✓ Strong peer communities and friendships\n✓ Leadership development opportunities\n✓ Character formation and discipline\n✓ Safe, secure learning environment\n✓ Equal access to all resources\n✓ Preparation for university and independent life\n\nWeekend Activities:\n• Sports competitions\n• Cultural programs\n• Educational field trips\n• Recreation and relaxation\n• Family visiting days (as per calendar)\n• Community service projects\n\nStudent Support:\n• House parents and resident staff\n• School counselors and advisors\n• Medical and health services\n• Peer mentoring systems\n• Disciplinary guidance\n\nNote: Detailed information about specific house names and individual house traditions may be accessed through the school administration.",
    followUp: [
      "What is the daily schedule like?",
      "What weekend activities are available?",
      "How are students supervised?"
    ],
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // STUDENT LIFE & CO-CURRICULAR ACTIVITIES
  // ════════════════════════════════════════════════════════════════

  studentLife: {
    keywords: [
      "student life",
      "clubs",
      "activities",
      "co curricular",
      "co-curricular",
      "sports",
      "games",
      "music",
      "drama",
      "debate",
      "journalism",
      "science congress",
      "what can students do"
    ],
    trainingPhrases: [
      "what clubs are available",
      "what sports do you offer",
      "can i join debate club",
      "do you have music festivals",
      "do you participate in drama festivals",
      "what co curricular activities are available",
      "what can students do after class",
      "how do i join a club",
      "do you have student leadership opportunities",
      "can i become a prefect",
      "what competitions do you attend",
      "what talents can students develop",
      "what happens during weekends",
      "do you have a journalism club"
    ],
    response:
      "Student Life & Co-Curricular Activities at Kangaru Girls Senior School:\n\nSports & Athletics:\n✓ Athletics: Track and field events\n✓ Volleyball: Competitive volleyball teams\n✓ Netball: Inter-house and inter-school matches\n✓ Basketball: Basketball competitions\n✓ Tennis: Tennis programs\n✓ Other Sports: Various athletic pursuits\n✓ Inter-house Sports Competitions: Building school spirit\n✓ County & National Championships: Representing the school\n\nCultural & Performing Arts:\n✓ Music Festival: Annual school music competition\n✓ Drama Festival: Theater and dramatic performances\n✓ Dance Performances: Cultural and contemporary dance\n✓ Choir: School music groups\n✓ Band: School musical ensembles\n✓ Cultural Events: Celebration of diverse cultures\n\nIntellectual & Academic Clubs:\n✓ Debate Club: Speech and debate competitions\n✓ Journalism Club: School newspaper and publications\n✓ Science Congress: Scientific research and presentations\n✓ Math Club: Mathematics enrichment\n✓ Language Clubs: English and Kiswahili clubs\n✓ Academic Clinics: Subject-specific support\n\nLeadership & Personal Development:\n✓ Student Council: School governance participation\n✓ Class Prefects: Student leadership roles\n✓ House Leadership: House captain and committee positions\n✓ Leadership Programs: Training in leadership skills\n✓ Mentoring Systems: Peer support and guidance\n✓ Character Development: Building integrity and values\n\nSpiritual & Social Clubs:\n✓ Christian Union: Faith-based community\n✓ Young Christian Students (YCS): Spiritual programs\n✓ Environmental Club: Sustainability and conservation\n✓ Social Justice Initiatives: Community engagement\n✓ Outreach Programs: Service to surrounding communities\n\nOther Opportunities:\n✓ School Committees: Various student committees\n✓ Field Trips: Educational excursions\n✓ Exchange Programs: Inter-school visits\n✓ Community Projects: Social responsibility\n✓ Skill Development Workshops: Various training programs\n\nBenefits of Co-Curricular Participation:\n• Develop talents and interests beyond academics\n• Build confidence and public speaking skills\n• Create lasting friendships\n• Discover passions and career interests\n• Develop teamwork and collaboration\n• Enhance university applications\n• Foster school pride and community\n• Build well-rounded personalities\n\nStudents are encouraged to actively participate in clubs and activities that match their interests and strengths.",
    followUp: [
      "What sports teams can I join?",
      "Are there music or drama opportunities?",
      "How do I join a club?"
    ],
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // STUDENT SUPPORT & COUNSELLING
  // ════════════════════════════════════════════════════════════════

  studentSupport: {
    keywords: [
      "counselling",
      "counseling",
      "mental health",
      "career guidance",
      "support",
      "guidance",
      "welfare",
      "counselor",
      "psychology",
      "wellbeing",
      "student health",
      "academic support"
    ],
    trainingPhrases: [
      "is there counselling available",
      "does the school have a counselor",
      "where can i get mental health support",
      "what career guidance is available",
      "can i speak to a counselor",
      "does the school support student wellbeing",
      "how does the school help with stress",
      "what support services are available",
      "can i get academic support",
      "where can i get help with personal issues",
      "does the school have a psychology service",
      "how does the school support struggling students"
    ],
    response:
      "Student Support & Counselling Services at Kangaru Girls Senior School:\n\nWellness & Mental Health Support:\n✓ School Counselors: Trained professionals providing mental health support\n✓ Confidential Counselling: Private, secure counselling sessions\n✓ Mental Health Resources: Information and guidance on psychological wellbeing\n✓ Stress Management: Support for managing academic and personal stress\n✓ Peer Support Programs: Student-to-student mentoring and support\n✓ Crisis Intervention: Immediate support for students in crisis\n\nAcademic Support Services:\n✓ Academic Clinics: Subject-specific tutoring and support\n✓ Study Guidance: Help with study skills and time management\n✓ Exam Preparation: Special sessions before major examinations\n✓ Remedial Programs: Additional support for struggling students\n✓ Learning Assessments: Identifying learning needs and support strategies\n\nCareer Guidance:\n✓ Career Counseling: One-on-one career guidance sessions\n✓ Career Exploration: Learning about different career paths\n✓ University Preparation: Guidance on university selection and application\n✓ Subject Choice Support: Help choosing subjects aligned with career goals\n✓ Professional Mentorship: Alumni and professionals sharing career insights\n✓ Job Search Skills: Resume writing, interview preparation\n\nPersonal & Social Support:\n✓ Life Skills Development: Building coping and interpersonal skills\n✓ Values Education: Character development and ethical guidance\n✓ Peer Mediation: Resolving conflicts between students\n✓ Spiritual Guidance: Spiritual counselors available\n✓ Family Support: Communication with parents on student welfare\n✓ Disciplinary Support: Guidance on behavioral expectations\n\nHealth & Wellness Services:\n✓ Medical Services: On-campus health facilities\n✓ Health Education: Wellness and preventive health programs\n✓ Sexual Health Education: Age-appropriate health and safety education\n✓ Nutrition Support: Guidance on healthy eating\n✓ Exercise Programs: Physical wellness activities\n\nSpecial Needs Support:\n✓ Inclusive Education: Support for students with diverse learning needs\n✓ Disability Support: Accommodations for students with disabilities\n✓ Accessibility Services: Ensuring equal access to school programs\n\nHow to Access Support:\n• Schedule an appointment with school counselor\n• Speak with House Parent or Resident Staff\n• Contact the Guidance Department\n• Reach out to Class Teacher or Form Tutor\n• Call school administration office\n• Speak with Student Council representatives\n\nNote: For detailed information on current support services, availability, and how to schedule appointments, contact the school counselling department directly through the school administration office.",
    followUp: [
      "How do I speak to the school counselor?",
      "What career guidance is available?",
      "How does the school support student wellbeing?"
    ],
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // SCHOOL CULTURE & VALUES
  // ════════════════════════════════════════════════════════════════

  culture: {
    keywords: [
      "culture",
      "values",
      "discipline",
      "leadership",
      "integrity",
      "mission",
      "vision",
      "character",
      "core values",
      "school motto"
    ],
    trainingPhrases: [
      "what is your mission",
      "what is your vision",
      "what are your core values",
      "what values does the school promote",
      "how does the school promote discipline",
      "what is the school culture like",
      "what traditions does the school have",
      "what does the school believe in",
      "what is the school ethos"
    ],
    response:
      "School Culture & Core Values at Kangaru Girls Senior School:\n\nCore Values:\nKangaru Girls Senior School is built on the foundation of:\n\n✓ DISCIPLINE: Maintaining order, respect, and responsibility\n✓ INTEGRITY: Honesty, trustworthiness, and ethical conduct\n✓ EXCELLENCE: Pursuing high standards in all endeavors\n✓ LEADERSHIP: Taking initiative and inspiring others\n✓ TEAMWORK: Collaboration and mutual support\n✓ PROFESSIONALISM: Conducting ourselves with pride and competence\n\nMission:\nTo develop well-rounded, confident, responsible, and academically excellent young women prepared to make meaningful contributions to society.\n\nVision:\nTo be a leading center of academic excellence and holistic student development in Eastern Kenya.\n\nSchool Ethos:\n• Academic Excellence: High standards in teaching and learning\n• Student Development: Growth in character, skills, and knowledge\n• Community Responsibility: Engagement with local and national communities\n• Inclusive Environment: Welcoming and supportive to all students\n• Safety & Security: Secure environment for learning and growth\n• Respect & Dignity: Treating all members of the school community with respect\n\nHistorical Heritage:\nThe school's values are rooted in its historical connection to Kangaru School and the community's commitment to quality education since 1948.\n\nSchool Traditions:\n• Assembly programs and announcements\n• Prize-giving ceremonies celebrating achievements\n• House competitions building school spirit\n• Inter-school academic and sports competitions\n• Community service projects\n• Spiritual programs and reflections\n• Annual school events and celebrations\n\nNote: For more informationvisit the about page.",
    followUp: [
      "What is the school's mission?",
      "What are school traditions?",
      "How does the school promote discipline?"
    ],
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // SCHOOL IDENTITY
  // ════════════════════════════════════════════════════════════════

  identity: {
    keywords: [
      "identity",
      "colours",
      "colors",
      "uniform",
      "school colours",
      "school colors",
      "blazer",
      "tie",
      "dress code",
      "mascot",
      "motto"
    ],
    trainingPhrases: [
      "what does the school uniform look like",
      "do you have school ids",
      "what are the school colours",
      "what is the school mascot",
      "what is the school motto",
      "what is the school anthem",
      "what color is the uniform",
      "describe the uniform",
      "what symbols does the school have",
      "what is the school logo",
      "what dress code does the school have"
    ],
    response:
      "School Identity & Symbols:\n\nSchool Colours:\nGreen, White, and Grey\n• These colours reflect the school's historical connection to Kangaru School\n• Represent growth, purity, and stability\n• Prominently displayed in uniforms and school insignia\n\nSchool Uniform:\nStandard school uniform includes:\n✓ Green Blazer: Main uniform jacket\n✓ White Shirt: Worn with blazer\n✓ Green Tie: Coordinating with blazer\n✓ Grey Skirt: Lower uniform\n✓ Black Shoes: Formal footwear\n\nUniform Guidelines:\n• Uniform standards may be reviewed periodically\n• Specific measurements and style requirements available through school administration\n• Proper uniform wearing demonstrates school identity and discipline\n• Weekend or casual dress codes may differ from weekday requirements\n\nSchool Mascot & Symbols:\nNote: The lion mascot and motto \"Serve and Lead\" officially belong to Kangaru School. Due to historical ties, these symbols are sometimes informally associated with Kangaru Girls, but have not been independently verified by the girls' school itself.\n\nOfficial School Motto:\nThe official school motto for Kangaru Girls Senior School has not been extensively documented in public records. This represents an important piece of school history awaiting formal documentation.\n\nSchool Anthem:\nThe official school anthem and its complete lyrics are part of important school heritage currently not widely available in public archives.\n\nFor official information on school symbols and their meanings, contact the school administration directly.",
    followUp: [
      "What does the school uniform look like?",
      "What are the school colours?",
      "What is the school motto?"
    ],
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // EVENTS & CELEBRATIONS
  // ════════════════════════════════════════════════════════════════

  events: {
    keywords: [
      "events",
      "event",
      "sports day",
      "open day",
      "open house",
      "competition",
      "festival",
      "ceremony",
      "prize giving",
      "celebration",
      "when are events held"
    ],
    trainingPhrases: [
      "when is sports day",
      "what activies do you have?",
      "how do i know more about the events",
      "when is prize giving day",
      "when are open days",
      "what events does the school have",
      "when can parents visit",
      "when is visiting day",
      "what celebrations happen at school",
      "when do you celebrate annual events",
      "what competitions do you hold",
      "when is the school festival"
    ],
    response:
      "School Events & Celebrations at Kangaru Girls Senior School:\n\nAnnual Events Calendar:\n\nAcademic Events:\n✓ Opening of School Year: Commencement ceremonies\n✓ Academic Clinics: Subject-specific support sessions\n✓ Monthly Assemblies: School-wide announcements and recognition\n✓ Mid-term Assessments: Ongoing student evaluation\n✓ Term-end Examinations: Formal assessment periods\n✓ Prize-Giving Ceremonies: Recognition of academic achievements\n\nSports Events:\n✓ Sports Day: Annual inter-house athletics competition\n✓ Sports Competitions: Volleyball, netball, and other tournaments\n✓ Inter-school Matches: Competitions with other schools\n✓ County Championships: Participation in county-level competitions\n✓ National Competitions: Representation at national level\n\nCultural Events:\n✓ Music Festival: Annual music competition and performances\n✓ Drama Festival: Theater performances and drama competitions\n✓ Cultural Day: Celebration of diverse cultures\n✓ Dance Performances: Cultural and contemporary dance events\n✓ Talent Shows: Student performances and entertainment\n\nAcademic Competitions:\n✓ Debate Competitions: Interschool and inter-house debates\n✓ Science Congress: Scientific research presentations\n✓ Journalism Contests: Writing and publication competitions\n✓ Quiz Competitions: Academic knowledge tests\n✓ Inter-house Academic Competitions: Building healthy competition\n\nSpecial Occasions:\n✓ School Anniversary Celebrations: Marking important dates\n✓ Graduation/Awards Ceremonies: Recognizing departing class\n✓ Open Days: Family visits and school showcase\n✓ Visiting Days: Parent and guardian visits\n✓ Leadership Induction: Installing new student leaders\n\nCommunity & Spiritual Events:\n✓ Church Services: Sunday worship and spiritual programs\n✓ Prayer Meetings: Daily spiritual reflection\n✓ Community Service Projects: Outreach to surrounding communities\n✓ Environmental Initiatives: Conservation and sustainability events\n✓ Social Justice Programs: Addressing community issues\n\nRecent Notable Events:\n✓ 2025: KCSE Class of 2024 celebrations following strong national results\n✓ 2026: Student unrest incident (March) - drew national attention\n✓ Ongoing: Regular academic and co-curricular activities\n\nFor current event calendar and specific dates, visit the school website or contact the administration office.",
    followUp: [
      "When is sports day?",
      "Are there visiting days for parents?",
      "What competitions does the school participate in?"
    ],
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // SCHOOL LEADERSHIP & MANAGEMENT
  // ════════════════════════════════════════════════════════════════

  leadership: {
    keywords: [
      "principal",
      "deputy principal",
      "head teacher",
      "administration",
      "management",
      "leadership",
      "board",
      "board of management",
      "who runs the school",
      "school management"
    ],
    trainingPhrases: [
      "who is the principal",
      "who is the headmistress",
      "who are the board members",
      "who manages the school",
      "what is the organizational structure",
      "who is the deputy principal",
      "who is in leadership",
      "how is the school governed"
    ],
    response:
      "School Leadership & Management Structure:\n\nAdministration:\nKangaru Girls Senior School is managed by:\n\n✓ PRINCIPAL: Chief executive officer of the school\n• Overall responsibility for school operations\n• Academic and administrative leadership\n• Staff management and development\n• Strategic planning and school vision\n\n✓ DEPUTY PRINCIPAL(S): Assistant leadership\n• Support principal in all administrative functions\n• Oversight of specific departments or areas\n• Student discipline and welfare\n• Academic coordination\n\n✓ SENIOR TEACHERS: Department heads\n• Subject-specific curriculum leadership\n• Teacher training and support\n• Departmental budgeting and planning\n\n✓ TEACHERS: Classroom instruction and student support\n• Direct student education\n• Assessment and feedback\n• Pastoral care and guidance\n\n✓ NON-TEACHING STAFF: Support services\n• Administration\n• Maintenance and facilities\n• Catering and food services\n• Security and grounds\n• Medical/health services\n\nGovernance:\n✓ BOARD OF MANAGEMENT:\n• Sets school policy and strategic direction\n• Oversees financial management\n• Ensures compliance with government regulations\n• Represents community interests\n• Meets regularly for governance decisions\n\n✓ PARENT-TEACHER ASSOCIATION (PTA):\n• Facilitates parent participation\n• Supports school development projects\n• Engages in fundraising\n• Bridges home-school communication\n\nStudent Leadership:\n✓ STUDENT COUNCIL: Student government representatives\n✓ HOUSE LEADERSHIP: House captains and committees\n✓ CLASS PREFECTS: Class-level student leaders\n✓ CLUB LEADERS: Co-curricular activity leaders\n\nExternal Oversight:\n• KNEC: Examination administration\n• Education Quality Assurance: School inspections\n• Local Government: County education office\n\nHistorical Note:\nA complete list of principals serving since 1989 is not currently available in public records. This represents an important element of school history for documentation and archiving.\n\nFor information about current school leadership, visit the about page or the staff page.",
    followUp: [
      "Who is the current principal?",
      "How can I contact school management?",
      "What is the Board of Management?"
    ],
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // STUDENT POPULATION & DEMOGRAPHICS
  // ════════════════════════════════════════════════════════════════

  population: {
    keywords: [
      "students",
      "population",
      "enrollment",
      "enrolment",
      "how many students",
      "teachers",
      "staff",
      "student body",
      "capacity"
    ],
    response:
      "Student Population & Demographics:\n\nEnrollment Figures:\n• Estimated Current Student Population: 850–900 students\n• Form Levels: Four or more streams per class level\n• Enrollment Patterns: Varies annually based on admissions and retention\n\nClass Distribution:\n• Form 1: Multiple streams\n• Form 2: Multiple streams\n• Form 3: Multiple streams\n• Form 4: Multiple streams\n• (Additional streams may be added based on capacity and enrollment)\n\nStaffing:\n✓ Teaching Staff: \n✓ Non-Teaching Staff: Support personnel across various departments\n\nStudent Demographics:\n\nGeographic Distribution:\n• National: Qualified students from across Kenya\n• International: Limited international student enrollment\n\nAge Range:\n• Typical age: 13–18 years\n• Form 1: Approximately 13–14 years\n• Form 4: Approximately 17–18 years\n\nCommunity Background:\nThe school serves diverse communities including:\n✓ Embu communities\n✓ Mbeere communities\n✓ Mwea communities\n✓ Kirinyaga communities\n✓ Meru communities\n✓ Tharaka-Nithi communities\n✓ Urban communities from Nairobi\n✓ Other Kenyan regions\n\nSchool Capacity:\n• Current capacity: Approximately 900–1000 students\n• Infrastructure: Being continuously improved to serve growing enrollment\n• Class Sizes: Maintained at manageable levels for quality instruction\n\nNote: Exact annual enrollment figures and historical enrollment data are maintained in school records but not all are publicly available. For specific demographic information, contact the school administration.",
    followUp: [
      "What is the teacher-to-student ratio?",
      "How many Form 1 students are admitted yearly?",
      "What countries do international students come from?"
    ],
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // COMMUNITY & ALUMNI
  // ════════════════════════════════════════════════════════════════

  community: {
    keywords: [
      "community",
      "county",
      "region",
      "counties",
      "where students come from",
      "local community",
      "regional",
      "location",
      "communities served"
    ],
    response:
      "Community Engagement & Service Areas:\n\nGeographic Communities Served:\n\nPrimary Service Area - Embu County:\n• Located in Embu County's Manyatta Constituency\n• Strong roots in Kangaru village and surrounding areas\n• Close connections with Embu town\n• Serves majority of student population from Embu County\n\nSecondary Service Areas - Eastern Kenya:\n• MBEERE COMMUNITY: Students and parents from this region\n• MWEA COMMUNITY: Agricultural region representation\n• KIRINYAGA COUNTY: Mountain region communities\n• MERU COUNTY: Highland communities\n• THARAKA-NITHI COUNTY: Northern region students\n\nWider Service Areas:\n• Nairobi County: Urban students gaining admission\n• Other Kenyan Counties: Nationally placed students\n• Total Reach: Students from diverse background across Kenya\n\nHistorical Community Links:\nKangaru Girls maintains strong traditional connections with Eastern Province communities (now divided into multiple counties):\n✓ Embu\n✓ Mbeere\n✓ Mwea\n✓ Kirinyaga\n✓ Meru\n✓ Tharaka-Nithi\n\nCommunity Integration:\n• Many families have educated multiple generations at Kangaru Girls or Kangaru Boys\n• Strong alumni networks across eastern Kenya\n• Community ties with local leadership\n• Engagement in surrounding villages\n• Support for local development projects\n\nSchool-Community Initiatives:\n✓ Community Service Projects: Students engage in service learning\n✓ Educational Partnerships: Collaboration with local schools\n✓ Development Support: School involvement in community development\n✓ Environmental Programs: Conservation efforts\n✓ Health Awareness: Community health initiatives\n✓ Economic Development: Skills sharing with communities\n\nThe school views itself as an institution serving not just individual families but entire communities with a commitment to regional development and excellence.",
    followUp: [
      "What is the school's relationship with Embu town?",
      "Do students return to their communities?",
      "How does the school support local communities?",
      "where is the school located",
      "where are you located",
      "tell me your location"
    ],
    requiresLogin: false,
  },

  alumni: {
    keywords: [
      "alumni",
      "old girls",
      "graduates",
      "former students",
      "past students",
      "alumni association",
      "alumni network",
      "where are alumni now"
    ],
    trainingPhrases: [
      "where are alumni now",
      "how can i join the alumni network",
      "are there reunion events",
      "can alumni mentor current students",
      "what are alumni doing",
      "how do i stay connected",
      "where are old girls now",
      "what is the alumni community like",
      "do you have alumni associations"
    ],
    response:
      "Alumni & Graduate Network:\n\nAlumni Community:\nKangaru Girls Senior School has an extensive network of alumni serving across Kenya and beyond.\n\nAlumni Geographic Distribution:\n✓ Nationally: Serving in all regions of Kenya\n✓ Regionally: Concentrated in Eastern Kenya (Embu, Meru, Kirinyaga, Mbeere)\n✓ Internationally: Some graduates work abroad\n✓ Diaspora: Alumni maintaining connection to the school globally\n\nAlumni Professional Fields:\n✓ Education: Teachers, administrators, university lecturers\n✓ Healthcare: Doctors, nurses, health professionals\n✓ Business: Entrepreneurs, business leaders\n✓ Government: Civil servants, public administrators\n✓ Law & Justice: Lawyers, judges, legal professionals\n✓ Technology: Engineers, IT professionals, tech innovators\n✓ Arts & Media: Journalists, writers, creative professionals\n✓ Community Service: NGO leaders, social workers\n✓ Military & Security: Officers in security forces\n✓ Other Sectors: Diverse professional pursuits\n\nAlumni Networks:\n• WhatsApp Groups: Year groups maintaining connections\n• Facebook Pages: Alumni community pages\n• Reunion Events: Annual gatherings and school visits\n• Social Media: Shared memories and updates\n• School Events: Alumni attendance at major school events\n• Mentorship Programs: Alumni advising current students\n• Fundraising Initiatives: Alumni support for school development\n\nAlumni Contributions:\n✓ Career Mentorship: Advising current students\n✓ Fundraising: Supporting school projects\n✓ Advocacy: Promoting school excellence\n✓ Professional Expertise: Contributing to school programs\n✓ Role Modeling: Inspiring current students\n✓ Network Building: Connecting school to broader communities\n✓ Institutional Memory: Preserving school history\n\nNotable Alumni Achievements:\nWhile a comprehensive public database of notable alumni does not yet exist, many Kangaru Girls graduates have achieved recognition in their fields across Kenya.\n\nRecent Alumni Engagement:\n• 2025: Alumni celebrations following KCSE Class of 2024 successes\n• Ongoing: Regular alumni networking and mentorship\n• Future: Expanded alumni database and networking platform being developed\n\nFor Alumni Information & Connection:\n• Join alumni social media groups\n• Attend school reunions and events\n• Contact the school's alumni coordinator\n• Participate in mentorship programs\n• Support school development initiatives\n\nThe school values its alumni as ambassadors and seeks to maintain lifelong connections with graduates.",
    followUp: [
      "How can I join the alumni network?",
      "Are there reunion events?",
      "Can alumni mentor current students?"
    ],
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // SISTER SCHOOL & HISTORICAL RELATIONSHIPS
  // ════════════════════════════════════════════════════════════════

  sisterSchool: {
    keywords: [
      "kangaru boys",
      "kangaru school",
      "sister school",
      "brother school",
      "relationship",
      "shared history",
      "twin school"
    ],
    response:
      "Kangaru School & Historical Relationship:\n\nShared Heritage:\nKangaru Girls Senior School and Kangaru School (boys' institution) share a profound historical connection spanning over 75 years.\n\nHistorical Timeline:\n\n1948: Kangaru School opens as the primary educational institution\n\n1949: First girls admitted as day scholars to Kangaru School\n\n1973 (July): Embu Girls Secondary School merges with Kangaru School, creating a mixed co-educational institution\n• One principal leads both\n• Two deputy principals oversee operations\n• Educational merger aims to improve performance through healthy competition between boys and girls\n\n1989: Historic Separation\n• Mixed institution splits into separate institutions\n• Kangaru School (boys): Continues as boys' institution\n• Kangaru Girls Senior School: Established as independent girls' institution\n• This marks the official founding of Kangaru Girls as a standalone school\n\nCurrent Relationship:\n✓ Sister Schools: Maintained strong educational partnership\n✓ Shared Identity: Both trace heritage to 1948 founding\n✓ Community Ties: Families educate children at both schools\n✓ Alumni Networks: Many families have members of both communities\n✓ Academic Competition: Inter-school sports and academic events\n✓ Shared Facilities: May coordinate certain programs or activities\n✓ Joint Celebrations: Commemorate shared history\n\nSchool Identity Sharing:\n• School Colours: Both share green and white colours (historically significant)\n• Symbols: Kangaru School's lion mascot and \"Serve and Lead\" motto are historically shared\n• Location: Adjacent campuses in Kangaru area\n• Community: Both view themselves as serving Eastern Kenya communities\n\nDifferences:\n• Kangaru School: Boys' institution, co-educational history\n• Kangaru Girls: Girls' institution, separate since 1989\n• Governance: Independently managed institutions\n• Leadership: Separate principals and administrative structures\n• Curriculum: Both implement CBE but with independent planning\n\nLegacy of the Merger/Separation:\nThe 1973 merger and 1989 separation represent important milestones in Kenyan education:\n• Reflected broader education policies of those eras\n• Demonstrated commitment to gender-specific education\n• Showcased educational excellence in Eastern Kenya\n• Illustrates evolution of secondary education in Kenya\n\nThe two institutions continue to honor their shared heritage while maintaining distinct identities and missions.",
    followUp: [
      "When were the schools separated?",
      "Do the schools compete together?",
      "Why are they sister schools?",
      "Which is the nearest boys school",
      "Tell me more about kangaru history"
    
    ],
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // RECENT NEWS & NOTABLE EVENTS
  // ════════════════════════════════════════════════════════════════

  news: {
    keywords: [
      "news",
      "latest",
      "recent",
      "recent events",
      "updates",
      "current affairs",
      "what's new",
      "unrest",
      "incident",
      "2026"
    ],
    response:
      "Recent News & Notable Events:\n\n2025 KCSE Results & Celebrations:\n• Kangaru Girls Class of 2024 recorded exceptional KCSE performance\n• Results released in January 2025\n• 131 candidates sitting with strong pass rate\n• 2 A-grade students demonstrating excellence\n• 99%+ pass rate (130/131 qualified for university)\n• School held celebrations recognizing achievements\n• Performance reflects school's continued commitment to academic excellence\n\nMarch 2026 Student Unrest Incident:\n• Date: March 2026\n• Incident: Students reportedly left school compound at night\n• Weather: Heavy rainfall during incident\n• Documentation: Videos circulated on social media showing students in Embu town\n• Parent Response: Concerns raised about student safety\n• Official Response: Authorities did not immediately publish detailed explanation\n• Status: Incident drew national attention\n• Current Status: Investigation and review processes ongoing\n\nOngoing School Operations:\n✓ Continued Implementation: Competency-Based Curriculum rollout\n✓ Infrastructure: Ongoing facility improvements and modernization\n✓ Academic Programs: Strong focus on maintaining KCSE excellence\n✓ Co-curricular: Active participation in sports, cultural events\n✓ Student Life: Vibrant boarding and community experience\n\nRecent Achievements:\n✓ 2024 KCSE: Outstanding academic performance\n✓ Sports: Active participation in county and national competitions\n✓ Cultural Programs: Participation in music and drama festivals\n✓ Digital Learning: Implementation of ICT infrastructure improvements\n✓ Community Engagement: Ongoing service and outreach programs\n\nFor Latest Updates:\n• Check official school website\n• Follow school social media pages\n• Contact school administration office\n• Read recent school newsletters and announcements\n\nNote: For sensitive matters and ongoing investigations, official school communications should be consulted for most current information.",
    followUp: [
      "What caused the March 2026 incident?",
      "What were the 2024 KCSE results?",
      "What is the school doing to improve safety?"
    ],
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // DIGITAL PRESENCE & INFORMATION CHANNELS
  // ════════════════════════════════════════════════════════════════

  digital: {
    keywords: [
      "website",
      "facebook",
      "social media",
      "youtube",
      "online",
      "digital presence",
      "how to find",
      "where online"
    ],
    response:
      "Digital Presence & Communication Channels:\n\nOfficial School Channels:\n✓ Official Website: School's main online hub (URL available through web search)\n✓ Email: kangarugirls@yahoo.com (note: may have been updated)\n✓ Postal Address: P.O. Box 1094-60100, Embu, Kenya\n\nSocial Media Presence:\n✓ Facebook Pages: Multiple pages managed by school community\n  • Official school Facebook page\n  • Alumni community pages\n  • Parent groups\n  • Student community pages\n\n✓ YouTube Channel: Video content including:\n  • KCSE celebrations\n  • School events\n  • Academic programs\n  • Student life footage\n  • School tours and promotions\n\n✓ WhatsApp Groups: Alumni and parent networks\n\nSchool Listing Platforms:\n✓ Educational Directories: Listed on school database websites\n✓ KNEC Registry: Examination administration records\n✓ County Education Database: Embu County education office records\n\nCommunication Methods:\n• Email: Official school email (kangarugirls@yahoo.com)\n• Phone: Contact through school official line 0796214804\n• Office Visits: Direct contact at school \n• Contact Form: Online inquiry submission\n• Parent Meetings: Structured communication schedules\n• School Newsletter: Periodic updates and announcements\n\nInformation Resources:\n✓ School Website: Most comprehensive online resource\n✓ Brochures: School profile and program information\n✓ News Archives: School announcements and updates\n\nOnline Engagement:\n• Follow official social media accounts for updates\n• Subscribe to school newsletter\n• Join parent/alumni networks\n• Participate in online events and forums\n• Submit online inquiries through official channels\n\nNote: Digital presence is growing but remains more limited compared to some other schools. The school continues to expand its online communication and engagement platforms.\n\nFor most current contact information, visit our contact page for more options.",
    followUp: [
      "What is the school's website?",
      "How do I follow the school on Facebook?",
      "Can I submit inquiries online?"
    ],
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // RESEARCH GAPS & MISSING INFORMATION
  // ════════════════════════════════════════════════════════════════

  research: {
    keywords: [
      "records",
      "missing information",
      "history",
      "principal list",
      "school anthem",
      "house names",
      "photos",
      "archives",
      "where can i find",
      "what do we not know"
    ],
    response:
      "School Records & Research Gaps:\n\nWhat We Know:\n✓ School founding and historical timeline\n✓ Location and geographic details\n✓ Academic programs and curriculum\n✓ KCSE performance (recent years)\n✓ Student life and co-curricular activities\n✓ General facilities and infrastructure\n✓ Relationship with Kangaru School\n✓ Contact information and community\n\nWhat We Do NOT Yet Have (Research Gaps):\n\nAdministrative Records:\n✗ Complete list of principals (1989–2026)\n✗ Deputy principals by year\n✗ Historical staffing records\n✗ Detailed Board of Management records\n✗ Annual budget information\n\nHistorical Information:\n✗ Official school motto (GROW IN GRACE )\n✗ House names and systems\n✗ Historical photographs (pre-1990)\n✗ Historical enrollment figures\n✗ Year-by-year KCSE results (complete record)\n✗ School magazine archives\n✗ Prize-giving program archives\n\nCultural Records:\n✗ Historical uniform variations\n✗ School traditions documentation\n✗ Notable events history\n✗ School anniversaries and celebrations\n✗ Memorable achievements timeline\n\nAlumni Information:\n✗ Comprehensive alumni database\n✗ Notable alumni records\n✗ Alumni achievement documentation\n✗ Class reunion records\n✗ Alumni contribution history\n\nOther Missing Records:\n✗ Complete sports achievements history\n✗ Detailed co-curricular activity records\n✗ Historical discipline policies\n✗ Educational infrastructure development timeline\n✗ Research publications about the school\n\nWhere Hidden Records Are Stored:\n\nSchool Archives (On-Site):\n→ Admission registers\n→ Staff registers\n→ School magazines\n→ Annual reports\n→ Board meeting minutes\n→ Prize-giving programs\n→ Inspection reports\n→ Development plans\n→ Financial records\n\nCounty/Government Records:\n→ Embu County Education Office\n→ Sub-county education offices\n→ Ministry of Education files\n→ Inspection reports\n→ Principal appointment letters\n→ Infrastructure grant records\n\nNational Archives:\n→ Colonial education reports\n→ Embu District annual reports\n→ Provincial education records\n→ Missionary education documentation\n→ Historical inspection reports\n\nNewspaper Archives:\n→ The Daily Nation\n→ The Standard\n→ Taifa Leo\n→ The Star Kenya\n→ Local Embu publications\nSearchable via: \"Kangaru Girls\", \"Kangaru School\", \"prize giving\", \"KCSE results\"\n\nAlumni Sources (Oral History):\n→ First independent class (1989)\n→ Retired teachers\n→ Former principals\n→ Non-teaching staff\n→ Alumni association leaders\n→ Former Board members\n→ Kangaru village residents\n\nHow to Access Hidden Records:\n\n1. Direct School Contact:\n   • Request access to school archives\n   • Ask for historical records\n   • Interview school administrators\n   • Participate in school research projects\n\n2. Government Channels:\n   • Contact Embu County Education Office\n   • Request inspection reports\n   • Access ministry records\n   • Obtain official documentation\n\n3. Research & Documentation:\n   • Conduct newspaper archive searches\n   • Interview alumni and former staff\n   • Collect historical photographs\n   • Document oral histories\n   • Compile timeline information\n\n4. Collaborative Initiatives:\n   • Partner with school on history documentation\n   • Support school archive digitization\n   • Contribute research findings\n   • Help preserve institutional memory\n\nOur Research Limitation:\nThis knowledge base represents approximately 70–75% of discoverable information about Kangaru Girls Senior School. The remaining 25–30% exists in offline archives, institutional memory, and records not yet digitized or made publicly available.\n\nTo Complete the Record:\nA comprehensive school history requires:\n✓ Direct access to school archives\n✓ Interviews with key figures (past and current)\n✓ Newspaper article compilation\n✓ Alumni database development\n✓ Photograph collection and digitization\n✓ Historical timeline documentation\n✓ Record preservation project\n\nThe school's complete history represents invaluable institutional memory worth documenting and preserving for future generations.",
    followUp: [
      "How can I access school archives?",
      "Who can I interview about school history?",
      "How do I search newspaper archives?",
      "Can I help document school history?"
    ],
    requiresLogin: false,
  },

  // ════════════════════════════════════════════════════════════════
  // GENERAL & FALLBACK RESPONSES
  // ════════════════════════════════════════════════════════════════

  general: {
    keywords: [
      "help me",
      "what can you do",
      "available topics",
      "show options",
      "need assistance"
    ],
    response:
      "Welcome to Kangaru Girls Senior School!\n\n👋 Hello! I'm your school's AI Assistant & Digital Historian.\n\nI'm here to provide comprehensive information about Kangaru Girls Senior School, including:\n\n📚 HISTORY & HERITAGE:\nLearn about our founding in 1989, roots in Kangaru School (1948), and journey to becoming a leading extra-county school.\n\n🎓 ACADEMICS:\nExplore our CBE curriculum, KCSE performance (2024: 99%+ pass rate), and academic programs across STEM, Social Sciences, and Arts.\n\n🏫 FACILITIES & STUDENT LIFE:\nDiscover boarding life, co-curricular activities, sports, clubs, and vibrant student community.\n\n📍 PRACTICAL INFORMATION:\nFind location details, contact information, admissions procedures, and how to get in touch.\n\n🌟 COMMUNITY:\nUnderstand our service areas across Eastern Kenya, alumni network, and relationships with communities.\n\n🔍 SCHOOL ARCHIVE:\nAccess historical records, timelines, notable events, and information about school records and how to access them.\n\nYou can ask about:\n✓ School history and timeline\n✓ Admissions and enrollment\n✓ Academic programs and KCSE results\n✓ Facilities and boarding\n✓ Student life and activities\n✓ Location and directions\n✓ Contact information\n✓ Alumni and community\n✓ School culture and values\n✓ Events and celebrations\n✓ And much more!\n\nWhat would you like to know about Kangaru Girls Senior School?",
    followUp: [
      "Tell me about school history",
      "What are the academic programs?",
      "How do I apply?",
      "What is student life like?",
      "Where is the school located?",
      "Tell me about the school",
      "Do you have ongoing apprications"
      
    
    ],
    requiresLogin: false,
  },

  fallback: {
    keywords: [],
    response: "I'm not quit sure how to answer that . For any specific details kindly visit the school administration through the contact page",
    requiresLogin: false,
  },
};

// Enhanced matching: score-based intent classification with priority ordering
export function findMatchedTopic(userMessage) {
  const text = userMessage
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Topic priority: more specific topics rank higher
  const priorities = {
    greetings: 100,
    admissions: 90,
    fees: 90,
    curriculum: 85,
    academics: 85,
    performance: 80,
    contact: 80,
    location: 75,
    facilities: 70,
    boarding: 70,
    studentLife: 70,
    kcse2024: 75,
    history: 60,
    timeline: 60,
    about: 50,
    general: 10,
    fallback: 0,
  };

  let bestTopic = guestResponses.fallback;
  let highestScore = 0;

  for (const [key, topic] of Object.entries(guestResponses)) {
    // Combine keywords and training phrases
    const phrases = [
      ...(topic.keywords || []),
      ...(topic.trainingPhrases || []),
    ];

    let score = priorities[key] || 0;

    // Score each phrase match
    for (const phrase of phrases) {
      const normalizedPhrase = phrase.toLowerCase().trim();
      if (!normalizedPhrase) continue;

      // Exact match: highest score
      if (text === normalizedPhrase) {
        score += 50;
      }
      // Substring match: score by phrase length (longer = more specific)
      else if (text.includes(normalizedPhrase)) {
        const wordCount = normalizedPhrase.split(/\s+/).length;
        score += wordCount > 1 ? 15 : 8;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestTopic = topic;
    }
  }

  return bestTopic;
}

// Helper function to get all topics for AI training or documentation
export function getAllTopics() {
  return Object.keys(guestResponses).map((key) => ({
    topic: key,
    keywords: guestResponses[key].keywords,
  }));
}

// Statistics function
export function getKnowledgeBaseStats() {
  const topics = Object.keys(guestResponses).length;
  const totalKeywords = Object.values(guestResponses).reduce(
    (sum, topic) => sum + (topic.keywords?.length || 0),
    0
  );
  const totalResponseLength = Object.values(guestResponses).reduce(
    (sum, topic) => sum + (topic.response?.length || 0),
    0
  );

  return {
    totalTopics: topics,
    totalKeywords,
    averageKeywordsPerTopic: (totalKeywords / topics).toFixed(2),
    totalResponseCharacters: totalResponseLength,
    estimatedWords: Math.floor(totalResponseLength / 5),
    coverageAreas: [
      "Core Information",
      "History & Timeline",
      "Location & Geography",
      "Contact & Communication",
      "Admissions",
      "Fees",
      "Academics & Curriculum",
      "Performance & KCSE",
      "Facilities",
      "Boarding Life",
      "Student Life & Activities",
      "School Culture",
      "Identity & Symbols",
      "Events",
      "Leadership",
      "Population",
      "Community",
      "Alumni",
      "Sister School",
      "News",
      "Digital Presence",
      "Research Gaps",
    ],
  };
}
