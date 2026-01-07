import { useState, useCallback, useRef, useEffect } from "react";
import {
  MessageSquare,
  Hash,
  Film,
  Headphones,
  File,
  Type,
  Image,
  Globe,
  AtSign,
  ImageUp,
  SquareArrowOutUpRight,
  Phone,
  Variable,
  Code,
  GripVertical,
} from "lucide-react";
import { Node, NodeType } from "@/types/chatbot";
import { renderTextSegments } from "@/lib/textParser";
import { cn } from "@/lib/utils";

interface NodeItemProps {
  node: Node;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}

const nodeIcons: Record<NodeType, React.ReactNode> = {
  "bubble-text": <MessageSquare className="h-4 w-4" />,
  "bubble-number": <Hash className="h-4 w-4" />,
  "bubble-image": <Image className="h-4 w-4" />,
  "bubble-video": <Film className="h-4 w-4" />,
  "bubble-audio": <Headphones className="h-4 w-4" />,
  "bubble-document": <File className="h-4 w-4" />,
  "input-text": <Type className="h-4 w-4" />,
  "input-number": <Hash className="h-4 w-4" />,
  "input-phone": <Phone className="h-4 w-4" />,
  "input-mail": <AtSign className="h-4 w-4" />,
  "input-image": <ImageUp className="h-4 w-4" />,
  "input-video": <Film className="h-4 w-4" />,
  "input-audio": <Headphones className="h-4 w-4" />,
  "input-document": <File className="h-4 w-4" />,
  "input-webSite": <Globe className="h-4 w-4" />,
  "input-buttons": <SquareArrowOutUpRight className="h-4 w-4" />,
  "set-variable": <Variable className="h-4 w-4" />,
  "script": <Code className="h-4 w-4" />,
};

const nodeColors: Record<NodeType, string> = {
  "bubble-text": "bg-primary/10 border-primary/30 text-primary",
  "bubble-number": "bg-primary/10 border-primary/30 text-primary",
  "bubble-video": "bg-primary/10 border-primary/30 text-primary",
  "bubble-image": "bg-primary/10 border-primary/30 text-primary",
  "bubble-document": "bg-primary/10 border-primary/30 text-primary",
  "bubble-audio": "bg-primary/10 border-primary/30 text-primary",
  "input-text": "bg-accent/10 border-accent/30 text-orange-600",
  "input-number": "bg-accent/10 border-accent/30 text-orange-600",
  "input-audio": "bg-accent/10 border-accent/30 text-orange-600",
  "input-mail": "bg-accent/10 border-accent/30 text-orange-600",
  "input-phone": "bg-accent/10 border-accent/30 text-orange-600",
  "input-image": "bg-accent/10 border-accent/30 text-orange-600",
  "input-video": "bg-accent/10 border-accent/30 text-orange-600",
  "input-document": "bg-accent/10 border-accent/30 text-orange-600",
  "input-webSite": "bg-accent/10 border-accent/30 text-orange-600",
  "input-buttons": "bg-accent/10 border-accent/30 text-orange-600",
  "set-variable": "bg-purple-100 border-purple-300 text-purple-700",
  "script": "bg-purple-100 border-purple-300 text-purple-700",
};

const nodeLabels: Record<NodeType, string> = {
  "bubble-text": "Bot envia Mensagem de Texto",
  "bubble-number": "Bot envia Mensagem de Número",
  "bubble-video": "Bot envia Mensagem de Video",
  "bubble-image": "Bot envia Mensagem de Imagem",
  "bubble-audio": "Bot envia Mensagem de Audio",
  "bubble-document": "Bot envia Mensagem de Arquivo",
  "input-text": "Usuário Responde com Texto",
  "input-number": "Usuário Responde com Número",
  "input-mail": "Usuário Responde com Email",
  "input-phone": "Usuário Responde com Telefone",
  "input-image": "Usuário Responde com Imagem",
  "input-audio": "Usuário Responde com Audio",
  "input-video": "Usuário Responde com Video",
  "input-document": "Usuário Responde com Documento",
  "input-webSite": "Usuário Responde com Link",
  "input-buttons": "Usuário Responde seleção de botão",
  "set-variable": "Definir Variável",
  "script": "Executar Script",
};

const HOLD_DURATION = 3000; // 3 segundos
const PROGRESS_INTERVAL = 30; // Atualiza a cada 30ms para animação suave

export const NodeItem = ({ node, onClick, onDragStart }: NodeItemProps) => {
  const [isDraggable, setIsDraggable] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startHold = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Apenas botão esquerdo do mouse (button 0)
    if ('button' in e && e.button !== 0) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    setHoldProgress(0);
    
    // Intervalo para atualizar progresso visual
    progressIntervalRef.current = setInterval(() => {
      setHoldProgress(prev => {
        const next = prev + (100 / (HOLD_DURATION / PROGRESS_INTERVAL));
        return Math.min(next, 100);
      });
    }, PROGRESS_INTERVAL);
    
    // Timer para ativar draggable após 3s
    holdTimerRef.current = setTimeout(() => {
      setIsDraggable(true);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setHoldProgress(100);
    }, HOLD_DURATION);
  }, []);

  const cancelHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    // Só reseta o progresso se não estiver em modo draggable
    if (!isDraggable) {
      setHoldProgress(0);
    }
  }, [isDraggable]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    setIsDraggable(false);
    setHoldProgress(0);
  }, []);

  const handleClick = useCallback(() => {
    // Só executa onClick se não estiver em modo draggable
    if (!isDraggable) {
      onClick();
    }
  }, [isDraggable, onClick]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    if (isDraggable) {
      e.dataTransfer.setData('nodeId', node.id);
      e.dataTransfer.effectAllowed = 'move';
      if (onDragStart) onDragStart(e);
    } else {
      e.preventDefault();
    }
  }, [isDraggable, onDragStart, node.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const configValue = Object.values(node.config || {});
  const messageValue = configValue.find(
    (value) =>
      typeof value === "string" &&
      value.trim() !== "" &&
      !value.includes("não configurada") &&
      !value.includes("Nova mensagem") &&
      !value.includes("medium")
  );

  const hasImagePreview = node.type === "bubble-image" && node.config["ImageURL"];
  const hasVideoPreview = node.type === "bubble-video" && node.config["VideoURL"];
  const hasDocumentPreview = node.type === "bubble-document" && node.config["FileURL"];
  const hasAudioPreview = node.type === "bubble-audio" && node.config["AudioURL"];
  const hasButtonsPreview = node.type === "input-buttons" && node.config.buttons;
  const hasSetVariablePreview = node.type === "set-variable" && node.config.variableName;
  const hasScriptPreview = node.type === "script" && node.config.code;

  return (
    <div
      draggable={isDraggable}
      onClick={(e) => {
        e.stopPropagation();
        handleClick();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        startHold(e);
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        cancelHold();
      }}
      onMouseLeave={cancelHold}
      onTouchStart={(e) => {
        e.stopPropagation();
        startHold(e);
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
        cancelHold();
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        "nodrag nopan",
        nodeColors[node.type],
        "rounded-lg p-3 cursor-pointer transition-all duration-200 select-none border relative overflow-hidden",
        isDraggable && "ring-2 ring-blue-500 cursor-move shadow-lg scale-[1.02]",
        holdProgress > 0 && holdProgress < 100 && "ring-2 ring-yellow-400/70"
      )}
    >
      {/* Barra de progresso durante hold */}
      {holdProgress > 0 && holdProgress < 100 && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-75 rounded-b"
          style={{ width: `${holdProgress}%` }} 
        />
      )}
      
      {/* Indicador de modo arrastar ativo */}
      {isDraggable && (
        <div className="absolute -top-1 -right-1 bg-blue-500 text-white p-1 rounded-full shadow-md animate-pulse">
          <GripVertical className="h-3 w-3" />
        </div>
      )}

      <div className="flex items-center gap-2">
        {nodeIcons[node.type]}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className="text-xs font-semibold text-left max-w-[180px]">{nodeLabels[node.type]}</p>

          {hasVideoPreview ? (
            <div className="mt-2">
              <video
                src={node.config["VideoURL"]}
                aria-description={node.config["VideoAlt"] || "Preview"}
                controls
                autoPlay={false}
                className="w-full h-auto rounded border max-h-36 object-cover"
              />
            </div>
          ) : hasImagePreview ? (
            <div className="mt-2">
              <img
                src={node.config["ImageURL"]}
                alt={node.config["ImageAlt"] || "Preview"}
                className="w-full h-auto rounded border max-h-36 object-cover"
              />
            </div>
          ) : hasDocumentPreview ? (
            <div className="mt-2 p-2 bg-muted rounded border">
              <p className="text-xs">{node.config["FileName"] || "Documento anexado"}</p>
            </div>
          ) : hasAudioPreview ? (
            <div className="mt-2 p-2 bg-muted rounded border flex items-center gap-2">
              <Headphones className="h-4 w-4 text-primary" />
              <audio
                src={node.config["AudioURL"]}
                controls
                className="flex-1 h-8"
                style={{ maxWidth: '100%' }}
              />
            </div>
          ) : hasButtonsPreview ? (
            <div className="mt-2 space-y-1">
              {(node.config.buttons as Array<{ id: string; label: string; saveVariable?: string }>).map((button) => (
                <div
                  key={button.id}
                  className="px-2 py-1.5 bg-white border rounded text-xs text-gray-700 font-medium text-center"
                >
                  {button.label}
                </div>
              ))}
            </div>
          ) : hasSetVariablePreview ? (
            <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
              <p className="text-xs font-semibold text-purple-700">
                {node.config.variableName} = {node.config.value || "(vazio)"}
              </p>
            </div>
          ) : hasScriptPreview ? (
            <div className="mt-2 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-700">
                  {node.config.executeOnServer ? '🖥️ Server Script' : '💻 Client Script'}
                </span>
              </div>
              <pre className="text-xs bg-black/20 p-2 rounded overflow-hidden text-ellipsis whitespace-nowrap text-gray-700">
                {node.config.code?.substring(0, 50) || "// código vazio"}
                {node.config.code?.length > 50 ? '...' : ''}
              </pre>
            </div>
          ) : (
            messageValue && (
              <p className="text-xs text-black text-justify max-w-[180px] h-auto leading-relaxed text-wrap py-0">
                {renderTextSegments(messageValue as string, {
                  variableClassName: "bg-orange-400 px-1 py-0.5 text-white rounded",
                  linkClassName: "text-blue-600 underline hover:text-blue-800"
                })}
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
};
