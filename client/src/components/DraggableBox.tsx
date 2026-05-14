import React, { useRef, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { useXarrow } from 'react-xarrows';

interface DraggableBoxProps {
  id: string;
  style?: React.CSSProperties;
  onDrag: (x: number, y: number) => void;
  onClick: (e: React.MouseEvent<HTMLDivElement> | any) => void;
  className?: string;
  onTouchStart?: (e: React.TouchEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>) => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>) => void;
}

const DraggableBox = ({ 
  id, 
  style = {}, 
  onDrag, 
  onClick, 
  className = "",
  onTouchStart,
  onTouchEnd 
}: DraggableBoxProps) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const updateXarrow = useXarrow();
  
  const [planetDesign] = useState(() => {
    const minSize = 90;
    const maxSize = 140;
    const size = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
    const hues = [28, 205, 280, 320, 15]; 
    const hue1 = hues[Math.floor(Math.random() * hues.length)];
    const hue2 = (hue1 + 40) % 360;
    return {
      width: `${size}px`,
      height: `${size}px`,
      background: `radial-gradient(circle at 30% 30%, hsl(${hue1}, 90%, 65%), hsl(${hue2}, 80%, 30%))`,
      boxShadow: `0 0 20px hsl(${hue1}, 80%, 50%, 0.4), inset -10px -10px 20px rgba(0,0,0,0.4), inset 5px 5px 10px rgba(255,255,255,0.3)`,
    };
  });

  // Visually update the arrows while dragging, but don't choke React State!
  const handleDrag = () => {
    updateXarrow();
  };

  // Only save the final coordinates to React State when you drop it
  const handleStop = (e: DraggableEvent, ui: DraggableData) => {
    updateXarrow();
    onDrag(ui.x, ui.y);
  };

  const displayName = id.toLowerCase().includes('task') 
    ? `LVL ${id.replace(/\D/g, '')}` 
    : id;

  const initialX = typeof style.left === 'number' ? style.left : 0;
  const initialY = typeof style.top === 'number' ? style.top : 0;

  return (
    <Draggable
      bounds="parent" // 🚨 RESTORED: This instantly fixes the 1cm/4cm resistance bug!
      defaultPosition={{ x: initialX, y: initialY }}
      onDrag={handleDrag}
      onStop={handleStop}
      nodeRef={boxRef}
    >
      <div
        ref={boxRef}
        id={id}
        className={`absolute z-20 ${className}`}
        style={{
          ...style, 
          left: undefined, 
          top: undefined,
          width: planetDesign.width,
          height: planetDesign.height,
        }}
      >
        <div
          onClick={onClick}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="w-full h-full flex items-center justify-center rounded-full text-white font-display font-bold cursor-pointer transition-transform duration-200 hover:scale-110 hover:brightness-110"
          style={{
            background: planetDesign.background,
            boxShadow: planetDesign.boxShadow,
          }}
        >
          <span className="drop-shadow-md tracking-wider text-sm md:text-base pointer-events-none">
            {displayName}
          </span>
        </div>
      </div>
    </Draggable>
  );
};

export default DraggableBox;