import React, { useRef, useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { X } from 'lucide-react';

const DraggableField = ({ field, color, isActive, onMove, onDelete }) => {
  const nodeRef = useRef(null);
  const [position, setPosition] = useState({ x: field.x, y: field.y });

  // Sync state if it changes externally
  useEffect(() => {
    setPosition({ x: field.x, y: field.y });
  }, [field.x, field.y]);

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds="parent"
      position={position}
      onDrag={(e, data) => setPosition({ x: data.x, y: data.y })}
      onStop={(e, data) => onMove(field.id, data.x, data.y)}
      disabled={!isActive}
    >
      <div
        ref={nodeRef}
        className={`absolute pointer-events-auto group cursor-move flex flex-col items-center justify-center border-2 transition-all rounded-sm ${
          isActive ? 'shadow-xl ring-2 ring-white/50 z-50' : 'opacity-70 z-10'
        }`}
        style={{
          width: field.width,
          height: field.height,
          backgroundColor: `${color}33`,
          borderColor: color,
          top: 0,   // CRITICAL: Forces coordinate math to start from exact top-left
          left: 0,  // CRITICAL: Forces coordinate math to start from exact top-left
        }}
      >
        <div className="pointer-events-none flex flex-col items-center px-2 text-center">
          <span className="text-[9px] font-black uppercase tracking-tighter leading-tight" style={{ color }}>
            {field.type}
          </span>
          <span className="text-[7px] font-bold opacity-50 uppercase" style={{ color }}>PAGE {field.page}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(field.id);
          }}
          className="absolute -top-2.5 -right-2.5 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-[60]"
        >
          <X size={10} strokeWidth={3} />
        </button>
      </div>
    </Draggable>
  );
};

export default DraggableField;