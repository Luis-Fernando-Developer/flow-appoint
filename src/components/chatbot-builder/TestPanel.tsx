import React, { useState, useRef, useEffect } from 'react';
import { X, Send, RefreshCw, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatbot } from '@/contexts/ChatbotContext';
import { ChatMessage, Container, getNodeConfig } from '@/types/chatbot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TestPanelProps {
  onClose: () => void;
}

export function TestPanel({ onClose }: TestPanelProps) {
  const { containers, edges, variables } = useChatbot();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [currentContainerId, setCurrentContainerId] = useState<string | null>(null);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [sessionVariables, setSessionVariables] = useState<Record<string, unknown>>({});
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [pendingVariable, setPendingVariable] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Start the flow
  useEffect(() => {
    if (containers.length > 0 && !currentContainerId) {
      // Find start container (first one or one without incoming edges)
      const containerIdsWithIncoming = new Set(edges.map(e => e.target));
      const startContainer = containers.find(c => !containerIdsWithIncoming.has(c.id)) || containers[0];
      setCurrentContainerId(startContainer.id);
      processContainer(startContainer, 0);
    }
  }, [containers]);

  const processContainer = async (container: Container, nodeIndex: number) => {
    if (nodeIndex >= container.nodes.length) {
      // Move to next container
      const nextEdge = edges.find(e => e.source === container.id);
      if (nextEdge) {
        const nextContainer = containers.find(c => c.id === nextEdge.target);
        if (nextContainer) {
          setCurrentContainerId(nextContainer.id);
          setCurrentNodeIndex(0);
          setTimeout(() => processContainer(nextContainer, 0), 500);
        }
      }
      return;
    }

    const node = container.nodes[nodeIndex];
    const config = getNodeConfig(node.type);

    switch (node.type) {
      case 'text':
        addBotMessage(interpolateVariables(node.data.content as string || 'Mensagem de texto'));
        setTimeout(() => processContainer(container, nodeIndex + 1), 1000);
        break;

      case 'text-input':
      case 'email-input':
      case 'phone-input':
      case 'number-input':
        addBotMessage(interpolateVariables(node.data.placeholder as string || 'Por favor, digite sua resposta...'));
        setWaitingForInput(true);
        setPendingVariable(node.data.variable as string || null);
        setCurrentNodeIndex(nodeIndex + 1);
        break;

      case 'buttons':
        const buttons = (node.data.buttons as Array<{ id: string; label: string; value: string }>) || [];
        addBotMessage('Escolha uma opção:', buttons);
        setWaitingForInput(true);
        setPendingVariable(node.data.variable as string || null);
        setCurrentNodeIndex(nodeIndex + 1);
        break;

      case 'booking-services':
        addBotMessage('📋 Nossos serviços disponíveis:\n\n1. Corte de Cabelo - R$ 50\n2. Barba - R$ 30\n3. Corte + Barba - R$ 70\n\nDigite o número do serviço desejado:', [
          { id: '1', label: 'Corte de Cabelo', value: 'corte' },
          { id: '2', label: 'Barba', value: 'barba' },
          { id: '3', label: 'Corte + Barba', value: 'combo' },
        ]);
        setWaitingForInput(true);
        setPendingVariable(node.data.variable as string || 'selected_service');
        setCurrentNodeIndex(nodeIndex + 1);
        break;

      case 'booking-employees':
        addBotMessage('👤 Profissionais disponíveis:\n\n1. João Silva\n2. Maria Santos\n3. Pedro Oliveira\n\nEscolha o profissional:', [
          { id: '1', label: 'João Silva', value: 'joao' },
          { id: '2', label: 'Maria Santos', value: 'maria' },
          { id: '3', label: 'Pedro Oliveira', value: 'pedro' },
        ]);
        setWaitingForInput(true);
        setPendingVariable(node.data.variable as string || 'selected_employee');
        setCurrentNodeIndex(nodeIndex + 1);
        break;

      case 'booking-slots':
        addBotMessage('📅 Horários disponíveis para hoje:\n\n• 09:00\n• 10:00\n• 11:00\n• 14:00\n• 15:00\n\nDigite o horário desejado:', [
          { id: '1', label: '09:00', value: '09:00' },
          { id: '2', label: '10:00', value: '10:00' },
          { id: '3', label: '14:00', value: '14:00' },
        ]);
        setWaitingForInput(true);
        setPendingVariable(node.data.variable as string || 'selected_slot');
        setCurrentNodeIndex(nodeIndex + 1);
        break;

      case 'booking-confirm':
        addBotMessage('✅ Agendamento confirmado!\n\nServiço: ' + (sessionVariables.selected_service || 'N/A') + '\nProfissional: ' + (sessionVariables.selected_employee || 'N/A') + '\nHorário: ' + (sessionVariables.selected_slot || 'N/A'));
        setTimeout(() => processContainer(container, nodeIndex + 1), 1000);
        break;

      case 'booking-summary':
        addBotMessage('📝 Resumo do seu agendamento:\n\n' + Object.entries(sessionVariables).map(([k, v]) => `${k}: ${v}`).join('\n'));
        setTimeout(() => processContainer(container, nodeIndex + 1), 1000);
        break;

      case 'wait':
        const seconds = (node.data.seconds as number) || 2;
        setTimeout(() => processContainer(container, nodeIndex + 1), seconds * 1000);
        break;

      default:
        addBotMessage(`[${config?.label || node.type}]`);
        setTimeout(() => processContainer(container, nodeIndex + 1), 500);
    }
  };

  const interpolateVariables = (text: string): string => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return String(sessionVariables[varName] || match);
    });
  };

  const addBotMessage = (content: string, buttons?: ChatMessage['buttons']) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'bot',
      content,
      timestamp: new Date().toISOString(),
      buttons
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSend = () => {
    if (!input.trim() || !waitingForInput) return;

    addUserMessage(input);
    
    if (pendingVariable) {
      setSessionVariables(prev => ({ ...prev, [pendingVariable]: input }));
    }

    setInput('');
    setWaitingForInput(false);
    setPendingVariable(null);

    // Continue processing
    const container = containers.find(c => c.id === currentContainerId);
    if (container) {
      setTimeout(() => processContainer(container, currentNodeIndex), 500);
    }
  };

  const handleButtonClick = (button: { id: string; label: string; value: string }) => {
    addUserMessage(button.label);
    
    if (pendingVariable) {
      setSessionVariables(prev => ({ ...prev, [pendingVariable]: button.value }));
    }

    setWaitingForInput(false);
    setPendingVariable(null);

    // Continue processing
    const container = containers.find(c => c.id === currentContainerId);
    if (container) {
      setTimeout(() => processContainer(container, currentNodeIndex), 500);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setCurrentContainerId(null);
    setCurrentNodeIndex(0);
    setSessionVariables({});
    setWaitingForInput(false);
    setPendingVariable(null);

    // Restart
    setTimeout(() => {
      if (containers.length > 0) {
        const containerIdsWithIncoming = new Set(edges.map(e => e.target));
        const startContainer = containers.find(c => !containerIdsWithIncoming.has(c.id)) || containers[0];
        setCurrentContainerId(startContainer.id);
        processContainer(startContainer, 0);
      }
    }, 100);
  };

  return (
    <div className="w-96 bg-card border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold">Teste do Chatbot</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleReset}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2",
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Buttons */}
                {message.buttons && message.buttons.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.buttons.map((btn) => (
                      <Button
                        key={btn.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleButtonClick(btn)}
                        disabled={!waitingForInput}
                        className="text-xs"
                      >
                        {btn.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={waitingForInput ? "Digite sua resposta..." : "Aguarde..."}
            disabled={!waitingForInput}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button 
            onClick={handleSend} 
            disabled={!waitingForInput || !input.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
