import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { GlobeIcon, UsersIcon, LockIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const privacyOptions = [
  {
    title: 'Public',
    description: 'Share with the community. Inspire (and invite friendly pressure).',
    icon: GlobeIcon,
  },
  {
    title: 'Friends only',
    description: 'Share with people you trust. Stay visible, stay safe.',
    icon: UsersIcon,
  },
  {
    title: 'Private',
    description: 'Just you. Track without sharing. Switch anytime.',
    icon: LockIcon,
  },
];

const PrivacySection: React.FC = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const title = titleRef.current;
    const cards = cardsRef.current.filter(Boolean);

    if (!section || !title) return;

    const ctx = gsap.context(() => {
      // Title animation - flowing
      gsap.fromTo(title,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            once: true,
          }
        }
      );

      // Cards animation - stagger
      cards.forEach((card, index) => {
        gsap.fromTo(card,
          { y: 60, opacity: 0, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: `top ${70 - index * 10}%`,
              once: true,
            }
          }
        );
      });

    }, section);

    return () => ctx.revert();
  }, []);

  const handlePrivacyClick = () => {
    navigate('/signup');
  };

  return (
    <section 
      ref={sectionRef} 
      className="section-flowing bg-bg-primary py-[10vh] px-[6vw] z-[70]"
    >
      {/* Title */}
      <div ref={titleRef} className="text-center max-w-[760px] mx-auto mb-12 opacity-0">
        <h2 className="text-[clamp(28px,3.5vw,48px)] font-space font-bold text-text-primary mb-4">
          You're in control
        </h2>
        <p className="text-text-primary/70 text-lg">
          Public momentum or private discipline—choose per habit, per post, per group.
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-wrap justify-center gap-6">
        {privacyOptions.map((option, index) => {
          const Icon = option.icon;
          return (
            <motion.div
              key={option.title}
              ref={el => { cardsRef.current[index] = el; }}
              className="w-full md:w-[min(28vw,360px)] min-h-[220px] bg-surface rounded-card p-6 opacity-0 cursor-pointer"
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrivacyClick}
            >
              <div className="w-12 h-12 rounded-full bg-accent-yellow/20 flex items-center justify-center mb-4">
                <Icon size={24} className="text-accent-yellow" />
              </div>
              <h3 className="font-space font-bold text-xl text-text-primary mb-3">
                {option.title}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {option.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default PrivacySection;
