"use client";

import React from "react";
import Link from "next/link";
import Footer from "../home-page-components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF4D04]/5 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-12 md:py-16 lg:py-20">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-block text-sm md:text-base font-medium text-[#FF4D04] hover:text-[#FF4D04]/80 mb-6 md:mb-8 transition-colors"
        >
          ← Back to Home
        </Link>
        <div className="bg-white rounded-lg shadow-sm border border-[#FF4D04]/20 p-6 md:p-8 lg:p-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#FF4D04] mb-6 md:mb-8">
            Terms of Service
          </h1>
          
          <div className="prose max-w-none space-y-6 md:space-y-8">
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              <strong>Last Updated:</strong> January 2025
            </p>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-[#FF4D04] mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                By accessing and using Auditly360 ("the Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this service. Auditly360 provides a website auditing platform that analyzes content, SEO, performance, branding, and security risks through single-page checks and full-site crawls.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-[#FF4D04] mb-4">
                2. Description of Service
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3">
                Auditly360 is a comprehensive website auditing platform that provides:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 ml-4">
                <li>Single page and full-site website crawling and analysis</li>
                <li>Content, SEO, and branding consistency checks</li>
                <li>Performance metrics and Core Web Vitals analysis</li>
                <li>Security risk detection (exposed keys, Google tags audit)</li>
                <li>Image optimization and link validation</li>
                <li>Social media preview generation</li>
                <li>Technical and UI/UX quality assessments</li>
                <li>Custom audit instructions and tailored analysis</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-[#FF4D04] mb-4">
                3. User Accounts and Registration
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3">
                To use certain features of the Service, you must create an account. When you create an account, you must:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 ml-4">
                <li>Provide accurate, complete, and current information</li>
                <li>Maintain the security of your account and password</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Be at least 13 years old (or have parental consent if under 13)</li>
              </ul>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mt-3">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-[#FF4D04] mb-4">
                4. Subscription Plans and Payment
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3">
                Some features of Auditly360 require a paid subscription. By subscribing, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 ml-4">
                <li>Pay all fees associated with your subscription plan</li>
                <li>Automatic renewal of your subscription unless you cancel before the renewal date</li>
                <li>Payment processing through Razorpay, our third-party payment provider</li>
                <li>Compliance with the billing cycle (monthly or yearly) you select</li>
              </ul>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mt-3">
                <strong>Refund Policy:</strong> We currently do not offer refunds for subscription fees. All subscription payments are final. If you cancel your subscription, you will continue to have access to paid features until the end of your current billing period.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-[#FF4D04] mb-4">
                5. Acceptable Use
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3">
                You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 ml-4">
                <li>Use the Service to audit websites you do not own or have permission to audit</li>
                <li>Attempt to overload, disrupt, or damage our servers or infrastructure</li>
                <li>Use automated scripts or bots to access the Service beyond normal usage</li>
                <li>Reverse engineer, decompile, or attempt to extract the source code of the Service</li>
                <li>Share your account credentials with others or create multiple accounts to circumvent plan limitations</li>
                <li>Use the Service to violate any applicable laws or regulations</li>
                <li>Transmit any malicious code, viruses, or harmful content</li>
                <li>Collect or harvest information about other users</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-[#FF4D04] mb-4">
                6. Audit Data and Content
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3">
                You retain ownership of all audit data and content you submit to the Service. However, by using the Service, you grant us:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 ml-4">
                <li>A license to process, analyze, and store your audit data to provide the Service</li>
                <li>Permission to generate reports and insights based on your submitted data</li>
                <li>The right to store your audit data until you choose to delete it</li>
              </ul>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mt-3">
                You are responsible for ensuring you have the right to audit any website you submit to the Service. We are not responsible for any content or data discovered during the audit process.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-[#FF4D04] mb-4">
                7. Intellectual Property
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                The Service and its original content, features, functionality, algorithms, and design are owned by Auditly360 and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our Service or included software.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-[#FF4D04] mb-4">
                8. Service Availability and Modifications
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                We strive to provide reliable service but do not guarantee that the Service will be available at all times or free from errors. We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice. We may also impose limits on certain features or restrict access to parts of the Service without notice or liability.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-[#FF4D04] mb-4">
                9. Disclaimer of Warranties
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                The Service is provided on an "as is" and "as available" basis. Auditly360 makes no warranties, expressed or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or completely secure. Audit results are provided for informational purposes and should not be considered as professional advice.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-[#FF4D04] mb-4">
                10. Limitation of Liability
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                To the maximum extent permitted by law, Auditly360 shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, arising out of or related to your use of the Service. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-[#FF4D04] mb-4">
                11. Termination
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 ml-4">
                <li>Breach of these Terms of Service</li>
                <li>Violation of acceptable use policies</li>
                <li>Non-payment of subscription fees</li>
                <li>Fraudulent or illegal activity</li>
              </ul>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mt-3">
                You may terminate your account at any time through your account settings. Upon termination, your right to use the Service will immediately cease, and we may delete your account and associated data in accordance with our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-[#FF4D04] mb-4">
                12. Changes to Terms
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide reasonable notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. Your continued use of the Service after any changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-[#FF4D04] mb-4">
                13. Governing Law
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions. Any disputes arising from these Terms or your use of the Service shall be resolved through appropriate legal channels.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-semibold text-[#FF4D04] mb-4">
                14. Contact Information
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at{" "}
                <Link href="/contact" className="text-[#FF4D04] hover:text-[#FF4D04]/80 underline">
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
