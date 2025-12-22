import mongoose from 'mongoose';

const globalSEOSchema = new mongoose.Schema(
  {
    // Global Site SEO Settings
    defaultMetaTitle: {
      type: String,
      maxlength: [60, 'Meta title should be under 60 characters'],
      trim: true,
      default: 'The Arboreal Resort | Luxury Nature Retreat in Lonavala',
    },
    defaultMetaDescription: {
      type: String,
      maxlength: [160, 'Meta description should be under 160 characters'],
      trim: true,
      default: 'Experience luxury in the heart of nature. Private pool rooms, mountain views, premium amenities. Book your stay at The Arboreal Resort, Lonavala.',
    },
    defaultKeywords: [{
      type: String,
      trim: true,
    }],
    defaultOgImage: {
      type: String,
      trim: true,
    },
    defaultOgImagePublicId: {
      type: String,
      trim: true,
    },

    // Analytics & Tracking
    googleAnalyticsId: {
      type: String,
      trim: true,
    },
    facebookPixelId: {
      type: String,
      trim: true,
    },
    googleTagManagerId: {
      type: String,
      trim: true,
    },
    customTrackingScripts: {
      type: String,
      trim: true,
    },

    // Search Engine Verification
    googleSearchConsoleCode: {
      type: String,
      trim: true,
    },
    bingWebmasterCode: {
      type: String,
      trim: true,
    },

    // Google Business Profile
    googleBusinessProfileId: {
      type: String,
      trim: true,
    },
    businessName: {
      type: String,
      trim: true,
      default: 'The Arboreal Resort',
    },
    businessAddress: {
      type: String,
      trim: true,
    },
    businessPhone: {
      type: String,
      trim: true,
    },
    businessEmail: {
      type: String,
      trim: true,
    },
    businessHours: {
      type: String,
      trim: true,
    },
    businessCoordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    priceRange: {
      type: String,
      enum: ['$', '$$', '$$$', '$$$$'],
    },

    // Social Media Defaults
    defaultFacebookImage: {
      type: String,
      trim: true,
    },
    defaultFacebookImagePublicId: {
      type: String,
      trim: true,
    },
    defaultTwitterImage: {
      type: String,
      trim: true,
    },
    defaultTwitterImagePublicId: {
      type: String,
      trim: true,
    },
    defaultShareText: {
      type: String,
      trim: true,
    },

    // Structured Data (Schema.org)
    structuredDataEnabled: {
      type: Boolean,
      default: false,
    },
    structuredData: {
      type: mongoose.Schema.Types.Mixed,
      // Will store LodgingBusiness schema data
    },

    // Robots.txt
    robotsTxt: {
      type: String,
      default: 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api',
    },

    // Sitemap
    sitemapLastGenerated: {
      type: Date,
    },
    sitemapLastSubmitted: {
      type: Date,
    },

    // Site Information
    siteUrl: {
      type: String,
      trim: true,
      default: 'https://thearborealresort.com',
    },
    siteName: {
      type: String,
      trim: true,
      default: 'The Arboreal Resort',
    },
    siteTagline: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one document exists
globalSEOSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const GlobalSEO = mongoose.model('GlobalSEO', globalSEOSchema);

export default GlobalSEO;

