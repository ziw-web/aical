"use client";

import Link from "next/link";
import { ChevronLeft, Mail, MessageSquare, MapPin, Phone, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

export default function ContactPage() {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate sending
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.success("Message sent! Our team will get back to you soon.");
        setLoading(false);
        (e.target as HTMLFormElement).reset();
    };

    return (
        <div className="flex flex-col min-h-screen bg-white text-slate-900 font-sora">
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/">
                        <Logo width={180} height={45} variant="black" />
                    </Link>
                    <Button asChild variant="ghost" className="rounded-full">
                        <Link href="/"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
                    </Button>
                </div>
            </header>

            <main className="pt-32 pb-20 px-6">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16">
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
                                Get in <span className="text-[#8078F0]">Touch</span>
                            </h1>
                            <p className="text-xl text-slate-600 leading-relaxed">
                                Have questions about how IntelliCall can help your business? We're here to help.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-slate-50 rounded-2xl text-[#8078F0]">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold">Email Us</h4>
                                    <p className="text-slate-500">support@intellicall.ai</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-slate-50 rounded-2xl text-[#8078F0]">
                                    <MessageSquare className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold">Live Chat</h4>
                                    <p className="text-slate-500">Available Mon-Fri, 9am - 6pm EST</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-slate-50 rounded-2xl text-[#8078F0]">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold">Headquarters</h4>
                                    <p className="text-slate-500">123 AI Boulevard, Silicon Valley, CA 94025</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 md:p-12 rounded-[2.5rem] bg-slate-50 border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8078F0]/5 rounded-bl-full -z-10"></div>

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" placeholder="John Doe" required className="rounded-xl border-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" type="email" placeholder="john@example.com" required className="rounded-xl border-slate-200" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input id="subject" placeholder="Plan Inquiry" required className="rounded-xl border-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">How can we help?</Label>
                                <Textarea id="message" placeholder="Tell us more about your needs..." required className="rounded-xl border-slate-200 min-h-[150px]" />
                            </div>
                            <Button type="submit" disabled={loading} className="w-full bg-[#8078F0] hover:bg-[#8078F0]/90 text-white rounded-full h-12 text-base font-bold">
                                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
                                Send Message
                            </Button>
                        </form>
                    </div>
                </div>
            </main>

            <footer className="mt-auto border-t border-slate-100 py-8 px-6 text-center text-slate-400 text-sm">
                © {new Date().getFullYear()} IntelliCall AI. All rights reserved.
            </footer>
        </div>
    );
}
