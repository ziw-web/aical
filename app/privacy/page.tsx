"use client";

import Link from "next/link";
import { ChevronLeft, ShieldCheck, Lock, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { Footer } from "@/components/layout/footer";
import { useSettings } from "@/components/settings-provider";

export default function PrivacyPage() {
    const { branding } = useSettings();

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
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-6">
                        <div className="inline-flex p-3 rounded-2xl mb-4" style={{ backgroundColor: `${branding.primaryColor}15`, color: branding.primaryColor }}>
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
                        <p className="text-muted-foreground">Last updated: February 1, 2026</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-2xl bg-muted/30 border border-border space-y-3">
                            <Lock className="h-5 w-5" style={{ color: branding.primaryColor }} />
                            <h4 className="font-bold">Encryption</h4>
                            <p className="text-sm text-muted-foreground italic">Industry-standard AES-256 for all stored voice and text data.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-muted/30 border border-border space-y-3">
                            <Eye className="h-5 w-5" style={{ color: branding.primaryColor }} />
                            <h4 className="font-bold">Transparency</h4>
                            <p className="text-sm text-muted-foreground italic">Clear disclosure on how interactions are handled and processed.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-muted/30 border border-border space-y-3">
                            <FileText className="h-5 w-5" style={{ color: branding.primaryColor }} />
                            <h4 className="font-bold">Compliance</h4>
                            <p className="text-sm text-muted-foreground italic">Fully compliant with GDPR, CCPA, and TCPA regulations.</p>
                        </div>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-foreground" style={{ borderLeftColor: branding.primaryColor, borderLeftWidth: 4, paddingLeft: '1rem' }}>1. Data Collection</h2>
                            <p>
                                We collect information you provide directly, such as when you create an account, configure AI agents, or contact support. This includes basic contact info, payment details, and the content of communications managed by our platform.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-foreground" style={{ borderLeftColor: branding.primaryColor, borderLeftWidth: 4, paddingLeft: '1rem' }}>2. Use of Information</h2>
                            <p>
                                We use the collected data to provide, maintain, and improve our services, process payments, and develop new features related to voice synthesis and conversation logic. We do not sell your personal information to third parties.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-foreground" style={{ borderLeftColor: branding.primaryColor, borderLeftWidth: 4, paddingLeft: '1rem' }}>3. Voice Data Processing</h2>
                            <p>
                                Audio recordings and transcripts generated through our agents are used for performance monitoring and training purposes only within the scope of your account. You have full control to enable or disable recording in your settings.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-foreground" style={{ borderLeftColor: branding.primaryColor, borderLeftWidth: 4, paddingLeft: '1rem' }}>4. Your Rights</h2>
                            <p>
                                Depending on your location, you may have rights to access, correct, or delete your personal data. Please contact our data protection officer at privacy@intellicall.ai for any requests.
                            </p>
                        </section>
                    </div>

                    <div className="pt-12 border-t border-border text-center">
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            By using {branding.appName}, you agree to the collection and use of information in accordance with this policy. We reserve the right to update this policy at any time.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
