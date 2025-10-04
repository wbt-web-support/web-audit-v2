'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  // Removed opacity fade-out on scroll

  // State for website analysis
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Function to analyze website
  const analyzeWebsite = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // Call PageSpeed API directly
      const pagespeedResponse = await fetch('/api/pagespeed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: 'demo-project', // Dummy project ID for demo
          url: url.trim()
        })
      });

      if (!pagespeedResponse.ok) {
        const errorData = await pagespeedResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to analyze website performance');
      }

      const pagespeedData = await pagespeedResponse.json();
      setAnalysisResult(pagespeedData);
      
      // Scroll down to analysis results after completion
      setIsScrolling(true);
      setTimeout(() => {
        const analysisElement = document.getElementById('analysis-results');
        if (analysisElement) {
          analysisElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
          
          // Add a subtle highlight effect
          analysisElement.style.transition = 'box-shadow 0.3s ease';
          analysisElement.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
          setTimeout(() => {
            analysisElement.style.boxShadow = '';
            setIsScrolling(false);
          }, 2000);
        } else {
          setIsScrolling(false);
        }
      }, 500); // Small delay to ensure content is rendered
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to export results as PDF
  const exportToPDF = async () => {
    if (!analysisResult) return;

    setIsExporting(true);
    try {
      // Create a hidden iframe for PDF generation
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const { lighthouseResult } = analysisResult.analysis;
      const { categories, audits } = lighthouseResult;

      // Generate PDF content
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Website Performance Analysis - ${url}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #333;
            }
            .container {
              background: white;
              border-radius: 15px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: left; 
              padding: 40px 20px; 
              margin: 0;
            }
            .header h1 { 
              font-size: 2.5em; 
              margin: 0 0 10px 0; 
              font-weight: 700;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .header p { 
              font-size: 1.1em; 
              margin: 5px 0; 
              opacity: 0.9;
            }
            .content { padding: 30px; }
            .score-grid { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              gap: 20px; 
              margin: 30px 0; 
            }
            .score-card { 
              text-align: center; 
              padding: 15px; 
              border-radius: 8px; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              border: 1px solid #e2e8f0;
              background: white;
            }
            .score-circle { 
              width: 60px; 
              height: 60px; 
              border-radius: 50%; 
              margin: 0 auto 8px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-size: 18px; 
              font-weight: bold;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .score-good { 
              background: linear-gradient(135deg, #10b981, #059669); 
              color: white; 
            }
            .score-warning { 
              background: linear-gradient(135deg, #f59e0b, #d97706); 
              color: white; 
            }
            .score-poor { 
              background: linear-gradient(135deg, #ef4444, #dc2626); 
              color: white; 
            }
            .metrics-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
              gap: 20px; 
              margin: 25px 0; 
            }
            .metric-card { 
              padding: 12px; 
              background: #f8fafc; 
              border-radius: 6px; 
              border-left: 3px solid #667eea;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              border: 1px solid #e2e8f0;
            }
            .metric-value { 
              font-size: 18px; 
              font-weight: bold; 
              color: #1e293b; 
              margin-bottom: 3px;
            }
            .metric-label { 
              font-size: 12px; 
              color: #64748b; 
              font-weight: 500;
            }
            .section { 
              margin: 20px 0; 
              padding: 15px;
              background: #f8fafc;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
            }
            .section h3 { 
              color: #1e293b; 
              border-bottom: 2px solid #667eea; 
              padding-bottom: 8px; 
              margin-bottom: 15px;
              font-size: 1.2em;
              font-weight: 600;
            }
            .recommendation { 
              background: #fef3c7; 
              border: 1px solid #f59e0b; 
              border-radius: 6px; 
              padding: 12px; 
              margin: 8px 0; 
              box-shadow: 0 1px 3px rgba(245, 158, 11, 0.2);
            }
            .recommendation h4 { 
              color: #92400e; 
              margin: 0 0 5px 0; 
              font-size: 1em;
              font-weight: 600;
            }
            .recommendation p { 
              color: #92400e; 
              margin: 0; 
              font-size: 13px; 
              line-height: 1.4;
            }
            .performance-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .badge-excellent { background: #10b981; color: white; }
            .badge-good { background: #3b82f6; color: white; }
            .badge-needs-improvement { background: #f59e0b; color: white; }
            .badge-poor { background: #ef4444; color: white; }
            .summary-stats {
              background: linear-gradient(135deg, #667eea, #764ba2);
              color: white;
              padding: 15px;
              border-radius: 6px;
              margin: 15px 0;
              text-align: left;
            }
            .summary-stats h3 {
              color: white;
              border: none;
              margin-bottom: 10px;
            }
            .footer {
              background: #1e293b;
              color: white;
              text-align: left;
              padding: 15px;
              margin-top: 20px;
            }
            .footer p {
              margin: 5px 0;
              opacity: 0.8;
            }
            @media print { 
              body { margin: 0; background: white; }
              .container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Website Performance Analysis</h1>
              <p><strong>URL:</strong> ${url}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Analysis Type:</strong> Comprehensive Performance Audit</p>
            </div>

            <div class="content">
              <div class="summary-stats">
                <h3>Executive Summary</h3>
                <p>This comprehensive analysis evaluates your website's performance across multiple critical dimensions including speed, accessibility, SEO, and best practices. The scores below provide a quick overview of your site's current state.</p>
              </div>

              <div class="section">
                <h3>Overall Performance Scores</h3>
                <div class="score-grid">
                  <div class="score-card">
                    <div class="score-circle ${categories.performance.score > 0.9 ? 'score-good' : categories.performance.score > 0.5 ? 'score-warning' : 'score-poor'}">
                      ${Math.round(categories.performance.score * 100)}
                    </div>
                    <h4>Performance</h4>
                    <span class="performance-badge ${categories.performance.score > 0.9 ? 'badge-excellent' : categories.performance.score > 0.7 ? 'badge-good' : categories.performance.score > 0.5 ? 'badge-needs-improvement' : 'badge-poor'}">
                      ${categories.performance.score > 0.9 ? 'Excellent' : categories.performance.score > 0.7 ? 'Good' : categories.performance.score > 0.5 ? 'Needs Improvement' : 'Poor'}
                    </span>
                  </div>
                  <div class="score-card">
                    <div class="score-circle ${categories.accessibility.score > 0.9 ? 'score-good' : categories.accessibility.score > 0.5 ? 'score-warning' : 'score-poor'}">
                      ${Math.round(categories.accessibility.score * 100)}
                    </div>
                    <h4>Accessibility</h4>
                    <span class="performance-badge ${categories.accessibility.score > 0.9 ? 'badge-excellent' : categories.accessibility.score > 0.7 ? 'badge-good' : categories.accessibility.score > 0.5 ? 'badge-needs-improvement' : 'badge-poor'}">
                      ${categories.accessibility.score > 0.9 ? 'Excellent' : categories.accessibility.score > 0.7 ? 'Good' : categories.accessibility.score > 0.5 ? 'Needs Improvement' : 'Poor'}
                    </span>
                  </div>
                  <div class="score-card">
                    <div class="score-circle ${categories['best-practices'].score > 0.9 ? 'score-good' : categories['best-practices'].score > 0.5 ? 'score-warning' : 'score-poor'}">
                      ${Math.round(categories['best-practices'].score * 100)}
                    </div>
                    <h4>Best Practices</h4>
                    <span class="performance-badge ${categories['best-practices'].score > 0.9 ? 'badge-excellent' : categories['best-practices'].score > 0.7 ? 'badge-good' : categories['best-practices'].score > 0.5 ? 'badge-needs-improvement' : 'badge-poor'}">
                      ${categories['best-practices'].score > 0.9 ? 'Excellent' : categories['best-practices'].score > 0.7 ? 'Good' : categories['best-practices'].score > 0.5 ? 'Needs Improvement' : 'Poor'}
                    </span>
                  </div>
                  <div class="score-card">
                    <div class="score-circle ${categories.seo.score > 0.9 ? 'score-good' : categories.seo.score > 0.5 ? 'score-warning' : 'score-poor'}">
                      ${Math.round(categories.seo.score * 100)}
                    </div>
                    <h4>SEO</h4>
                    <span class="performance-badge ${categories.seo.score > 0.9 ? 'badge-excellent' : categories.seo.score > 0.7 ? 'badge-good' : categories.seo.score > 0.5 ? 'badge-needs-improvement' : 'badge-poor'}">
                      ${categories.seo.score > 0.9 ? 'Excellent' : categories.seo.score > 0.7 ? 'Good' : categories.seo.score > 0.5 ? 'Needs Improvement' : 'Poor'}
                    </span>
                  </div>
                </div>
              </div>

              <div class="section">
                <h3>Core Web Vitals</h3>
                <p style="color: #64748b; margin-bottom: 20px; font-style: italic;">These metrics are crucial for user experience and are used by Google for ranking. They measure the loading, interactivity, and visual stability of your page.</p>
                <div class="metrics-grid">
                  <div class="metric-card">
                    <div class="metric-value">${audits['first-contentful-paint']?.displayValue || 'N/A'}</div>
                    <div class="metric-label">First Contentful Paint</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Time to first content render</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${audits['largest-contentful-paint']?.displayValue || 'N/A'}</div>
                    <div class="metric-label">Largest Contentful Paint</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Time to largest content render</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${audits['cumulative-layout-shift']?.displayValue || 'N/A'}</div>
                    <div class="metric-label">Cumulative Layout Shift</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Visual stability measure</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <h3>Performance Metrics</h3>
                <p style="color: #64748b; margin-bottom: 20px; font-style: italic;">Detailed performance measurements that help identify specific areas for optimization.</p>
                <div class="metrics-grid">
                  <div class="metric-card">
                    <div class="metric-value">${audits['speed-index']?.displayValue || 'N/A'}</div>
                    <div class="metric-label">Speed Index</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Visual loading speed</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${audits['total-blocking-time']?.displayValue || 'N/A'}</div>
                    <div class="metric-label">Total Blocking Time</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Time blocked by long tasks</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${audits['interactive']?.displayValue || 'N/A'}</div>
                    <div class="metric-label">Time to Interactive</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Time until page is interactive</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${audits['max-potential-fid']?.displayValue || 'N/A'}</div>
                    <div class="metric-label">First Input Delay</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Input responsiveness</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <h3>🔧 Additional Performance Details</h3>
                <p style="color: #64748b; margin-bottom: 20px; font-style: italic;">Additional metrics that provide deeper insights into your website's performance characteristics.</p>
                <div class="metrics-grid">
                  <div class="metric-card">
                    <div class="metric-value">${audits['first-meaningful-paint']?.displayValue || 'N/A'}</div>
                    <div class="metric-label">🎨 First Meaningful Paint</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Time to meaningful content</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${audits['render-blocking-resources']?.displayValue || 'N/A'}</div>
                    <div class="metric-label">🚫 Render Blocking Resources</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Resources blocking render</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${audits['unused-css-rules']?.displayValue || 'N/A'}</div>
                    <div class="metric-label">🎨 Unused CSS Rules</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Unused CSS detected</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${audits['unused-javascript']?.displayValue || 'N/A'}</div>
                    <div class="metric-label">📜 Unused JavaScript</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Unused JS detected</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${audits['efficient-animated-content']?.displayValue || 'N/A'}</div>
                    <div class="metric-label">🎬 Efficient Animated Content</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Animation efficiency</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${audits['uses-optimized-images']?.displayValue || 'N/A'}</div>
                    <div class="metric-label">🖼️ Optimized Images</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Image optimization status</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <h3>📊 Resource Analysis</h3>
                <p style="color: #64748b; margin-bottom: 20px; font-style: italic;">Analysis of your website's resource usage and network performance.</p>
                <div class="metrics-grid">
                  <div class="metric-card">
                    <div class="metric-value">${audits['resource-summary']?.details?.items?.[0]?.total || 'N/A'}</div>
                    <div class="metric-label">📦 Total Resources</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Number of resources loaded</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${audits['resource-summary']?.details?.items?.[0]?.totalBytes ? (audits['resource-summary'].details.items[0].totalBytes / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</div>
                    <div class="metric-label">💾 Total Size</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Total resource size</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${audits['network-requests']?.details?.items?.length || 'N/A'}</div>
                    <div class="metric-label">🌐 Network Requests</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Number of network requests</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${(() => {
                      const items = audits['network-requests']?.details?.items;
                      if (!items) return 'N/A';
                      const totalSize = items.reduce((total: number, item: any) => total + (item.transferSize || 0), 0);
                      return totalSize ? (totalSize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A';
                    })()}</div>
                    <div class="metric-label">📡 Transfer Size</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Data transferred over network</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <h3>💡 Performance Recommendations</h3>
                <p style="color: #64748b; margin-bottom: 20px; font-style: italic;">Actionable recommendations to improve your website's performance based on the analysis results.</p>
                ${categories.performance.score < 0.9 ? `
                  <div class="recommendation">
                    <h4>🚀 Improve Performance Score</h4>
                    <p>Your performance score is ${Math.round(categories.performance.score * 100)}. Focus on optimizing Core Web Vitals, reducing JavaScript execution time, and optimizing images.</p>
                  </div>
                ` : ''}
                ${audits['first-contentful-paint']?.score < 0.9 ? `
                  <div class="recommendation">
                    <h4>🎨 Optimize First Contentful Paint</h4>
                    <p>Improve server response times, eliminate render-blocking resources, and optimize critical rendering path.</p>
                  </div>
                ` : ''}
                ${audits['largest-contentful-paint']?.score < 0.9 ? `
                  <div class="recommendation">
                    <h4>🖼️ Optimize Largest Contentful Paint</h4>
                    <p>Optimize images, preload important resources, and eliminate render-blocking resources.</p>
                  </div>
                ` : ''}
                ${audits['cumulative-layout-shift']?.score < 0.9 ? `
                  <div class="recommendation">
                    <h4>📐 Reduce Cumulative Layout Shift</h4>
                    <p>Ensure images and ads have size attributes, avoid inserting content above existing content, and use transform animations instead of properties that trigger layout.</p>
                  </div>
                ` : ''}
                ${audits['render-blocking-resources']?.score < 0.9 ? `
                  <div class="recommendation">
                    <h4>🚫 Eliminate Render-Blocking Resources</h4>
                    <p>Remove or defer render-blocking CSS and JavaScript. Use media queries for non-critical CSS and load JavaScript asynchronously.</p>
                  </div>
                ` : ''}
                ${audits['unused-css-rules']?.score < 0.9 ? `
                  <div class="recommendation">
                    <h4>🎨 Remove Unused CSS</h4>
                    <p>Eliminate unused CSS rules to reduce file size and improve loading performance. Use tools like PurgeCSS or similar.</p>
                  </div>
                ` : ''}
                ${audits['unused-javascript']?.score < 0.9 ? `
                  <div class="recommendation">
                    <h4>📜 Remove Unused JavaScript</h4>
                    <p>Remove unused JavaScript code to reduce bundle size and improve loading performance. Use code splitting and tree shaking.</p>
                  </div>
                ` : ''}
                ${audits['uses-optimized-images']?.score < 0.9 ? `
                  <div class="recommendation">
                    <h4>🖼️ Optimize Images</h4>
                    <p>Use modern image formats (WebP, AVIF), compress images, and implement responsive images with proper sizing.</p>
                  </div>
                ` : ''}
                ${audits['efficient-animated-content']?.score < 0.9 ? `
                  <div class="recommendation">
                    <h4>🎬 Optimize Animations</h4>
                    <p>Use CSS transforms and opacity for animations instead of properties that trigger layout or paint. Consider using will-change property.</p>
                  </div>
                ` : ''}
              </div>

              <div class="section">
                <h3>📋 Technical Summary</h3>
                <p style="color: #64748b; margin-bottom: 20px; font-style: italic;">Final overview of all performance categories and their scores.</p>
                <div class="metrics-grid">
                  <div class="metric-card">
                    <div class="metric-value">${categories.performance.score ? Math.round(categories.performance.score * 100) : 'N/A'}</div>
                    <div class="metric-label">⚡ Overall Performance</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Combined performance score</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${categories.accessibility.score ? Math.round(categories.accessibility.score * 100) : 'N/A'}</div>
                    <div class="metric-label">♿ Accessibility Score</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Accessibility compliance</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${categories['best-practices'].score ? Math.round(categories['best-practices'].score * 100) : 'N/A'}</div>
                    <div class="metric-label">✅ Best Practices</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Web development best practices</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${categories.seo.score ? Math.round(categories.seo.score * 100) : 'N/A'}</div>
                    <div class="metric-label">🔍 SEO Score</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Search engine optimization</div>
                  </div>
                </div>
              </div>

              <div class="footer">
                <h3 style="color: white; margin-bottom: 15px;">Thank You for Using WebAudit!</h3>
                <p><strong>Generated by WebAudit</strong> - Professional Website Analysis Tool</p>
                <p>For more detailed analysis, continuous monitoring, and advanced recommendations, visit our dashboard at <strong>webaudit.com</strong></p>
                <p style="margin-top: 20px; font-size: 14px; opacity: 0.7;">
                  Contact: support@webaudit.com | Website: webaudit.com
                </p>
                <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                  <p style="margin: 0; font-size: 13px; opacity: 0.9;">
                    <strong>Pro Tip:</strong> Run this analysis monthly to track your website's performance improvements over time!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      iframe.contentDocument?.write(pdfContent);
      iframe.contentDocument?.close();
      
      // Wait for content to load, then trigger print
      setTimeout(() => {
        iframe.contentWindow?.print();
        // Clean up iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 1000);

    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={ref} className="relative min-h-screen overflow-hidden bg-black">
      {/* Parallax Background */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800"
      >
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05)_76%,transparent_77%)] bg-[length:50px_50px]"></div>
        </div>
        
        {/* Floating Elements */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-4 h-4 bg-white rounded-full opacity-30"
        />
        <motion.div
          animate={{
            y: [0, 30, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-40 right-20 w-6 h-6 border border-white rounded-full opacity-20"
        />
        <motion.div
          animate={{
            y: [0, -15, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-40 left-1/4 w-3 h-3 bg-white rounded-full opacity-25"
        />
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8 pt-20"
      >
        <div className="text-center max-w-6xl mx-auto px-4">
          {/* Main Title with AI Integration */}
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-4xl lg:text-4xl xl:text-6xl font-bold text-white mb-4 sm:mb-6"
          >
            WEB{' '}
            <motion.span
              animate={{
                backgroundPosition: ['0%', '100%', '0%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              className="bg-gradient-to-r from-white via-gray-300 to-white bg-[length:200%_100%] bg-clip-text text-transparent"
            >
              AUDIT
            </motion.span>
          </motion.h1>

          {/* AI-Powered Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mb-6 sm:mb-8"
          >
            <motion.span
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-black text-xs sm:text-sm font-semibold rounded-full mb-3 sm:mb-4"
            >
               AI-POWERED
            </motion.span>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-gray-300 font-light px-4">
              Complete Website Analysis in Minutes
            </h2>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 max-w-4xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4"
          >
            From single-page checks to full-site crawls, our AI analyzes content, SEO, 
            performance, branding, and security risks. Get actionable insights to improve 
            your site&apos;s quality, speed, and visibility.
          </motion.p>

          {/* URL Input and CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="max-w-2xl mx-auto mb-6 sm:mb-8 px-4"
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
              <div className="flex-1 w-full">
                <input
                  type="url"
                  placeholder="Enter your website URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isAnalyzing}
                  className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300 text-sm sm:text-base disabled:opacity-50"
                />
              </div>
              <motion.button
                whileHover={{ scale: isAnalyzing ? 1 : 1.05 }}
                whileTap={{ scale: isAnalyzing ? 1 : 0.95 }}
                onClick={analyzeWebsite}
                disabled={isAnalyzing}
                className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-300 shadow-lg whitespace-nowrap text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </div>
                ) : (
                  "Let's Go! 🚀"
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Secondary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex justify-center px-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 sm:px-8 sm:py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-black transition-all duration-300 text-sm sm:text-base"
            >
              Learn More
            </motion.button>
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 max-w-2xl mx-auto px-4"
            >
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200 text-center">
                {error}
              </div>
            </motion.div>
          )}

          {/* Scrolling Indicator */}
          {isScrolling && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 max-w-2xl mx-auto px-4"
            >
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-200 text-center">
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-green-300 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Analysis complete! Scrolling to results...
                </div>
              </div>
            </motion.div>
          )}
          {/* Stats - Only show when no analysis results */}
          {!analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1 }}
              className="mt-12 sm:mt-16 flex flex-row justify-center items-center gap-4 sm:gap-8 md:gap-12 max-w-4xl mx-auto px-4"
            >
              {[
                { number: "10K+", label: "Websites Audited" },
                { number: "99.9%", label: "Accuracy Rate" },
                { number: "< 2min", label: "Average Scan Time" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                  className="text-center flex-shrink-0"
                >
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                    {stat.number}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm whitespace-nowrap">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Analysis Results - Separate Section Below Hero */}
      {analysisResult && (
        <motion.div
          id="analysis-results"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-7xl mx-auto px-4 pb-8"
        >
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                Performance Analysis for {url}
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportToPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors duration-300 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export PDF
                  </>
                )}
              </motion.button>
            </div>
            
            {/* Screenshot */}
            {analysisResult.analysis?.screenshot && (
              <div className="mb-8 text-center">
                <img
                  src={analysisResult.analysis.screenshot}
                  alt="Website Screenshot"
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                  style={{ maxHeight: '400px' }}
                />
              </div>
            )}

            {/* Overall Scores Dashboard */}
            {analysisResult.analysis?.lighthouseResult && (
              <>
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-white mb-4">Overall Performance Scores</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { 
                        label: 'Performance', 
                        score: analysisResult.analysis.lighthouseResult.categories?.performance?.score,
                        color: 'text-green-400'
                      },
                      { 
                        label: 'Accessibility', 
                        score: analysisResult.analysis.lighthouseResult.categories?.accessibility?.score,
                        color: 'text-blue-400'
                      },
                      { 
                        label: 'Best Practices', 
                        score: analysisResult.analysis.lighthouseResult.categories?.['best-practices']?.score,
                        color: 'text-purple-400'
                      },
                      { 
                        label: 'SEO', 
                        score: analysisResult.analysis.lighthouseResult.categories?.seo?.score,
                        color: 'text-yellow-400'
                      }
                    ].map((metric, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-4 text-center">
                        <div className="relative w-16 h-16 mx-auto mb-2">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              className="text-white/20"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray={`${Math.round((metric.score || 0) * 100) * 2.51} 251`}
                              strokeLinecap="round"
                              className={metric.score > 0.9 ? 'text-green-400' : metric.score > 0.5 ? 'text-yellow-400' : 'text-red-400'}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">{Math.round((metric.score || 0) * 100)}</span>
                          </div>
                        </div>
                        <div className="text-white text-sm font-medium">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Core Web Vitals */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-white mb-4">Core Web Vitals</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'first-contentful-paint', label: 'First Contentful Paint', desc: 'Time to first content render' },
                      { key: 'largest-contentful-paint', label: 'Largest Contentful Paint', desc: 'Time to largest content render' },
                      { key: 'cumulative-layout-shift', label: 'Cumulative Layout Shift', desc: 'Visual stability measure' }
                    ].map((metric, index) => {
                      const audit = analysisResult.analysis.lighthouseResult.audits[metric.key];
                      const score = audit?.score || 0;
                      return audit ? (
                        <div key={index} className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium text-white">{metric.label}</h5>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              score > 0.9 ? 'bg-green-500/20 text-green-300' : 
                              score > 0.5 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {score > 0.9 ? 'Good' : score > 0.5 ? 'Needs Improvement' : 'Poor'}
                            </span>
                          </div>
                          <p className="text-xl font-bold text-white mb-1">{audit.displayValue || 'N/A'}</p>
                          <p className="text-xs text-gray-300">{metric.desc}</p>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-white mb-4">Performance Metrics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { key: 'speed-index', label: 'Speed Index', desc: 'Visual loading speed' },
                      { key: 'total-blocking-time', label: 'Total Blocking Time', desc: 'Time blocked by long tasks' },
                      { key: 'interactive', label: 'Time to Interactive', desc: 'Time until page is interactive' },
                      { key: 'max-potential-fid', label: 'First Input Delay', desc: 'Input responsiveness' }
                    ].map((metric, index) => {
                      const audit = analysisResult.analysis.lighthouseResult.audits[metric.key];
                      const score = audit?.score || 0;
                      return audit ? (
                        <div key={index} className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium text-white">{metric.label}</h5>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              score > 0.9 ? 'bg-green-500/20 text-green-300' : 
                              score > 0.5 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {score > 0.9 ? 'Good' : score > 0.5 ? 'Needs Improvement' : 'Poor'}
                            </span>
                          </div>
                          <p className="text-lg font-bold text-white mb-1">{audit.displayValue || 'N/A'}</p>
                          <p className="text-xs text-gray-300">{metric.desc}</p>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Additional Performance Details */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-white mb-4">Additional Performance Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { key: 'first-meaningful-paint', label: 'First Meaningful Paint', desc: 'Time to meaningful content' },
                      { key: 'render-blocking-resources', label: 'Render Blocking Resources', desc: 'Resources blocking render' },
                      { key: 'unused-css-rules', label: 'Unused CSS Rules', desc: 'Unused CSS detected' },
                      { key: 'unused-javascript', label: 'Unused JavaScript', desc: 'Unused JS detected' },
                      { key: 'efficient-animated-content', label: 'Efficient Animated Content', desc: 'Animation efficiency' },
                      { key: 'uses-optimized-images', label: 'Optimized Images', desc: 'Image optimization status' }
                    ].map((metric, index) => {
                      const audit = analysisResult.analysis.lighthouseResult.audits[metric.key];
                      const score = audit?.score || 0;
                      return audit ? (
                        <div key={index} className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium text-white">{metric.label}</h5>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              score > 0.9 ? 'bg-green-500/20 text-green-300' : 
                              score > 0.5 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {score > 0.9 ? 'Good' : score > 0.5 ? 'Needs Improvement' : 'Poor'}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-white mb-1">{audit.displayValue || 'N/A'}</p>
                          <p className="text-xs text-gray-300">{metric.desc}</p>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Resource Analysis */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-white mb-4">Resource Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-white mb-3">Resource Summary</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Total Resources:</span>
                          <span className="text-white font-medium">{analysisResult.analysis.lighthouseResult.audits?.['resource-summary']?.details?.items?.[0]?.total || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Total Size:</span>
                          <span className="text-white font-medium">{analysisResult.analysis.lighthouseResult.audits?.['resource-summary']?.details?.items?.[0]?.totalBytes ? `${(analysisResult.analysis.lighthouseResult.audits['resource-summary'].details.items[0].totalBytes / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Gzip Savings:</span>
                          <span className="text-white font-medium">{analysisResult.analysis.lighthouseResult.audits?.['resource-summary']?.details?.items?.[0]?.wastedBytes ? `${(analysisResult.analysis.lighthouseResult.audits['resource-summary'].details.items[0].wastedBytes / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-white mb-3">Network Analysis</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Requests:</span>
                          <span className="text-white font-medium">{analysisResult.analysis.lighthouseResult.audits?.['network-requests']?.details?.items?.length || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Transfer Size:</span>
                          <span className="text-white font-medium">{analysisResult.analysis.lighthouseResult.audits?.['network-requests']?.details?.items?.reduce((total: number, item: any) => total + (item.transferSize || 0), 0) ? `${(analysisResult.analysis.lighthouseResult.audits['network-requests'].details.items.reduce((total: number, item: any) => total + (item.transferSize || 0), 0) / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Resource Load Time:</span>
                          <span className="text-white font-medium">{analysisResult.analysis.lighthouseResult.audits?.['network-requests']?.details?.items?.[0]?.duration ? `${analysisResult.analysis.lighthouseResult.audits['network-requests'].details.items[0].duration.toFixed(2)}ms` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Recommendations */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Performance Recommendations</h4>
                  <div className="space-y-3">
                    {analysisResult.analysis.lighthouseResult.categories?.performance?.score < 0.9 && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                        <h5 className="font-medium text-yellow-300 mb-2">Improve Performance Score</h5>
                        <p className="text-sm text-yellow-200">
                          Your performance score is {Math.round((analysisResult.analysis.lighthouseResult.categories?.performance?.score || 0) * 100)}. 
                          Focus on optimizing Core Web Vitals, reducing JavaScript execution time, and optimizing images.
                        </p>
                      </div>
                    )}
                    {analysisResult.analysis.lighthouseResult.audits?.['first-contentful-paint']?.score < 0.9 && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <h5 className="font-medium text-blue-300 mb-2">Optimize First Contentful Paint</h5>
                        <p className="text-sm text-blue-200">
                          Improve server response times, eliminate render-blocking resources, and optimize critical rendering path.
                        </p>
                      </div>
                    )}
                    {analysisResult.analysis.lighthouseResult.audits?.['largest-contentful-paint']?.score < 0.9 && (
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                        <h5 className="font-medium text-purple-300 mb-2">Optimize Largest Contentful Paint</h5>
                        <p className="text-sm text-purple-200">
                          Optimize images, preload important resources, and eliminate render-blocking resources.
                        </p>
                      </div>
                    )}
                    {analysisResult.analysis.lighthouseResult.audits?.['cumulative-layout-shift']?.score < 0.9 && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <h5 className="font-medium text-red-300 mb-2">Reduce Cumulative Layout Shift</h5>
                        <p className="text-sm text-red-200">
                          Ensure images and ads have size attributes, avoid inserting content above existing content, and use transform animations.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="mt-6 text-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const analysisElement = document.getElementById('analysis-results');
                  if (analysisElement) {
                    analysisElement.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'start' 
                    });
                  }
                }}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-300"
              >
                📊 View Analysis Results
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/dashboard'}
                className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-300"
              >
                View Full Analysis
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/signup'}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-300"
              >
                Get Started Free
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Scroll Indicator - Only show when no analysis results */}
      {!analysisResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
