import mongoose from 'mongoose';

const seoHealthHistorySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    global: {
      score: { type: Number, required: true },
      details: {
        titleScore: Number,
        descriptionScore: Number,
        keywordsScore: Number,
        ogImageScore: Number,
        titleLength: Number,
        descriptionLength: Number,
        keywordCount: Number,
      },
    },
    rooms: [{
      slug: String,
      name: String,
      score: Number,
      details: {
        titleScore: Number,
        descriptionScore: Number,
        keywordsScore: Number,
        titleLength: Number,
        descriptionLength: Number,
        keywordCount: Number,
      },
    }],
    blogs: [{
      slug: String,
      title: String,
      score: Number,
      details: {
        titleScore: Number,
        descriptionScore: Number,
        keywordsScore: Number,
        titleLength: Number,
        descriptionLength: Number,
        keywordCount: Number,
        contentLength: Number,
      },
    }],
    // Google Search Console Data (if available)
    searchConsole: {
      totalClicks: Number,
      totalImpressions: Number,
      averagePosition: Number,
      topKeywords: [{
        keyword: String,
        clicks: Number,
        impressions: Number,
        position: Number,
      }],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
seoHealthHistorySchema.index({ date: -1 });

const SEOHealthHistory = mongoose.model('SEOHealthHistory', seoHealthHistorySchema);

export default SEOHealthHistory;
