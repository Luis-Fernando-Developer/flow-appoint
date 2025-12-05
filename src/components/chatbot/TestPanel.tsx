import { useState, useEffect, useRef } from "react";
import { X, Send, File, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container, Node, ButtonConfig, Edge } from "@/types/chatbot";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useVariables } from "@/contexts/VariablesContext";
import { renderTextSegments } from "@/lib/textParser";

interface TestPanelProps {
  isOpen: boolean;
  onClose: () => void;
  startContainer: Container | null;
  allContainers: Container[];
  edges?: Edge[];
}

interface Message {
  id: string;
  type: "bot" | "user";
  content: string;
  isVideo?: boolean;
  isImage?: boolean;
  isFile?: boolean;
  isAudio?: boolean;
  alt?: string;
}

export const TestPanel = ({ isOpen, onClose, startContainer, allContainers, edges = [] }: TestPanelProps) => {
  const { replaceVariablesInText, setVariable, variables } = useVariables();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentContainerId, setCurrentContainerId] = useState<string | null>(null);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [currentInputNode, setCurrentInputNode] = useState<Node | null>(null);
  const [activeButtons, setActiveButtons] = useState<ButtonConfig[]>([]);
  const [waitingForButton, setWaitingForButton] = useState(false);
  const pendingVarsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && startContainer) {
      setMessages([]);
      setCurrentContainerId(startContainer.id);
      setCurrentNodeIndex(0);
      setWaitingForInput(false);
      setWaitingForButton(false);
      setActiveButtons([]);
      pendingVarsRef.current = {};
      processNextNode(startContainer, 0, {});
    }
  }, [isOpen, startContainer]);

  const processNextNode = (container: Container, nodeIndex: number, extraVars: Record<string, string> = {}) => {
    if (!container || nodeIndex >= container.nodes.length) {
      const nextEdge = edges.find((edge) => edge.source === container.id);
      if (nextEdge) {
        const nextContainer = allContainers.find((c) => c.id === nextEdge.target);
        if (nextContainer) {
          setTimeout(() => {
            setCurrentContainerId(nextContainer.id);
            setCurrentNodeIndex(0);
            processNextNode(nextContainer, 0, extraVars);
          }, 500);
        }
      }
      return;
    }

    const node = container.nodes[nodeIndex];

    if (node.type === "set-variable") {
      const variableName = node.config.variableName;
      const value = node.config.value || "";
      if (variableName) {
        setVariable(variableName, replaceVariablesInText(value, extraVars));
        extraVars[variableName] = replaceVariablesInText(value, extraVars);
      }
      processNextNode(container, nodeIndex + 1, extraVars);
      return;
    }

    if (node.type.startsWith("bubble")) {
      if (node.type === "bubble-image" && node.config.ImageURL) {
        setTimeout(() => {
          setMessages((prev) => [...prev, { id: `${node.id}-${Date.now()}`, type: "bot", content: node.config.ImageURL, isImage: true, alt: node.config.ImageAlt || "Imagem" }]);
          setTimeout(() => processNextNode(container, nodeIndex + 1, extraVars), 500);
        }, 500);
      } else if (node.type === "bubble-video" && node.config.VideoURL) {
        setTimeout(() => {
          setMessages((prev) => [...prev, { id: `${node.id}-${Date.now()}`, type: "bot", content: node.config.VideoURL, isVideo: true }]);
          setTimeout(() => processNextNode(container, nodeIndex + 1, extraVars), 500);
        }, 500);
      } else {
        const message = node.config.message || node.config.number || "";
        if (message) {
          setTimeout(() => {
            setMessages((prev) => [...prev, { id: `${node.id}-${Date.now()}`, type: "bot", content: replaceVariablesInText(message, extraVars) }]);
            setTimeout(() => processNextNode(container, nodeIndex + 1, extraVars), 500);
          }, 500);
        } else {
          processNextNode(container, nodeIndex + 1, extraVars);
        }
      }
    } else if (node.type === "input-buttons") {
      const buttons = (node.config.buttons as ButtonConfig[]) || [];
      setActiveButtons(buttons);
      setWaitingForButton(true);
      setCurrentInputNode(node);
      setCurrentNodeIndex(nodeIndex);
    } else if (node.type.startsWith("input")) {
      setCurrentInputNode(node);
      setWaitingForInput(true);
      setCurrentNodeIndex(nodeIndex);
    } else {
      processNextNode(container, nodeIndex + 1, extraVars);
    }
  };

  const handleButtonClick = (button: ButtonConfig) => {
    if (!waitingForButton || !currentInputNode) return;
    if (button.saveVariable) setVariable(button.saveVariable, button.label);
    setMessages((prev) => [...prev, { id: Date.now().toString(), type: "user", content: button.label }]);
    setActiveButtons([]);
    setWaitingForButton(false);
    const currentContainer = allContainers.find(c => c.id === currentContainerId);
    if (currentContainer) processNextNode(currentContainer, currentNodeIndex + 1, pendingVarsRef.current);
  };

  const handleSendMessage = () => {
    if (!currentInput.trim() || !waitingForInput) return;
    if (currentInputNode?.config.saveVariable) {
      setVariable(currentInputNode.config.saveVariable, currentInput);
      pendingVarsRef.current[currentInputNode.config.saveVariable] = currentInput;
    }
    setMessages((prev) => [...prev, { id: Date.now().toString(), type: "user", content: currentInput }]);
    setCurrentInput("");
    setWaitingForInput(false);
    setCurrentInputNode(null);
    const currentContainer = allContainers.find((c) => c.id === currentContainerId);
    if (currentContainer) setTimeout(() => processNextNode(currentContainer, currentNodeIndex + 1, pendingVarsRef.current), 500);
  };

  if (!isOpen) return null;

  return (
    <aside className="w-72 absolute top-0 right-0 h-full bg-sidebar border-l border-border shadow-lg">
      <div className="flex flex-col w-full h-full">
        <div className="h-14 border-b px-3 flex items-center justify-between">
          <h2 className="font-semibold text-sm">Teste do Fluxo</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "bot" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${message.type === "bot" ? "bg-blue-500 text-white" : "bg-orange-500 text-white"}`}>
                  {message.isImage ? <img src={message.content} alt={message.alt} className="max-w-full rounded" /> : message.isVideo ? <video src={message.content} controls className="max-w-full rounded" /> : renderTextSegments(message.content)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        {waitingForButton && activeButtons.length > 0 && (
          <div className="p-2 border-t space-y-2">
            {activeButtons.map((btn) => (<Button key={btn.id} variant="outline" className="w-full" onClick={() => handleButtonClick(btn)}>{btn.label}</Button>))}
          </div>
        )}
        {waitingForInput && !waitingForButton && (
          <div className="p-2 border-t flex gap-2">
            <Input value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSendMessage()} placeholder="Digite..." className="flex-1" />
            <Button size="icon" onClick={handleSendMessage}><Send className="h-4 w-4" /></Button>
          </div>
        )}
      </div>
    </aside>
  );
};
