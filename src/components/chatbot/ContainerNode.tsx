import { memo } from "react";
import { Handle, Position, NodeProps } from 'reactflow';
import { MoreVertical } from "lucide-react";
import { Container, Node, ButtonConfig } from "@/types/chatbot";
import { NodeItem } from "./NodeItem";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ContainerNodeData {
  container: Container;
  onNodeClick: (nodeId: string) => void;
  onTest: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onNodeDrop: (nodeId: string, targetContainerId: string) => void;
}

export const ContainerNode = memo(({ data }: NodeProps<ContainerNodeData>) => {
  const { container, onNodeClick, onTest, onDuplicate, onDelete, onNodeDrop } = data;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('ring-2', 'ring-primary');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('ring-2', 'ring-primary');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-primary');
    const nodeId = e.dataTransfer.getData('nodeId');
    if (nodeId) {
      onNodeDrop(nodeId, container.id);
    }
  };

  return (
    <div className='relative bg-card py-1 px-2 rounded-xl shadow-lg border border-border min-w-[280px] transition-all duration-200'>
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

        <div className="space-y-2">
          {container.nodes.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
              Arraste nodes para cá
            </div>
          ) : (
            container.nodes.map((node) => (
              <NodeItem
                key={node.id}
                node={node}
                onClick={() => onNodeClick(node.id)}
                onDragStart={(e) => {
                  e.dataTransfer.setData('nodeId', node.id);
                }}
              />
            ))
          )}
        </div>

        {/* Handles dinâmicos para botões */}
        {container.nodes.map((node, nodeIdx) => {
          if (node.type === 'input-buttons' && node.config.buttons) {
            const buttons = node.config.buttons as ButtonConfig[];
            return buttons.map((button, btnIdx) => (
              <Handle
                key={`${node.id}-${button.id}`}
                type="source"
                position={Position.Right}
                id={`${node.id}-${button.id}`}
                style={{
                  top: `${40 + nodeIdx * 80 + btnIdx * 20}px`,
                  background: '#10b981',
                  width: 12,
                  height: 12,
                }}
              />
            ));
          } else if (node.type === 'set-variable') {
            return (
              <div key={node.id}>
                <Handle type="target" position={Position.Left} id={`${node.id}-target`} />
                <Handle type="source" position={Position.Right} id={`${node.id}-source`} />
              </div>
            );
          }
          return null;
        })}

        <Handle type="source" position={Position.Bottom} className="!bg-green-600 !w-4 !h-4 -bottom-2" />
      </div>
    </div>
  );
});

ContainerNode.displayName = 'ContainerNode';
