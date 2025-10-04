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
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // State for website analysis
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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
      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Unable to open print window. Please allow popups for this site.');
      }

      const { lighthouseResult } = analysisResult.analysis;
      const { categories, audits } = lighthouseResult;

      // Generate PDF content
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Website Performance Analysis - ${url}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: white; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .score-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
            .score-card { text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .score-circle { width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; }
            .score-good { background: #10b981; color: white; }
            .score-warning { background: #f59e0b; color: white; }
            .score-poor { background: #ef4444; color: white; }
            .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
            .metric-card { padding: 15px; background: #f9fafb; border-radius: 6px; }
            .metric-value { font-size: 20px; font-weight: bold; color: #1f2937; }
            .metric-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
            .section { margin: 30px 0; }
            .section h3 { color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
            .recommendation { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 10px 0; }
            .recommendation h4 { color: #92400e; margin: 0 0 10px 0; }
            .recommendation p { color: #92400e; margin: 0; font-size: 14px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Website Performance Analysis</h1>
            <p><strong>URL:</strong> ${url}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div class="section">
            <h3>Overall Performance Scores</h3>
            <div class="score-grid">
              <div class="score-card">
                <div class="score-circle ${categories.performance.score > 0.9 ? 'score-good' : categories.performance.score > 0.5 ? 'score-warning' : 'score-poor'}">
                  ${Math.round(categories.performance.score * 100)}
                </div>
                <h4>Performance</h4>
              </div>
              <div class="score-card">
                <div class="score-circle ${categories.accessibility.score > 0.9 ? 'score-good' : categories.accessibility.score > 0.5 ? 'score-warning' : 'score-poor'}">
                  ${Math.round(categories.accessibility.score * 100)}
                </div>
                <h4>Accessibility</h4>
              </div>
              <div class="score-card">
                <div class="score-circle ${categories['best-practices'].score > 0.9 ? 'score-good' : categories['best-practices'].score > 0.5 ? 'score-warning' : 'score-poor'}">
                  ${Math.round(categories['best-practices'].score * 100)}
                </div>
                <h4>Best Practices</h4>
              </div>
              <div class="score-card">
                <div class="score-circle ${categories.seo.score > 0.9 ? 'score-good' : categories.seo.score > 0.5 ? 'score-warning' : 'score-poor'}">
                  ${Math.round(categories.seo.score * 100)}
                </div>
                <h4>SEO</h4>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Core Web Vitals</h3>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">${audits['first-contentful-paint']?.displayValue || 'N/A'}</div>
                <div class="metric-label">First Contentful Paint</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${audits['largest-contentful-paint']?.displayValue || 'N/A'}</div>
                <div class="metric-label">Largest Contentful Paint</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${audits['cumulative-layout-shift']?.displayValue || 'N/A'}</div>
                <div class="metric-label">Cumulative Layout Shift</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Performance Metrics</h3>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">${audits['speed-index']?.displayValue || 'N/A'}</div>
                <div class="metric-label">Speed Index</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${audits['total-blocking-time']?.displayValue || 'N/A'}</div>
                <div class="metric-label">Total Blocking Time</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${audits['interactive']?.displayValue || 'N/A'}</div>
                <div class="metric-label">Time to Interactive</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Performance Recommendations</h3>
            ${categories.performance.score < 0.9 ? `
              <div class="recommendation">
                <h4>Improve Performance Score</h4>
                <p>Your performance score is ${Math.round(categories.performance.score * 100)}. Focus on optimizing Core Web Vitals, reducing JavaScript execution time, and optimizing images.</p>
              </div>
            ` : ''}
            ${audits['first-contentful-paint']?.score < 0.9 ? `
              <div class="recommendation">
                <h4>Optimize First Contentful Paint</h4>
                <p>Improve server response times, eliminate render-blocking resources, and optimize critical rendering path.</p>
              </div>
            ` : ''}
            ${audits['largest-contentful-paint']?.score < 0.9 ? `
              <div class="recommendation">
                <h4>Optimize Largest Contentful Paint</h4>
                <p>Optimize images, preload important resources, and eliminate render-blocking resources.</p>
              </div>
            ` : ''}
            ${audits['cumulative-layout-shift']?.score < 0.9 ? `
              <div class="recommendation">
                <h4>Reduce Cumulative Layout Shift</h4>
                <p>Ensure images and ads have size attributes, avoid inserting content above existing content, and use transform animations instead of properties that trigger layout.</p>
              </div>
            ` : ''}
          </div>

          <div style="margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>Generated by WebAudit - Professional Website Analysis Tool</p>
            <p>For more detailed analysis and recommendations, visit our dashboard at webaudit.com</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(pdfContent);
      printWindow.document.close();
      
      // Wait for content to load, then trigger print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);

    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={ref} className="relative h-screen overflow-hidden bg-black">
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
        style={{ opacity }}
        className="relative z-10 flex items-center justify-center h-full px-4"
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
              🤖 AI-POWERED
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

      {/* Analysis Results */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 max-w-7xl mx-auto px-4"
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

          {/* Stats */}
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
        </div>
      </motion.div>

      {/* Scroll Indicator */}
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
    </div>
  );
}
