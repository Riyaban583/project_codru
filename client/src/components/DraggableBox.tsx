import React, { useRef, useEffect, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { useXarrow } from 'react-xarrows';

interface DraggableBoxProps {
  id: string;
  style?: React.CSSProperties;
  onDrag: (x: number, y: number) => void;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

const DraggableBox = ({ id, style = {}, onDrag, onClick, className = "" }: DraggableBoxProps) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const updateXarrow = useXarrow();
  
  // Keep the planets within the vertical bounds of the screen
  const [bounds, setBounds] = useState({ top: 0, bottom: window.innerHeight - 150 });

  useEffect(() => {
    const handleResize = () => setBounds({ top: 0, bottom: window.innerHeight - 150 });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🪐 Generate a beautiful 3D Planet design ONCE when the component mounts
  const [planetDesign] = useState(() => {
    const minSize = 90;
    const maxSize = 140;
    const size = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;

    // CuTe Learning Brand Colors mixed with deep space colors
    const hues = [28, 205, 280, 320, 15]; // Oranges, Blues, Purples, Pinks
    const hue1 = hues[Math.floor(Math.random() * hues.length)];
    const hue2 = (hue1 + 40) % 360;

    return {
      width: `${size}px`,
      height: `${size}px`,
      // 3D sphere effect using radial gradients
      background: `radial-gradient(circle at 30% 30%, hsl(${hue1}, 90%, 65%), hsl(${hue2}, 80%, 30%))`,
      // Inner shadow for 3D depth, outer shadow for the "glow"
      boxShadow: `0 0 20px hsl(${hue1}, 80%, 50%, 0.4), inset -10px -10px 20px rgba(0,0,0,0.4), inset 5px 5px 10px rgba(255,255,255,0.3)`,
    };
  });

  const handleDrag = (e: DraggableEvent, ui: DraggableData) => {
    // We update the arrows visually in real-time as the user drags
    updateXarrow();
    // Pass the new coordinates up to the parent
    onDrag(ui.x, ui.y);
  };

  // Clean up the text: if id is "task1", just display "Week 1"
  const displayName = id.toLowerCase().includes('task') 
    ? `Wk ${id.replace(/\D/g, '')}` 
    : id;

  // Safely extract left/top from incoming style so we don't cause the double-move bug
  const initialX = typeof style.left === 'number' ? style.left : 0;
  const initialY = typeof style.top === 'number' ? style.top : 0;

  return (
    <Draggable
      bounds={bounds}
      defaultPosition={{ x: initialX, y: initialY }}
      onDrag={handleDrag}
      onStop={updateXarrow}
      nodeRef={boxRef}
    >
      <div
        ref={boxRef}
        id={id}
        onClick={onClick}
        className={`absolute flex items-center justify-center rounded-full text-white font-display font-bold cursor-pointer z-20 transition-transform duration-200 hover:scale-110 hover:brightness-110 ${className}`}
        style={{
          width: planetDesign.width,
          height: planetDesign.height,
          background: planetDesign.background,
          boxShadow: planetDesign.boxShadow,
        }}
      >
        <span className="drop-shadow-md tracking-wider text-sm md:text-base pointer-events-none">
          {displayName}
        </span>
      </div>
    </Draggable>
  );
};

export default DraggableBox;