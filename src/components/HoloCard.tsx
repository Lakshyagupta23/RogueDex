import React, { useRef, useState, MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';
import { usePokemon } from '@/context/PokemonContext';

interface HoloCardProps {
  children: React.ReactNode;
  className?: string;
  typeColor?: string; // Dominant color for the holo glow (e.g., Fire = orange, Water = blue)
  pokemonType?: string; // Signature Pokemon type for dynamic ambient aura shifting
  layoutId?: string; // For framer-motion shared layout animations
}

export default function HoloCard({ children, className = '', typeColor = '#ffffff', pokemonType, layoutId }: HoloCardProps) {
  const { setAmbientType } = usePokemon();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Framer motion values (normalized -0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring physics for smooth return and movement
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  // Map normalized coordinates to rotation
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  // Map normalized coordinates to glare position (0% to 100%)
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], [100, 0]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], [100, 0]);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 60%)`;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Normalize coordinates (-0.5 to 0.5)
    const normalizedX = (e.clientX - rect.left) / rect.width - 0.5;
    const normalizedY = (e.clientY - rect.top) / rect.height - 0.5;
    
    x.set(normalizedX);
    y.set(normalizedY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (pokemonType) {
      setAmbientType(pokemonType);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Reset to center smoothly
    x.set(0);
    y.set(0);
    if (pokemonType) {
      setAmbientType(null);
    }
  };

  return (
    <motion.div
      layoutId={layoutId}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-xl overflow-hidden ${className}`}
      style={{ 
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        scale: isHovered ? 1.05 : 1,
        willChange: 'transform'
      }}
      initial={{ scale: 1 }}
      animate={{ scale: isHovered ? 1.05 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Background/Content of the card */}
      <div className="relative z-10 h-full w-full" style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>

      {/* Type-spectrum background illumination */}
      <div
        className="absolute inset-0 z-0 pointer-events-none rounded-xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at top, ${typeColor}22 0%, transparent 75%)`,
          opacity: isHovered ? 0.9 : 0.45,
        }}
      />

      {/* Iridescent Prismatic Holographic Foil Overlay */}
      <motion.div
        className="absolute inset-0 z-20 pointer-events-none rounded-xl"
        style={{
          background: 'linear-gradient(125deg, transparent 0%, rgba(255, 100, 180, 0.16) 20%, rgba(255, 230, 90, 0.18) 35%, rgba(100, 255, 200, 0.16) 50%, rgba(90, 200, 255, 0.18) 65%, rgba(200, 120, 255, 0.16) 80%, transparent 100%)',
          backgroundSize: '250% 250%',
          mixBlendMode: 'color-dodge',
        }}
        animate={{
          backgroundPosition: isHovered ? ['0% 0%', '100% 100%'] : '0% 0%',
          opacity: isHovered ? 0.85 : 0,
        }}
        transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0, ease: "linear" }}
      />

      {/* Glare/Sheen */}
      <motion.div
        className="absolute inset-0 z-30 pointer-events-none mix-blend-overlay rounded-xl"
        style={{
          background: glareBackground,
          opacity: isHovered ? 1 : 0,
        }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Type-based Ambient Edge Glow & Specular Luminous Border */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none rounded-xl transition-all duration-300"
        style={{
          boxShadow: isHovered 
            ? `0 0 35px -5px ${typeColor}, inset 0 0 20px -8px ${typeColor}` 
            : `0 0 20px -8px ${typeColor}66`,
          borderColor: isHovered ? `${typeColor}99` : `${typeColor}40`,
          borderTopColor: isHovered ? 'rgba(255, 255, 255, 0.55)' : `${typeColor}77`,
          borderWidth: '1px',
          borderStyle: 'solid',
        }}
      />
    </motion.div>
  );
}
