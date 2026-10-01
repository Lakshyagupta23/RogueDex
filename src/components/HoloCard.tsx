import React, { useRef, useState, MouseEvent } from 'react';

interface HoloCardProps {
  children: React.ReactNode;
  className?: string;
  typeColor?: string; // Dominant color for the holo glow (e.g., Fire = orange, Water = blue)
}

export default function HoloCard({ children, className = '', typeColor = '#fff' }: HoloCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 }); // percentages

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate mouse position as a percentage of the card's width/height
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 50, y: 50 }); // Reset to center
  };

  // Convert mouse pos to rotation degrees (range: -15deg to +15deg)
  const rotateX = isHovered ? (mousePos.y - 50) * -0.3 : 0;
  const rotateY = isHovered ? (mousePos.x - 50) * 0.3 : 0;
  
  // Transform style
  const transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${isHovered ? 1.05 : 1}, ${isHovered ? 1.05 : 1}, 1)`;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-xl overflow-hidden transition-transform duration-200 ease-out ${className}`}
      style={{ 
        transform,
        transformStyle: 'preserve-3d',
        willChange: 'transform'
      }}
    >
      {/* Background/Content of the card */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>

      {/* Glare/Sheen */}
      <div
        className="absolute inset-0 z-30 pointer-events-none transition-opacity duration-300 rounded-xl mix-blend-overlay"
        style={{
          opacity: isHovered ? 0.6 : 0,
          background: `
            radial-gradient(
              circle at ${mousePos.x}% ${mousePos.y}%, 
              rgba(255,255,255,0.8) 0%, 
              rgba(255,255,255,0) 40%
            )
          `
        }}
      />
      
      {/* Type-based Ambient Edge Glow */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300 rounded-xl"
        style={{
          opacity: isHovered ? 0.6 : 0,
          boxShadow: `0 0 40px -10px ${typeColor}`,
        }}
      />
    </div>
  );
}
