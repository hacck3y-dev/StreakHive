import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { ArrowRightIcon, ChatIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const CTAFooterSection: React.FC = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const ctaCardRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const ctaCard = ctaCardRef.current;
    const buttons = buttonsRef.current;

    if (!section || !ctaCard) return;

    const ctx = gsap.context(() => {
      // CTA Card animation
      gsap.fromTo(ctaCard,
        { y: 60, opacity: 0 },
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

      // Buttons stagger
      if (buttons) {
        const buttonElements = buttons.querySelectorAll('button');
        gsap.fromTo(buttonElements,
          { y: 16, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
              once: true,
            }
          }
        );
      }

    }, section);

    return () => ctx.revert();
  }, []);

  const handleSignupRedirect = () => {
    navigate('/signup');
  };

  return (
    <section
      ref={sectionRef}
      className="section-flowing bg-bg-primary pt-[8vh] pb-[4vh] px-[4vw] z-[100]"
    >
      {/* CTA Card */}
      <div
        ref={ctaCardRef}
        className="max-w-[1100px] mx-auto card-surface p-12 text-center mb-12 opacity-0"
      >
        <h2 className="text-[clamp(32px,4vw,52px)] font-space font-bold text-text-primary mb-4">
          Ready to build in public?
        </h2>
        <p className="text-text-secondary text-lg max-w-[600px] mx-auto mb-8">
          Create your board, invite a few friends, and start showing up - one day at a time.
        </p>

        <div ref={buttonsRef} className="flex flex-wrap justify-center gap-4">
          <motion.button
            className="btn-primary flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSignupRedirect}
          >
            Create your board
            <ArrowRightIcon size={18} />
          </motion.button>
          <motion.button
            className="btn-secondary flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSignupRedirect}
          >
            <ChatIcon size={18} />
            Ask a question
          </motion.button>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-[1100px] mx-auto pt-8 border-t border-border">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <motion.div
            className="font-space text-lg font-bold text-text-primary cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            HabitSync
          </motion.div>

          <nav className="flex gap-6">
            <motion.button
              type="button"
              className="text-text-secondary hover:text-text-primary transition-colors text-sm"
              whileHover={{ y: -2 }}
              onClick={handleSignupRedirect}
            >
              Privacy
            </motion.button>
            <motion.button
              type="button"
              className="text-text-secondary hover:text-text-primary transition-colors text-sm"
              whileHover={{ y: -2 }}
              onClick={handleSignupRedirect}
            >
              Terms
            </motion.button>
            <motion.button
              type="button"
              className="text-text-secondary hover:text-text-primary transition-colors text-sm"
              whileHover={{ y: -2 }}
              onClick={handleSignupRedirect}
            >
              Support
            </motion.button>
          </nav>

          <p className="text-text-secondary text-sm">
            (c) {new Date().getFullYear()} HabitSync
          </p>
        </div>
      </footer>
    </section>
  );
};

export default CTAFooterSection;
