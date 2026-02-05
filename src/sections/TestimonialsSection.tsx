import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    quote: 'I used to ghost my own goals. Now I post them - and people actually check in.',
    name: 'Mina K.',
    role: 'Designer',
    avatar: 'MK',
  },
  {
    quote: "The streak heatmap hits different. I don't want to see a hole there.",
    name: 'Diego R.',
    role: 'Engineer',
    avatar: 'DR',
  },
];

const TestimonialsSection: React.FC = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

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
        const xDirection = index === 0 ? '-8vw' : '8vw';
        gsap.fromTo(card,
          { x: xDirection, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
              once: true,
            }
          }
        );
      });

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-flowing bg-bg-primary py-[10vh] px-[6vw] z-[80]"
    >
      {/* Title */}
      <h2
        ref={titleRef}
        className="text-[clamp(28px,3.5vw,48px)] font-space font-bold text-text-primary text-center mb-12 opacity-0"
      >
        Loved by people building better days
      </h2>

      {/* Testimonial Cards */}
      <div className="flex flex-wrap justify-center gap-6">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.name}
            ref={el => { cardsRef.current[index] = el; }}
            className="w-full md:w-[42vw] card-surface p-8 opacity-0 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/signup')}
          >
            {/* Quote */}
            <p className="text-2xl font-space font-medium text-text-primary leading-snug mb-8">
              "{testimonial.quote}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-4">
              <motion.div
                className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center text-text-primary font-semibold"
                whileHover={{ scale: 1.1 }}
              >
                {testimonial.avatar}
              </motion.div>
              <div>
                <p className="text-text-primary font-medium">{testimonial.name}</p>
                <p className="text-text-secondary text-sm font-mono uppercase tracking-wider">
                  {testimonial.role}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
