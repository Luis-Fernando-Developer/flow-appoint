// Node types available in the chatbot builder
export type NodeCategory = 'bubbles' | 'inputs' | 'logic' | 'booking' | 'integrations';

export type BubbleNodeType = 'text' | 'image' | 'video' | 'audio';
export type InputNodeType = 'text-input' | 'number-input' | 'email-input' | 'phone-input' | 'date-input' | 'buttons' | 'picture-choice';
export type LogicNodeType = 'condition' | 'set-variable' | 'redirect' | 'code' | 'wait';
export type BookingNodeType = 'booking-services' | 'booking-employees' | 'booking-slots' | 'booking-confirm' | 'booking-summary';
export type IntegrationNodeType = 'webhook' | 'zapier' | 'openai';

export type NodeType = BubbleNodeType | InputNodeType | LogicNodeType | BookingNodeType | IntegrationNodeType;

export interface NodeConfig {
  id: string;
  type: NodeType;
  category: NodeCategory;
  label: string;
  icon: string;
  description: string;
  defaultData: Record<string, unknown>;
}

export interface ChatNode {
  id: string;
  type: NodeType;
  data: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface Container {
  id: string;
  name: string;
  nodes: ChatNode[];
  position: { x: number; y: number };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  condition?: {
    variable: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: string;
  };
}

export interface Variable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array';
  defaultValue?: unknown;
  isSystem?: boolean;
}

export interface ChatbotFlow {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  containers: Container[];
  edges: Edge[];
  variables: Variable[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: string;
  nodeId?: string;
  buttons?: { id: string; label: string; value: string }[];
}

export interface ChatSession {
  id: string;
  company_id: string;
  flow_id: string;
  client_id?: string;
  current_container_id?: string;
  variables: Record<string, unknown>;
  messages: ChatMessage[];
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

// Node configurations
export const NODE_CONFIGS: NodeConfig[] = [
  // Bubbles
  {
    id: 'text',
    type: 'text',
    category: 'bubbles',
    label: 'Texto',
    icon: 'MessageSquare',
    description: 'Envia uma mensagem de texto',
    defaultData: { content: '' }
  },
  {
    id: 'image',
    type: 'image',
    category: 'bubbles',
    label: 'Imagem',
    icon: 'Image',
    description: 'Envia uma imagem',
    defaultData: { url: '', alt: '' }
  },
  {
    id: 'video',
    type: 'video',
    category: 'bubbles',
    label: 'Vídeo',
    icon: 'Video',
    description: 'Envia um vídeo',
    defaultData: { url: '' }
  },
  {
    id: 'audio',
    type: 'audio',
    category: 'bubbles',
    label: 'Áudio',
    icon: 'Volume2',
    description: 'Envia um áudio',
    defaultData: { url: '' }
  },
  // Inputs
  {
    id: 'text-input',
    type: 'text-input',
    category: 'inputs',
    label: 'Entrada de Texto',
    icon: 'Type',
    description: 'Captura texto do usuário',
    defaultData: { placeholder: 'Digite sua resposta...', variable: '' }
  },
  {
    id: 'number-input',
    type: 'number-input',
    category: 'inputs',
    label: 'Entrada Numérica',
    icon: 'Hash',
    description: 'Captura número do usuário',
    defaultData: { placeholder: 'Digite um número...', variable: '', min: null, max: null }
  },
  {
    id: 'email-input',
    type: 'email-input',
    category: 'inputs',
    label: 'Email',
    icon: 'Mail',
    description: 'Captura email do usuário',
    defaultData: { placeholder: 'Digite seu email...', variable: '' }
  },
  {
    id: 'phone-input',
    type: 'phone-input',
    category: 'inputs',
    label: 'Telefone',
    icon: 'Phone',
    description: 'Captura telefone do usuário',
    defaultData: { placeholder: 'Digite seu telefone...', variable: '' }
  },
  {
    id: 'date-input',
    type: 'date-input',
    category: 'inputs',
    label: 'Data',
    icon: 'Calendar',
    description: 'Captura data do usuário',
    defaultData: { variable: '' }
  },
  {
    id: 'buttons',
    type: 'buttons',
    category: 'inputs',
    label: 'Botões',
    icon: 'LayoutGrid',
    description: 'Mostra opções em botões',
    defaultData: { buttons: [], variable: '' }
  },
  {
    id: 'picture-choice',
    type: 'picture-choice',
    category: 'inputs',
    label: 'Escolha com Imagem',
    icon: 'Images',
    description: 'Opções com imagens',
    defaultData: { choices: [], variable: '' }
  },
  // Logic
  {
    id: 'condition',
    type: 'condition',
    category: 'logic',
    label: 'Condição',
    icon: 'GitBranch',
    description: 'Ramifica baseado em condição',
    defaultData: { conditions: [] }
  },
  {
    id: 'set-variable',
    type: 'set-variable',
    category: 'logic',
    label: 'Definir Variável',
    icon: 'Variable',
    description: 'Define valor de variável',
    defaultData: { variable: '', value: '' }
  },
  {
    id: 'redirect',
    type: 'redirect',
    category: 'logic',
    label: 'Redirecionar',
    icon: 'ExternalLink',
    description: 'Redireciona para URL',
    defaultData: { url: '' }
  },
  {
    id: 'wait',
    type: 'wait',
    category: 'logic',
    label: 'Aguardar',
    icon: 'Clock',
    description: 'Aguarda um tempo',
    defaultData: { seconds: 2 }
  },
  // Booking
  {
    id: 'booking-services',
    type: 'booking-services',
    category: 'booking',
    label: 'Listar Serviços',
    icon: 'Briefcase',
    description: 'Lista serviços disponíveis',
    defaultData: { variable: 'selected_service' }
  },
  {
    id: 'booking-employees',
    type: 'booking-employees',
    category: 'booking',
    label: 'Listar Profissionais',
    icon: 'Users',
    description: 'Lista profissionais do serviço',
    defaultData: { serviceVariable: 'selected_service', variable: 'selected_employee' }
  },
  {
    id: 'booking-slots',
    type: 'booking-slots',
    category: 'booking',
    label: 'Horários Disponíveis',
    icon: 'CalendarClock',
    description: 'Mostra horários disponíveis',
    defaultData: { employeeVariable: 'selected_employee', variable: 'selected_slot' }
  },
  {
    id: 'booking-confirm',
    type: 'booking-confirm',
    category: 'booking',
    label: 'Confirmar Agendamento',
    icon: 'CheckCircle',
    description: 'Confirma o agendamento',
    defaultData: { variables: {} }
  },
  {
    id: 'booking-summary',
    type: 'booking-summary',
    category: 'booking',
    label: 'Resumo do Agendamento',
    icon: 'FileText',
    description: 'Mostra resumo do agendamento',
    defaultData: {}
  },
  // Integrations
  {
    id: 'webhook',
    type: 'webhook',
    category: 'integrations',
    label: 'Webhook',
    icon: 'Webhook',
    description: 'Envia dados para webhook',
    defaultData: { url: '', method: 'POST', headers: {}, body: {} }
  },
  {
    id: 'openai',
    type: 'openai',
    category: 'integrations',
    label: 'OpenAI',
    icon: 'Bot',
    description: 'Resposta com IA',
    defaultData: { prompt: '', variable: '' }
  }
];

export const getNodeConfig = (type: NodeType): NodeConfig | undefined => {
  return NODE_CONFIGS.find(config => config.type === type);
};

export const getNodesByCategory = (category: NodeCategory): NodeConfig[] => {
  return NODE_CONFIGS.filter(config => config.category === category);
};
