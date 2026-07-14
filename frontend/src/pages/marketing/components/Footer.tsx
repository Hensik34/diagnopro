import { Link } from "react-router";
import { Mail, Phone, MapPin, FlaskConical, Shield, Cloud, Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                Diagno<span className="text-blue-400">Pro</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-6">
              All-in-one laboratory management software built for modern pathology labs, diagnostic centers, and multi-branch networks.
            </p>
            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Shield, label: "HIPAA" },
                { icon: Cloud, label: "Cloud-Native" },
                { icon: Zap, label: "99.9% Uptime" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                  <Icon className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-xs text-slate-300 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-widest">Product</h4>
            <div className="space-y-3">
              {[
                { label: "Features", path: "/features" },
                { label: "Pricing", path: "/pricing" },
                { label: "Book Demo", path: "/contact" },
                { label: "Login", path: "/login" },
              ].map(({ label, path }) => (
                <Link
                  key={path}
                  to={path}
                  className="block text-sm text-slate-400 hover:text-blue-400 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-widest">Company</h4>
            <div className="space-y-3">
              {[
                { label: "About Us", path: "/about" },
                { label: "Contact", path: "/contact" },
                { label: "Careers", path: "#" },
                { label: "Blog", path: "#" },
              ].map(({ label, path }) => (
                <Link
                  key={label}
                  to={path}
                  className="block text-sm text-slate-400 hover:text-blue-400 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-widest">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-sm text-slate-400">
                <Mail className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span>support@diagnopro.com</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-400">
                <Phone className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span>+91 9313402271</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-400">
                <MapPin className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span>Ahmedabad, India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © 2026 DiagnoPro. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Security", "HIPAA"].map((item) => (
              <a key={item} href="#" className="text-sm text-slate-500 hover:text-blue-400 transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
