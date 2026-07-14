import { motion } from "motion/react";
import { useState } from "react";
import { Check, X, ArrowRight, Shield, Clock, Headphones } from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Link } from "react-router";

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: "Basic",
      tagline: "For single labs just getting started",
      monthlyPrice: 199,
      yearlyPrice: 1999,
      icon: "🏥",
      features: [
        "Up to 1,000 patients",
        "5 users",
        "Report generation",
        "Patient management",
        "Basic analytics",
        "Email support",
        "Cloud backup",
      ],
      notIncluded: [
        "WhatsApp integration",
        "Multi-branch support",
        "Advanced analytics",
        "Priority support",
        "Custom templates",
      ],
    },
    {
      name: "Standard",
      tagline: "For growing labs with more volume",
      monthlyPrice: 299,
      yearlyPrice: 2999,
      recommended: true,
      icon: "⚡",
      features: [
        "Up to 10,000 patients",
        "15 users",
        "Report generation",
        "Patient management",
        "Advanced analytics",
        "WhatsApp integration",
        "Billing & invoicing",
        "Priority email support",
        "Cloud backup",
        "Custom templates",
      ],
      notIncluded: [
        "Multi-branch support",
        "Dedicated account manager",
        "Custom integrations",
      ],
    },
    {
      name: "Enterprise",
      tagline: "For multi-branch diagnostic networks",
      monthlyPrice: 500,
      yearlyPrice: 4999,
      icon: "🏢",
      features: [
        "Unlimited patients",
        "Unlimited users",
        "Report generation",
        "Patient management",
        "Advanced analytics",
        "WhatsApp integration",
        "Billing & invoicing",
        "Multi-branch support",
        "Priority phone & email support",
        "Cloud backup",
        "Custom templates",
        "Custom integrations",
        "Dedicated account manager",
        "Training & onboarding",
      ],
      notIncluded: [],
    },
  ];

  const trustItems = [
    { icon: Shield, label: "No hidden fees" },
    { icon: Clock, label: "Cancel anytime" },
    { icon: Headphones, label: "24/7 support" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-blue-50 via-white to-teal-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-100/40 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-5 tracking-wide">
              PRICING
            </span>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
              Simple,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                Transparent
              </span>{" "}
              Pricing
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-10">
              Choose the plan that fits your lab. All plans include core features with no hidden fees.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-1 p-1.5 bg-white rounded-xl shadow-sm border border-gray-200">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  billingCycle === "monthly"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                  billingCycle === "yearly"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Yearly
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                  Save 17%
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-16 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: plan.recommended ? -4 : -6, transition: { duration: 0.2 } }}
                className="relative pt-4"
              >
                {plan.recommended && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 px-5 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold rounded-full shadow-lg tracking-wide whitespace-nowrap">
                    MOST POPULAR
                  </div>
                )}

                <div
                  className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                    plan.recommended
                      ? "border-2 border-blue-500 shadow-2xl shadow-blue-500/25 scale-105"
                      : "border border-gray-200 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10"
                  }`}
                >
                  {plan.recommended && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 to-white pointer-events-none" />
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-teal-500" />
                    </>
                  )}

                <div className="relative p-8">
                  {/* Plan header */}
                  <div className="mb-6">
                    <div className="text-3xl mb-3">{plan.icon}</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
                      {plan.name}
                    </h3>
                    <p className="text-gray-500 text-sm">{plan.tagline}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-8 pb-8 border-b border-gray-100">
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                        ₹{billingCycle === "monthly" ? plan.monthlyPrice : Math.floor(plan.yearlyPrice / 12)}
                      </span>
                      <span className="text-gray-400 mb-2 font-medium">/month</span>
                    </div>
                    {billingCycle === "yearly" && (
                      <p className="text-sm text-gray-400 mt-1.5">
                        Billed annually at{" "}
                        <span className="font-semibold text-green-600">₹{plan.yearlyPrice}</span>
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <Link
                    to="/contact"
                    className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold transition-all duration-300 mb-8 group ${
                      plan.recommended
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5"
                        : "bg-gray-900 text-white hover:bg-gray-800 hover:-translate-y-0.5"
                    }`}
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  {/* Feature list */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                      What's included
                    </div>
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          plan.recommended ? "bg-blue-100" : "bg-green-100"
                        }`}>
                          <Check className={`w-3 h-3 ${plan.recommended ? "text-blue-600" : "text-green-600"}`} />
                        </div>
                        <span className="text-gray-700 text-sm font-medium">{feature}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 opacity-35">
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <X className="w-3 h-3 text-gray-400" />
                        </div>
                        <span className="text-gray-500 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
            ))}
          </div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-14 flex flex-wrap justify-center gap-8"
          >
            {trustItems.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-gray-500">
                <Icon className="w-5 h-5 text-teal-500" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Demo CTA */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-blue-500/10 p-12 text-center"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Not sure which plan is right for you?
            </h2>
            <p className="text-xl text-gray-500 mb-8 max-w-xl mx-auto">
              Schedule a personalized demo with our team to find the perfect solution for your lab.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              Book a Personalized Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="mt-4 text-gray-400 text-sm">Free · No credit card · 30 minutes</p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
