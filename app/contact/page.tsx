"use client";

import Link from "next/link";
import { ChevronLeft, Mail, MessageSquare, MapPin, Phone, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { Footer } from "@/components/layout/footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { useSettings } from "@/components/settings-provider";

export default function ContactPage() {
    const [loading, setLoading] = useState(false);
    const { branding } = useSettings();

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
        <div className="flex flex-col min-h-screen bg-background text-foreground font-sora">
            <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/">
                        <Logo width={180} height={45} variant="auto" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <ModeToggle />
                        <Button asChild variant="ghost" className="rounded-full">
                            <Link href="/"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-20 px-6">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16">
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
                                Get in <span style={{ color: branding.primaryColor }}>Touch</span>
                            </h1>
                            <p className="text-xl text-muted-foreground leading-relaxed">
                                Have questions about how {branding.appName} can help your business? We're here to help.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-muted rounded-2xl" style={{ color: branding.primaryColor }}>
                                    <Mail className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold">Email Us</h4>
                                    <p className="text-muted-foreground">support@intellicall.ai</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-muted rounded-2xl" style={{ color: branding.primaryColor }}>
                                    <MessageSquare className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold">Live Chat</h4>
                                    <p className="text-muted-foreground">Available Mon-Fri, 9am - 6pm EST</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-muted rounded-2xl" style={{ color: branding.primaryColor }}>
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold">Headquarters</h4>
                                    <p className="text-muted-foreground">123 AI Boulevard, Silicon Valley, CA 94025</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 md:p-12 rounded-[2.5rem] bg-muted/30 border border-border relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full -z-10" style={{ backgroundColor: `${branding.primaryColor}0D` }}></div>

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" placeholder="John Doe" required className="rounded-xl border-border" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" type="email" placeholder="john@example.com" required className="rounded-xl border-border" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input id="subject" placeholder="Plan Inquiry" required className="rounded-xl border-border" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">How can we help?</Label>
                                <Textarea id="message" placeholder="Tell us more about your needs..." required className="rounded-xl border-border min-h-[150px]" />
                            </div>
                            <Button type="submit" disabled={loading} className="w-full text-white rounded-full h-12 text-base font-bold" style={{ backgroundColor: branding.primaryColor }}>
                                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
                                Send Message
                            </Button>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
