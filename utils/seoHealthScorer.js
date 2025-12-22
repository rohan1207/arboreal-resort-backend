/**
 * SEO Health Scorer - Quality-based scoring system
 * Evaluates SEO elements based on best practices, not just presence
 */

/**
 * Score meta title based on length and quality
 * @param {string} title - Meta title
 * @returns {object} Score object with score (0-100) and issues array
 */
export const scoreMetaTitle = (title) => {
  if (!title || title.trim().length === 0) {
    return {
      score: 0,
      issues: ['Meta title is missing'],
      recommendations: ['Add a meta title (50-60 characters recommended)'],
    };
  }

  const length = title.length;
  let score = 100;
  const issues = [];
  const recommendations = [];

  // Length scoring (optimal: 50-60 chars)
  if (length < 30) {
    score -= 40;
    issues.push(`Title too short (${length} chars). Recommended: 50-60 characters`);
    recommendations.push('Expand title to 50-60 characters for better SEO');
  } else if (length < 50) {
    score -= 20;
    issues.push(`Title could be longer (${length} chars). Optimal: 50-60 characters`);
    recommendations.push('Add more descriptive text to reach 50-60 characters');
  } else if (length > 60) {
    score -= 30;
    issues.push(`Title too long (${length} chars). Will be truncated in search results`);
    recommendations.push('Shorten title to 60 characters to avoid truncation');
  } else if (length > 65) {
    score -= 50;
    issues.push(`Title very long (${length} chars). Will be cut off in Google`);
    recommendations.push('Reduce title to 60 characters maximum');
  }

  // Quality checks
  if (title.length > 0 && title.length < 50) {
    if (!title.includes('|') && !title.includes('-')) {
      // No separator - might be missing brand name
      recommendations.push('Consider adding brand name with separator (e.g., "Title | Brand")');
    }
  }

  // Check for keyword stuffing (too many repeated words)
  const words = title.toLowerCase().split(/\s+/);
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  const repeatedWords = Object.entries(wordCount).filter(([_, count]) => count > 2);
  if (repeatedWords.length > 0) {
    score -= 10;
    issues.push('Title may have keyword stuffing');
    recommendations.push('Reduce repeated words in title');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    length,
    issues: issues.length > 0 ? issues : [],
    recommendations: recommendations.length > 0 ? recommendations : [],
    status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'needs-improvement' : 'poor',
  };
};

/**
 * Score meta description based on length and quality
 * @param {string} description - Meta description
 * @returns {object} Score object with score (0-100) and issues array
 */
export const scoreMetaDescription = (description) => {
  if (!description || description.trim().length === 0) {
    return {
      score: 0,
      issues: ['Meta description is missing'],
      recommendations: ['Add a meta description (150-160 characters recommended)'],
    };
  }

  const length = description.length;
  let score = 100;
  const issues = [];
  const recommendations = [];

  // Length scoring (optimal: 150-160 chars)
  if (length < 50) {
    score -= 50;
    issues.push(`Description too short (${length} chars). Recommended: 150-160 characters`);
    recommendations.push('Expand description to 150-160 characters');
  } else if (length < 120) {
    score -= 30;
    issues.push(`Description could be longer (${length} chars). Optimal: 150-160 characters`);
    recommendations.push('Add more details to reach 150-160 characters');
  } else if (length > 160) {
    score -= 30;
    issues.push(`Description too long (${length} chars). Will be truncated in search results`);
    recommendations.push('Shorten description to 160 characters');
  } else if (length > 200) {
    score -= 50;
    issues.push(`Description very long (${length} chars). Will be cut off`);
    recommendations.push('Reduce description to 160 characters maximum');
  }

  // Quality checks
  if (length > 0 && length < 150) {
    if (!description.match(/[.!?]$/)) {
      // No ending punctuation - might be incomplete
      recommendations.push('Add a call-to-action or complete sentence');
    }
  }

  // Check for keyword stuffing
  const words = description.toLowerCase().split(/\s+/);
  if (words.length < 20) {
    score -= 10;
    issues.push('Description is too brief');
    recommendations.push('Add more descriptive content');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    length,
    issues: issues.length > 0 ? issues : [],
    recommendations: recommendations.length > 0 ? recommendations : [],
    status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'needs-improvement' : 'poor',
  };
};

/**
 * Score keywords based on count and relevance
 * @param {array} keywords - Array of keywords
 * @returns {object} Score object with score (0-100) and issues array
 */
export const scoreKeywords = (keywords) => {
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    return {
      score: 0,
      count: 0,
      issues: ['No keywords provided'],
      recommendations: ['Add 5-10 relevant keywords'],
    };
  }

  const count = keywords.length;
  let score = 100;
  const issues = [];
  const recommendations = [];

  // Count scoring (optimal: 5-10 keywords)
  if (count < 3) {
    score -= 40;
    issues.push(`Too few keywords (${count}). Recommended: 5-10 keywords`);
    recommendations.push('Add more relevant keywords (5-10 is optimal)');
  } else if (count < 5) {
    score -= 20;
    issues.push(`Could add more keywords (${count}). Optimal: 5-10 keywords`);
    recommendations.push('Add 2-5 more relevant keywords');
  } else if (count > 15) {
    score -= 20;
    issues.push(`Too many keywords (${count}). May be seen as keyword stuffing`);
    recommendations.push('Reduce to 5-10 most important keywords');
  } else if (count > 20) {
    score -= 40;
    issues.push(`Excessive keywords (${count}). Risk of keyword stuffing penalty`);
    recommendations.push('Focus on 5-10 primary keywords only');
  }

  // Quality checks
  const longKeywords = keywords.filter(k => k && k.split(/\s+/).length > 4);
  if (longKeywords.length > count * 0.5) {
    score -= 15;
    issues.push('Many keywords are too long (phrases)');
    recommendations.push('Use shorter, more focused keywords');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    count,
    issues: issues.length > 0 ? issues : [],
    recommendations: recommendations.length > 0 ? recommendations : [],
    status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'needs-improvement' : 'poor',
  };
};

/**
 * Score OG image
 * @param {string} ogImageUrl - OG image URL
 * @returns {object} Score object with score (0-100) and issues array
 */
export const scoreOgImage = (ogImageUrl) => {
  if (!ogImageUrl || ogImageUrl.trim().length === 0) {
    return {
      score: 0,
      issues: ['OG image is missing'],
      recommendations: ['Upload an OG image (1200x630px recommended) for better social sharing'],
    };
  }

  // If image exists, give full score (we can't check dimensions from URL alone)
  // In a more advanced version, we could fetch and check image dimensions
  return {
    score: 100,
    issues: [],
    recommendations: [],
    status: 'excellent',
  };
};

/**
 * Score content quality (for blogs)
 * @param {string} content - HTML content
 * @returns {object} Score object with score (0-100) and issues array
 */
export const scoreContentQuality = (content) => {
  if (!content || content.trim().length === 0) {
    return {
      score: 0,
      wordCount: 0,
      issues: ['Content is missing'],
      recommendations: ['Add content to the blog post'],
    };
  }

  // Strip HTML to count words
  const textContent = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;
  let score = 100;
  const issues = [];
  const recommendations = [];

  // Word count scoring (optimal: 1000-2000 words for blogs)
  if (wordCount < 300) {
    score -= 50;
    issues.push(`Content too short (${wordCount} words). Recommended: 1000+ words for SEO`);
    recommendations.push('Expand content to at least 1000 words for better SEO');
  } else if (wordCount < 500) {
    score -= 30;
    issues.push(`Content could be longer (${wordCount} words). Optimal: 1000+ words`);
    recommendations.push('Add more detailed content (aim for 1000+ words)');
  } else if (wordCount < 1000) {
    score -= 15;
    issues.push(`Content length is okay (${wordCount} words). Could be longer for better SEO`);
    recommendations.push('Consider expanding to 1000+ words for optimal SEO');
  }

  // Check for headings (H1, H2, H3)
  const hasH1 = /<h1[^>]*>/i.test(content);
  const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (content.match(/<h3[^>]*>/gi) || []).length;

  if (!hasH1) {
    score -= 10;
    issues.push('Missing H1 heading');
    recommendations.push('Add an H1 heading to improve content structure');
  }

  if (h2Count < 2 && wordCount > 500) {
    score -= 10;
    issues.push('Few or no H2 headings');
    recommendations.push('Add H2 headings to structure your content');
  }

  // Check for images
  const imageCount = (content.match(/<img[^>]*>/gi) || []).length;
  if (wordCount > 1000 && imageCount === 0) {
    score -= 10;
    issues.push('No images in long content');
    recommendations.push('Add images to break up long text and improve engagement');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    wordCount,
    headingCount: { h1: hasH1 ? 1 : 0, h2: h2Count, h3: h3Count },
    imageCount,
    issues: issues.length > 0 ? issues : [],
    recommendations: recommendations.length > 0 ? recommendations : [],
    status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'needs-improvement' : 'poor',
  };
};

/**
 * Calculate overall page score
 * @param {object} scores - Object with title, description, keywords, content scores
 * @returns {number} Overall score (0-100)
 */
export const calculatePageScore = (scores) => {
  const weights = {
    title: 0.30,      // 30% weight
    description: 0.30, // 30% weight
    keywords: 0.20,    // 20% weight
    content: 0.20,    // 20% weight (for blogs)
  };

  let totalScore = 0;
  let totalWeight = 0;

  if (scores.title) {
    totalScore += scores.title.score * weights.title;
    totalWeight += weights.title;
  }
  if (scores.description) {
    totalScore += scores.description.score * weights.description;
    totalWeight += weights.description;
  }
  if (scores.keywords) {
    totalScore += scores.keywords.score * weights.keywords;
    totalWeight += weights.keywords;
  }
  if (scores.content) {
    totalScore += scores.content.score * weights.content;
    totalWeight += weights.content;
  } else {
    // For pages without content (like rooms), redistribute weight
    const remainingWeight = weights.content;
    if (scores.title) {
      totalScore += scores.title.score * (remainingWeight * 0.5);
      totalWeight += remainingWeight * 0.5;
    }
    if (scores.description) {
      totalScore += scores.description.score * (remainingWeight * 0.5);
      totalWeight += remainingWeight * 0.5;
    }
  }

  return Math.round(totalScore / totalWeight);
};
