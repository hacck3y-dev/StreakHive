import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { TrophyIcon, ArrowRightIcon, FlameIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const leaderboardData = [
  { rank: 1, name: 'Sarah M.', avatar: 'SM', streak: 24, progress: 95 },
  { rank: 2, name: 'Alex K.', avatar: 'AK', streak: 18, progress: 87 },
  { rank: 3, name: 'Mina R.', avatar: 'MR', streak: 15, progress: 82 },
];

const ChallengesSection: React.FC = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const textPanelRef = useRef<HTMLDivElement>(null);
  const challengeCardRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const textPanel = textPanelRef.current;
    const challengeCard = challengeCardRef.current;
    const rows = rowsRef.current.filter(Boolean);

    if (!section || !textPanel || !challengeCard) return;

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

      // Challenge card - enters from right
      scrollTl.fromTo(
        challengeCard,
        { x: '18vw', opacity: 0, scale: 0.98 },
        { x: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' },
        0.1
      );

      // Leaderboard rows staggered
      rows.forEach((row, index) => {
        scrollTl.fromTo(
          row,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
          0.2 + index * 0.08
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const handleBrowse = () => {
    navigate('/signup');
  };

  return (
    <section ref={sectionRef} className="section-pinned bg-bg-primary plus-grid z-50">
      {/* Left Text Panel */}
      <div
        ref={textPanelRef}
        className="relative md:absolute left-0 md:left-[6vw] top-0 md:top-[20vh] w-full md:w-[36vw] opacity-0 px-6 md:px-0 pt-4 md:pt-0"
      >
        <h2 className="text-[clamp(28px,3.5vw,48px)] font-space font-bold text-text-primary mb-6 leading-tight">
          Join a challenge. Keep the group alive.
        </h2>
        <p className="text-text-secondary text-lg leading-relaxed mb-8">
          7-day sprints, 30-day builds, or custom group goals. Progress is shared - so skipping is harder.
        </p>

        <motion.button
          className="btn-primary flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBrowse}
        >
          Browse challenges
          <ArrowRightIcon size={18} />
        </motion.button>
      </div>

      {/* Right Challenge Card */}
      <div
        ref={challengeCardRef}
        className="relative md:absolute left-0 md:left-[44vw] top-0 md:top-[14vh] w-full md:w-[50vw] h-auto md:h-[72vh] card-surface overflow-hidden opacity-0 mt-8 md:mt-0 mx-auto md:mx-0"
      >
        {/* Header Image */}
        <div className="h-[30%] w-full overflow-hidden relative">
          <img
            src="/challenge_run_group.jpg"
            alt="Group running challenge"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
        </div>

        {/* Challenge Info */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-space font-bold text-2xl text-text-primary mb-1">
                Morning Movement
              </h3>
              <p className="text-text-secondary text-sm">
                7 days - 24 members
              </p>
            </div>
            <motion.div
              className="w-12 h-12 rounded-full bg-accent-yellow/20 flex items-center justify-center cursor-pointer"
              whileHover={{ scale: 1.1, rotate: 10 }}
              onClick={() => navigate('/signup')}
            >
              <TrophyIcon size={24} className="text-accent-yellow" />
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs font-mono text-text-secondary mb-2">
              <span>Your Progress</span>
              <span>5/7 days</span>
            </div>
            <div className="h-2 bg-surface-highlight rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent-yellow rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: '71%' }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <p className="text-xs font-mono text-text-secondary uppercase tracking-wider mb-3">
              Top this week
            </p>
            <div className="space-y-3">
              {leaderboardData.map((user, index) => (
                <motion.div
                  key={user.rank}
                  ref={el => { rowsRef.current[index] = el; }}
                  className="flex items-center gap-4 bg-surface rounded-xl p-3 opacity-0 cursor-pointer"
                  whileHover={{ scale: 1.02, x: 5 }}
                  onClick={() => navigate('/signup')}
                >
                  <span className="w-6 text-center font-space font-bold text-text-secondary">
                    {user.rank}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-text-primary font-semibold text-sm">
                    {user.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-text-primary font-medium text-sm">{user.name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-accent-yellow">
                    <FlameIcon size={14} />
                    <span className="text-sm font-mono">{user.streak}</span>
                  </div>
                  <div className="w-16">
                    <div className="h-1.5 bg-surface-highlight rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-accent-yellow rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${user.progress}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChallengesSection;
