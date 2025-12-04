import React, { useState } from 'react';
import { 
  MessageSquare, Image, Video, Volume2, Type, Hash, Mail, Phone, 
  Calendar, LayoutGrid, Images, GitBranch, Variable, ExternalLink, 
  Clock, Briefcase, Users, CalendarClock, CheckCircle, FileText, 
  Webhook, Bot, ChevronDown, ChevronRight, GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeCategory, NodeConfig, getNodesByCategory } from '@/types/chatbot';
import { ScrollArea } from '@/components/ui/scroll-area';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare, Image, Video, Volume2, Type, Hash, Mail, Phone,
  Calendar, LayoutGrid, Images, GitBranch, Variable, ExternalLink,
  Clock, Briefcase, Users, CalendarClock, CheckCircle, FileText,
  Webhook, Bot
};

const categoryInfo: Record<NodeCategory, { label: string; color: string; bgColor: string }> = {
  bubbles: { label: 'Bolhas', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  inputs: { label: 'Entradas', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  logic: { label: 'Lógica', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  booking: { label: 'Agendamento', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  integrations: { label: 'Integrações', color: 'text-pink-500', bgColor: 'bg-pink-500/10' }
};

interface NodesSidebarProps {
  onDragStart: (e: React.DragEvent, nodeConfig: NodeConfig) => void;
}

export function NodesSidebar({ onDragStart }: NodesSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<NodeCategory[]>([
    'bubbles', 'inputs', 'booking'
  ]);

  const toggleCategory = (category: NodeCategory) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const categories: NodeCategory[] = ['bubbles', 'inputs', 'logic', 'booking', 'integrations'];

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Blocos</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Arraste para o canvas
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {categories.map(category => {
            const info = categoryInfo[category];
            const nodes = getNodesByCategory(category);
            const isExpanded = expandedCategories.includes(category);
            
            return (
              <div key={category} className="mb-2">
                <button
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-lg transition-colors",
                    "hover:bg-accent/50",
                    info.bgColor
                  )}
                >
                  <span className={cn("font-medium text-sm", info.color)}>
                    {info.label}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className={cn("h-4 w-4", info.color)} />
                  ) : (
                    <ChevronRight className={cn("h-4 w-4", info.color)} />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="mt-1 space-y-1 pl-1">
                    {nodes.map(node => {
                      const Icon = iconMap[node.icon] || MessageSquare;
                      
                      return (
                        <div
                          key={node.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, node)}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-md cursor-grab",
                            "bg-background border border-border",
                            "hover:border-primary/50 hover:shadow-sm",
                            "transition-all duration-150",
                            "group"
                          )}
                        >
                          <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className={cn(
                            "p-1.5 rounded",
                            info.bgColor
                          )}>
                            <Icon className={cn("h-3.5 w-3.5", info.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {node.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
