import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    metaTitle: {
      type: String,
      required: true,
      trim: true,
    },
    metaDescription: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String, // HTML content from TinyMCE
      required: true,
    },
    coverImage: {
      type: String, // Cloudinary image URL will be stored here
    },
    author: {
      type: String,
      default: "The Arboreal Resort",
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

export default mongoose.model("Blog", blogSchema);
