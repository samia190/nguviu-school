import mongoose from "mongoose";

const HeroContentSchema = new mongoose.Schema(
  {
    // Type of hero content: image, video, slide
    type: {
      type: String,
      enum: ["image", "video", "slide"],
      required: true,
      index: true
    },

    // Page this hero is for (about, home, etc)
    page: {
      type: String,
      required: true,
      default: "about"
    },

    // Title/heading for the hero
    title: {
      type: String
    },

    // Subtitle or description
    description: {
      type: String
    },

    // URL to the media (image or video)
    url: {
      type: String,
      required: true
    },

    // For videos - thumbnail URL
    thumbnail: {
      type: String
    },

    // For videos - video duration
    duration: {
      type: Number
    },

    // Display order
    displayOrder: {
      type: Number,
      default: 0
    },

    // Is this currently active/displayed?
    active: {
      type: Boolean,
      default: true
    },

    // Original filename
    originalName: {
      type: String
    },

    // File size
    size: {
      type: Number
    },

    // MIME type
    mimetype: {
      type: String
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

export default mongoose.models?.HeroContent || mongoose.model("HeroContent", HeroContentSchema);
