import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer style={{ background: "#fafafa", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link to="/" onClick={() => scrollTo(0, 0)} className="inline-flex items-center gap-2 mb-5">
                            <img src="/logo.svg" alt="logo" className="size-6" />
                            <span className="font-medium font-serif text-xl text-gray-800">Scheduler</span>
                        </Link>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                            The AI-powered social media scheduler that helps creators and teams grow faster with less effort.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-widest mb-5 text-gray-600">Product</div>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><a href="#features" className="hover:text-gray-900">Features</a></li>
                            <li><a href="#pricing" className="hover:text-gray-900">Pricing</a></li>
                            <li><Link to="/login" className="hover:text-gray-900">Dashboard</Link></li>
                        </ul>
                    </div>

                    <div>
                        <div className="text-xs font-semibold uppercase tracking-widest mb-5 text-gray-600">Legal</div>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><Link to="/privacy" className="hover:text-gray-900">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-gray-900">Terms of Service</Link></li>
                            <li><Link to="/refund" className="hover:text-gray-900">Refund Policy</Link></li>
                            <li><Link to="/cookies" className="hover:text-gray-900">Cookie Policy</Link></li>
                        </ul>
                    </div>

                    <div>
                        <div className="text-xs font-semibold uppercase tracking-widest mb-5 text-gray-600">Admin & Access</div>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><Link to="/admin" className="hover:text-red-600 font-medium">Admin Portal</Link></li>
                            <li><Link to="/login" className="hover:text-gray-900">Sign In</Link></li>
                            <li><Link to="/reset-password" className="hover:text-gray-900">Reset Password</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                    <p className="text-xs text-gray-400">© {new Date().getFullYear()} MetScheduler. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <Link to="/privacy" className="text-xs text-gray-400 hover:text-gray-700">
                            Privacy Policy
                        </Link>
                        <Link to="/terms" className="text-xs text-gray-400 hover:text-gray-700">
                            Terms of Service
                        </Link>
                        <Link to="/refund" className="text-xs text-gray-400 hover:text-gray-700">
                            Refunds
                        </Link>
                        <Link to="/login" className="text-xs text-gray-400 hover:text-gray-700">
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
