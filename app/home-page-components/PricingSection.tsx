"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

// Default fallback plans (minimal fallback)

const defaultPlans = [
  {
    id: "starter-free",
    name: "Starter",
    price: "Free",
    period: "forever",
    description: "Perfect for personal projects and small websites",
    features: [
      "Up to 5 audits per month",
      "Basic SEO analysis",
      "Performance metrics",
      "Security scan",
      "Mobile responsiveness check",
      "Email support",
    ],
    cta: "Get Started Free",
    popular: false,
    color: "gray",
    amount: 0,
    currency: "INR",
    plan_type: "Starter",
    billing_cycle: "monthly",
    max_projects: 5,
    can_use_features: ["basic_seo", "performance", "security", "mobile_check"],
    razorpay_plan_id: null,
    isCurrentPlan: false,
  },
];
interface PricingSectionProps {
  currentPlanType?: string;
  currentPlanId?: string;
  currentBillingCycle?: string;
  planExpiresAt?: string;
  showBillingToggle?: boolean;
  showCurrentPlanHighlight?: boolean;
  className?: string;
}
export default function PricingSection({
  currentPlanType,
  currentPlanId,
  currentBillingCycle,
  planExpiresAt,
  showBillingToggle = true,
  showCurrentPlanHighlight = false,
  className = "",
}: PricingSectionProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [plans, setPlans] = useState(defaultPlans);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  // Helper function to convert features to new format (with backward compatibility)
  const convertFeaturesToNewFormat = useCallback((features: unknown): Array<{ heading: string; tools: string[] }> => {
    if (!Array.isArray(features)) return [];
    
    return features.map((feature: unknown) => {
      // Check if it's already in new format
      if (feature && typeof feature === 'object' && 'heading' in feature && 'tools' in feature) {
        return feature as { heading: string; tools: string[] };
      }
      
      // Handle string format - could be JSON string
      if (typeof feature === 'string') {
        const trimmed = feature.trim();
        const looksLikeJson =
          (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
          (trimmed.startsWith("[") && trimmed.endsWith("]"));
        if (looksLikeJson) {
          try {
            const parsed = JSON.parse(trimmed);
            // Check for new format with heading and tools
            if (parsed && typeof parsed === 'object' && 'heading' in parsed && 'tools' in parsed) {
              return {
                heading: String(parsed.heading || 'Features'),
                tools: Array.isArray(parsed.tools) ? parsed.tools.map(String) : []
              };
            }
            // Old format with name
            if (parsed && typeof parsed === 'object' && 'name' in parsed) {
              return {
                heading: String(parsed.name || 'Features'),
                tools: parsed.description ? [String(parsed.description)] : []
              };
            }
          } catch {
            // Fall through - treat as plain string
          }
        }
        // Plain string - treat as a feature name
        return {
          heading: 'Features',
          tools: [feature]
        };
      }
      
      // Convert from old format (backward compatibility)
      if (feature && typeof feature === 'object' && 'name' in feature) {
        const oldFeature = feature as { name?: string; description?: string; icon?: string };
        return {
          heading: oldFeature.name || 'Features',
          tools: oldFeature.description ? [oldFeature.description] : []
        };
      }
      
      // Fallback
      return { heading: 'Features', tools: [] };
    }).filter((f) => f.heading && f.heading.trim() !== '');
  }, []);

  // Track expanded headings per plan (planId -> headingIndex -> boolean)
  // Default to all expanded (true)
  const [expandedHeadings, setExpandedHeadings] = useState<Record<string, Record<number, boolean>>>({});

  // Toggle heading expansion
  const toggleHeading = useCallback((planId: string, headingIndex: number) => {
    setExpandedHeadings(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [headingIndex]: !prev[planId]?.[headingIndex]
      }
    }));
  }, []);

  // Lazy load Razorpay script only when needed

  const loadRazorpayScript = async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if (window.Razorpay) return true;

    // Check if script is already being loaded

    const existingScript = document.querySelector(
      'script[src*="checkout.razorpay.com"]'
    );
    if (existingScript) {
      return new Promise((resolve) => {
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => resolve(false));
      });
    }
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        resolve(true);
      };
      script.onerror = (error) => {
        console.error("Failed to load Razorpay script:", error);
        resolve(false);
      };

      // Reduced timeout for faster failure detection

      setTimeout(() => {
        if (!window.Razorpay) {
          console.error("Razorpay script loading timeout");
          resolve(false);
        }
      }, 5000); // 5 second timeout

      document.body.appendChild(script);
    });
  };

  // Fetch plans from database with optimized loading

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);

        // First, set default plans immediately for faster initial render

        setPlans(defaultPlans);
        const response = await fetch("/api/plans");
        if (response.ok) {
          const data = await response.json();
          if (data.plans && data.plans.length > 0) {
            // Transform database plans to match component format

            const transformedPlans = data.plans.map((plan: any) => ({
              id: plan.id,
              name: plan.name,
              price:
                plan.price === 0
                  ? "Free"
                  : plan.currency === "INR"
                  ? `$${plan.price.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : `$${plan.price.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
              period:
                plan.billing_cycle === "monthly"
                  ? "per month"
                  : plan.billing_cycle === "yearly"
                  ? "per year"
                  : "per " + plan.billing_cycle,
              description: plan.description || "",
              features: plan.features ? convertFeaturesToNewFormat(plan.features) : [],
              cta:
                plan.plan_type === "Starter"
                  ? "Get Started Free"
                  : plan.planStatus === "current"
                  ? "Current Plan"
                  : plan.planStatus === "billing_change"
                  ? `Switch to ${plan.billing_cycle}`
                  : plan.planStatus === "upgrade_downgrade"
                  ? plan.amount >
                    (plans.find((p) => p.plan_type === currentPlanType)
                      ?.amount || 0)
                    ? "Upgrade"
                    : "Downgrade"
                  : "Get Started Now",
              popular: plan.is_popular || false,
              color: plan.color || "gray",
              amount: plan.price,
              currency: plan.currency,
              plan_type: plan.plan_type,
              billing_cycle: plan.billing_cycle,
              max_projects: plan.max_projects,
              can_use_features: plan.can_use_features || [],
              razorpay_plan_id: plan.razorpay_plan_id,
              subscription_id: plan.subscription_id,
              isCurrentPlan:
                showCurrentPlanHighlight &&
                currentPlanType &&
                plan.plan_type === currentPlanType,
            }));

            // Update plans with database data (no need for Razorpay plans API)

            setPlans(transformedPlans);
          } else {
            setPlans(defaultPlans);
          }
        } else {
          console.error("Failed to fetch database plans, using fallback");
          setPlans(defaultPlans);
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
        setPlans(defaultPlans);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  // Function to check if a plan can be purchased
  const canPurchasePlan = useCallback(
    (plan: any) => {
      // Always allow free plan
      if (plan.plan_type === "Starter") return true;

      // If no current plan, allow any plan
      if (!currentPlanType) return true;

      // If current plan is Starter, allow any paid plan
      if (currentPlanType === "Starter") return true;

      // Check if plan has expired
      const isPlanExpired = planExpiresAt
        ? new Date(planExpiresAt) < new Date()
        : false;

      // If plan has expired, allow any plan
      if (isPlanExpired) return true;

      // If same plan type and same billing cycle, don't allow (user is already on this exact plan)
      if (
        plan.plan_type === currentPlanType &&
        plan.billing_cycle === currentBillingCycle
      ) {
        return false;
      }

      // If same plan type but different billing cycle, allow (monthly to yearly or vice versa)
      if (
        plan.plan_type === currentPlanType &&
        plan.billing_cycle !== currentBillingCycle
      ) {
        return true;
      }

      // If different plan type, allow (upgrade or downgrade)
      if (plan.plan_type !== currentPlanType) {
        return true;
      }

      // Default: allow the plan
      return true;
    },
    [currentPlanType, currentBillingCycle, planExpiresAt]
  );

  // Function to get plan status
  const getPlanStatus = useCallback(
    (plan: any) => {
      if (plan.plan_type === "Starter") return "available";
      if (!currentPlanType) return "available";
      if (currentPlanType === "Starter") return "available";

      const isPlanExpired = planExpiresAt
        ? new Date(planExpiresAt) < new Date()
        : false;
      if (isPlanExpired) return "available";

      // If same plan type and same billing cycle, it's the current plan
      if (
        plan.plan_type === currentPlanType &&
        plan.billing_cycle === currentBillingCycle
      ) {
        return "current";
      }

      // If same plan type but different billing cycle, it's a billing change
      if (
        plan.plan_type === currentPlanType &&
        plan.billing_cycle !== currentBillingCycle
      ) {
        return "billing_change";
      }

      // If different plan type, it's an upgrade or downgrade
      if (plan.plan_type !== currentPlanType) {
        return "upgrade_downgrade";
      }

      return "available";
    },
    [currentPlanType, currentBillingCycle, planExpiresAt]
  );

  // Memoized filtered plans for better performance
  const filteredPlans = useMemo(() => {
    return plans
      .filter((plan) => {
        if (plan.plan_type === "Starter") return true; // Always show free plan
        return plan.billing_cycle === billingCycle;
      })
      .map((plan) => ({
        ...plan,
        canPurchase: canPurchasePlan(plan),
        planStatus: getPlanStatus(plan),
      }))
      .sort((a, b) => {
        // Always put Starter plan first
        if (a.plan_type === "Starter") return -1;
        if (b.plan_type === "Starter") return 1;

        // Then sort by price (ascending)
        return a.amount - b.amount;
      });
  }, [plans, billingCycle, canPurchasePlan, getPlanStatus]);
  const handlePayment = async (plan: any) => {
    // Check if plan can be purchased
    if (!plan.canPurchase) {
      if (plan.planStatus === "current") {
        alert("You are already on this plan!");
        return;
      }
      alert("This plan is not available for purchase at this time.");
      return;
    }

    // Handle free plan
    if (plan.plan_type === "Starter" || plan.amount === 0) {
      alert("Free plan selected! No payment required.");
      return;
    }
    setLoading(plan.id);
    setPaymentSuccess(null);
    try {
      // Ensure Razorpay checkout is available

      const isRazorpayReady = await loadRazorpayScript();
      if (!isRazorpayReady) {
        alert("Payment system not available. Please try again later.");
        return;
      }
      // Validate plan amount
      if (!plan.amount || plan.amount <= 0) {
        throw new Error("Invalid plan amount. Please contact support.");
      }

      // Create order using the create-order API (supports all payment methods)
      const orderData = {
        amount: Math.round(plan.amount * 100),
        // Convert to paise and ensure integer
        currency: plan.currency || "INR",
        receipt: `rec_${Date.now()}`,
        // Shortened receipt (max 40 chars)
        plan_id: plan.id,
      };
      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        console.error("Order creation failed:", errorData);
        throw new Error(
          errorData.details ||
            errorData.error ||
            "Failed to create payment order"
        );
      }
      const orderResponseData = await orderResponse.json();
      // Initialize Razorpay with order data (supports all payment methods)
      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: orderResponseData.id,
        name: "Web Audit Pro",
        description: `${plan.name} Plan - ${plan.billing_cycle} subscription`,
        image: "/logo.png",
        // Add your logo path

        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          emi: true,
          paylater: true,
        },
        prefill: {
          name: "Customer",
          email: "customer@example.com",
          contact: "9999999999",
        },
        notes: {
          plan_name: plan.name,
          plan_type: plan.plan_type,
          billing_cycle: plan.billing_cycle,
          plan_id: plan.id,
        },
        theme: {
          color: "#000000",
        },
        config: {
          display: {
            hide: [],
          },
        },
        handler: async function (response: any) {
          setPaymentSuccess(response.razorpay_payment_id);
          try {
            // Get current session for authentication
            const {
              data: { session },
            } = await supabase.auth.getSession();
            const authToken = session?.access_token;
            // Get current user info for the API call
            const {
              data: { user: currentUser },
            } = await supabase.auth.getUser();

            // Call payment success API to update user plan
            const successResponse = await fetch("/api/payment-success", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(authToken && {
                  Authorization: `Bearer ${authToken}`,
                }),
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                plan_id: plan.id,
                amount: plan.amount,
                currency: plan.currency,
                payment_method: response.method || "unknown",
                subscription_id: plan.subscription_id,
                user_id: currentUser?.id,
                user_email: currentUser?.email,
              }),
            });
            if (successResponse.ok) {
              const successData = await successResponse.json();
              // Check if the response has the expected structure
              if (successData.success && successData.plan_details) {
                alert(
                  `Payment successful! You are now on the ${successData.plan_details.plan_name} plan.`
                );

                // Trigger multiple refresh mechanisms

                window.dispatchEvent(new CustomEvent("planUpdated"));
                localStorage.setItem("plan_updated", "true");

                // Wait a bit longer to ensure database update is complete

                setTimeout(() => {
                  window.location.reload();
                }, 3000);
              } else {
                console.warn("Unexpected response structure:", successData);
                alert("Payment successful! Your plan has been updated.");

                // Still trigger plan refresh even if response structure is unexpected

                window.dispatchEvent(new CustomEvent("planUpdated"));
                localStorage.setItem("plan_updated", "true");

                // Wait a bit longer to ensure database update is complete

                setTimeout(() => {
                  window.location.reload();
                }, 3000);
              }
            } else {
              const errorData = await successResponse.json();
              console.error("Payment processing failed:", errorData);
              console.error("Response status:", successResponse.status);
              console.error(
                "Response headers:",
                Object.fromEntries(successResponse.headers.entries())
              );
              alert(
                `Payment successful but plan update failed: ${
                  errorData.error || "Unknown error"
                }. Please contact support.`
              );
            }
          } catch (apiError) {
            console.error("Error calling payment success API:", apiError);
            alert(
              "Payment successful but plan update failed. Please contact support."
            );
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(null);
          },
        },
      });
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);

      // Try fallback approach with direct payment
      try {
        // Fallback: Create direct payment without order
        const razorpay = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: Math.round(plan.amount * 100),
          currency: plan.currency || "INR",
          name: "Web Audit Pro",
          description: `${plan.name} Plan - ${plan.billing_cycle} subscription`,
          image: "/logo.png",
          method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true,
            emi: true,
            paylater: true,
          },
          prefill: {
            name: "Customer",
            email: "customer@example.com",
            contact: "9999999999",
          },
          notes: {
            plan_name: plan.name,
            plan_type: plan.plan_type,
            billing_cycle: plan.billing_cycle,
            plan_id: plan.id,
          },
          theme: {
            color: "#000000",
          },
          handler: async function (response: any) {
            setPaymentSuccess(response.razorpay_payment_id);
            try {
              // Get current user info for the API call
              const {
                data: { user: currentUser },
              } = await supabase.auth.getUser();

              // Call payment success API to update user plan
              const successResponse = await fetch("/api/payment-success", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  plan_id: plan.id,
                  amount: plan.amount,
                  currency: plan.currency,
                  payment_method: response.method || "unknown",
                  subscription_id: plan.subscription_id,
                  user_id: currentUser?.id,
                  user_email: currentUser?.email,
                }),
              });
              if (successResponse.ok) {
                const successData = await successResponse.json();
                alert(
                  `Payment successful! You are now on the ${successData.plan_details.plan_name} plan.`
                );

                // Trigger multiple refresh mechanisms

                window.dispatchEvent(new CustomEvent("planUpdated"));
                localStorage.setItem("plan_updated", "true");

                // Wait a bit longer to ensure database update is complete

                setTimeout(() => {
                  window.location.reload();
                }, 3000);
              } else {
                const errorData = await successResponse.json();
                console.error("Fallback payment processing failed:", errorData);
                alert(
                  "Payment successful but plan update failed. Please contact support."
                );
              }
            } catch (apiError) {
              console.error(
                "Error calling payment success API for fallback:",
                apiError
              );
              alert(
                "Payment successful but plan update failed. Please contact support."
              );
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(null);
            },
          },
        });
        razorpay.open();
        return; // Exit early if fallback succeeds
      } catch (fallbackError) {
        console.error("Fallback payment also failed:", fallbackError);
        alert(
          "Payment failed: " +
            (error as Error).message +
            "\n\nPlease try again or contact support."
        );
      }
    } finally {
      setLoading(null);
    }
  };
  return (
    <section
      id="pricing"
      className={`py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 ${className} `}
    >
      <div className="max-w-[90rem] mx-auto ">
        {/* Section Header */}
        <div className="flex flex-col justify-start">
          <div className="mb-8 sm:mb-12 md:mb-16 lg:mb-20 max-w-4xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-black mb-3 sm:mb-4 raleway leading-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-black/70 raleway">
              Choose the plan that fits your needs. No hidden fees, no surprises.
            </p>
          </div>
          <div className="flex justify-center">
            {/* Billing Cycle Toggle */}
            {showBillingToggle && (
              <div className="flex flex-col items-center gap-2 sm:gap-3 mb-6 sm:mb-8 w-full">
                {/* Toggle Container */}
                <div className="relative inline-flex items-center bg-gray-100 rounded-full p-1 sm:p-1.5">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`relative px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm md:text-base font-medium transition-all duration-200 z-10 focus:outline-none ${
                      billingCycle === "monthly"
                        ? "text-black"
                        : "text-gray-500"
                    }`}
                  >
                    Monthly
                  </button>

                  <button
                    onClick={() => setBillingCycle("yearly")}
                    className={`relative px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm md:text-base font-medium transition-all duration-200 z-10 focus:outline-none ${
                      billingCycle === "yearly"
                        ? "text-black"
                        : "text-gray-500"
                    }`}
                  >
                    Yearly
                  </button>

                  {/* Active Background Slider */}
                  <span
                    className={`absolute top-1 sm:top-1.5 bottom-1 sm:bottom-1.5 rounded-full bg-white shadow-md transition-all duration-200 ${
                      billingCycle === "yearly"
                        ? "left-1/2 right-1 sm:right-1.5"
                        : "left-1 sm:left-1.5 right-1/2"
                    }`}
                  />
                </div>

                {/* Save Badge */}
                <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1 sm:px-4 sm:py-1.5">
                  <span className="text-green-700 text-xs sm:text-sm font-semibold">
                    Yearly 17% Save
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Pricing Cards */}

        <div
          className={`grid grid-cols-1 gap-4 sm:gap-6 max-w-7xl mx-auto ${
            filteredPlans.length === 1
              ? "sm:max-w-md"
              : filteredPlans.length === 2
              ? "sm:grid-cols-2"
              : filteredPlans.length === 3
              ? "sm:grid-cols-2 md:grid-cols-3"
              : "sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {loadingPlans
            ? // Loading skeleton

              Array.from({
                length: filteredPlans.length || 3,
              }).map((_, index) => (
                <div
                  key={index}
                  className="bg-red rounded-3xl p-2 animate-pulse"
                >
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>

                  <div className="h-12 bg-gray-200 rounded mb-4"></div>

                  <div className="h-4 bg-gray-200 rounded mb-2"></div>

                  <div className="h-4 bg-gray-200 rounded mb-8"></div>

                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ))
            : filteredPlans.map((plan, index) => (
                <div
                  key={plan.id || `${plan.name}_${plan.billing_cycle}_${index}`}
                  className={`relative rounded-2xl sm:rounded-3xl p-3 sm:p-4 ${
                    plan.popular && plan.billing_cycle === billingCycle
                      ? "bg-black text-white sm:scale-105"
                      : "bg-white text-black "
                  } border-2 ${
                    plan.popular && plan.billing_cycle === billingCycle
                      ? "border-black"
                      : "border-gray-200"
                  }`}
                >
                  {/* Popular Badge */}

                  {plan.popular && plan.billing_cycle === billingCycle && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-white text-black px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {plan.planStatus === "current" && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gray-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold">
                        Current Plan
                      </span>
                    </div>
                  )}

                  {/* Billing Change Badge */}
                  {plan.planStatus === "billing_change" && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gray-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold">
                        Switch Billing
                      </span>
                    </div>
                  )}

                  {/* Upgrade/Downgrade Badge */}
                  {plan.planStatus === "upgrade_downgrade" && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                      <span className={`bg-gray-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold`}>
                        {plan.amount >
                        (plans.find((p) => p.plan_type === currentPlanType)
                          ?.amount || 0)
                          ? "Upgrade"
                          : "Downgrade"}
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}

                  <div className={`p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 md:mb-8 ${
                    plan.plan_type === "Growth" 
                      ? "bg-[#447BF8] text-white" 
                      : "bg-[#F4F4F4] text-black"
                  }`}>
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-3 sm:mb-4">
                      <span className="text-3xl sm:text-4xl md:text-5xl font-bold">{plan.price}</span>

                      {plan.plan_type !== "Starter" && (
                        <span
                          className={`text-base sm:text-lg ml-2 ${
                            plan.popular && plan.billing_cycle === billingCycle
                              ? "text-gray-300"
                              : plan.plan_type === "Growth" 
                              ? " text-white" 
                              : " text-black"
                          }`}
                        >
                          {plan.period}
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-xs sm:text-sm ${
                        plan.popular && plan.billing_cycle === billingCycle
                          ? "text-gray-300"
                          : "text-gray-600"
                      }`}
                    >
                      {plan.description}
                    </p>
{/* CTA Button */}

<button
                    onClick={() => handlePayment(plan)}
                    disabled={loading === plan.id || !plan.canPurchase}
                    className={`w-full py-3 sm:py-4 mt-4 sm:mt-6 md:mt-8 rounded-lg text-sm sm:text-base font-semibold transition-all duration-300 ${
                      plan.popular && plan.billing_cycle === billingCycle
                        ? "bg-white text-black hover:bg-gray-100 disabled:bg-gray-300"
                        : plan.planStatus === "current"
                        ? "bg-gray-500 text-white cursor-not-allowed"
                        : "bg-white border-blue-400 border text-black hover:bg-blue-400 hover:text-white disabled:bg-gray-500"
                    }`}
                  >
                    {loading === plan.id ? "Processing..." : plan.cta}
                  </button>

                  </div>

                  {/* Features List with Togglable Headings and Tools */}

                  <div className="space-y-4 sm:space-y-5 mb-4 sm:mb-6 md:mb-8">
                    {plan.features && Array.isArray(plan.features) && plan.features.length > 0 ? (
                      (plan.features as unknown as Array<{ heading: string; tools: string[] }>).map(
                        (featureGroup: { heading: string; tools: string[] }, headingIndex: number) => {
                          const hasTools = featureGroup.tools && Array.isArray(featureGroup.tools) && featureGroup.tools.length > 0;
                          // Default to expanded (true) if not set
                          const isExpanded = expandedHeadings[plan.id]?.[headingIndex] ?? true;
                          
                          return (
                            <div key={headingIndex} className="space-y-2">
                              {/* Heading - Clickable if has tools */}
                              <button
                                onClick={() => hasTools && toggleHeading(plan.id, headingIndex)}
                                disabled={!hasTools}
                                className={`w-full flex items-center justify-between text-left ${
                                  hasTools ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                                }`}
                              >
                                <div className="flex items-start flex-1">
                                  <span
                                    className={`text-base sm:text-lg mr-2 sm:mr-3 flex-shrink-0 mt-0.5 ${
                                      plan.popular &&
                                      plan.billing_cycle === billingCycle
                                        ? "text-white"
                                        : "text-black"
                                    }`}
                                  >
                                    ✓
                                  </span>
                                  <span
                                    className={`text-sm sm:text-base  ${
                                      plan.popular &&
                                      plan.billing_cycle === billingCycle
                                        ? "text-white"
                                        : "text-black"
                                    }`}
                                  >
                                    {featureGroup.heading}
                                  </span>
                                </div>
                                {hasTools && (
                                  <span
                                    className={`ml-2 text-sm flex-shrink-0 transition-transform duration-200 ${
                                      isExpanded ? 'rotate-180' : ''
                                    } ${
                                      plan.popular &&
                                      plan.billing_cycle === billingCycle
                                        ? "text-white"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </span>
                                )}
                              </button>

                              {/* Tools List - Show when expanded (default expanded) */}
                              {hasTools && isExpanded && (
                                <div className="ml-6 sm:ml-8 space-y-1.5">
                                  {featureGroup.tools.map((tool: string, toolIndex: number) => (
                                    <div key={toolIndex} className="flex items-start">
                                      <span
                                        className={`text-xs sm:text-sm mr-2 flex-shrink-0 mt-0.5 ${
                                          plan.popular &&
                                          plan.billing_cycle === billingCycle
                                            ? "text-gray-400"
                                            : "text-gray-500"
                                        }`}
                                      >
                                        •
                                      </span>
                                      <span
                                        className={`text-xs sm:text-sm ${
                                          plan.popular &&
                                          plan.billing_cycle === billingCycle
                                            ? "text-gray-300"
                                            : "text-gray-600"
                                        }`}
                                      >
                                        {tool}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }
                      )
                    ) : (
                      <p
                        className={`text-xs sm:text-sm ${
                          plan.popular &&
                          plan.billing_cycle === billingCycle
                            ? "text-gray-300"
                            : "text-gray-600"
                        }`}
                      >
                        No features listed
                      </p>
                    )}
                  </div>

                  

                  {/* Payment Success Message */}

                  {paymentSuccess && plan.plan_type !== "Starter" && (
                    <div className="mt-4 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-xs sm:text-sm text-center">
                        ✅ Payment successful! ID: {paymentSuccess}
                      </p>
                    </div>
                  )}
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
