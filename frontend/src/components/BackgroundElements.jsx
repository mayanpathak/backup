
import { motion } from 'framer-motion';

export function BackgroundElements() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Primary floating orb - top left */}
      <motion.div
        className="absolute -top-10 -left-10 w-80 h-80 rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(147, 51, 234, 0.2) 50%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary floating orb - bottom right */}
      <motion.div
        className="absolute -bottom-10 -right-10 w-96 h-96 rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, 20, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Tertiary accent orb - center */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, rgba(59, 130, 246, 0.1) 60%, transparent 80%)',
          filter: 'blur(30px)',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Floating particles */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -30, 40, 0],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
      />

      <motion.div
        className="absolute bottom-1/4 left-1/4 w-24 h-24 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)',
          filter: 'blur(15px)',
        }}
        animate={{
          x: [0, -25, 35, 0],
          y: [0, 25, -20, 0],
          scale: [1, 1.3, 0.8, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 8,
        }}
      />

      {/* Subtle grid overlay */}
      <motion.div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
        animate={{
          backgroundPosition: ['0px 0px', '50px 50px'],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{
          background: 'linear-gradient(45deg, transparent 30%, rgba(59, 130, 246, 0.1) 50%, transparent 70%)',
        }}
        animate={{
          background: [
            'linear-gradient(45deg, transparent 30%, rgba(59, 130, 246, 0.1) 50%, transparent 70%)',
            'linear-gradient(135deg, transparent 30%, rgba(147, 51, 234, 0.1) 50%, transparent 70%)',
            'linear-gradient(225deg, transparent 30%, rgba(168, 85, 247, 0.1) 50%, transparent 70%)',
            'linear-gradient(315deg, transparent 30%, rgba(59, 130, 246, 0.1) 50%, transparent 70%)',
          ],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating sparkles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full opacity-20"
          style={{
            top: `${20 + i * 15}%`,
            left: `${10 + i * 12}%`,
            filter: 'blur(1px)',
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        />
      ))}
    </div>
  );
}