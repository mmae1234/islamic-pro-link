import DOMPurify from 'dompurify';

// Security utility functions for input validation and sanitization

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export function sanitizeHtml(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
}

/**
 * Sanitizes plain text by removing any HTML tags
 */
export function sanitizeText(content: string): string {
  return DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Validates and sanitizes bio content
 */
export function validateBio(bio: string): { isValid: boolean; sanitized: string; error?: string } {
  if (bio.length > 500) {
    return { isValid: false, sanitized: '', error: 'Bio must be 500 characters or less' };
  }
  
  const sanitized = sanitizeText(bio);
  
  // Check for inappropriate content patterns
  const inappropriatePatterns = [
    /\b(fuck|shit|damn)\b/gi,
    /<script/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];
  
  const hasInappropriateContent = inappropriatePatterns.some(pattern => pattern.test(sanitized));
  
  if (hasInappropriateContent) {
    return { isValid: false, sanitized: '', error: 'Bio contains inappropriate content' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates and sanitizes skill entries
 */
export function validateSkill(skill: string): { isValid: boolean; sanitized: string; error?: string } {
  if (skill.length > 50) {
    return { isValid: false, sanitized: '', error: 'Skill must be 50 characters or less' };
  }
  
  const sanitized = sanitizeText(skill.trim());
  
  if (sanitized.length < 2) {
    return { isValid: false, sanitized: '', error: 'Skill must be at least 2 characters' };
  }
  
  // Only allow alphanumeric characters, spaces, and common punctuation
  const validPattern = /^[a-zA-Z0-9\s\-\+\#\.\/&]+$/;
  if (!validPattern.test(sanitized)) {
    return { isValid: false, sanitized: '', error: 'Skill contains invalid characters' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates and sanitizes message content
 */
export function validateMessage(message: string): { isValid: boolean; sanitized: string; error?: string } {
  if (message.length > 2000) {
    return { isValid: false, sanitized: '', error: 'Message must be 2000 characters or less' };
  }
  
  if (message.trim().length < 1) {
    return { isValid: false, sanitized: '', error: 'Message cannot be empty' };
  }
  
  const sanitized = sanitizeText(message);
  
  // Check for spam patterns
  const spamPatterns = [
    /(.)\1{10,}/g, // Repeated characters
    /https?:\/\/[^\s]+/g, // URLs (basic detection)
    /\b(click here|visit now|free money)\b/gi
  ];
  
  const hasSpam = spamPatterns.some(pattern => pattern.test(sanitized));
  
  if (hasSpam) {
    return { isValid: false, sanitized: '', error: 'Message appears to contain spam or inappropriate content' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates and sanitizes user names
 */
export function validateName(name: string): { isValid: boolean; sanitized: string; error?: string } {
  if (name.length > 50) {
    return { isValid: false, sanitized: '', error: 'Name must be 50 characters or less' };
  }
  
  const sanitized = sanitizeText(name.trim());
  
  if (sanitized.length < 1) {
    return { isValid: false, sanitized: '', error: 'Name is required' };
  }
  
  // Only allow letters, spaces, hyphens, and apostrophes
  const validPattern = /^[a-zA-Z\s\-']+$/;
  if (!validPattern.test(sanitized)) {
    return { isValid: false, sanitized: '', error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): { isValid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeText(email.trim().toLowerCase());
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(sanitized)) {
    return { isValid: false, sanitized: '', error: 'Please enter a valid email address' };
  }
  
  return { isValid: true, sanitized };
}