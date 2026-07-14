import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import { useRef, useState, useEffect } from "react";
import {
  Users,
  FileText,
  DollarSign,
  MessageCircle,
  Building2,
  BarChart3,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  Star,
  FlaskConical,
  Microscope,
  ClipboardList,
  Send,
  Cloud,
  Smartphone,
  TrendingUp,
  Zap,
  Lock,
  UserPlus,
  HeartPulse,
  Activity,
  ChevronRight,
} from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ImageWithFallback } from "./components/ImageWithFallback";

function useCountUp(target: number, duration: number, trigger: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [trigger, target, duration]);
  return count;
}

function StatCounter({ value, suffix, label, prefix = "" }: { value: number; suffix: string; label: string; prefix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);
  const count = useCountUp(value, 1800, triggered);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTriggered(true); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="text-center">
      <div className="text-5xl lg:text-6xl font-bold text-white mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-blue-200 text-sm font-medium uppercase tracking-widest">{label}</div>
    </div>
  );
}

export default function Home() {
  const features = [
    {
      icon: Users,
      title: "Patient Management",
      description: "Comprehensive patient records with instant search, complete history, and family linking for thousands of patients.",
      color: "from-blue-500 to-blue-600",
      badge: "Core",
    },
    {
      icon: FileText,
      title: "Smart Report Generation",
      description: "Automated, professional reports in under 2 minutes with customizable templates, digital signatures, and QR verification.",
      color: "from-teal-500 to-teal-600",
      badge: "Popular",
    },
    {
      icon: DollarSign,
      title: "Billing & Invoicing",
      description: "Streamlined billing with automated invoices, payment tracking, insurance claims, and financial reporting.",
      color: "from-indigo-500 to-indigo-600",
      badge: "Core",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Report Sharing",
      description: "Instant report delivery via WhatsApp with consent management, delivery tracking, and automated reminders.",
      color: "from-green-500 to-green-600",
      badge: "Unique",
    },
    {
      icon: Building2,
      title: "Multi-Branch Management",
      description: "Centralized control for labs with multiple locations. Unified reporting, inventory, and staff management.",
      color: "from-purple-500 to-purple-600",
      badge: "Enterprise",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Real-time dashboards with revenue tracking, test volumes, turnaround times, and actionable business metrics.",
      color: "from-orange-500 to-rose-500",
      badge: "Advanced",
    },
  ];

  const workflowSteps = [
    { icon: UserPlus, title: "Patient Registration", desc: "Quick intake with smart autofill", color: "bg-blue-500" },
    { icon: FlaskConical, title: "Sample Collection", desc: "Barcode-linked specimen tracking", color: "bg-teal-500" },
    { icon: ClipboardList, title: "Report Entry", desc: "Guided data entry with ranges", color: "bg-indigo-500" },
    { icon: HeartPulse, title: "Doctor Verification", desc: "Digital sign-off & QC check", color: "bg-purple-500" },
    { icon: FileText, title: "PDF Generation", desc: "Branded report in one click", color: "bg-rose-500" },
    { icon: Send, title: "WhatsApp Delivery", desc: "Instant patient notification", color: "bg-green-500" },
  ];

  const builtFor = [
    { icon: Microscope, title: "Pathology Labs", desc: "Full-spectrum test reporting, histology, and cytology workflows built for high-volume pathology operations." },
    { icon: Activity, title: "Diagnostic Centers", desc: "Multi-modality support covering radiology, clinical labs, and point-of-care testing under one platform." },
    { icon: Building2, title: "Collection Centers", desc: "Efficient sample intake, barcode tracking, and seamless data sync with your main lab in real time." },
    { icon: TrendingUp, title: "Multi-Branch Labs", desc: "Unified management across all branches with centralized analytics, staff, and inventory control." },
  ];

  const whyChoose = [
    { icon: Zap, title: "Reports in Under 2 Minutes", desc: "Intelligent templates and auto-calculated reference ranges slash report time dramatically." },
    { icon: MessageCircle, title: "WhatsApp-First Delivery", desc: "The only LMS with built-in WhatsApp API — patients receive PDFs instantly, not via email." },
    { icon: Cloud, title: "Cloud-Native Architecture", desc: "No servers to maintain. Access from any device, anywhere, with 99.9% uptime SLA." },
    { icon: Lock, title: "HIPAA-Grade Security", desc: "End-to-end encryption, role-based access, audit trails, and compliance built in by default." },
    { icon: Building2, title: "True Multi-Branch", desc: "Not a workaround — branch isolation with centralized oversight is a first-class feature." },
    { icon: Shield, title: "24/7 Dedicated Support", desc: "Real humans, not bots. Every subscription includes access to our healthcare tech support team." },
  ];

  const testimonials = [
    {
      quote: "DiagnoPro cut our report delivery time from 30 minutes to under 2. Our patients love the WhatsApp notifications.",
      author: "Dr. Sarah Johnson",
      role: "Lab Director",
      company: "MediCare Diagnostics",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop&auto=format",
      rating: 5,
    },
    {
      quote: "Managing 5 branches from one dashboard is a game-changer. The analytics alone paid for the subscription in 3 months.",
      author: "Dr. Michael Chen",
      role: "CEO",
      company: "HealthTech Diagnostics",
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=80&h=80&fit=crop&auto=format",
      rating: 5,
    },
    {
      quote: "WhatsApp report sharing improved our patient retention significantly. The billing module is also incredibly intuitive.",
      author: "Dr. Priya Patel",
      role: "Owner",
      company: "Precision Lab Network",
      image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=80&h=80&fit=crop&auto=format",
      rating: 5,
    },
  ];

  const floatingStats = [
    { value: "50L+", label: "Reports Generated", color: "text-blue-600" },
    { value: "12L+", label: "Active Patients", color: "text-teal-600" },
    { value: "45L+", label: "WhatsApp Deliveries", color: "text-green-600" },
    { value: "100+", label: "Labs Connected", color: "text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-blue-100/40 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left col */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full mb-6"
            >
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-blue-700">Trusted by 100+ Labs in India</span>
            </motion.div>

            <h1
              className="text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              All-in-One{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                Laboratory
              </span>{" "}
              Management Software
            </h1>
            <p className="text-xl text-gray-500 mb-8 leading-relaxed">
              Manage reports, patients, billing, and analytics in one place. Streamline your lab operations with intelligent automation and instant WhatsApp delivery.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                to="/contact"
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Book a Free Demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/pricing"
                className="px-8 py-4 bg-white text-gray-800 rounded-xl font-semibold border border-gray-200 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center"
              >
                View Pricing
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {[
                { icon: Cloud, label: "Secure Cloud Storage" },
                { icon: Activity, label: "99.9% Uptime SLA" },
                { icon: Building2, label: "Multi-Branch Ready" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-teal-500" />
                  <span className="text-sm text-gray-500 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right col — image + floating cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20 border border-white">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1576669801838-1b1c52121e6a?w=1200&h=800&fit=crop&auto=format"
                alt="Modern laboratory with advanced diagnostic equipment"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-700/25 to-transparent" />
            </div>

            {/* Floating stat cards */}
            {floatingStats.map((stat, i) => {
              const positions = [
                "absolute -bottom-6 -left-6",
                "absolute -top-6 -right-6",
                "absolute bottom-1/3 -right-8",
                "absolute top-1/3 -left-8",
              ];
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 + i * 0.15 }}
                  className={`${positions[i]} bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-xl border border-gray-100/80 hidden lg:block`}
                >
                  <div className={`text-2xl font-bold ${stat.color}`} style={{ fontFamily: "Poppins, sans-serif" }}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-28 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold mb-4 tracking-wide">
              FEATURES
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Everything Your Lab Needs
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Powerful features designed to streamline every aspect of laboratory management.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative p-8 bg-white rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50/0 to-teal-50/0 group-hover:from-blue-50/60 group-hover:to-teal-50/30 transition-all duration-300" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{feature.description}</p>
                  <div className="mt-5 flex items-center gap-1 text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Learn more <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow Section ── */}
      <section className="py-28 bg-gradient-to-br from-slate-900 to-blue-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold mb-4 tracking-wide border border-blue-500/30">
              HOW IT WORKS
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              From Patient to Report in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                Minutes
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              A seamless end-to-end workflow designed for speed, accuracy, and patient satisfaction.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-12 left-[8.33%] right-[8.33%] h-0.5 bg-gradient-to-r from-blue-500/20 via-teal-500/40 to-green-500/20" />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {workflowSteps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative flex flex-col items-center text-center group"
                >
                  <div className="relative mb-5 z-10">
                    <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center text-xs font-bold text-slate-300">
                      {i + 1}
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{step.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                  {i < workflowSteps.length - 1 && (
                    <div className="lg:hidden mt-3 text-slate-600">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-14 text-center"
          >
            <Link
              to="/features"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold border border-white/20 hover:border-white/40 transition-all duration-300 backdrop-blur-sm"
            >
              Explore All Features
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Statistics ── */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: 50000, suffix: "+", label: "Reports Generated", prefix: "" },
              { value: 100, suffix: "+", label: "Labs Supported", prefix: "" },
              { value: 99, suffix: ".9%", label: "Uptime Guarantee", prefix: "" },
              { value: 24, suffix: "/7", label: "Cloud Access", prefix: "" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <StatCounter {...stat} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Built For ── */}
      <section className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm font-semibold mb-4 tracking-wide">
              BUILT FOR
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Designed for Every Type of Lab
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Whether you run a single pathology lab or a network of diagnostic centers, DiagnoPro scales with you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {builtFor.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose ── */}
      <section className="py-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-sm font-semibold mb-4 tracking-wide">
              WHY DIAGNOPRO
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Built Different. By Design.
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Not just another LIMS. A focused, modern platform built specifically for pathology and diagnostic labs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyChoose.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex gap-5 p-6 rounded-2xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                  <item.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1.5">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-sm font-semibold mb-4 tracking-wide">
              TESTIMONIALS
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Trusted by Lab Professionals
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              See what lab directors and owners are saying about DiagnoPro.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative p-8 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
              >
                <div className="flex gap-0.5 mb-5">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-7 leading-relaxed text-sm">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-4 pt-5 border-t border-gray-100">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 flex-shrink-0">
                    <ImageWithFallback
                      src={t.image}
                      alt={t.author}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.author}</div>
                    <div className="text-xs text-gray-500">{t.role}, {t.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 bg-gradient-to-br from-blue-600 via-blue-600 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
              Ready to Transform Your Lab?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join 100+ labs already using DiagnoPro to streamline operations, cut report times, and delight patients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
              >
                Start Free Trial
              </Link>
              <Link
                to="/pricing"
                className="px-8 py-4 bg-white/10 text-white rounded-xl font-semibold border border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300"
              >
                View Pricing
              </Link>
            </div>
            <p className="mt-6 text-blue-200 text-sm">
              No credit card required · 14-day free trial · Setup in under 30 minutes
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
