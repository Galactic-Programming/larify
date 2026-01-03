import { Head } from '@inertiajs/react';

import {
    ContactSection,
    FAQSection,
    FeaturesSection,
    Footer,
    Header,
    HeroSection,
    SocialProofSection,
    TestimonialsSection,
} from './components';

interface WelcomeProps {
    canRegister?: boolean;
}

export default function Welcome({ canRegister = true }: WelcomeProps) {
    return (
        <>
            <Head title="Welcome to Larify" />
            <div className="min-h-screen bg-background text-foreground">
                <Header canRegister={canRegister} />
                <main>
                    <HeroSection canRegister={canRegister} />
                    <FeaturesSection />
                    <SocialProofSection />
                    <TestimonialsSection />
                    <FAQSection />
                    <ContactSection />
                </main>
                <Footer />
            </div>
        </>
    );
}
