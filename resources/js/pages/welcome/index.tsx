import { Head } from '@inertiajs/react';

import {
    BackToTop,
    ContactSection,
    CTABanner,
    FAQSection,
    FeaturesSection,
    Footer,
    Header,
    HeroSection,
    LazySection,
    PricingSection,
    SocialProofSection,
    TestimonialsSection,
} from './components';

interface WelcomeProps {
    canRegister?: boolean;
}

export default function Welcome({ canRegister = true }: WelcomeProps) {
    return (
        <>
            <Head title="Welcome to Laraflow" />
            <div className="min-h-screen bg-background text-foreground">
                <Header canRegister={canRegister} />
                <main>
                    <HeroSection canRegister={canRegister} />
                    <FeaturesSection />
                    <LazySection>
                        <SocialProofSection />
                    </LazySection>
                    <LazySection>
                        <PricingSection />
                    </LazySection>
                    <LazySection>
                        <TestimonialsSection />
                    </LazySection>
                    <LazySection>
                        <FAQSection />
                    </LazySection>
                    <LazySection>
                        <CTABanner canRegister={canRegister} />
                    </LazySection>
                    <LazySection>
                        <ContactSection />
                    </LazySection>
                </main>
                <Footer />
                <BackToTop />
            </div>
        </>
    );
}
