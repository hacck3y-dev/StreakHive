import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { CheckIcon, ArrowRightIcon, ZapIcon } from '../components/icons';
import { Modal } from '../components/ui/Modal';

gsap.registerPlugin(ScrollTrigger);

interface PricingSectionProps {
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const plans = [
  {
    name: 'Free',
    price: null,
    description: 'Core tracking, social feed, streaks, and groups.',
    features: [
      'Unlimited posts',
      'Social feed access',
      'Basic streak tracking',
      'Join public challenges',
      'Community support',
    ],
    cta: 'Get started free',
    highlighted: false,
  },
  {
    name: 'Premium',
    price: '$9',
    period: '/mo',
    description: 'Advanced analytics, unlimited habits, custom themes, AI insights.',
    features: [
      'Everything in Free',
      'Advanced analytics',
      'Unlimited habits',
      'Custom themes',
      'AI habit coaching',
      'Priority support',
    ],
    cta: 'Upgrade to Premium',
    highlighted: true,
  },
];

const PricingSection: React.FC<PricingSectionProps> = ({ showToast }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const title = titleRef.current;
    const cards = cardsRef.current.filter(Boolean);

    if (!section || !title) return;

    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(title,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            once: true,
          }
        }
      );

      // Cards animation
      cards.forEach((card, index) => {
        gsap.fromTo(card,
          { y: 50, opacity: 0, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: `top ${70 - index * 5}%`,
              once: true,
            }
          }
        );
      });

    }, section);

    return () => ctx.revert();
  }, []);

  const handlePlanClick = (planName: string) => {
    if (planName === 'Premium') {
      setIsUpgradeOpen(true);
    } else {
      showToast('Welcome to HabitSync Free! 🎉', 'success');
    }
  };

  const handleUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpgradeOpen(false);
    showToast('Welcome to Premium! Enjoy all features! 🚀', 'success');
  };

  return (
    <>
      <section 
        ref={sectionRef} 
        className="section-flowing bg-bg-primary py-[10vh] px-[6vw] z-[90]"
      >
        {/* Title */}
        <div ref={titleRef} className="text-center mb-12 opacity-0">
          <h2 className="text-[clamp(28px,3.5vw,48px)] font-space font-bold text-text-primary mb-4">
            Start free. Upgrade when you're ready.
          </h2>
        </div>

        {/* Pricing Cards */}
        <div className="flex flex-wrap justify-center gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              ref={el => { cardsRef.current[index] = el; }}
              className={`w-full md:w-[min(26vw,380px)] card-surface p-8 opacity-0 ${
                plan.highlighted ? 'border-accent-yellow border-2' : ''
              }`}
              whileHover={{ scale: 1.03, y: -5 }}
            >
              {/* Plan Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-space font-bold text-2xl text-text-primary">
                    {plan.name}
                  </h3>
                  {plan.highlighted && (
                    <motion.div 
                      className="w-6 h-6 rounded-full bg-accent-yellow/20 flex items-center justify-center"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ZapIcon size={14} className="text-accent-yellow" />
                    </motion.div>
                  )}
                </div>
                {plan.price ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-space font-bold text-accent-yellow">
                      {plan.price}
                    </span>
                    <span className="text-text-secondary">{plan.period}</span>
                  </div>
                ) : (
                  <span className="text-4xl font-space font-bold text-text-primary">Free</span>
                )}
              </div>

              {/* Description */}
              <p className="text-text-secondary mb-6">{plan.description}</p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent-yellow/20 flex items-center justify-center flex-shrink-0">
                      <CheckIcon size={12} className="text-accent-yellow" />
                    </div>
                    <span className="text-text-primary text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <motion.button 
                className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-full font-semibold transition-all duration-200 ${
                  plan.highlighted 
                    ? 'btn-primary' 
                    : 'btn-secondary'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlanClick(plan.name)}
              >
                {plan.cta}
                <ArrowRightIcon size={16} />
              </motion.button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Upgrade Modal */}
      <Modal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} title="Upgrade to Premium">
        <form onSubmit={handleUpgrade} className="space-y-4">
          <div className="bg-accent-yellow/10 rounded-xl p-4 mb-4">
            <p className="text-accent-yellow font-semibold">Premium Plan - $9/month</p>
            <p className="text-text-secondary text-sm">Unlock all features and supercharge your habits!</p>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-2">Card Number</label>
            <input 
              type="text" 
              className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
              placeholder="1234 5678 9012 3456"
              required
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-text-secondary mb-2">Expiry</label>
              <input 
                type="text" 
                className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                placeholder="MM/YY"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-text-secondary mb-2">CVC</label>
              <input 
                type="text" 
                className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                placeholder="123"
                required
              />
            </div>
          </div>
          <button type="submit" className="w-full btn-primary py-3 mt-2">
            Upgrade Now
          </button>
          <p className="text-center text-xs text-text-secondary">
            Secure payment processing. Cancel anytime.
          </p>
        </form>
      </Modal>
    </>
  );
};

export default PricingSection;
