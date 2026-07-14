import { motion } from "motion/react";
import {
  Users,
  FileText,
  DollarSign,
  MessageCircle,
  Building2,
  BarChart3,
  Shield,
  Zap,
  Clock,
  Database,
  Bell,
  Lock,
  CheckCircle2,
  ChevronRight,
  Activity,
  Cloud,
} from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ImageWithFallback } from "./components/ImageWithFallback";
import { Link } from "react-router";

function MockupPatientReg() {
  return (
    <div className="bg-white rounded-2xl shadow-2xl shadow-blue-500/15 border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center gap-3">
        <div className="flex gap-1.5">
          {["bg-red-400", "bg-yellow-400", "bg-green-400"].map((c) => (
            <div key={c} className={`w-3 h-3 rounded-full ${c}`} />
          ))}
        </div>
        <span className="text-white/80 text-sm font-medium">Patient Registration</span>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {["Patient ID: LAB-2024-8821", "Date: 22 Jun 2026"].map((v) => (
            <div key={v} className="text-xs bg-blue-50 text-blue-700 rounded-lg px-3 py-2 font-medium">{v}</div>
          ))}
        </div>
        {[
          { label: "Full Name", value: "Rajesh Kumar Sharma" },
          { label: "Mobile", value: "+91 98765 43210" },
          { label: "Date of Birth", value: "15 March 1985" },
          { label: "Referred By", value: "Dr. A. Mehta" },
        ].map((f) => (
          <div key={f.label} className="mb-3">
            <div className="text-xs text-gray-400 mb-1">{f.label}</div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 font-medium">{f.value}</div>
          </div>
        ))}
        <div className="mt-4 flex gap-3">
          <button className="flex-1 bg-blue-600 text-white text-sm py-2.5 rounded-lg font-semibold">Save & Add Tests</button>
          <button className="px-4 bg-gray-100 text-gray-600 text-sm py-2.5 rounded-lg">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function MockupReport() {
  const tests = [
    { name: "Haemoglobin", result: "13.2", unit: "g/dL", ref: "13.0 – 17.0", status: "normal" },
    { name: "TLC", result: "11,200", unit: "/cumm", ref: "4000 – 11000", status: "high" },
    { name: "Platelets", result: "2.1 Lac", unit: "/cumm", ref: "1.5 – 4.0 Lac", status: "normal" },
    { name: "ESR", result: "28", unit: "mm/hr", ref: "0 – 20", status: "high" },
  ];
  return (
    <div className="bg-white rounded-2xl shadow-2xl shadow-teal-500/15 border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-4 flex items-center gap-3">
        <div className="flex gap-1.5">
          {["bg-red-400", "bg-yellow-400", "bg-green-400"].map((c) => (
            <div key={c} className={`w-3 h-3 rounded-full ${c}`} />
          ))}
        </div>
        <span className="text-white/80 text-sm font-medium">CBC Report Entry</span>
      </div>
      <div className="p-5">
        <div className="bg-teal-50 rounded-xl p-3 mb-4 text-xs text-teal-700 font-semibold">
          Patient: Rajesh Kumar · ID: LAB-2024-8821 · CBC + ESR
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 text-left">
              <th className="pb-2 font-medium">Test</th>
              <th className="pb-2 font-medium">Result</th>
              <th className="pb-2 font-medium">Unit</th>
              <th className="pb-2 font-medium">Ref Range</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tests.map((t) => (
              <tr key={t.name} className="py-2">
                <td className="py-2 font-medium text-gray-700">{t.name}</td>
                <td className={`py-2 font-bold ${t.status === "high" ? "text-red-600" : "text-green-600"}`}>{t.result}</td>
                <td className="py-2 text-gray-400">{t.unit}</td>
                <td className="py-2 text-gray-400">{t.ref}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex gap-2">
          <button className="flex-1 bg-teal-600 text-white text-xs py-2.5 rounded-lg font-semibold">Verify & Generate PDF</button>
        </div>
      </div>
    </div>
  );
}

function MockupAnalytics() {
  const bars = [65, 80, 55, 90, 72, 88, 94];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="bg-white rounded-2xl shadow-2xl shadow-indigo-500/15 border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center gap-3">
        <div className="flex gap-1.5">
          {["bg-red-400", "bg-yellow-400", "bg-green-400"].map((c) => (
            <div key={c} className={`w-3 h-3 rounded-full ${c}`} />
          ))}
        </div>
        <span className="text-white/80 text-sm font-medium">Analytics Dashboard</span>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Today's Revenue", value: "₹24,800", trend: "+12%" },
            { label: "Reports Done", value: "147", trend: "+8%" },
            { label: "Pending", value: "23", trend: "-5%" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">{s.label}</div>
              <div className="text-base font-bold text-gray-800">{s.value}</div>
              <div className={`text-xs font-semibold mt-0.5 ${s.trend.startsWith("+") ? "text-green-600" : "text-red-500"}`}>{s.trend}</div>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-2 h-24">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-400"
                style={{ height: `${h}%` }}
              />
              <span className="text-[9px] text-gray-400">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockupWhatsApp() {
  return (
    <div className="bg-white rounded-2xl shadow-2xl shadow-green-500/15 border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-teal-500 px-6 py-4 flex items-center gap-3">
        <div className="flex gap-1.5">
          {["bg-red-400", "bg-yellow-400", "bg-green-400"].map((c) => (
            <div key={c} className={`w-3 h-3 rounded-full ${c}`} />
          ))}
        </div>
        <span className="text-white/80 text-sm font-medium">WhatsApp Delivery</span>
      </div>
      <div className="p-5 bg-[#e5ddd5]">
        <div className="space-y-3">
          <div className="bg-white rounded-xl rounded-tl-none p-4 shadow-sm max-w-[80%]">
            <p className="text-xs text-gray-700 leading-relaxed">
              <span className="font-semibold text-green-700 block mb-1">DiagnoPro</span>
              Dear Rajesh Kumar, your CBC + ESR report is ready.
            </p>
            <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-gray-800">CBC_Rajesh_2024.pdf</div>
                <div className="text-[10px] text-gray-500">245 KB · Tap to open</div>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-gray-400 text-right flex items-center justify-end gap-1">
              10:32 AM <CheckCircle2 className="w-3 h-3 text-blue-500" />
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-green-100 rounded-xl rounded-tr-none p-3 max-w-[60%] shadow-sm">
              <p className="text-xs text-gray-700">Thank you doctor 🙏</p>
              <div className="text-[10px] text-gray-400 text-right mt-1">10:34 AM</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Features() {
  const mainFeatures = [
    {
      icon: Users,
      title: "Advanced Patient Management",
      description: "Complete patient records with instant search, medical history tracking, and intelligent data organization. Manage thousands of patients effortlessly.",
      mockup: <MockupPatientReg />,
      highlights: [
        "Quick search with autocomplete",
        "Complete medical history",
        "Family linking",
        "Custom fields and tags",
      ],
    },
    {
      icon: FileText,
      title: "Smart Report Generation",
      description: "Create professional reports in seconds with customizable templates, digital signatures, and automated reference range highlighting. Support for all test types.",
      mockup: <MockupReport />,
      highlights: [
        "Customizable templates",
        "Digital signatures & QR codes",
        "Auto reference range flags",
        "Batch report generation",
      ],
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics Dashboard",
      description: "Monitor your lab's performance with comprehensive dashboards. Track revenue, test volumes, turnaround times, and key metrics in real-time.",
      mockup: <MockupAnalytics />,
      highlights: [
        "Revenue analytics",
        "Test volume tracking",
        "Turnaround time metrics",
        "Branch-wise comparison",
      ],
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Report Sharing",
      description: "Instantly deliver reports to patients via WhatsApp. Automated notifications with patient consent management and delivery tracking — no app needed.",
      mockup: <MockupWhatsApp />,
      highlights: [
        "Instant PDF delivery",
        "Consent management",
        "Delivery read receipts",
        "Automated reminders",
      ],
    },
  ];

  const additionalFeatures = [
    {
      icon: DollarSign,
      title: "Billing & Invoicing",
      description: "Automated billing with invoice generation, payment tracking, and financial reporting.",
    },
    {
      icon: Building2,
      title: "Multi-Branch Management",
      description: "Centralized control for labs with multiple locations. Unified reporting and inventory.",
    },
    {
      icon: Shield,
      title: "HIPAA Compliance",
      description: "Bank-grade encryption and compliance with healthcare data protection standards.",
    },
    {
      icon: Zap,
      title: "Fast Performance",
      description: "Lightning-fast search and report generation. Optimized for high-volume operations.",
    },
    {
      icon: Clock,
      title: "Automated Workflows",
      description: "Reduce manual work with intelligent automation for routine tasks and processes.",
    },
    {
      icon: Database,
      title: "Cloud Backup",
      description: "Automatic daily backups with 99.9% uptime guarantee. Your data is always safe.",
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Stay informed with automated alerts for critical events and pending tasks.",
    },
    {
      icon: Lock,
      title: "Role-based Access",
      description: "Granular permission controls. Define access levels for different staff members.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-white to-teal-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-100/40 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-5 tracking-wide">
              FEATURES
            </span>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
              Powerful Features for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                Modern Labs
              </span>
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed">
              Everything you need to run your laboratory efficiently. Built for speed, accuracy, and ease of use — with real product screens.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main feature sections with alternating layouts + real mockups */}
      {mainFeatures.map((feature, index) => (
        <section
          key={index}
          className={`py-24 ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div
              className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${
                index % 2 === 1 ? "lg:grid-flow-dense" : ""
              }`}
            >
              {/* Text col */}
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={index % 2 === 1 ? "lg:col-start-2" : ""}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center mb-6 shadow-md">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                  {feature.title}
                </h2>
                <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                  {feature.description}
                </p>
                <div className="space-y-3 mb-8">
                  {feature.highlights.map((highlight, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <span className="text-gray-700 font-medium">{highlight}</span>
                    </div>
                  ))}
                </div>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 text-sm"
                >
                  See it in action <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>

              {/* Mockup col */}
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={index % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}
              >
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-blue-100 to-teal-50 rounded-3xl blur-xl opacity-60 -z-10" />
                  {feature.mockup}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      ))}

      {/* Additional features */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold mb-4 tracking-wide">
              AND MUCH MORE
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Every Tool You Need
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Additional features designed to enhance your laboratory operations.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-4 transition-colors duration-300">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_70%)]" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
              Experience All Features Risk-Free
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Start your 14-day free trial today. No credit card required.
            </p>
            <Link
              to="/contact"
              className="inline-block px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
            >
              Start Free Trial
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
