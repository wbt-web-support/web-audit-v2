"use client";

import React from "react";
import Link from "next/link";
import Footer from "../home-page-components/Footer";

export default function PrivacyPage() {
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
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 mb-6 md:mb-8">
            Privacy Policy
          </h1>
          
          <div className="prose prose-blue max-w-none space-y-6 md:space-y-8">
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              <strong>Last Updated:</strong> January 2025
            </p>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-blue-800 mb-4">
                1. Introduction
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                Welcome to Auditly360. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website auditing platform and services.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-blue-800 mb-4">
                2. Information We Collect
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3">
                We collect the following types of information:
              </p>
              <div className="space-y-3">
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                    Personal Information
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 ml-4">
                    <li>Name and email address when you create an account</li>
                    <li>Payment information processed through Razorpay (we do not store your payment card details)</li>
                    <li>Account preferences and subscription details</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                    Audit Data
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 ml-4">
                    <li>Website URLs you submit for analysis</li>
                    <li>Audit results and analysis data</li>
                    <li>Project configurations and custom audit instructions</li>
                    <li>Generated reports and insights</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                    Usage Information
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 ml-4">
                    <li>Account activity and login information</li>
                    <li>Feature usage and preferences</li>
                    <li>Support inquiries and communication history</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-blue-800 mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 ml-4">
                <li>Provide, maintain, and improve our website auditing services</li>
                <li>Process your subscription payments and manage your account</li>
                <li>Perform website audits, crawls, and analysis as requested</li>
                <li>Generate audit reports, insights, and recommendations</li>
                <li>Send technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and support requests</li>
                <li>Monitor platform usage and prevent abuse</li>
                <li>Ensure compliance with our terms of service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-blue-800 mb-4">
                4. Data Storage and Retention
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3">
                We retain your information as follows:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 ml-4">
                <li><strong>Personal Information:</strong> Your name and email address are stored as long as your account is active</li>
                <li><strong>Audit Data:</strong> Your audit results and project data are stored until you choose to delete them</li>
                <li><strong>Account Information:</strong> Retained while your account is active and for a reasonable period after account closure</li>
              </ul>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mt-3">
                You can delete your audit data and projects at any time through your account dashboard. Upon account deletion, we will remove your personal information, except where we are required to retain it for legal, accounting, or regulatory purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-blue-800 mb-4">
                5. Information Sharing and Disclosure
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3">
                We do not sell, trade, or rent your personal information to third parties. We do not share your data with third parties except in the following limited circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 ml-4">
                <li><strong>Payment Processing:</strong> We use Razorpay to process subscription payments. Razorpay handles payment information according to their privacy policy. We do not store your payment card details.</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                <li><strong>Protection of Rights:</strong> To protect our rights, property, or safety, or that of our users</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with notice to users)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-blue-800 mb-4">
                6. Data Security
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information and audit data against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure access controls, and regular security assessments. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-blue-800 mb-4">
                7. Your Rights
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 ml-4">
                <li><strong>Access:</strong> View and access your personal information and audit data through your account</li>
                <li><strong>Update:</strong> Modify your account information and preferences at any time</li>
                <li><strong>Delete:</strong> Delete your audit data and projects at any time</li>
                <li><strong>Account Deletion:</strong> Request deletion of your account and all associated data</li>
                <li><strong>Data Export:</strong> Request a copy of your data in a portable format</li>
              </ul>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mt-3">
                To exercise these rights, please contact us through our contact page or your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-blue-800 mb-4">
                8. Children's Privacy
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                Our service is available to users of all ages. We do not knowingly collect personal information from children under 13 without parental consent. If you are a parent or guardian and believe your child has provided us with personal information, please contact us to have that information removed.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-blue-800 mb-4">
                9. International Data Transfers
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using our service, you consent to the transfer of your information to these countries.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-blue-800 mb-4">
                10. Changes to This Privacy Policy
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                We may update our Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of our service after such changes constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-blue-800 mb-4">
                11. Contact Us
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at{" "}
                <Link href="/contact" className="text-blue-600 hover:text-blue-800 underline">
                  our contact page
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
