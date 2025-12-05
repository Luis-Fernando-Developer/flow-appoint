import { NodeConfig } from "@/types/chatbot";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BubbleTextConfigProps {
  config: NodeConfig;
  setConfig: (config: NodeConfig) => void;
}

export const BubbleTextConfig = ({ config, setConfig }: BubbleTextConfigProps) => {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="message">Mensagem</Label>
        <Textarea
          id="message"
          placeholder="Digite a mensagem do bot..."
          value={config.message || ""}
          onChange={(e) => setConfig({ ...config, message: e.target.value })}
          className="min-h-[100px]"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Use {"{{variavel}}"} para inserir variáveis e [texto](url) para links.
      </p>
    </div>
  );
};
