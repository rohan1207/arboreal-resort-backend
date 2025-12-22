import GlobalSEO from '../models/GlobalSEO.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';
import { deleteByUrl, getPublicIdFromUrl } from '../utils/cloudinaryDelete.js';

// @desc    Get global SEO settings
// @route   GET /api/admin/seo
// @access  Private (Admin)
export const getGlobalSEO = async (req, res) => {
  try {
    const settings = await GlobalSEO.getSettings();
    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('[GET GLOBAL SEO] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching SEO settings',
      error: error.message,
    });
  }
};

// @desc    Update global SEO settings
// @route   PUT /api/admin/seo
// @access  Private (Admin)
export const updateGlobalSEO = async (req, res) => {
  try {
    const settings = await GlobalSEO.getSettings();

    // Handle file uploads
    if (req.files) {
      // Default OG Image
      if (req.files.defaultOgImage) {
        // Delete old image
        if (settings.defaultOgImage) {
          try {
            await deleteByUrl(settings.defaultOgImage);
          } catch (err) {
            console.error('Error deleting old default OG image:', err.message);
          }
        }
        const result = await uploadBufferToCloudinary(
          req.files.defaultOgImage[0],
          'Arboreal/seo'
        );
        settings.defaultOgImage = result;
        settings.defaultOgImagePublicId = getPublicIdFromUrl(result) || '';
      }

      // Default Facebook Image
      if (req.files.defaultFacebookImage) {
        if (settings.defaultFacebookImage) {
          try {
            await deleteByUrl(settings.defaultFacebookImage);
          } catch (err) {
            console.error('Error deleting old Facebook image:', err.message);
          }
        }
        const result = await uploadBufferToCloudinary(
          req.files.defaultFacebookImage[0],
          'Arboreal/seo'
        );
        settings.defaultFacebookImage = result;
        settings.defaultFacebookImagePublicId = getPublicIdFromUrl(result) || '';
      }

      // Default Twitter Image
      if (req.files.defaultTwitterImage) {
        if (settings.defaultTwitterImage) {
          try {
            await deleteByUrl(settings.defaultTwitterImage);
          } catch (err) {
            console.error('Error deleting old Twitter image:', err.message);
          }
        }
        const result = await uploadBufferToCloudinary(
          req.files.defaultTwitterImage[0],
          'Arboreal/seo'
        );
        settings.defaultTwitterImage = result;
        settings.defaultTwitterImagePublicId = getPublicIdFromUrl(result) || '';
      }
    }

    // Update text fields
    const {
      defaultMetaTitle,
      defaultMetaDescription,
      defaultKeywords,
      googleAnalyticsId,
      facebookPixelId,
      googleTagManagerId,
      customTrackingScripts,
      googleSearchConsoleCode,
      bingWebmasterCode,
      googleBusinessProfileId,
      businessName,
      businessAddress,
      businessPhone,
      businessEmail,
      businessHours,
      businessCoordinates,
      priceRange,
      defaultShareText,
      structuredDataEnabled,
      structuredData,
      robotsTxt,
      siteUrl,
      siteName,
      siteTagline,
    } = req.body;

    if (defaultMetaTitle !== undefined) settings.defaultMetaTitle = defaultMetaTitle;
    if (defaultMetaDescription !== undefined) settings.defaultMetaDescription = defaultMetaDescription;
    if (defaultKeywords !== undefined) {
      settings.defaultKeywords = Array.isArray(defaultKeywords) 
        ? defaultKeywords 
        : (defaultKeywords ? defaultKeywords.split(',').map(k => k.trim()) : []);
    }
    if (googleAnalyticsId !== undefined) settings.googleAnalyticsId = googleAnalyticsId;
    if (facebookPixelId !== undefined) settings.facebookPixelId = facebookPixelId;
    if (googleTagManagerId !== undefined) settings.googleTagManagerId = googleTagManagerId;
    if (customTrackingScripts !== undefined) settings.customTrackingScripts = customTrackingScripts;
    if (googleSearchConsoleCode !== undefined) settings.googleSearchConsoleCode = googleSearchConsoleCode;
    if (bingWebmasterCode !== undefined) settings.bingWebmasterCode = bingWebmasterCode;
    if (googleBusinessProfileId !== undefined) settings.googleBusinessProfileId = googleBusinessProfileId;
    if (businessName !== undefined) settings.businessName = businessName;
    if (businessAddress !== undefined) settings.businessAddress = businessAddress;
    if (businessPhone !== undefined) settings.businessPhone = businessPhone;
    if (businessEmail !== undefined) settings.businessEmail = businessEmail;
    if (businessHours !== undefined) settings.businessHours = businessHours;
    if (businessCoordinates !== undefined) {
      if (typeof businessCoordinates === 'string') {
        try {
          settings.businessCoordinates = JSON.parse(businessCoordinates);
        } catch {
          settings.businessCoordinates = businessCoordinates;
        }
      } else {
        settings.businessCoordinates = businessCoordinates;
      }
    }
    if (priceRange !== undefined && priceRange !== '') {
      // Only set if it's a valid enum value (not empty string)
      if (['$', '$$', '$$$', '$$$$'].includes(priceRange)) {
        settings.priceRange = priceRange;
      }
    } else if (priceRange === '') {
      // Clear priceRange if empty string is sent
      settings.priceRange = undefined;
    }
    if (defaultShareText !== undefined) settings.defaultShareText = defaultShareText;
    if (structuredDataEnabled !== undefined) settings.structuredDataEnabled = structuredDataEnabled === 'true' || structuredDataEnabled === true;
    if (structuredData !== undefined) {
      if (typeof structuredData === 'string') {
        try {
          settings.structuredData = JSON.parse(structuredData);
        } catch {
          settings.structuredData = structuredData;
        }
      } else {
        settings.structuredData = structuredData;
      }
    }
    if (robotsTxt !== undefined) settings.robotsTxt = robotsTxt;
    if (siteUrl !== undefined) settings.siteUrl = siteUrl;
    if (siteName !== undefined) settings.siteName = siteName;
    if (siteTagline !== undefined) settings.siteTagline = siteTagline;

    await settings.save();

    res.json({
      success: true,
      message: 'SEO settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('[UPDATE GLOBAL SEO] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating SEO settings',
      error: error.message,
    });
  }
};

// @desc    Generate sitemap
// @route   POST /api/admin/seo/sitemap/generate
// @access  Private (Admin)
export const generateSitemap = async (req, res) => {
  try {
    const Blog = (await import('../models/Blog.js')).default;
    const Room = (await import('../models/Room.js')).default;
    const settings = await GlobalSEO.getSettings();

    const baseUrl = settings.siteUrl || 'https://thearborealresort.com';
    const currentDate = new Date().toISOString().split('T')[0];

    // Get all published blogs
    const blogs = await Blog.find({ status: 'published' }).select('slug updatedAt').lean();
    // Get all published rooms
    const rooms = await Room.find({ status: 'published' }).select('slug updatedAt').lean();

    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/rooms</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;

    // Add room pages
    rooms.forEach((room) => {
      const lastmod = room.updatedAt ? new Date(room.updatedAt).toISOString().split('T')[0] : currentDate;
      sitemap += `
  <url>
    <loc>${baseUrl}/rooms#${room.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Add blog pages
    blogs.forEach((blog) => {
      const lastmod = blog.updatedAt ? new Date(blog.updatedAt).toISOString().split('T')[0] : currentDate;
      sitemap += `
  <url>
    <loc>${baseUrl}/blog/${blog.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    sitemap += '\n</urlset>';

    // Update last generated date
    settings.sitemapLastGenerated = new Date();
    await settings.save();

    res.json({
      success: true,
      message: 'Sitemap generated successfully',
      sitemap,
      lastGenerated: settings.sitemapLastGenerated,
    });
  } catch (error) {
    console.error('[GENERATE SITEMAP] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating sitemap',
      error: error.message,
    });
  }
};

// @desc    Mark sitemap as submitted
// @route   POST /api/admin/seo/sitemap/submit
// @access  Private (Admin)
export const markSitemapSubmitted = async (req, res) => {
  try {
    const settings = await GlobalSEO.getSettings();
    settings.sitemapLastSubmitted = new Date();
    await settings.save();

    res.json({
      success: true,
      message: 'Sitemap submission recorded',
      lastSubmitted: settings.sitemapLastSubmitted,
    });
  } catch (error) {
    console.error('[MARK SITEMAP SUBMITTED] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording sitemap submission',
      error: error.message,
    });
  }
};

// @desc    Get SEO health status (Enhanced with quality-based scoring)
// @route   GET /api/admin/seo/health
// @access  Private (Admin)
export const getSEOHealth = async (req, res) => {
  try {
    const Blog = (await import('../models/Blog.js')).default;
    const Room = (await import('../models/Room.js')).default;
    const SEOHealthHistory = (await import('../models/SEOHealthHistory.js')).default;
    const seoScorer = await import('../utils/seoHealthScorer.js');
    const { calculatePageScore, scoreMetaTitle, scoreMetaDescription, scoreKeywords, scoreOgImage, scoreContentQuality } = seoScorer;
    const settings = await GlobalSEO.getSettings();

    // Enhanced global scoring
    const globalTitleScore = scoreMetaTitle(settings.defaultMetaTitle);
    const globalDescScore = scoreMetaDescription(settings.defaultMetaDescription);
    const globalKeywordsScore = scoreKeywords(settings.defaultKeywords || []);
    const globalOgImageScore = scoreOgImage(settings.defaultOgImage);

    const globalScore = Math.round(
      globalTitleScore.score * 0.30 +
      globalDescScore.score * 0.30 +
      globalKeywordsScore.score * 0.20 +
      globalOgImageScore.score * 0.20
    );

    const health = {
      global: {
        score: globalScore,
        details: {
          title: globalTitleScore,
          description: globalDescScore,
          keywords: globalKeywordsScore,
          ogImage: globalOgImageScore,
        },
        issues: [
          ...globalTitleScore.issues,
          ...globalDescScore.issues,
          ...globalKeywordsScore.issues,
          ...globalOgImageScore.issues,
        ],
        recommendations: [],
      },
      rooms: [],
      blogs: [],
      history: [],
      searchConsole: null,
    };

    // Generate global recommendations
    if (globalTitleScore.score < 80) {
      health.global.recommendations.push({
        priority: 'high',
        category: 'title',
        message: globalTitleScore.issues[0] || 'Optimize meta title',
        action: 'Edit default meta title in Global SEO settings',
      });
    }
    if (globalDescScore.score < 80) {
      health.global.recommendations.push({
        priority: 'high',
        category: 'description',
        message: globalDescScore.issues[0] || 'Optimize meta description',
        action: 'Edit default meta description in Global SEO settings',
      });
    }
    if (globalKeywordsScore.score < 80) {
      health.global.recommendations.push({
        priority: 'medium',
        category: 'keywords',
        message: globalKeywordsScore.issues[0] || 'Add more keywords',
        action: 'Add keywords in Global SEO settings',
      });
    }

    // Check rooms with enhanced scoring
    const rooms = await Room.find({ status: 'published' })
      .select('name slug metaTitle metaDescription seoKeywords images description')
      .lean();
    
    rooms.forEach((room) => {
      const titleScore = scoreMetaTitle(room.metaTitle);
      const descScore = scoreMetaDescription(room.metaDescription);
      const keywordsScore = scoreKeywords(room.seoKeywords || []);
      const ogImageScore = scoreOgImage(room.images && room.images.length > 0 ? room.images[0] : null);

      const roomOverallScore = calculatePageScore({
        title: titleScore,
        description: descScore,
        keywords: keywordsScore,
        content: null, // Rooms don't have content field
      });

      const recommendations = [];
      if (titleScore.score < 80) {
        recommendations.push({
          priority: titleScore.score < 50 ? 'high' : 'medium',
          category: 'title',
          message: titleScore.issues[0] || 'Optimize meta title',
          action: `Edit "${room.name}" room SEO settings`,
        });
      }
      if (descScore.score < 80) {
        recommendations.push({
          priority: descScore.score < 50 ? 'high' : 'medium',
          category: 'description',
          message: descScore.issues[0] || 'Optimize meta description',
          action: `Edit "${room.name}" room SEO settings`,
        });
      }
      if (keywordsScore.score < 80) {
        recommendations.push({
          priority: 'medium',
          category: 'keywords',
          message: keywordsScore.issues[0] || 'Add more keywords',
          action: `Edit "${room.name}" room SEO settings`,
        });
      }

      health.rooms.push({
        name: room.name,
        slug: room.slug,
        score: roomOverallScore,
        details: {
          title: titleScore,
          description: descScore,
          keywords: keywordsScore,
          ogImage: ogImageScore,
        },
        issues: [
          ...titleScore.issues,
          ...descScore.issues,
          ...keywordsScore.issues,
          ...ogImageScore.issues,
        ],
        recommendations,
      });
    });

    // Check blogs with enhanced scoring
    const blogs = await Blog.find({ status: 'published' })
      .select('title slug metaTitle metaDescription seoKeywords coverImage ogImage content')
      .lean();
    
    blogs.forEach((blog) => {
      const titleScore = scoreMetaTitle(blog.metaTitle);
      const descScore = scoreMetaDescription(blog.metaDescription);
      const keywordsScore = scoreKeywords(blog.seoKeywords || []);
      const ogImageScore = scoreOgImage(blog.ogImage || blog.coverImage);
      const contentScore = scoreContentQuality(blog.content || '');

      const blogOverallScore = calculatePageScore({
        title: titleScore,
        description: descScore,
        keywords: keywordsScore,
        content: contentScore,
      });

      const recommendations = [];
      if (titleScore.score < 80) {
        recommendations.push({
          priority: titleScore.score < 50 ? 'high' : 'medium',
          category: 'title',
          message: titleScore.issues[0] || 'Optimize meta title',
          action: `Edit "${blog.title}" blog SEO settings`,
        });
      }
      if (descScore.score < 80) {
        recommendations.push({
          priority: descScore.score < 50 ? 'high' : 'medium',
          category: 'description',
          message: descScore.issues[0] || 'Optimize meta description',
          action: `Edit "${blog.title}" blog SEO settings`,
        });
      }
      if (keywordsScore.score < 80) {
        recommendations.push({
          priority: 'medium',
          category: 'keywords',
          message: keywordsScore.issues[0] || 'Add more keywords',
          action: `Edit "${blog.title}" blog SEO settings`,
        });
      }
      if (contentScore.score < 80) {
        recommendations.push({
          priority: contentScore.score < 50 ? 'high' : 'medium',
          category: 'content',
          message: contentScore.issues[0] || 'Improve content quality',
          action: `Edit "${blog.title}" blog content`,
        });
      }

      health.blogs.push({
        title: blog.title,
        slug: blog.slug,
        score: blogOverallScore,
        details: {
          title: titleScore,
          description: descScore,
          keywords: keywordsScore,
          ogImage: ogImageScore,
          content: contentScore,
        },
        issues: [
          ...titleScore.issues,
          ...descScore.issues,
          ...keywordsScore.issues,
          ...ogImageScore.issues,
          ...contentScore.issues,
        ],
        recommendations,
      });
    });

    // Calculate averages
    const roomsAverage = health.rooms.length > 0
      ? Math.round(health.rooms.reduce((sum, r) => sum + r.score, 0) / health.rooms.length)
      : 0;
    
    const blogsAverage = health.blogs.length > 0
      ? Math.round(health.blogs.reduce((sum, b) => sum + b.score, 0) / health.blogs.length)
      : 0;

    // Get historical data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const history = await SEOHealthHistory.find({
      date: { $gte: thirtyDaysAgo },
    })
      .sort({ date: 1 }) // Sort ascending for chart
      .limit(30)
      .lean();

    health.history = history.map(h => ({
      date: h.date,
      global: h.global?.score || 0,
      rooms: h.rooms?.length > 0 
        ? Math.round(h.rooms.reduce((sum, r) => sum + (r.score || 0), 0) / h.rooms.length)
        : 0,
      blogs: h.blogs?.length > 0
        ? Math.round(h.blogs.reduce((sum, b) => sum + (b.score || 0), 0) / h.blogs.length)
        : 0,
    }));

    // Save current health snapshot
    try {
      await SEOHealthHistory.create({
        date: new Date(),
        global: {
          score: health.global.score,
          details: {
            titleScore: globalTitleScore.score,
            descriptionScore: globalDescScore.score,
            keywordsScore: globalKeywordsScore.score,
            ogImageScore: globalOgImageScore.score,
            titleLength: globalTitleScore.length,
            descriptionLength: globalDescScore.length,
            keywordCount: globalKeywordsScore.count,
          },
        },
        rooms: health.rooms.map(r => ({
          slug: r.slug,
          name: r.name,
          score: r.score,
          details: {
            titleScore: r.details.title.score,
            descriptionScore: r.details.description.score,
            keywordsScore: r.details.keywords.score,
            titleLength: r.details.title.length,
            descriptionLength: r.details.description.length,
            keywordCount: r.details.keywords.count,
          },
        })),
        blogs: health.blogs.map(b => ({
          slug: b.slug,
          title: b.title,
          score: b.score,
          details: {
            titleScore: b.details.title.score,
            descriptionScore: b.details.description.score,
            keywordsScore: b.details.keywords.score,
            titleLength: b.details.title.length,
            descriptionLength: b.details.description.length,
            keywordCount: b.details.keywords.count,
            contentLength: b.details.content?.wordCount || 0,
          },
        })),
      });
    } catch (err) {
      console.error('[SEO HEALTH] Error saving history:', err.message);
    }

    // Try to fetch Google Search Console data
    const { fetchSearchConsoleData } = await import('../utils/googleSearchConsole.js');
    let searchConsoleData = null;
    if (settings.googleSearchConsoleCode) {
      try {
        // In production, you'd pass actual credentials here
        const gscResult = await fetchSearchConsoleData(settings.siteUrl, null);
        if (gscResult.success) {
          searchConsoleData = gscResult.data;
        } else {
          searchConsoleData = {
            connected: false,
            message: gscResult.message || 'Google Search Console not fully configured',
          };
        }
      } catch (err) {
        console.error('[SEO HEALTH] Search Console error:', err.message);
        searchConsoleData = {
          connected: false,
          message: 'Error fetching Search Console data',
        };
      }
    } else {
      searchConsoleData = {
        connected: false,
        message: 'Connect Google Search Console in Verification tab to see real performance data',
      };
    }

    // Add summary
    health.summary = {
      roomsAverage,
      blogsAverage,
      roomsCount: health.rooms.length,
      blogsCount: health.blogs.length,
      totalRecommendations: [
        ...health.global.recommendations,
        ...health.rooms.flatMap(r => r.recommendations),
        ...health.blogs.flatMap(b => b.recommendations),
      ].length,
    };

    health.searchConsole = searchConsoleData;

    res.json({
      success: true,
      health,
    });
  } catch (error) {
    console.error('[GET SEO HEALTH] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching SEO health',
      error: error.message,
    });
  }
};

// @desc    Serve robots.txt file
// @route   GET /robots.txt
// @access  Public
export const serveRobotsTxt = async (req, res) => {
  try {
    const settings = await GlobalSEO.getSettings();
    const robotsContent = settings.robotsTxt || 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api';
    
    // Set content-type to plain text
    res.setHeader('Content-Type', 'text/plain');
    res.send(robotsContent);
  } catch (error) {
    console.error('[SERVE ROBOTS.TXT] Error:', error);
    // Fallback robots.txt if database fails
    const fallback = 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api';
    res.setHeader('Content-Type', 'text/plain');
    res.send(fallback);
  }
};

// @desc    Serve sitemap.xml file
// @route   GET /sitemap.xml
// @access  Public
export const serveSitemap = async (req, res) => {
  try {
    const Blog = (await import('../models/Blog.js')).default;
    const Room = (await import('../models/Room.js')).default;
    const settings = await GlobalSEO.getSettings();

    const baseUrl = settings.siteUrl || 'https://thearborealresort.com';
    const currentDate = new Date().toISOString().split('T')[0];

    // Get all published blogs
    const blogs = await Blog.find({ status: 'published' }).select('slug updatedAt').lean();
    // Get all published rooms
    const rooms = await Room.find({ status: 'published' }).select('slug updatedAt').lean();

    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/rooms</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;

    // Add room pages
    rooms.forEach((room) => {
      const lastmod = room.updatedAt ? new Date(room.updatedAt).toISOString().split('T')[0] : currentDate;
      sitemap += `
  <url>
    <loc>${baseUrl}/rooms#${room.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Add blog pages
    blogs.forEach((blog) => {
      const lastmod = blog.updatedAt ? new Date(blog.updatedAt).toISOString().split('T')[0] : currentDate;
      sitemap += `
  <url>
    <loc>${baseUrl}/blog/${blog.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    sitemap += '\n</urlset>';

    // Set content-type to XML
    res.setHeader('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('[SERVE SITEMAP] Error:', error);
    res.status(500).setHeader('Content-Type', 'text/plain');
    res.send('Error generating sitemap');
  }
};

