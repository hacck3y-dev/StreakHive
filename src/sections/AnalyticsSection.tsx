import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { ChartIcon, ArrowRightIcon, CheckIcon, FlameIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const barData = [
  { day: 'Mon', value: 65 },
  { day: 'Tue', value: 85 },
  { day: 'Wed', value: 45 },
  { day: 'Thu', value: 70 },
  { day: 'Fri', value: 55 },
  { day: 'Sat', value: 90 },
  { day: 'Sun', value: 75 },
];

const CalendarIconCustom: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2.5" />
    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const AnalyticsSection: React.FC = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const analyticsCardRef = useRef<HTMLDivElement>(null);
  const textPanelRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const analyticsCard = analyticsCardRef.current;
    const textPanel = textPanelRef.current;
    const bars = barsRef.current.filter(Boolean);

    if (!section || !analyticsCard || !textPanel) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          once: true,
        }
      });

      // Analytics card - enters from left
      scrollTl.fromTo(
        analyticsCard,
        { x: '-18vw', opacity: 0, scale: 0.98 },
        { x: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }
      );

      // Bar chart bars - scale up from bottom
      bars.forEach((bar, index) => {
        scrollTl.fromTo(
          bar,
          { scaleY: 0, opacity: 0 },
          { scaleY: 1, opacity: 1, duration: 0.45, ease: 'power2.out' },
          0.2 + index * 0.06
        );
      });

      // Text panel - enters from right
      scrollTl.fromTo(
        textPanel,
        { x: '18vw', opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        0.1
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const handleViewAnalytics = () => {
    navigate('/signup');
  };

  return (
    <section ref={sectionRef} className="section-pinned bg-bg-primary plus-grid z-[60]">
      {/* Left Analytics Card */}
      <div
        ref={analyticsCardRef}
        className="relative md:absolute left-0 md:left-[6vw] top-0 md:top-[14vh] w-full md:w-[52vw] h-auto md:h-[72vh] card-surface p-6 opacity-0 mx-auto md:mx-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-full bg-accent-yellow/20 flex items-center justify-center cursor-pointer"
              whileHover={{ scale: 1.1, rotate: 5 }}
              onClick={() => navigate('/signup')}
            >
              <ChartIcon size={20} className="text-accent-yellow" />
            </motion.div>
            <div>
              <h3 className="font-space font-bold text-xl text-text-primary">Weekly Report</h3>
              <p className="text-text-secondary text-xs">Jan 15 - Jan 21</p>
            </div>
          </div>
        </div>

        {/* Stats Chips */}
        <div className="flex gap-4 mb-8">
          <motion.div
            className="bg-surface rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/signup')}
          >
            <div className="w-8 h-8 rounded-full bg-accent-yellow/20 flex items-center justify-center">
              <CheckIcon size={16} className="text-accent-yellow" />
            </div>
            <div>
              <p className="text-lg font-space font-bold text-text-primary">18</p>
              <p className="text-xs font-mono text-text-secondary uppercase">Completed</p>
            </div>
          </motion.div>
          <motion.div
            className="bg-surface rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/signup')}
          >
            <div className="w-8 h-8 rounded-full bg-accent-yellow/20 flex items-center justify-center">
              <FlameIcon size={16} className="text-accent-yellow" />
            </div>
            <div>
              <p className="text-lg font-space font-bold text-text-primary">+2</p>
              <p className="text-xs font-mono text-text-secondary uppercase">Streak</p>
            </div>
          </motion.div>
          <motion.div
            className="bg-surface rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/signup')}
          >
            <div className="w-8 h-8 rounded-full bg-accent-yellow/20 flex items-center justify-center">
              <CalendarIconCustom size={16} className="text-accent-yellow" />
            </div>
            <div>
              <p className="text-lg font-space font-bold text-text-primary">Tue</p>
              <p className="text-xs font-mono text-text-secondary uppercase">Best Day</p>
            </div>
          </motion.div>
        </div>

        {/* Bar Chart */}
        <div className="bg-surface rounded-2xl p-6 mb-6">
          <p className="text-sm font-mono text-text-secondary uppercase tracking-wider mb-4">
            Completion Rate
          </p>
          <div className="flex items-end justify-between h-40 gap-4">
            {barData.map((item, index) => (
              <motion.div
                key={item.day}
                className="flex-1 flex flex-col items-center gap-2 cursor-pointer"
                whileHover={{ scale: 1.1 }}
                onClick={() => navigate('/signup')}
              >
                <div
                  ref={el => { barsRef.current[index] = el; }}
                  className="w-full bg-accent-yellow rounded-t-lg opacity-0 origin-bottom"
                  style={{ height: `${item.value}%` }}
                />
                <span className="text-xs font-mono text-text-secondary">{item.day}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Insight Tip */}
        <motion.div
        className="bg-bg-secondary/30 rounded-xl p-4 border border-bg-secondary/50 cursor-pointer"
        whileHover={{ scale: 1.02 }}
        onClick={() => navigate('/signup')}
      >
          <p className="text-sm text-text-secondary">
            <span className="text-accent-yellow font-medium">Insight:</span> You finish more tasks before 10am. Consider scheduling important habits in the morning.
          </p>
        </motion.div>
      </div>

      {/* Right Text Panel */}
      <div
        ref={textPanelRef}
        className="relative md:absolute left-0 md:left-[62vw] top-0 md:top-[22vh] w-full md:w-[32vw] opacity-0 mt-8 md:mt-0 px-6 md:px-0"
      >
        <h2 className="text-[clamp(28px,3.5vw,48px)] font-space font-bold text-text-primary mb-6 leading-tight">
          See what's working
        </h2>
        <p className="text-text-secondary text-lg leading-relaxed mb-8">
          Weekly reports, completion trends, and habit insights—so you can adjust before you drop off.
        </p>

        <motion.button
          className="btn-primary flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleViewAnalytics}
        >
          View your analytics
          <ArrowRightIcon size={18} />
        </motion.button>
      </div>
    </section>
  );
};

export default AnalyticsSection;
