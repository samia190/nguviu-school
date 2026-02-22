import mongoose from "mongoose";

const HomeNewsSchema = new mongoose.Schema(
  {
    // Title of the news/update
    title: {
      type: String,
      required: true
    },

    // Description/content
    description: {
      type: String,
      required: true
    },

    // Featured image URL
    imageUrl: {
      type: String,
      required: true
    },

    // Thumbnail for smaller displays
    thumbnail: {
      type: String
    },

    // Category (news, event, update, announcement, etc)
    category: {
      type: String,
      enum: ["news", "event", "update", "announcement", "achievement"],
      default: "news"
    },

    // Display order on page
    displayOrder: {
      type: Number,
      default: 0
    },

    // Is this currently displayed on home page?
    active: {
      type: Boolean,
      default: true
    },

    // Publish date
    publishDate: {
      type: Date,
      default: Date.now
    },

    // Optional link/URL
    link: {
      type: String
    },

    // Author (admin user)
    author: {
      type: String
    },

    // View count
    views: {
      type: Number,
      default: 0
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

export default mongoose.models?.HomeNews || mongoose.model("HomeNews", HomeNewsSchema);
