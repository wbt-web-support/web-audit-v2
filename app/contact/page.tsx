"use client";

import React, { useState } from "react";
import Link from "next/link";
import Footer from "../home-page-components/Footer";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      // Simulate API call - replace with actual API endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setSubmitStatus({
        type: "success",
        message: "Thank you for contacting us! We'll get back to you soon.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "Something went wrong. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-12 md:py-16 lg:py-20">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-block text-sm md:text-base font-medium text-blue-600 hover:text-blue-800 mb-6 md:mb-8 transition-colors"
        >
          ← Back to Home
        </Link>
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6 md:p-8 lg:p-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 mb-4 md:mb-6">
            Contact Us
          </h1>
          <p className="text-base md:text-lg text-gray-700 mb-8 md:mb-10">
            Have a question or need help? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm md:text-base font-medium text-gray-700 mb-2"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm md:text-base"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm md:text-base font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm md:text-base"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm md:text-base font-medium text-gray-700 mb-2"
              >
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm md:text-base bg-white"
              >
                <option value="">Select a subject</option>
                <option value="support">Technical Support</option>
                <option value="billing">Billing Inquiry</option>
                <option value="feature">Feature Request</option>
                <option value="bug">Report a Bug</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm md:text-base font-medium text-gray-700 mb-2"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none text-sm md:text-base"
                placeholder="Tell us how we can help you..."
              />
            </div>

            {submitStatus.type && (
              <div
                className={`p-4 rounded-lg ${
                  submitStatus.type === "success"
                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {submitStatus.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>

          <div className="mt-12 md:mt-16 pt-8 md:pt-12 border-t border-gray-200">
            <h2 className="text-xl md:text-2xl font-semibold text-blue-800 mb-6">
              Other Ways to Reach Us
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                  Email Support
                </h3>
                <p className="text-sm md:text-base text-gray-700">
                  For general inquiries, email us at{" "}
                  <a
                    href="mailto:support@auditly360.com"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    support@auditly360.com
                  </a>
                </p>
              </div>
              <div>
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                  Response Time
                </h3>
                <p className="text-sm md:text-base text-gray-700">
                  We typically respond within 24-48 hours during business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

