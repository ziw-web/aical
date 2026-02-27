"use client";

import Link from "next/link";
import {
    ChevronRight,
    CheckCircle2,
    Bot,
    Zap,
    Users,
    Phone,
    ArrowRight,
    MessageSquare,
    BarChart3,
    ShieldCheck,
    Star,
    Instagram,
    Linkedin,
    Youtube,
    PhoneIncoming,
    PhoneOutgoing,
    Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export default function LandingPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);
    const [currencySymbol, setCurrencySymbol] = useState("$");
    const [loadingPlans, setLoadingPlans] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);

        const fetchData = async () => {
            try {
                const [plansRes, settingsRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/plans`),
                    axios.get(`${API_BASE_URL}/settings/public`)
                ]);

                if (plansRes.data?.status === "success") {
                    setPlans(plansRes.data.data.plans);
                }

                if (settingsRes.data?.status === "success") {
                    const symbolMap: any = { "USD": "$", "EUR": "€", "GBP": "£", "INR": "₹", "AUD": "$", "ZAR": "R" };
                    setCurrencySymbol(symbolMap[settingsRes.data.data.currency] || "$");
                }
            } catch (err) {
                console.error("Failed to fetch landing page data", err);
            } finally {
                setLoadingPlans(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-white text-slate-900 overflow-x-hidden font-sora">
            {/* Navigation */}
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Logo width={180} height={45} variant="black" />

                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="#features" className="text-sm font-medium hover:text-[#8078F0] transition-colors">Features</Link>
                        <Link href="#solutions" className="text-sm font-medium hover:text-[#8078F0] transition-colors">Solutions</Link>
                        <Link href="#pricing" className="text-sm font-medium hover:text-[#8078F0] transition-colors">Pricing</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        {isLoggedIn ? (
                            <Button asChild variant="default" className="rounded-full px-6 bg-[#8078F0] hover:bg-[#8078F0]/90 text-white">
                                <Link href="/dashboard">Dashboard</Link>
                            </Button>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-medium hover:text-[#8078F0] transition-colors px-4 py-2">Login</Link>
                                <Button asChild variant="default" className="rounded-full px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-lg">
                                    <Link href="/signup" className="text-white">Get Started <ChevronRight className="ml-2 h-4 w-4" /></Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="pt-20">
                {/* Hero Section */}
                <section className="relative py-24 md:py-32 px-6 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8078F0]/5 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-700"></div>
                    </div>

                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8078F0] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8078F0]"></span>
                            </span>
                            Introducing Next-Gen AI Calling
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                            AI Voice Agents for <span className="text-[#8078F0] italic">Inbound & Outbound</span> Calls
                        </h1>

                        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                            Empower your business with AI agents that handle calls 24/7 – whether it's outbound campaigns or answering inbound inquiries with human-like intelligence.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            {!isLoggedIn ? (
                                <Button size="lg" className="rounded-full px-10 h-14 text-base font-semibold bg-[#8078F0] hover:bg-[#8078F0]/90 text-white shadow-xl hover:shadow-[#8078F0]/20 transition-all scale-100 hover:scale-105" asChild>
                                    <Link href="/signup" className="text-white">Start Free Trial <ArrowRight className="ml-2 h-5 w-5" /></Link>
                                </Button>
                            ) : (
                                <Button size="lg" className="rounded-full px-10 h-14 text-base font-semibold bg-[#8078F0] hover:bg-[#8078F0]/90 text-white shadow-xl hover:shadow-[#8078F0]/20 transition-all scale-100 hover:scale-105" asChild>
                                    <Link href="/dashboard" className="text-white">Back to Dashboard <ArrowRight className="ml-2 h-5 w-5" /></Link>
                                </Button>
                            )}
                            <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-base font-semibold border-slate-200 hover:bg-slate-50" asChild>
                                <Link href="#features">See How It Works</Link>
                            </Button>
                        </div>

                        <div className="flex items-center justify-center gap-8 pt-12 text-slate-400 grayscale opacity-70">
                            {/* Logos of companies or just generic text */}
                            <span className="text-sm font-semibold tracking-widest uppercase italic font-mono">TRUSTED BY INNOVATORS</span>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="py-24 px-6 bg-slate-50">
                    <div className="max-w-7xl mx-auto space-y-16">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900">Complete AI Calling Solution</h2>
                            <p className="text-slate-600 max-w-2xl mx-auto">Handle inbound inquiries, automate outbound campaigns, and let AI qualify your leads – all from one powerful platform.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: <PhoneOutgoing className="h-8 w-8 text-[#8078F0]" />,
                                    title: "Outbound Campaigns",
                                    desc: "Launch thousands of AI-powered calls in minutes. Scale your outreach without scaling your team."
                                },
                                {
                                    icon: <PhoneIncoming className="h-8 w-8 text-[#8078F0]" />,
                                    title: "Inbound Call Handling",
                                    desc: "Let AI answer incoming calls 24/7. Perfect for support, sales inquiries, and lead capture."
                                },
                                {
                                    icon: <BarChart3 className="h-8 w-8 text-[#8078F0]" />,
                                    title: "AI Lead Scoring",
                                    desc: "Automatic qualification and scoring after every call. Know your hot leads instantly."
                                },
                                {
                                    icon: <Mic className="h-8 w-8 text-[#8078F0]" />,
                                    title: "Call Recording & Transcripts",
                                    desc: "Full recordings with word-for-word transcripts. Never miss a detail from any conversation."
                                },
                                {
                                    icon: <Bot className="h-8 w-8 text-[#8078F0]" />,
                                    title: "Neural AI Voices",
                                    desc: "Hyper-realistic voices powered by ElevenLabs. Handles objections and follows complex logic naturally."
                                },
                                {
                                    icon: <Users className="h-8 w-8 text-[#8078F0]" />,
                                    title: "Lead & Campaign Management",
                                    desc: "Import leads via CSV, organize with tags, and manage campaigns all from one dashboard."
                                }
                            ].map((feature, i) => (
                                <div key={i} className="group p-8 bg-white rounded-3xl border border-slate-100 hover:border-[#8078F0]/20 hover:shadow-2xl transition-all duration-300">
                                    <div className="p-3 bg-[#8078F0]/5 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="py-24 px-6">
                    <div className="max-w-7xl mx-auto space-y-16">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900">Simple, Transparent Pricing</h2>
                            <p className="text-slate-600 max-w-2xl mx-auto">Choose the plan that fits your growth. No hidden fees, ever.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {loadingPlans ? (
                                Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="p-8 rounded-3xl border border-slate-100 bg-white animate-pulse">
                                        <div className="h-6 w-24 bg-slate-100 rounded mb-4"></div>
                                        <div className="h-10 w-32 bg-slate-100 rounded mb-6"></div>
                                        <div className="space-y-3">
                                            <div className="h-4 w-full bg-slate-50 rounded"></div>
                                            <div className="h-4 w-full bg-slate-50 rounded"></div>
                                            <div className="h-4 w-full bg-slate-50 rounded"></div>
                                        </div>
                                    </div>
                                ))
                            ) : plans.length > 0 ? (
                                plans.map((plan, i) => (
                                    <div key={i} className={`relative p-8 rounded-3xl border-2 ${i === 1 ? 'border-[#8078F0] bg-[#8078F0]/[0.02] shadow-xl' : 'border-slate-100 bg-white'}`}>
                                        {i === 1 && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#8078F0] text-white text-xs font-bold rounded-full uppercase">
                                                Most Popular
                                            </div>
                                        )}
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                                                <div className="mt-4 flex items-baseline gap-1">
                                                    <span className="text-4xl font-bold text-slate-900">{currencySymbol}{plan.price}</span>
                                                    <span className="text-slate-500 text-sm">/{plan.interval}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle2 className="h-5 w-5 text-[#8078F0] shrink-0" />
                                                    <span className="text-slate-600 text-sm">{plan.limits?.agents || 0} AI Agents</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle2 className="h-5 w-5 text-[#8078F0] shrink-0" />
                                                    <span className="text-slate-600 text-sm">{plan.limits?.campaigns || 0} Active Campaigns</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle2 className="h-5 w-5 text-[#8078F0] shrink-0" />
                                                    <span className="text-slate-600 text-sm">{plan.limits?.leads || 0} Lead Capacity</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle2 className="h-5 w-5 text-[#8078F0] shrink-0" />
                                                    <span className="text-slate-600 text-sm">Unlimited Calls (BYOK)</span>
                                                </div>
                                                {plan.description && (
                                                    <p className="text-xs text-muted-foreground pt-2 italic">{plan.description}</p>
                                                )}
                                            </div>

                                            <Button
                                                asChild
                                                className={`w-full rounded-full h-12 font-bold ${i === 1 ? 'bg-[#8078F0] hover:bg-[#8078F0]/90 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                                            >
                                                <Link href={isLoggedIn ? "/settings?tab=billing" : "/signup"}>
                                                    Get Started
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12 text-slate-400">
                                    No plans available at the moment.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <section className="py-24 px-6 bg-slate-900 text-white rounded-[3rem] mx-6 mb-24 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Bot className="h-64 w-64" />
                    </div>

                    <div className="max-w-7xl mx-auto space-y-16 relative z-10">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-5xl font-bold">Why Teams Love Us</h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">Join hundreds of companies that have transformed their calling operations.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                {
                                    quote: "The AI handles both our inbound support calls and outbound campaigns. We've reduced our call center costs by 60%.",
                                    author: "Sarah Johnson",
                                    role: "VP Operations, TechCorp"
                                },
                                {
                                    quote: "Inbound AI answering has been a game-changer. Leads get qualified 24/7, even when our team is offline.",
                                    author: "Michael Chen",
                                    role: "Founder, GrowthOps"
                                },
                                {
                                    quote: "The AI scoring feature saves us hours. We instantly know which leads are worth pursuing after every call.",
                                    author: "Emma Williams",
                                    role: "Sales Manager, BrightScale"
                                }
                            ].map((testimonial, i) => (
                                <div key={i} className="p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                                    <div className="flex gap-1 mb-6">
                                        {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-4 w-4 fill-[#8078F0] text-[#8078F0]" />)}
                                    </div>
                                    <p className="text-lg italic text-slate-200 mb-6 font-medium">"{testimonial.quote}"</p>
                                    <div>
                                        <div className="font-bold">{testimonial.author}</div>
                                        <div className="text-sm text-slate-400">{testimonial.role}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 py-16 px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
                    <div className="col-span-2 space-y-6">
                        <Logo width={180} height={45} />
                        <p className="text-slate-500 max-w-sm">
                            Revolutionizing business communications with intelligent, automated calling solutions that scale with your growth.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Company</h4>
                        <nav className="flex flex-col gap-2">
                            <Link href="/about" className="text-slate-500 hover:text-[#8078F0] text-sm transition-colors">About Us</Link>
                            <Link href="/contact" className="text-slate-500 hover:text-[#8078F0] text-sm transition-colors">Contact</Link>
                            <Link href="/privacy" className="text-slate-500 hover:text-[#8078F0] text-sm transition-colors">Privacy Policy</Link>
                            <Link href="/terms" className="text-slate-500 hover:text-[#8078F0] text-sm transition-colors">Terms of Service</Link>
                        </nav>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Connect</h4>
                        <div className="flex gap-4">
                            <Button size="icon" variant="ghost" className="rounded-full bg-slate-50 hover:bg-[#8078F0]/10 hover:text-[#8078F0] transition-all">
                                <Instagram className="h-5 w-5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="rounded-full bg-slate-50 hover:bg-[#8078F0]/10 hover:text-[#8078F0] transition-all">
                                <Linkedin className="h-5 w-5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="rounded-full bg-slate-50 hover:bg-[#8078F0]/10 hover:text-[#8078F0] transition-all">
                                <Youtube className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto border-t border-slate-100 mt-16 pt-8 text-center text-slate-400 text-sm font-medium">
                    © {new Date().getFullYear()} aical AI. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
