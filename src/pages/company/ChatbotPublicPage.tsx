import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabaseClient } from '@/lib/supabaseClient';
import { getEdgeFunctionUrl } from '@/lib/supabaseHelpers';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  isImage?: boolean;
  isVideo?: boolean;
  isAudio?: boolean;
  alt?: string;
}

interface ButtonOption {
  id: string;
  label: string;
  value?: string;
}

interface CompanyData {
  id: string;
  name: string;
  slug: string;
}

interface FlowData {
  id: string;
  name: string;
  settings: {
    theme?: {
      primaryColor?: string;
      backgroundColor?: string;
      textColor?: string;
      fontFamily?: string;
    };
    metadata?: {
      title?: string;
      description?: string;
      favicon?: string;
    };
  };
}

export default function ChatbotPublicPage() {
  const { slug, publicId } = useParams();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [flow, setFlow] = useState<FlowData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [buttons, setButtons] = useState<ButtonOption[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [waitingFor, setWaitingFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getRuntimeUrl = () => {
    try {
      return getEdgeFunctionUrl('chatbot-runtime');
    } catch {
      return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot-runtime`;
    }
  };

  useEffect(() => {
    loadFlowAndStartChat();
  }, [slug, publicId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (flow?.settings?.metadata?.title) {
      document.title = flow.settings.metadata.title;
    }
  }, [flow]);

  const loadFlowAndStartChat = async () => {
    try {
      // Get company
      const { data: companyData, error: companyError } = await supabaseClient
        .from('companies')
        .select('id, name, slug')
        .eq('slug', slug)
        .single();

      if (companyError || !companyData) {
        setError('Empresa não encontrada');
        setIsLoading(false);
        return;
      }
      setCompany(companyData);

      // Get flow by public_id directly - query the correct columns
      // Must be published AND active to be accessible
      const { data: flowData, error: flowError } = await supabaseClient
        .from('chatbot_flows')
        .select('id, name, settings, is_published, is_active, public_id')
        .eq('company_id', companyData.id)
        .eq('public_id', publicId)
        .eq('is_published', true)
        .eq('is_active', true) // Only allow active bots
        .maybeSingle();

      if (flowError || !flowData) {
        console.error('Flow query error:', flowError);
        setError('Chatbot não encontrado, não está publicado ou está desativado');
        setIsLoading(false);
        return;
      }

      setFlow({
        id: flowData.id,
        name: flowData.name,
        settings: (flowData.settings as FlowData['settings']) || {},
      });

      // Start chat session using published version
      const response = await fetch(`${getRuntimeUrl()}/start-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_id: publicId,
          company_slug: slug,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao iniciar chat');
      }

      const data = await response.json();
      setSessionId(data.session_id);
      setMessages(data.messages || []);
      setWaitingFor(data.waiting_for);
      setButtons(data.buttons || []);
    } catch (err: any) {
      console.error('Error starting chat:', err);
      setError(err.message || 'Erro ao iniciar conversa');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message?: string, buttonId?: string) => {
    if (!sessionId) return;
    if (!message && !buttonId) return;

    setIsSending(true);
    try {
      const response = await fetch(`${getRuntimeUrl()}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: message || undefined,
          button_id: buttonId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      const data = await response.json();
      setMessages(data.messages || []);
      setWaitingFor(data.waiting_for);
      setButtons(data.buttons || []);
      setInput('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
    }
  };

  const handleButtonClick = (button: ButtonOption) => {
    sendMessage(undefined, button.id);
  };

  const theme = flow?.settings?.theme || {};
  const primaryColor = theme.primaryColor || '#3b82f6';
  const backgroundColor = theme.backgroundColor || '#ffffff';
  const textColor = theme.textColor || '#1f2937';

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor }}
      >
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: primaryColor }} />
          <p style={{ color: textColor }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor }}
      >
        <div className="text-center max-w-md">
          <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-semibold mb-2" style={{ color: textColor }}>
            {error}
          </h1>
          <p className="text-muted-foreground">
            Verifique se o link está correto ou entre em contato com a empresa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor }}
    >
      {/* Header */}
      <div 
        className="py-4 px-6 border-b shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Bot className="h-8 w-8 text-white" />
          <div>
            <h1 className="font-semibold text-white">
              {flow?.settings?.metadata?.title || flow?.name || 'Chat'}
            </h1>
            {company && (
              <p className="text-sm text-white/80">{company.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.type === 'user'
                    ? 'text-white'
                    : 'bg-muted'
                }`}
                style={msg.type === 'user' ? { backgroundColor: primaryColor } : undefined}
              >
                {msg.isImage ? (
                  <img 
                    src={msg.content} 
                    alt={msg.alt || 'Imagem'} 
                    className="max-w-full rounded"
                  />
                ) : msg.isVideo ? (
                  <video 
                    src={msg.content} 
                    controls 
                    className="max-w-full rounded"
                  />
                ) : msg.isAudio ? (
                  <audio 
                    src={msg.content} 
                    controls 
                    className="w-full"
                  />
                ) : (
                  <p 
                    className="whitespace-pre-wrap"
                    style={{ color: msg.type === 'user' ? '#ffffff' : textColor }}
                  >
                    {msg.content}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Buttons */}
          {buttons.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {buttons.map((btn) => (
                <Button
                  key={btn.id}
                  variant="outline"
                  onClick={() => handleButtonClick(btn)}
                  disabled={isSending}
                  style={{ 
                    borderColor: primaryColor, 
                    color: primaryColor,
                  }}
                  className="hover:bg-primary/10"
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {waitingFor && waitingFor !== 'buttons' && (
        <div className="border-t p-4" style={{ backgroundColor }}>
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                waitingFor === 'input-mail' ? 'Digite seu e-mail...' :
                waitingFor === 'input-phone' ? 'Digite seu telefone...' :
                waitingFor === 'input-number' ? 'Digite um número...' :
                'Digite sua mensagem...'
              }
              disabled={isSending}
              className="flex-1"
              type={
                waitingFor === 'input-mail' ? 'email' :
                waitingFor === 'input-number' ? 'number' :
                waitingFor === 'input-phone' ? 'tel' :
                'text'
              }
            />
            <Button 
              type="submit" 
              disabled={isSending || !input.trim()}
              style={{ backgroundColor: primaryColor }}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
