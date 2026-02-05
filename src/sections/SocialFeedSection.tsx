import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { ArrowRightIcon, HeartIcon, ChatIcon, FlameIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const mockPosts = [
    {
        id: 1,
        user: 'Sarah M.',
        avatar: 'SM',
        time: '2h ago',
        content: 'Morning routine complete! ✅\n• Meditation 10min\n• Workout 30min\n• Healthy breakfast',
        likes: 12,
        comments: 3,
        streak: 5,
        liked: false,
    },
    {
        id: 2,
        user: 'Alex K.',
        avatar: 'AK',
        time: '4h ago',
        content: 'Deep work session done. 4 hours of focused coding. Productivity is contagious! 🔥',
        likes: 8,
        comments: 2,
        streak: 12,
        liked: true,
    },
    {
        id: 3,
        user: 'Mina R.',
        avatar: 'MR',
        time: '6h ago',
        content: 'Day 15 of reading challenge 📚\nFinished "Atomic Habits" - highly recommend!',
        likes: 24,
        comments: 7,
        streak: 15,
        liked: false,
    },
];

const SocialFeedSection: React.FC = () => {
    const navigate = useNavigate();
    const sectionRef = useRef<HTMLElement>(null);
    const textPanelRef = useRef<HTMLDivElement>(null);
    const feedCardRef = useRef<HTMLDivElement>(null);
    const postsRef = useRef<(HTMLDivElement | null)[]>([]);
    const posts = mockPosts;

    useLayoutEffect(() => {
        const section = sectionRef.current;
        const textPanel = textPanelRef.current;
        const feedCard = feedCardRef.current;
        const postElements = postsRef.current.filter(Boolean);

        if (!section || !textPanel || !feedCard) return;

        const ctx = gsap.context(() => {
            const scrollTl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top 75%',
                    once: true,
                }
            });

            // Text panel - enters from left
            scrollTl.fromTo(
                textPanel,
                { x: '-18vw', opacity: 0 },
                { x: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
            );

            // Feed card - enters from right
            scrollTl.fromTo(
                feedCard,
                { x: '18vw', opacity: 0, scale: 0.98 },
                { x: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' },
                0.1
            );

            // Posts staggered reveal
            postElements.forEach((post, index) => {
                scrollTl.fromTo(
                    post,
                    { y: 24, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
                    0.2 + index * 0.08
                );
            });
        }, section);

        return () => ctx.revert();
    }, []);

    const handleExplore = () => {
        navigate('/signup');
    };

    return (
        <>
            <section ref={sectionRef} className="section-pinned bg-bg-primary plus-grid z-30">
                {/* Left Text Panel */}
                <div
                    ref={textPanelRef}
                    className="relative md:absolute left-0 md:left-[6vw] top-0 md:top-[18vh] w-full md:w-[34vw] opacity-0 px-6 md:px-0 pt-4 md:pt-0"
                >
                    <h2 className="text-[clamp(28px,3.5vw,48px)] font-space font-bold text-text-primary mb-6 leading-tight">
                        Your feed, focused on progress
                    </h2>
                    <p className="text-text-secondary text-lg leading-relaxed mb-8">
                        See what friends are working on. React with accountability emojis. Comment with support (or friendly pressure).
                    </p>

                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-accent-yellow/20 flex items-center justify-center">
                                <HeartIcon size={14} className="text-accent-yellow" />
                            </div>
                            <span className="text-text-primary">Upvote consistency</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-accent-yellow/20 flex items-center justify-center">
                                <ChatIcon size={14} className="text-accent-yellow" />
                            </div>
                            <span className="text-text-primary">Threaded check-ins</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-accent-yellow/20 flex items-center justify-center">
                                <FlameIcon size={14} className="text-accent-yellow" />
                            </div>
                            <span className="text-text-primary">No noise. Just next steps.</span>
                        </li>
                    </ul>

                    <motion.button
                        className="btn-primary flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleExplore}
                    >
                        Explore the feed
                        <ArrowRightIcon size={18} />
                    </motion.button>
                </div>

                {/* Right Feed Card */}
                <div
                    ref={feedCardRef}
                    className="relative md:absolute left-0 md:left-[44vw] top-0 md:top-[14vh] w-full md:w-[50vw] h-auto md:h-[72vh] card-surface p-6 overflow-hidden opacity-0 mt-8 md:mt-0 mx-auto md:mx-0"
                >
                    <h3 className="font-space font-bold text-xl text-text-primary mb-4">Recent Updates</h3>

                    <div className="space-y-4 overflow-hidden">
                        {posts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                ref={el => { postsRef.current[index] = el; }}
                                className="bg-surface rounded-2xl p-4 opacity-0"
                                whileHover={{ scale: 1.01 }}
                            >
                                {/* Post Header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-text-primary font-semibold text-sm">
                                        {post.avatar}
                                    </div>
                                    <div>
                                        <p className="text-text-primary font-medium text-sm">{post.user}</p>
                                        <p className="text-text-secondary text-xs">{post.time}</p>
                                    </div>
                                    <div className="ml-auto flex items-center gap-1 text-accent-yellow">
                                        <FlameIcon size={14} />
                                        <span className="text-xs font-mono">{post.streak}</span>
                                    </div>
                                </div>

                                {/* Post Content */}
                                <p className="text-text-secondary text-sm whitespace-pre-line mb-3">
                                    {post.content}
                                </p>

                                {/* Post Actions */}
                                <div className="flex items-center gap-4">
                                    <motion.button
                                        className={`flex items-center gap-1 transition-colors ${post.liked ? 'text-accent-yellow' : 'text-text-secondary hover:text-accent-yellow'}`}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => navigate('/signup')}
                                    >
                                        <HeartIcon size={16} className={post.liked ? 'fill-current' : ''} />
                                        <span className="text-xs">{post.likes}</span>
                                    </motion.button>
                                    <motion.button
                                        className="flex items-center gap-1 text-text-secondary hover:text-accent-yellow transition-colors"
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => navigate('/signup')}
                                    >
                                        <ChatIcon size={16} />
                                        <span className="text-xs">{post.comments}</span>
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

        </>
    );
};

export default SocialFeedSection;
