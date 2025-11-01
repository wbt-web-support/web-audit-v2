"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";

export default function CommingSoon() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setMessage("Please enter your email address");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setMessageType("");

    try {
      // Check if email already exists
      const { data: existingEmail, error: checkError } = await supabase
        .from("notify_me")
        .select("id, email, is_active")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "not found" error, which is expected for new emails
        console.error("Error checking existing email:", checkError);
        console.error("Check error details:", {
          message: checkError.message,
          details: checkError.details,
          hint: checkError.hint,
          code: checkError.code,
        });

        if (checkError.code === "PGRST301") {
          setMessage(
            "Table not found. Please run the database setup script first."
          );
        } else if (checkError.message.includes("permission denied")) {
          setMessage(
            "Permission denied. Please check your Supabase RLS policies."
          );
        } else {
          setMessage(
            `Database error: ${checkError.message || "Unknown error"}`
          );
        }
        setMessageType("error");
        return;
      }

      if (existingEmail) {
        if (existingEmail.is_active) {
          setMessage(
            "You're already on our notification list! We'll notify you when we launch."
          );
          setMessageType("success");
          setEmail(""); // Clear the form
          return;
        } else {
          // Reactivate the subscription
          const { error: updateError } = await supabase
            .from("notify_me")
            .update({
              is_active: true,
              updated_at: new Date().toISOString(),
              source: "homepage",
            })
            .eq("id", existingEmail.id);

          if (updateError) {
            console.error("Error reactivating subscription:", updateError);
            setMessage("Failed to reactivate subscription");
            setMessageType("error");
            return;
          }

          setMessage(
            "Welcome back! We've reactivated your notification subscription."
          );
          setMessageType("success");
          setEmail(""); // Clear the form
          return;
        }
      }

      // Insert new email
      const { data, error } = await supabase
        .from("notify_me")
        .insert([
          {
            email: email.toLowerCase().trim(),
            source: "homepage",
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error inserting email:", error);
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        // Provide more specific error messages
        if (error.code === "PGRST301") {
          setMessage(
            "Table not found. Please run the database setup script first."
          );
        } else if (error.code === "PGRST116") {
          setMessage(
            "Database connection failed. Please check your Supabase configuration."
          );
        } else if (error.message.includes("permission denied")) {
          setMessage(
            "Permission denied. Please check your Supabase RLS policies."
          );
        } else {
          setMessage(
            `Failed to subscribe: ${error.message || "Unknown error"}`
          );
        }
        setMessageType("error");
        return;
      }

      setMessage("Thank you! We'll notify you when we launch.");
      setMessageType("success");
      setEmail(""); // Clear the form on success
    } catch (error) {
      console.error("Unexpected error:", error);
      setMessage("An unexpected error occurred");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-50 rounded-full opacity-30 blur-2xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center max-w-4xl mx-auto px-4">
        {/* Logo/Icon */}

        <div className="min-h-screen flex justify-center items-center">
          {/* Main Heading */}
          <div>
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full ring-1 ring-slate-200/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent text-sm font-semibold tracking-wide">
                Coming soon
              </span>
            </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Complete Website Audit & Analysis Platform
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl">
            Get comprehensive website audits in minutes. Analyze SEO,
            performance, security, content, and branding with actionable
            insights to improve your site's quality, speed, and visibility.
          </p>

          {/* Email Signup Form */}
          <div className="w-full max-w-md mb-12">
            {/* Success/Error Message */}
            {message && (
              <div
                className={`mb-4 p-4 rounded-lg ${
                  messageType === "success"
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {messageType === "success" ? (
                      <svg
                        className="h-5 w-5 text-green-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{message}</p>
                  </div>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                required
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Subscribing...
                  </div>
                ) : (
                  "Notify Me"
                )}
              </button>
            </form>
          </div>

          {/* Features Preview */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mb-12">
            <article className="bg-white/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                SEO Analysis
              </h2>
              <p className="text-gray-600 text-sm">
                Complete SEO audit including meta tags, headings, content
                structure, and Google tags analysis for better search engine
                visibility.
              </p>
            </article>

            <article className="bg-white/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Performance Audit
              </h2>
              <p className="text-gray-600 text-sm">
                Comprehensive performance analysis including Core Web Vitals,
                image optimization, and site speed recommendations.
              </p>
            </article>

            <article className="bg-white/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Security Assessment
              </h2>
              <p className="text-gray-600 text-sm">
                Identify security risks, exposed API keys, broken links, and
                vulnerabilities to protect your website and users.
              </p>
            </article>
          </section>
          </div>
        </div>
        {/* Additional Features */}
        <section className="max-w-4xl mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why Choose Auditly360?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Complete Website Crawl
              </h3>
              <p className="text-gray-600 text-sm">
                From single-page checks to full-site crawls, discover hidden
                URLs and analyze your entire website structure.
              </p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Actionable Insights
              </h3>
              <p className="text-gray-600 text-sm">
                Get specific recommendations to improve your site's quality,
                speed, and visibility with prioritized action items.
              </p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Content & Branding
              </h3>
              <p className="text-gray-600 text-sm">
                Analyze content quality, social media previews, and branding
                consistency across your website.
              </p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Fast Results
              </h3>
              <p className="text-gray-600 text-sm">
                Get comprehensive website audit results in just minutes, not
                hours or days like traditional tools.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="my-16 text-gray-500 text-sm">
          <p>
            &copy; 2025 Auditly360. All rights reserved. | Complete Website
            Audit & Analysis Platform
          </p>
        </footer>
      </div>
    </div>
  );
}
