import { motion } from "motion/react";
import { Target, Heart, Award, Users, Shield, CheckCircle2 } from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ImageWithFallback } from "./components/ImageWithFallback";
import { Link } from "react-router";

export default function About() {
  const values = [
    {
      icon: Target,
      title: "Mission-Driven",
      description: "Simplify laboratory operations through intelligent automation and intuitive design.",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Heart,
      title: "Patient-Centric",
      description: "Every feature is designed to improve patient care and experience.",
      color: "from-rose-500 to-pink-600",
    },
    {
      icon: Award,
      title: "Excellence",
      description: "Committed to delivering the highest quality software and support.",
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: Users,
      title: "Partnership",
      description: "We succeed when our customers succeed. Your growth is our priority.",
      color: "from-teal-500 to-teal-600",
    },
  ];

  const team = [
    {
      name: "Dr. Sarah Mitchell",
      role: "CEO & Co-Founder",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&auto=format",
    },
    {
      name: "David Chen",
      role: "CTO & Co-Founder",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&auto=format",
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Product",
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&auto=format",
    },
    {
      name: "James Park",
      role: "Head of Engineering",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&auto=format",
    },
  ];

  const trustBadges = [
    { label: "HIPAA Compliant", desc: "Full patient data protection", icon: "🔒" },
    { label: "SOC 2 Type II", desc: "Audited security controls", icon: "✅" },
    { label: "99.9% Uptime", desc: "SLA-backed availability", icon: "⚡" },
    { label: "ISO 27001", desc: "Information security certified", icon: "🛡️" },
  ];

  const milestones = [
    { year: "2020", event: "Founded by healthcare + tech team" },
    { year: "2021", event: "First 50 labs onboarded" },
    { year: "2022", event: "WhatsApp integration launched" },
    { year: "2023", event: "Multi-branch feature released" },
    { year: "2024", event: "100+ labs · 50L+ reports milestone" },
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
              OUR STORY
            </span>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
              Transforming{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                Laboratory
              </span>{" "}
              Management
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed">
              We're on a mission to simplify lab operations and improve patient care through innovative software solutions built by healthcare professionals.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story + milestones */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm font-semibold mb-5 tracking-wide">
                WHO WE ARE
              </span>
              <h2 className="text-4xl font-bold text-gray-900 mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
                Our Story
              </h2>
              <div className="space-y-4 text-gray-500 leading-relaxed">
                <p>
                  DiagnoPro was founded in 2020 by a team of healthcare professionals and software engineers who experienced firsthand the challenges of managing a modern diagnostic laboratory.
                </p>
                <p>
                  Frustrated by outdated, complex systems that hindered rather than helped, we set out to build something better — a platform that would be powerful yet intuitive, comprehensive yet simple to use.
                </p>
                <p>
                  Today, DiagnoPro serves over 100 laboratories in India, processing 50 Lakh+ reports annually and helping healthcare professionals focus on what matters most: patient care.
                </p>
              </div>

              {/* Milestones */}
              <div className="mt-10 space-y-4">
                {milestones.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="flex gap-4 items-start"
                  >
                    <div className="w-16 flex-shrink-0 text-right">
                      <span className="text-sm font-bold text-blue-600">{m.year}</span>
                    </div>
                    <div className="flex-shrink-0 w-px h-full bg-gray-200 relative">
                      <div className="absolute top-1.5 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow" />
                    </div>
                    <p className="text-gray-600 text-sm pt-0.5 pl-2">{m.event}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-100 to-teal-50 rounded-3xl blur-xl opacity-60 -z-10" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20 border border-white">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1760074032649-0243993135b6?w=1200&h=800&fit=crop&auto=format"
                  alt="Laboratory professionals working together"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-sm font-semibold mb-4 tracking-wide">
              OUR VALUES
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              The Principles We Live By
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              The principles that guide every product decision we make.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="p-8 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-5 shadow-sm`}>
                  <value.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold mb-4 tracking-wide">
              THE TEAM
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Led by experienced healthcare and technology professionals who've worked in labs themselves.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="text-center group"
              >
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-100 to-teal-100 mx-auto mb-4 overflow-hidden shadow-md group-hover:shadow-blue-500/20 transition-shadow duration-300">
                  <ImageWithFallback
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-sm text-gray-500">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & security */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-semibold mb-4 tracking-wide">
              SECURITY
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Trust & Data Protection
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Your patient data security is our top priority. We maintain the highest standards.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustBadges.map((badge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md text-center transition-all duration-300"
              >
                <div className="text-4xl mb-3">{badge.icon}</div>
                <div className="font-bold text-gray-900 mb-1">{badge.label}</div>
                <div className="text-xs text-gray-500">{badge.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 bg-gradient-to-br from-blue-600 via-blue-600 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_70%)]" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
              Join Our Growing Family
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Experience the difference modern lab management software can make.
            </p>
            <Link
              to="/contact"
              className="inline-block px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
            >
              Get Started Today
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
