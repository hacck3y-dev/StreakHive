import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from '../components/icons';

interface HeroSectionProps {
    onLoginClick: () => void;
    onSignupClick: () => void;
    githubRepoUrl: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onLoginClick, onSignupClick, githubRepoUrl }) => {
    const sectionRef = useRef<HTMLElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const headlineRef = useRef<HTMLHeadingElement>(null);
    const subheadlineRef = useRef<HTMLParagraphElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLDivElement>(null);
    const labelRef = useRef<HTMLSpanElement>(null);
    const navRef = useRef<HTMLElement>(null);

    useLayoutEffect(() => {
        const section = sectionRef.current;
        const card = cardRef.current;
        const headline = headlineRef.current;
        const subheadline = subheadlineRef.current;
        const cta = ctaRef.current;
        const image = imageRef.current;
        const label = labelRef.current;
        const nav = navRef.current;

        if (!section || !card || !headline || !subheadline || !cta || !image || !label || !nav) return;

        const ctx = gsap.context(() => {
            // Initial load animation
            const loadTl = gsap.timeline({ defaults: { ease: 'power2.out' } });

            loadTl
                .fromTo(nav, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, 0)
                .fromTo(card, { scale: 0.96, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 }, 0.1)
                .fromTo(label, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, 0.25)
                .fromTo(headline.querySelectorAll('.word'), { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.04 }, 0.35)
                .fromTo(subheadline, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, 0.55)
                .fromTo(cta, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, 0.7)
                .fromTo(image, { x: '6vw', opacity: 0 }, { x: 0, opacity: 1, duration: 0.55 }, 0.45);

        }, section);

        return () => ctx.revert();
    }, []);

    const handleSeeHowItWorks = () => {
        const target = document.getElementById('how-it-works');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <>
            <section ref={sectionRef} className="section-pinned bg-bg-primary plus-grid z-10">
                {/* Navigation */}
                <nav
                    ref={navRef}
                    className="fixed top-0 left-0 w-full h-[64px] md:h-[72px] px-4 md:px-[4vw] flex items-center justify-between z-50 opacity-0 bg-bg-primary/80 backdrop-blur-md"
                >
                    <div className="flex items-center gap-6">
                        <motion.div
                            className="font-space text-xl font-bold text-text-primary cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            HabitSync
                        </motion.div>
                        <motion.a
                            href={githubRepoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-text-secondary text-sm hover:text-text-primary transition-colors"
                            whileHover={{ y: -1 }}
                        >
                            GitHub
                        </motion.a>
                    </div>
                    <div className="flex items-center gap-4">
                        <motion.button
                            className="btn-secondary text-sm py-2 px-4"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onLoginClick}
                        >
                            Log in
                        </motion.button>
                        <motion.button
                            className="btn-primary text-sm py-2 px-4"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onSignupClick}
                        >
                            Get started
                        </motion.button>
                    </div>
                </nav>

                {/* Hero Card */}
                <div
                    ref={cardRef}
                    className="relative md:absolute left-0 md:left-1/2 md:top-[52%] top-0 md:-translate-x-1/2 md:-translate-y-1/2 w-[92vw] md:w-[86vw] h-auto md:h-[78vh] card-surface opacity-0 p-6 md:p-0 mt-6 md:mt-0 mx-auto"
                >
                    {/* Left Content */}
                    <div className="relative md:absolute left-0 md:left-[6%] top-0 md:top-[10%] w-full md:w-[44%] h-auto md:h-full flex flex-col justify-start">
                        {/* Micro Label */}
                        <span ref={labelRef} className="micro-label mb-6 opacity-0">
                            Social Accountability
                        </span>

                        {/* Headline */}
                        <h1 ref={headlineRef} className="text-[clamp(32px,4vw,56px)] font-space font-bold text-text-primary leading-[0.95] mb-6">
                            <span className="word inline-block">Build</span>{' '}
                            <span className="word inline-block">habits.</span>{' '}
                            <span className="word inline-block">Stay</span>{' '}
                            <span className="word inline-block">accountable.</span>{' '}
                            <span className="word inline-block">Together.</span>
                        </h1>

                        {/* Subheadline */}
                        <p ref={subheadlineRef} className="text-lg text-text-secondary leading-relaxed mb-6 md:mb-8 max-w-[90%] opacity-0">
                            Post tasks, track streaks, and cheer each other on—without the noise of traditional social media.
                        </p>

                        {/* CTAs */}
                        <div ref={ctaRef} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-6 md:mt-auto mb-0 md:mb-[15%] opacity-0">
                            <motion.button
                                className="btn-primary flex items-center gap-2"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onSignupClick}
                            >
                                Create your board
                                <ArrowRightIcon size={18} />
                            </motion.button>
                            <motion.button
                                className="btn-secondary"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSeeHowItWorks}
                            >
                                See how it works
                            </motion.button>
                        </div>
                    </div>

                    {/* Right Image */}
                    <div
                        ref={imageRef}
                        className="relative md:absolute right-0 md:right-[4%] top-0 md:top-[10%] w-full md:w-[44%] h-[220px] sm:h-[320px] md:h-[80%] rounded-[22px] overflow-hidden opacity-0 mt-6 md:mt-0"
                    >
                        <img
                            src="/hero_coffee_work.jpg"
                            alt="Person working at café"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/30 to-transparent" />
                    </div>
                </div>
            </section>
        </>
    );
};

export default HeroSection;
