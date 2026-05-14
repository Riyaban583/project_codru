import React, { useMemo } from "react";
import "../styles/PlanetryAnimatedBackground.css";

interface BackgroundProps {
  taskCount: number;
}

const PlanetryAnimatedBackground = ({ taskCount = 0 }: BackgroundProps) => {
  
  const nebulaClouds = useMemo(() => {
    const count = 2 + Math.floor(taskCount / 3);
    const colors = [
      "rgba(237, 127, 35, 0.15)", // Brand Orange (faded)
      "rgba(23, 101, 164, 0.2)",  // Brand Blue (faded)
      "rgba(139, 92, 246, 0.15)", // Deep Purple
      "rgba(236, 72, 153, 0.1)",  // Soft Pink
    ];

    return Array.from({ length: count }).map(() => ({
      top: `${Math.random() * 80}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 400 + 300}px`,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: `${Math.random() * 10}s`,
    }));
  }, [taskCount]);

  const staticStars = useMemo(() => {
    const count = 150 + (taskCount * 40);
    return Array.from({ length: count }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1}px`,
      opacity: Math.random(),
      animationDelay: `${Math.random() * 5}s`,
    }));
  }, [taskCount]);

  const shootingStars = useMemo(() => {
    const count = 5 + Math.floor(taskCount / 3);
    return Array.from({ length: count }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 20}s`,
      animationDuration: `${Math.random() * 2 + 1.5}s`,
      angle: `${Math.random() * 360}deg`,
      distance: `${Math.random() * 600 + 400}px`,
    }));
  }, [taskCount]);

  return (
    <div className="planetry-animated-background">
      {nebulaClouds.map((nebula, index) => (
        <div
          key={`nebula-${index}`}
          className="nebula-cloud"
          style={{
            top: nebula.top,
            left: nebula.left,
            width: nebula.size,
            height: nebula.size,
            backgroundColor: nebula.color,
            animationDelay: nebula.delay,
          }}
        />
      ))}

      {staticStars.map((star, index) => (
        <div
          key={`star-${index}`}
          className="static-star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            animationDelay: star.animationDelay,
          }}
        />
      ))}

      {shootingStars.map((star, index) => (
        <div
          key={`shooting-${index}`}
          className="shooting-star"
          // 🚨 THE FIX: Strict typing for modern React Custom CSS properties
          style={
            {
              top: star.top,
              left: star.left,
              animationDelay: star.animationDelay,
              animationDuration: star.animationDuration,
              "--angle": star.angle,
              "--distance": star.distance,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};

export default PlanetryAnimatedBackground;