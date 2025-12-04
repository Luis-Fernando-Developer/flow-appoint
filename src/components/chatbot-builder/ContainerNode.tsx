import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Trash2, GripVertical, MoreVertical, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container, getNodeConfig } from '@/types/chatbot';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ContainerNodeData {
  container: Container;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onAddNode: (containerId: string) => void;
  isSelected: boolean;
}

const categoryColors: Record<string, { bg: string; border: string; dot: string }> = {
  bubbles: { bg: 'bg-blue-500/5', border: 'border-blue-500/30', dot: 'bg-blue-500' },
  inputs: { bg: 'bg-orange-500/5', border: 'border-orange-500/30', dot: 'bg-orange-500' },
  logic: { bg: 'bg-purple-500/5', border: 'border-purple-500/30', dot: 'bg-purple-500' },
  booking: { bg: 'bg-green-500/5', border: 'border-green-500/30', dot: 'bg-green-500' },
  integrations: { bg: 'bg-pink-500/5', border: 'border-pink-500/30', dot: 'bg-pink-500' },
};

export const ContainerNode = memo(({ data, selected }: NodeProps<ContainerNodeData>) => {
  const { container, onDelete, onEdit, isSelected } = data;
  
  return (
    <div
      className={cn(
        "min-w-[280px] rounded-xl border-2 bg-card shadow-lg transition-all duration-200",
        selected || isSelected 
          ? "border-primary ring-2 ring-primary/20" 
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Handle de entrada */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
      
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30 rounded-t-xl">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
          <span className="font-medium text-sm text-foreground">
            {container.name}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(container.id)}>
              <Pencil className="h-4 w-4 mr-2" />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(container.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Nodes */}
      <div className="p-2 space-y-2 min-h-[60px]">
        {container.nodes.length === 0 ? (
          <div className="flex items-center justify-center h-[60px] border-2 border-dashed border-border rounded-lg">
            <p className="text-xs text-muted-foreground">
              Arraste blocos aqui
            </p>
          </div>
        ) : (
          container.nodes.map((node, index) => {
            const config = getNodeConfig(node.type);
            const colors = categoryColors[config?.category || 'bubbles'];
            
            return (
              <div
                key={node.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                  colors.bg,
                  colors.border,
                  "hover:shadow-sm cursor-pointer"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full", colors.dot)} />
                <span className="text-xs font-medium text-foreground">
                  {config?.label || node.type}
                </span>
              </div>
            );
          })
        )}
      </div>
      
      {/* Handle de saída */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
    </div>
  );
});

ContainerNode.displayName = 'ContainerNode';
