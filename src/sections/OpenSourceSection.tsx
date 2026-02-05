import { motion } from 'framer-motion';

interface OpenSourceSectionProps {
  repoUrl: string;
}

const OpenSourceSection: React.FC<OpenSourceSectionProps> = ({ repoUrl }) => {
  return (
    <section className="section-flowing bg-bg-primary py-[10vh] px-[6vw] z-[85]">
      <div className="max-w-[1100px] mx-auto card-surface p-10 flex flex-col md:flex-row items-start md:items-center gap-8">
        <div className="flex-1">
          <p className="micro-label mb-3">Open source</p>
          <h2 className="text-[clamp(26px,3vw,40px)] font-space font-bold text-text-primary mb-3">
            Built in public
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Want to remix the UI or contribute? The project is open source.
            Check the repo for setup, issues, and contribution guidelines.
          </p>
        </div>
        <motion.a
          href={repoUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary px-6 py-3"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          View on GitHub
        </motion.a>
      </div>
    </section>
  );
};

export default OpenSourceSection;
