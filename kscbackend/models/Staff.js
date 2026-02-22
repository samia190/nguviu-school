import mongoose from "mongoose";

const StaffSchema = new mongoose.Schema(
  {
    // Staff type: principal, deputy_principal, head_of_department, teacher
    type: {
      type: String,
      enum: ["principal", "deputy_principal", "head_of_department", "teacher"],
      required: true,
      index: true
    },

    // Staff basic info
    fullName: {
      type: String,
      required: true
    },

    title: {
      type: String,
      required: true
    },

    department: {
      type: String
    },

    // Photo URL
    photoUrl: {
      type: String
    },

    // Remarks about staff member
    remarks: {
      type: String
    },

    // Contact info
    email: {
      type: String
    },

    phone: {
      type: String
    },

    // Professional info
    qualifications: {
      type: String
    },

    experience: {
      type: String
    },

    // Display order on about page
    displayOrder: {
      type: Number,
      default: 0
    },

    // Status
    active: {
      type: Boolean,
      default: true
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models?.Staff || mongoose.model("Staff", StaffSchema);
