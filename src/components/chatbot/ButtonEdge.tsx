import React, { useState } from 'react';
import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  getBezierPath, 
  useReactFlow,
  type EdgeProps 
} from 'reactflow';
import { X } from 'lucide-react';

export function ButtonEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  const showDeleteButton = selected || isHovered;

  return (
    <>
      {/* Invisible wider path for easier hover detection */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        className="react-flow__edge-interaction"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          ...style,
          strokeWidth: showDeleteButton ? 3 : 2,
          stroke: showDeleteButton ? 'hsl(var(--primary))' : style.stroke,
        }} 
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            opacity: showDeleteButton ? 1 : 0,
            transition: 'opacity 0.15s ease-in-out',
          }}
          className="nodrag nopan z-50"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button
            className="w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-md transition-colors"
            onClick={onEdgeClick}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
