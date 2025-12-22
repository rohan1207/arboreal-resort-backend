import Blog from '../models/Blog.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';
import { deleteByUrl, getPublicIdFromUrl } from '../utils/cloudinaryDelete.js';

// Helper to calculate reading time (strips HTML first)
const calculateReadingTime = (content) => {
  const textContent = stripHtml(content);
  const wordCount = textContent.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
};

// Helper to generate slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Helper to strip HTML tags
const stripHtml = (html) => {
  if (!html) return '';
  // Remove HTML tags and decode entities
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

// Helper to generate excerpt
const generateExcerpt = (content, maxWords = 40) => {
  const clean = stripHtml(content).replace(/\n+/g, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(' ') + (words.length > maxWords ? '…' : '');
};

// @desc    Get all blogs (public - only published)
// @route   GET /api/blogs
// @access  Public
export const getBlogs = async (req, res) => {
  try {
    const { category, tag, featured, limit = 20, page = 1 } = req.query;
    const query = { status: 'published' };

    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (featured === 'true') query.featured = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const blogs = await Blog.find(query)
      .select('-content -structuredData') // Exclude full content for list view
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Blog.countDocuments(query);

    res.json({
      success: true,
      blogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching blogs',
      error: error.message,
    });
  }
};

// @desc    Get single blog by slug (public)
// @route   GET /api/blogs/:slug
// @access  Public
export const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug, status: 'published' });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
    }

    // Increment view count
    blog.views += 1;
    await blog.save();

    res.json({
      success: true,
      blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching blog',
      error: error.message,
    });
  }
};

// @desc    Get all blogs (admin - includes drafts)
// @route   GET /api/admin/blogs
// @access  Private (Admin)
export const getAdminBlogs = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Blog.countDocuments(query);

    res.json({
      success: true,
      blogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching blogs',
      error: error.message,
    });
  }
};

// @desc    Get single blog by ID (admin)
// @route   GET /api/admin/blogs/:id
// @access  Private (Admin)
export const getAdminBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
    }

    res.json({
      success: true,
      blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching blog',
      error: error.message,
    });
  }
};

// @desc    Create new blog
// @route   POST /api/admin/blogs
// @access  Private (Admin)
export const createBlog = async (req, res) => {
  try {
    console.log('[CREATE BLOG] Request received');
    console.log('[CREATE BLOG] Body keys:', Object.keys(req.body));
    console.log('[CREATE BLOG] Files:', req.files ? Object.keys(req.files) : 'No files');
    
    // Parse array fields from FormData (they come as strings or arrays)
    const parseArrayField = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      if (typeof field === 'string') {
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(field);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          // If not JSON, split by comma or return as single item array
          return field.split(',').map(item => item.trim()).filter(Boolean);
        }
      }
      return [];
    };

    const parseBooleanField = (field) => {
      if (typeof field === 'boolean') return field;
      if (typeof field === 'string') {
        return field === 'true' || field === '1';
      }
      return false;
    };

    const {
      title,
      content,
      excerpt,
      author,
      status,
      featured,
      category,
      tags,
      metaTitle,
      metaDescription,
      seoKeywords,
      canonicalUrl,
    } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }

    // Generate slug from title
    let slug = generateSlug(title);
    
    // Ensure slug is unique
    let slugExists = await Blog.findOne({ slug });
    let counter = 1;
    while (slugExists) {
      slug = `${generateSlug(title)}-${counter}`;
      slugExists = await Blog.findOne({ slug });
      counter++;
    }

    // Handle cover image upload
    let coverImage = '';
    let coverImagePublicId = '';
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      try {
        console.log('[CREATE BLOG] Uploading cover image...');
        const result = await uploadBufferToCloudinary(
          req.files.coverImage[0],
          'Arboreal/blogs'
        );
        coverImage = result;
        // Extract public ID from Cloudinary URL
        coverImagePublicId = getPublicIdFromUrl(result) || '';
        console.log('[CREATE BLOG] Cover image uploaded:', coverImage);
      } catch (uploadError) {
        console.error('[CREATE BLOG] Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload cover image',
          error: uploadError.message,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Cover image is required',
      });
    }

    // Handle OG image upload (optional)
    let ogImage = '';
    let ogImagePublicId = '';
    if (req.files && req.files.ogImage && req.files.ogImage[0]) {
      try {
        console.log('[CREATE BLOG] Uploading OG image...');
        const result = await uploadBufferToCloudinary(
          req.files.ogImage[0],
          'Arboreal/blogs/og'
        );
        ogImage = result;
        ogImagePublicId = getPublicIdFromUrl(result) || '';
        console.log('[CREATE BLOG] OG image uploaded:', ogImage);
      } catch (uploadError) {
        console.error('[CREATE BLOG] OG image upload error:', uploadError);
        // Don't fail the whole request if OG image fails
      }
    }

    // Auto-generate excerpt if not provided
    const finalExcerpt = excerpt || generateExcerpt(content);

    // Generate structured data for SEO
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: metaTitle || title,
      description: metaDescription || finalExcerpt,
      image: coverImage,
      author: {
        '@type': 'Organization',
        name: author || 'The Arboreal Resort',
      },
      publisher: {
        '@type': 'Organization',
        name: 'The Arboreal Resort',
      },
      datePublished: new Date().toISOString(),
    };

    const blog = await Blog.create({
      title,
      slug,
      content,
      excerpt: finalExcerpt,
      coverImage,
      coverImagePublicId,
      ogImage,
      ogImagePublicId,
      author: author || 'The Arboreal Resort',
      status: status || 'draft',
      featured: parseBooleanField(featured),
      category: category || 'Story',
      tags: parseArrayField(tags),
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || finalExcerpt,
      seoKeywords: parseArrayField(seoKeywords),
      canonicalUrl: canonicalUrl || '',
      structuredData,
      readingTime: calculateReadingTime(content),
    });

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      blog,
    });
  } catch (error) {
    console.error('[CREATE BLOG] Error:', error);
    console.error('[CREATE BLOG] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error creating blog',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// @desc    Update blog
// @route   PUT /api/admin/blogs/:id
// @access  Private (Admin)
export const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
    }

    const {
      title,
      content,
      excerpt,
      author,
      status,
      featured,
      category,
      tags,
      metaTitle,
      metaDescription,
      seoKeywords,
      canonicalUrl,
    } = req.body;

    // Update slug if title changed
    if (title && title !== blog.title) {
      let newSlug = generateSlug(title);
      let slugExists = await Blog.findOne({ slug: newSlug, _id: { $ne: blog._id } });
      let counter = 1;
      while (slugExists) {
        newSlug = `${generateSlug(title)}-${counter}`;
        slugExists = await Blog.findOne({ slug: newSlug, _id: { $ne: blog._id } });
        counter++;
      }
      blog.slug = newSlug;
    }

    // Handle cover image update
    if (req.files && req.files.coverImage) {
      // Delete old cover image from Cloudinary
      if (blog.coverImage) {
        try {
          await deleteByUrl(blog.coverImage);
        } catch (err) {
          console.error('Error deleting old cover image:', err.message);
        }
      }

      // Upload new cover image
      const result = await uploadBufferToCloudinary(
        req.files.coverImage[0],
        'Arboreal/blogs'
      );
      blog.coverImage = result;
      blog.coverImagePublicId = getPublicIdFromUrl(result) || '';
    }

    // Handle OG image update
    if (req.files && req.files.ogImage) {
      // Delete old OG image
      if (blog.ogImage) {
        try {
          await deleteByUrl(blog.ogImage);
        } catch (err) {
          console.error('Error deleting old OG image:', err.message);
        }
      }

      // Upload new OG image
      const result = await uploadBufferToCloudinary(
        req.files.ogImage[0],
        'Arboreal/blogs/og'
      );
      blog.ogImage = result;
      blog.ogImagePublicId = getPublicIdFromUrl(result) || '';
    }

    // Update fields
    if (title) blog.title = title;
    if (content) {
      blog.content = content;
      blog.readingTime = calculateReadingTime(content);
    }
    if (excerpt) blog.excerpt = excerpt;
    else if (content) blog.excerpt = generateExcerpt(content);
    if (author) blog.author = author;
    if (status) blog.status = status;
    if (featured !== undefined) blog.featured = featured;
    if (category) blog.category = category;
    if (tags) blog.tags = tags;
    if (metaTitle) blog.metaTitle = metaTitle;
    if (metaDescription) blog.metaDescription = metaDescription;
    if (seoKeywords) blog.seoKeywords = seoKeywords;
    if (canonicalUrl) blog.canonicalUrl = canonicalUrl;

    // Update structured data
    blog.structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: blog.metaTitle || blog.title,
      description: blog.metaDescription || blog.excerpt,
      image: blog.coverImage,
      author: {
        '@type': 'Organization',
        name: blog.author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'The Arboreal Resort',
      },
      datePublished: blog.createdAt.toISOString(),
      dateModified: new Date().toISOString(),
    };

    await blog.save();

    res.json({
      success: true,
      message: 'Blog updated successfully',
      blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating blog',
      error: error.message,
    });
  }
};

// @desc    Delete blog
// @route   DELETE /api/admin/blogs/:id
// @access  Private (Admin)
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
    }

    // Delete images from Cloudinary
    if (blog.coverImage) {
      try {
        await deleteByUrl(blog.coverImage);
      } catch (err) {
        console.error('Error deleting cover image:', err.message);
      }
    }

    if (blog.ogImage) {
      try {
        await deleteByUrl(blog.ogImage);
      } catch (err) {
        console.error('Error deleting OG image:', err.message);
      }
    }

    await Blog.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Blog deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting blog',
      error: error.message,
    });
  }
};

