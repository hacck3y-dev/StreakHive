import { useRef, useLayoutEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { FlameIcon, ArrowRightIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const StreakTrackerSection: React.FC = () => {
    const navigate = useNavigate();
    const sectionRef = useRef<HTMLElement>(null);
    const heatmapCardRef = useRef<HTMLDivElement>(null);
    const textPanelRef = useRef<HTMLDivElement>(null);
    const flameRef = useRef<HTMLDivElement>(null);

    // Generate 365 days of heatmap data
    const heatmapData = useMemo(() => {
        const data = [];
        for (let i = 0; i < 365; i++) {
            // Random intensity 0-4
            const intensity = Math.random() > 0.3 ? Math.floor(Math.random() * 4) + 1 : 0;
            data.push(intensity);
        }
        return data;
    }, []);

    const getIntensityColor = (intensity: number) => {
        const colors = [
            'bg-surface-highlight', // 0 - no activity
            'bg-accent-yellow/20',  // 1 - low
            'bg-accent-yellow/40',  // 2 - medium
            'bg-accent-yellow/60',  // 3 - high
            'bg-accent-yellow',     // 4 - max
        ];
        return colors[intensity];
    };

    useLayoutEffect(() => {
        const section = sectionRef.current;
        const heatmapCard = heatmapCardRef.current;
        const textPanel = textPanelRef.current;
        const flame = flameRef.current;

        if (!section || !heatmapCard || !textPanel) return;

        const ctx = gsap.context(() => {
            const scrollTl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top 75%',
                    once: true,
                }
            });

            // Heatmap card - enters from left
            scrollTl.fromTo(
                heatmapCard,
                { x: '-18vw', opacity: 0, scale: 0.96 },
                { x: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }
            );

            // Text panel - enters from right
            scrollTl.fromTo(
                textPanel,
                { x: '18vw', opacity: 0 },
                { x: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
                0.1
            );

            // Flame icon
            if (flame) {
                scrollTl.fromTo(
                    flame,
                    { scale: 0.9, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out' },
                    0.2
                );
            }
        }, section);

        return () => ctx.revert();
    }, []);

    const handleStartStreak = () => {
        navigate('/signup');
    };

    return (
        <section ref={sectionRef} className="section-pinned bg-bg-primary plus-grid z-40">
            {/* Left Heatmap Card */}
            <div
                ref={heatmapCardRef}
                className="relative md:absolute left-0 md:left-[6vw] top-0 md:top-[16vh] w-full md:w-[46vw] h-auto md:h-[68vh] card-surface p-6 opacity-0 mx-auto md:mx-0"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-space font-bold text-xl text-text-primary">2024 Activity</h3>
                    <div className="flex items-center gap-4 text-xs font-mono text-text-secondary">
                        <span>Less</span>
                        <div className="flex gap-1">
                            <div className="w-3 h-3 rounded-sm bg-surface-highlight" />
                            <div className="w-3 h-3 rounded-sm bg-accent-yellow/20" />
                            <div className="w-3 h-3 rounded-sm bg-accent-yellow/40" />
                            <div className="w-3 h-3 rounded-sm bg-accent-yellow/60" />
                            <div className="w-3 h-3 rounded-sm bg-accent-yellow" />
                        </div>
                        <span>More</span>
                    </div>
                </div>

                {/* Month Labels */}
                <div className="flex justify-between text-xs font-mono text-text-secondary mb-2 px-1">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                        <span key={m}>{m}</span>
                    ))}
                </div>

                {/* Heatmap Grid */}
                <div className="overflow-x-auto md:overflow-hidden">
                    <div className="grid grid-cols-53 gap-[2px] min-w-[520px] md:min-w-0">
                        {heatmapData.map((intensity, index) => (
                            <div
                                key={index}
                                className={`relative w-full aspect-square rounded-sm ${getIntensityColor(intensity)} cursor-pointer transition-transform duration-150 hover:scale-[1.35] hover:z-10`}
                                title={`Day ${index + 1}: ${intensity > 0 ? 'Active' : 'No activity'}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 mt-6 pt-4 border-t border-border">
                    <div>
                        <p className="text-2xl font-space font-bold text-accent-yellow">342</p>
                        <p className="text-xs font-mono text-text-secondary uppercase tracking-wider">Total Days</p>
                    </div>
                    <div>
                        <p className="text-2xl font-space font-bold text-text-primary">87%</p>
                        <p className="text-xs font-mono text-text-secondary uppercase tracking-wider">Consistency</p>
                    </div>
                </div>
            </div>

            {/* Right Text Panel */}
            <div
                ref={textPanelRef}
                className="relative md:absolute left-0 md:left-[56vw] top-0 md:top-[22vh] w-full md:w-[38vw] opacity-0 mt-8 md:mt-0 px-6 md:px-0"
            >
                {/* Flame Icon */}
                <div ref={flameRef} className="mb-6 opacity-0">
                    <div className="w-16 h-16 rounded-full bg-accent-yellow/20 flex items-center justify-center animate-float">
                        <FlameIcon size={32} className="text-accent-yellow" />
                    </div>
                </div>

                <h2 className="text-[clamp(28px,3.5vw,48px)] font-space font-bold text-text-primary mb-6 leading-tight">
                    Don't break the chain
                </h2>
                <p className="text-text-secondary text-lg leading-relaxed mb-8">
                    Visualize your entire year. One glance shows where you showed up - and where you'll come back stronger.
                </p>

                {/* Stats */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-8">
                    <motion.div
                        className="bg-surface rounded-2xl px-6 py-4 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        onClick={() => navigate('/signup')}
                    >
                        <p className="text-xs font-mono text-text-secondary uppercase tracking-wider mb-1">Current Streak</p>
                        <p className="text-3xl font-space font-bold text-accent-yellow">12 days</p>
                    </motion.div>
                    <motion.div
                        className="bg-surface rounded-2xl px-6 py-4 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        onClick={() => navigate('/signup')}
                    >
                        <p className="text-xs font-mono text-text-secondary uppercase tracking-wider mb-1">Longest Streak</p>
                        <p className="text-3xl font-space font-bold text-text-primary">34 days</p>
                    </motion.div>
                </div>

                <motion.button
                    className="btn-primary flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartStreak}
                >
                    Start your streak
                    <ArrowRightIcon size={18} />
                </motion.button>
            </div>
        </section>
    );
};

export default StreakTrackerSection;
