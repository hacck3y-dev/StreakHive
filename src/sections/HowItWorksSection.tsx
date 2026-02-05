import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { TargetIcon, CheckIcon, UsersIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const steps = [
    {
        step: '01',
        title: 'Post your plan',
        description: 'Share today\'s tasks, habits, or goals with your circle.',
        icon: TargetIcon,
    },
    {
        step: '02',
        title: 'Track daily',
        description: 'Check off tasks and keep your streak alive—one day at a time.',
        icon: CheckIcon,
    },
    {
        step: '03',
        title: 'Stay accountable',
        description: 'Cheer others on. Get nudges when you need them most.',
        icon: UsersIcon,
    },
];

const HowItWorksSection: React.FC = () => {
    const navigate = useNavigate();
    const sectionRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

    useLayoutEffect(() => {
        const section = sectionRef.current;
        const title = titleRef.current;
        const cards = cardsRef.current.filter(Boolean);

        if (!section || !title || cards.length === 0) return;

        const ctx = gsap.context(() => {
            const scrollTl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top 75%',
                    once: true,
                }
            });

            // Title animation
            scrollTl.fromTo(
                title,
                { y: 24, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
            );

            // Card 1 (left) - enters from left
            scrollTl.fromTo(
                cards[0],
                { x: '-20vw', rotate: -4, opacity: 0 },
                { x: 0, rotate: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
                0.1
            );

            // Card 2 (center) - enters from bottom
            scrollTl.fromTo(
                cards[1],
                { y: 40, scale: 0.96, opacity: 0 },
                { y: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'power2.out' },
                0.2
            );

            // Card 3 (right) - enters from right
            scrollTl.fromTo(
                cards[2],
                { x: '20vw', rotate: 4, opacity: 0 },
                { x: 0, rotate: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
                0.3
            );
        }, section);

        return () => ctx.revert();
    }, []);

    const handleCardClick = () => {
        navigate('/signup');
    };

    return (
        <section id="how-it-works" ref={sectionRef} className="section-pinned bg-bg-primary plus-grid z-20">
            {/* Title */}
            <div ref={titleRef} className="relative md:absolute top-0 md:top-[8vh] left-0 md:left-1/2 md:-translate-x-1/2 text-center w-full md:w-[70vw] opacity-0 px-6 md:px-0 pt-2 md:pt-0">
                <h2 className="text-[clamp(28px,3.5vw,48px)] font-space font-bold text-text-primary mb-3">
                    Three steps to consistency
                </h2>
                <p className="text-text-secondary text-lg">
                    No overwhelm. Just post, track, and follow through.
                </p>
            </div>

            {/* Cards */}
            <div className="relative md:absolute top-0 md:top-[22vh] left-0 w-full px-6 md:px-[5vw] flex flex-col md:flex-row md:justify-between gap-6 md:gap-0 mt-6 md:mt-0">
                {steps.map((item, index) => {
                    const Icon = item.icon;
                    const leftPositions = ['md:left-[5vw]', 'md:left-[37vw]', 'md:left-[69vw]'];

                    return (
                        <motion.div
                            key={item.step}
                            ref={el => { cardsRef.current[index] = el; }}
                            className={`relative md:absolute left-0 ${leftPositions[index]} card-surface w-full md:w-[26vw] h-auto md:h-[64vh] p-6 md:p-8 flex flex-col opacity-0 cursor-pointer`}
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCardClick}
                        >
                            {/* Step Badge */}
                            <span className="micro-label mb-8">
                                Step {item.step}
                            </span>

                            {/* Icon */}
                            <div className="flex-1 flex items-center justify-center">
                                <div className="w-24 h-24 rounded-full bg-surface-highlight flex items-center justify-center">
                                    <Icon size={40} className="text-accent-yellow" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="mt-auto">
                                <h3 className="text-2xl font-space font-bold text-text-primary mb-3">
                                    {item.title}
                                </h3>
                                <p className="text-text-secondary leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
};

export default HowItWorksSection;
