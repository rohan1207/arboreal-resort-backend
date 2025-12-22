import mongoose from 'mongoose';

const amenitySchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    icon: { type: String, trim: true }, // optional, for future use
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      maxlength: [200, 'Room name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Room description is required'],
      trim: true,
    },
    experience: {
      type: String,
      trim: true,
    },
    // Images stored as full URLs (Cloudinary or local)
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    imagePublicIds: [
      {
        type: String,
        trim: true,
      },
    ],
    your_stays_include: [
      {
        type: String,
        trim: true,
      },
    ],
    amenities: [amenitySchema],
    bath_and_wellness: [
      {
        type: String,
        trim: true,
      },
    ],
    // SEO fields
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
    seoKeywords: [
      {
        type: String,
        trim: true,
      },
    ],
    canonicalUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helper to generate slug from name
const generateSlugFromName = (name) =>
  (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

roomSchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = generateSlugFromName(this.name);
  }

  // Auto-generate canonical URL if not provided
  if (!this.canonicalUrl && this.slug) {
    // Hard-coded main site URL; for production you can move this to an env var
    const baseUrl = 'https://thearborealresort.com';
    this.canonicalUrl = `${baseUrl}/rooms/${this.slug}`;
  }

  next();
});

roomSchema.index({ status: 1, sortOrder: 1 });

const Room = mongoose.model('Room', roomSchema);

export default Room;


