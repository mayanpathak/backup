


import { motion } from "framer-motion";

// Data for the "How It Works" steps
const HOW_IT_WORKS_STEPS = [
  {
    number: 1,
    title: "Give a Prompt",
    description: "Describe your website idea in a few words and let our AI do the rest.",
  },
  {
    number: 2,
    title: "Edit and Reprompt", // Corrected typo
    description: "Edit the generated website to your liking. You can also reprompt to get a different design.",
  },
  {
    number: 3,
    title: "Download Zip",
    description: "Download the generated website as a zip file and host it anywhere you want.",
  },
];

// Reusable Framer Motion configuration for blur-in animation
const blurInAnimation = {
  initial: { filter: 'blur(10px)', opacity: 0 }, // Added opacity for smoother fade-in
  animate: { filter: 'blur(0px)', opacity: 1 },
  transition: { duration: 0.5, ease: "easeOut" }, // Slightly longer duration and eased transition
};

// Renamed HowItWorksStep to follow PascalCase and improved clarity for props
function HowItWorksStep({
  number,
  title,
  description,
}) {
  return (
    <motion.div
      className="flex flex-col items-center text-center p-4 md:p-6 bg-gray-900 rounded-xl shadow-lg border border-gray-800" // Added background, padding, shadow, border
      {...blurInAnimation} // Apply the modularized animation config
      // Added a slight delay based on number for staggered animation effect
      transition={{ ...blurInAnimation.transition, delay: (number - 1) * 0.1 }}
    >
      <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mb-5 shadow-inner"> {/* Brighter color, larger, shadow */}
        {number}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3"> {/* Dark mode friendly text */}
        {title}
      </h3>
      <p className="text-gray-300 text-base leading-relaxed px-2 md:px-0"> {/* Adjusted text color and line-height */}
        {description}
      </p>
    </motion.div>
  );
}

// Renamed HowitWork to HowItWorks (PascalCase)
export default function HowItWorks() {
  return (
    <section id="howitworks" className="py-20 md:py-32 bg-gray-950 text-center relative overflow-hidden">
      {/* Background gradient or subtle pattern for premium feel */}
      <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#1a202c 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" // Added max-width and horizontal padding
        {...blurInAnimation} // Apply the modularized animation config
      >
        <h2 className="text-4xl font-extrabold text-white mb-16 leading-tight"> {/* Larger, bolder title */}
          How Wilder Works! {/* Changed "Bolt" to "Wilder" */}
        </h2>
        <div className="mt-12">
          <div className="grid md:grid-cols-3 gap-8"> {/* Increased gap */}
            {HOW_IT_WORKS_STEPS.map((step) => (
              <HowItWorksStep
                key={step.number} // Using number as key (unique for this list)
                {...step} // Pass all properties from the step object
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
