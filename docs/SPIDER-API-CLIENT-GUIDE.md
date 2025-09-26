# 🚀 Spider API Client Guide

## 📋 **Overview**

This guide provides step-by-step instructions for integrating with the Spider Node.js API from client applications. The API provides secure website scraping capabilities with enterprise-grade authentication and monitoring.

---

## 🔑 **Step 1: Obtaining API Keys**

### **1.1 Request API Access**
Contact your API administrator to request access to the Spider API. You will receive:
- A unique API key for authentication
- Encryption key for secure transmission (optional)
- API endpoint URL
- Rate limit information

### **1.2 API Key Format**
API keys follow this format: `sk_live_[64-character-hex-string]`
- Example: `sk_live_[your-actual-api-key-here]`
- Keys are case-sensitive
- Each key has individual rate limits

### **1.3 Security Storage**
- Store API keys in environment variables
- Never hardcode keys in source code
- Use secure key management systems in production
- Rotate keys regularly for security

---

## 🔐 **Step 2: Authentication Methods**

### **2.1 Basic API Key Authentication**
- **Security Level**: Low
- **Method**: Send API key in `X-API-Key` header
- **Use Case**: Development and testing
- **Visibility**: API key visible in network logs

### **2.2 Encrypted API Key Authentication**
- **Security Level**: High
- **Method**: Encrypt API key before transmission
- **Use Case**: Production applications
- **Visibility**: Only encrypted data visible in logs

### **2.3 JWT Token Authentication**
- **Security Level**: High
- **Method**: Generate time-limited tokens
- **Use Case**: Microservices and distributed systems
- **Visibility**: Tokens are opaque and time-limited

---

## 📡 **Step 3: API Endpoints**

### **3.1 Base URL Configuration**
- **Development**: `http://localhost:3001`
- **Production**: `https://your-api-domain.com`
- **Protocol**: Always use HTTPS in production

### **3.2 Available Endpoints**

#### **Website Scraping Endpoints**
- **Full Scraping**: `POST /scrap`
  - Extracts all content, links, images, and metadata
  - Supports single page and multi-page scraping
  - Returns comprehensive website data

- **Images Only**: `POST /scrapImagesOnly`
  - Extracts only images from websites
  - Optimized for image collection tasks
  - Faster processing for image-specific needs

#### **Management Endpoints**
- **API Key Status**: `GET /api-keys/status`
  - Check your API key usage and limits
  - Monitor remaining requests
  - View rate limit information

- **Server Health**: `GET /health`
  - Verify server availability
  - Check system status
  - No authentication required

- **Server Metrics**: `GET /status`
  - View detailed server statistics
  - Monitor performance metrics
  - No authentication required

- **Dashboard**: `GET /dashboard`
  - Visual monitoring interface
  - Real-time charts and metrics
  - No authentication required

---

## 🛠️ **Step 4: Request Configuration**

### **4.1 Required Headers**
- **Content-Type**: `application/json`
- **Authentication**: API key or encrypted key
- **Optional**: Encryption headers for secure transmission

### **4.2 Request Body Parameters**

#### **Basic Parameters**
- **url**: Target website URL (required)
- **mode**: Scraping mode (`single` or `multipage`)
- **maxPages**: Maximum pages to scrape (default: 500)

#### **Extraction Flags**
- **extractImagesFlag**: Extract images (true/false)
- **extractLinksFlag**: Extract links (true/false)
- **extractMeta**: Extract metadata (true/false)
- **detectTechnologiesFlag**: Detect web technologies (true/false)
- **detectCMSFlag**: Detect CMS systems (true/false)

### **4.3 Response Format**
All responses include:
- **Summary**: Total counts and statistics
- **Pages**: Detailed page information
- **Extracted Data**: Structured content data
- **Performance**: Timing and speed metrics
- **Metadata**: Request and response information

---

## 🔒 **Step 5: Security Implementation**

### **5.1 Environment Variables**
Set up secure environment variables:
- Store API keys in `.env` files
- Use different keys for different environments
- Never commit keys to version control
- Use secure key management in production

### **5.2 HTTPS Requirements**
- Always use HTTPS in production
- Verify SSL certificates
- Use secure connection protocols
- Monitor for security vulnerabilities

### **5.3 Rate Limiting**
- Each API key has individual rate limits
- Monitor usage to avoid exceeding limits
- Implement retry logic with exponential backoff
- Use multiple API keys for higher throughput

---

## ⚠️ **Step 6: Error Handling**

### **6.1 Common Error Codes**

#### **Authentication Errors**
- **MISSING_API_KEY**: No API key provided
- **INVALID_API_KEY**: Invalid or expired API key
- **KEY_DECRYPTION_ERROR**: Encryption/decryption failed

#### **Rate Limiting Errors**
- **API_KEY_RATE_LIMIT**: Rate limit exceeded
- **RETRY_AFTER**: Seconds to wait before retry

#### **Request Errors**
- **DECRYPTION_ERROR**: Request decryption failed
- **SCRAPING_ERROR**: Website scraping failed
- **VALIDATION_ERROR**: Invalid request parameters

### **6.2 Error Response Format**
All errors include:
- **error**: Human-readable error message
- **code**: Machine-readable error code
- **message**: Detailed error description
- **timestamp**: When the error occurred
- **retryAfter**: Seconds to wait (for rate limits)

---

## 🚀 **Step 7: Production Deployment**

### **7.1 Performance Considerations**
- Implement connection pooling
- Use async/await for non-blocking requests
- Cache responses when appropriate
- Monitor response times and success rates

### **7.2 Monitoring and Logging**
- Log all API requests and responses
- Monitor API key usage and limits
- Track error rates and patterns
- Set up alerts for failures

### **7.3 Scaling Strategies**
- Use multiple API keys for higher throughput
- Implement request queuing for burst traffic
- Consider geographic distribution
- Plan for traffic spikes

---

## 📈 **Step 8: Usage Monitoring**

### **8.1 API Key Status**
Check your API key status regularly:
- Current usage vs. limits
- Remaining requests available
- Reset time for rate limits
- Historical usage patterns

### **8.2 Performance Metrics**
Monitor key performance indicators:
- Request success rates
- Average response times
- Error rates by type
- Throughput per minute

### **8.3 Cost Management**
- Track API usage for billing
- Optimize requests to reduce costs
- Use appropriate scraping modes
- Monitor for unnecessary requests

---

## 🔧 **Step 9: Integration Best Practices**

### **9.1 Request Optimization**
- Use appropriate scraping modes
- Set reasonable page limits
- Extract only needed data
- Cache results when possible

### **9.2 Error Recovery**
- Implement retry logic
- Handle rate limiting gracefully
- Log errors for debugging
- Provide fallback mechanisms

### **9.3 Security Maintenance**
- Rotate API keys regularly
- Monitor for suspicious activity
- Update encryption keys
- Review access logs

---

## 📚 **Step 10: Support and Resources**

### **10.1 Documentation**
- API endpoint documentation
- Authentication guide
- Error code reference
- Best practices guide

### **10.2 Monitoring Tools**
- Real-time dashboard
- Server status endpoint
- Performance metrics
- Usage analytics

### **10.3 Support Channels**
- Technical support contact
- Documentation updates
- Community forums
- Issue reporting system

---

## 🎯 **Summary**

This guide provides everything needed to integrate with the Spider API securely and efficiently. Key points to remember:

- **Security First**: Always use encrypted authentication in production
- **Monitor Usage**: Track API key usage and limits
- **Handle Errors**: Implement proper error handling and retry logic
- **Optimize Performance**: Use appropriate settings for your use case
- **Stay Updated**: Keep up with API changes and security updates

The Spider API provides powerful website scraping capabilities with enterprise-grade security and monitoring. Following this guide ensures secure, efficient, and reliable integration with your applications.
