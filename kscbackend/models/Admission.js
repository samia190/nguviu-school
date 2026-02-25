// models/Admission.js
import mongoose from "mongoose";

const AdmissionSchema = new mongoose.Schema({
  // Student Personal Information
  fullName: { type: String, required: true },
  assessmentNo: { type: String },
  dateOfBirth: { type: Date, required: true },
  placeOfBirth: { type: String },
  gender: { type: String, enum: ['Female', ''], default: 'Female' },
  nationality: { type: String, default: 'Kenyan' },
  birthCertEntryNo: { type: String },
  birthCertNo: { type: String },
  
  // Location Information
  homeCounty: { type: String },
  subCounty: { type: String },
  constituency: { type: String },
  location: { type: String },
  subLocation: { type: String },
  chiefName: { type: String },
  chiefAddress: { type: String },
  subChiefName: { type: String },
  
  // Contact Information
  postalAddress: { type: String },
  town: { type: String },
  email: { type: String },
  phone: { type: String },
  mobileNo: { type: String },
  
  // Previous School Information
  juniorSchool: { type: String },
  juniorSchoolAddress: { type: String },
  
  // Application Details
  applyingForGrade: { type: String },
  pathway: { type: String },
  subjectCombination: { type: String },
  favouriteActivity: { type: String },
  
  // Grades
  gradeKiswahili: { type: String },
  gradeEnglish: { type: String },
  gradeScience: { type: String },
  gradeMaths: { type: String },
  gradeCreativeArts: { type: String },
  gradePreTechnical: { type: String },
  gradeAgriculture: { type: String },
  gradeSocialStudies: { type: String },
  gradeCRE: { type: String },
  
  // Religion
  religion: { type: String },
  denomination: { type: String },
  yearOfBaptism: { type: String },
  
  // Father's Information
  fatherName: { type: String },
  fatherOccupation: { type: String },
  fatherIdNo: { type: String },
  fatherAddress: { type: String },
  fatherTelephone: { type: String },
  
  // Mother's Information
  motherName: { type: String },
  motherOccupation: { type: String },
  motherIdNo: { type: String },
  motherAddress: { type: String },
  motherTelephone: { type: String },
  
  // Guardian's Information
  guardianName: { type: String },
  guardianOccupation: { type: String },
  guardianIdNo: { type: String },
  guardianAddress: { type: String },
  guardianTelephone: { type: String },
  guardianEmail: { type: String },
  guardianPhone: { type: String },
  
  // Medical & Special Needs
  specialMedicalCondition: { type: String },
  specialNeeds: { type: String },
  
  // Additional
  parentComments: { type: String },
  message: { type: String },
  grade: { type: String },
  
  // Declarations
  studentPromise: { type: Boolean, default: false },
  parentConfirmFit: { type: Boolean, default: false },
  parentUnderstandDiet: { type: Boolean, default: false },
  
  // Files (stored as paths)
  birthCertificate: { type: String },
  medicalCertificate: { type: String },
  leavingCertificate: { type: String },
  baptismCertificate: { type: String },
  passportPhoto1: { type: String },
  passportPhoto2: { type: String },
  transferLetter: { type: String },
  transcript: { type: String },
  certificate: { type: String },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'approved', 'rejected', 'waitlisted'],
    default: 'pending'
  },
  reviewNotes: { type: String },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  
  // Application metadata
  applicationYear: { type: Number, default: () => new Date().getFullYear() },
  applicationNumber: { type: String, unique: true, sparse: true },
}, { timestamps: true });

// Generate application number before saving
AdmissionSchema.pre('save', async function(next) {
  if (!this.applicationNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Admission').countDocuments({ 
      applicationYear: year 
    });
    this.applicationNumber = `ADM-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Index for faster queries
AdmissionSchema.index({ applicationYear: 1, status: 1 });
AdmissionSchema.index({ email: 1 });
AdmissionSchema.index({ fullName: 'text' });

const Admission = mongoose.model("Admission", AdmissionSchema);
export default Admission;
