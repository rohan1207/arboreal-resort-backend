import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Blog content is required'],
    },
    excerpt: {
      type: String,
      maxlength: [300, 'Excerpt cannot exceed 300 characters'],
    },
    coverImage: {
      type: String,
      required: [true, 'Cover image is required'],
    },
    coverImagePublicId: {
      type: String,
      // Store Cloudinary public ID for deletion
    },
    author: {
      type: String,
      default: 'The Arboreal Resort',
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'Story',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    // SEO Fields
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title should be under 60 characters for SEO'],
      trim: true,
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description should be under 160 characters for SEO'],
      trim: true,
    },
    seoKeywords: [{
      type: String,
      trim: true,
    }],
    ogImage: {
      type: String,
      // Open Graph image for social sharing
    },
    ogImagePublicId: {
      type: String,
    },
    canonicalUrl: {
      type: String,
      trim: true,
    },
    // Structured Data for SEO
    structuredData: {
      type: mongoose.Schema.Types.Mixed,
      // JSON-LD structured data
    },
    // Reading time (calculated)
    readingTime: {
      type: Number,
      default: 0,
    },
    // View count for analytics
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Helper to strip HTML tags
const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

// Generate slug from title before saving
blogSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Auto-generate excerpt from content if not provided
  if (!this.excerpt && this.content) {
    const clean = stripHtml(this.content).replace(/\n+/g, ' ').trim();
    const words = clean.split(/\s+/).filter(Boolean);
    this.excerpt = words.slice(0, 40).join(' ') + (words.length > 40 ? '…' : '');
  }
  
  // Calculate reading time (average 200 words per minute) - strip HTML first
  if (this.content) {
    const textContent = stripHtml(this.content);
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;
    this.readingTime = Math.max(1, Math.ceil(wordCount / 200));
  }
  
  next();
});

// Index for search and filtering
blogSchema.index({ status: 1, createdAt: -1 });
blogSchema.index({ slug: 1 });
blogSchema.index({ featured: 1, status: 1 });
blogSchema.index({ category: 1, status: 1 });
blogSchema.index({ tags: 1, status: 1 });

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;

