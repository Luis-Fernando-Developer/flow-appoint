import { memo, useState, useRef, useLayoutEffect, useCallback } from "react";
import { Handle, Position, NodeProps } from 'reactflow';
import { MoreVertical } from "lucide-react";
import { Container, Node, ButtonConfig, ConditionGroup } from "@/types/chatbot";
import { NodeItem } from "./NodeItem";
import { ButtonGroupNodeItem } from "./ButtonGroupNodeItem";
import { ConditionNodeItem } from "./ConditionNodeItem";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface HandlePosition {
  id: string;
  top: number;
  color: string;
}

interface ContainerNodeData {
  container: Container;
  onNodeClick: (nodeId: string) => void;
  onButtonClick?: (nodeId: string, buttonId: string) => void;
  onConditionClick?: (nodeId: string, conditionId: string) => void;
  onAddButton?: (nodeId: string, label: string) => void;
  onUpdateButton?: (nodeId: string, buttonId: string, updates: Partial<ButtonConfig>) => void;
  onDeleteButton?: (nodeId: string, buttonId: string) => void;
  onTest: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onNodeDrop: (nodeId: string, targetContainerId: string, insertIndex?: number) => void;
}

const InsertPreview = () => (
  <div className="rounded-lg p-3 border-2 border-dashed border-green-500 bg-green-500/10 flex items-center justify-center gap-2 transition-all duration-200">
    <span className="text-sm text-green-500 font-medium">
      Solte aqui
    </span>
  </div>
);

export const ContainerNode = memo(({ data }: NodeProps<ContainerNodeData>) => {
  const { 
    container, 
    onNodeClick, 
    onButtonClick,
    onConditionClick,
    onAddButton,
    onUpdateButton,
    onDeleteButton,
    onTest, 
    onDuplicate, 
    onDelete, 
    onNodeDrop 
  } = data;
  const [isDragOver, setIsDragOver] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [handlePositions, setHandlePositions] = useState<HandlePosition[]>([]);
  const nodesListRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate handle positions for button and condition nodes
  const calculateHandlePositions = useCallback(() => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const positions: HandlePosition[] = [];

    container.nodes.forEach((node) => {
      if (node.type === 'input-buttons') {
        const buttons = node.config.buttons || [];
        
        // Find button rows by data attribute
        buttons.forEach((btn: ButtonConfig) => {
          const rowEl = containerRef.current?.querySelector(`[data-button-id="${btn.id}"]`);
          if (rowEl) {
            const rowRect = rowEl.getBoundingClientRect();
            const top = rowRect.top - containerRect.top + rowRect.height / 2;
            positions.push({
              id: `${node.id}-btn-${btn.id}`,
              top,
              color: 'bg-blue-500',
            });
          }
        });

        // Default/fallback handle
        const defaultEl = containerRef.current?.querySelector(`[data-default-id="${node.id}"]`);
        if (defaultEl) {
          const defaultRect = defaultEl.getBoundingClientRect();
          const top = defaultRect.top - containerRect.top + defaultRect.height / 2;
          positions.push({
            id: `${node.id}-default`,
            top,
            color: 'bg-gray-400',
          });
        }
      }

      if (node.type === 'condition') {
        const conditions: ConditionGroup[] = node.config.conditions || [];
        
        // Find condition rows by data attribute
        conditions.forEach((cond: ConditionGroup) => {
          const rowEl = containerRef.current?.querySelector(`[data-condition-id="${cond.id}"]`);
          if (rowEl) {
            const rowRect = rowEl.getBoundingClientRect();
            const top = rowRect.top - containerRect.top + rowRect.height / 2;
            positions.push({
              id: `${node.id}-cond-${cond.id}`,
              top,
              color: 'bg-purple-500',
            });
          }
        });

        // Else handle
        const elseEl = containerRef.current?.querySelector(`[data-else-id="${node.id}"]`);
        if (elseEl) {
          const elseRect = elseEl.getBoundingClientRect();
          const top = elseRect.top - containerRect.top + elseRect.height / 2;
          positions.push({
            id: `${node.id}-else`,
            top,
            color: 'bg-gray-400',
          });
        }
      }
    });

    setHandlePositions(positions);
  }, [container.nodes]);

  // Recalculate positions on layout changes
  useLayoutEffect(() => {
    calculateHandlePositions();
    // Also recalculate after a short delay to catch any async renders
    const timeout = setTimeout(calculateHandlePositions, 100);
    return () => clearTimeout(timeout);
  }, [calculateHandlePositions, container.nodes]);

  // Check if container has a button or condition node - if so, don't show bottom handle
  const hasButtonNode = container.nodes.some(n => n.type === 'input-buttons');
  const hasConditionNode = container.nodes.some(n => n.type === 'condition');
  const hideBottomHandle = hasButtonNode || hasConditionNode;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    
    // Calculate insert index based on mouse Y position
    if (nodesListRef.current && container.nodes.length > 0) {
      const containerRect = nodesListRef.current.getBoundingClientRect();
      const mouseY = e.clientY - containerRect.top;
      
      const nodeElements = nodesListRef.current.querySelectorAll('[data-node-index]');
      let newIndex = container.nodes.length;
      
      nodeElements.forEach((el, idx) => {
        const rect = el.getBoundingClientRect();
        const nodeMiddle = rect.top - containerRect.top + rect.height / 2;
        if (mouseY < nodeMiddle && newIndex === container.nodes.length) {
          newIndex = idx;
        }
      });
      
      setInsertIndex(newIndex);
    } else {
      setInsertIndex(0);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setIsDragOver(false);
      setInsertIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    let nodeId = e.dataTransfer.getData('nodeId');
    if (!nodeId) {
      nodeId = e.dataTransfer.getData('text/plain');
    }
    
    if (nodeId) {
      onNodeDrop(nodeId, container.id, insertIndex ?? container.nodes.length);
    }
    
    setIsDragOver(false);
    setInsertIndex(null);
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative bg-card py-1 px-2 rounded-xl shadow-lg border border-border min-w-[280px] transition-all duration-200 overflow-visible',
        isDragOver && 'ring-2 ring-green-500 border-green-500 bg-green-50/10'
      )}
    >
      <div
        className="bg-card p-4"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Handle type="target" position={Position.Top} className="!bg-green-600 !w-4 !h-4 -top-2" />

        <div className="flex items-center justify-between mb-3 rounded-sm border border-border/40">
          <h3 className="font-semibold text-sm text-foreground px-0.5">Bloco #{container.id.slice(-6)}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onTest}>
                Testar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div ref={nodesListRef} className="space-y-2 nodrag nopan">
          {container.nodes.length === 0 ? (
            isDragOver ? <InsertPreview /> : (
              <div className="text-xs text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
                Arraste nodes para cá
              </div>
            )
          ) : (
            <>
              {container.nodes.map((node, idx) => (
                <div key={node.id}>
                  {isDragOver && insertIndex === idx && <InsertPreview />}
                  <div data-node-index={idx}>
                    {node.type === 'input-buttons' ? (
                      <ButtonGroupNodeItem
                        node={node}
                        nodeIndex={idx}
                        onGroupClick={() => onNodeClick(node.id)}
                        onButtonClick={(buttonId) => onButtonClick?.(node.id, buttonId)}
                        onAddButton={(label) => onAddButton?.(node.id, label)}
                        onUpdateButton={(buttonId, updates) => onUpdateButton?.(node.id, buttonId, updates)}
                        onDeleteButton={(buttonId) => onDeleteButton?.(node.id, buttonId)}
                      />
                    ) : node.type === 'condition' ? (
                      <ConditionNodeItem
                        node={node}
                        nodeIndex={idx}
                        onGroupClick={() => onNodeClick(node.id)}
                        onConditionClick={(conditionId) => onConditionClick?.(node.id, conditionId)}
                      />
                    ) : (
                      <NodeItem
                        node={node}
                        onClick={() => onNodeClick(node.id)}
                      />
                    )}
                  </div>
                </div>
              ))}
              {isDragOver && insertIndex === container.nodes.length && <InsertPreview />}
            </>
          )}
        </div>

        {/* Handles para outros tipos de nodes (exceto input-buttons e condition que tem handles externos) */}
        {container.nodes.map((node) => {
          if (node.type === 'set-variable') {
            return (
              <div key={node.id}>
                <Handle type="target" position={Position.Left} id={`${node.id}-target`} />
                <Handle type="source" position={Position.Right} id={`${node.id}-source`} />
              </div>
            );
          }
          return null;
        })}

        {!hideBottomHandle && (
          <Handle type="source" position={Position.Bottom} className="!bg-green-600 !w-4 !h-4 -bottom-2" />
        )}
      </div>

      {/* External handles for button and condition nodes - positioned on container edge */}
      {handlePositions.map((pos) => (
        <Handle
          key={pos.id}
          type="source"
          position={Position.Right}
          id={pos.id}
          className={cn("!w-3 !h-3", `!${pos.color}`)}
          style={{
            position: 'absolute',
            right: 0,
            top: pos.top,
            transform: 'translate(50%, -50%)',
          }}
        />
      ))}
    </div>
  );
});

ContainerNode.displayName = 'ContainerNode';
