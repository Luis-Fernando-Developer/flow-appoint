import { NodeConfig } from "@/types/chatbot";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ScriptConfigProps {
  config: NodeConfig;
  setConfig: (config: NodeConfig) => void;
}

export const ScriptConfig = ({ config, setConfig }: ScriptConfigProps) => {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Código JavaScript</Label>
        <Textarea
          id="code"
          placeholder="// Seu código aqui..."
          value={config.code || ""}
          onChange={(e) => setConfig({ ...config, code: e.target.value })}
          className="min-h-[150px] font-mono text-sm"
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="executeOnServer">Executar no Servidor</Label>
          <p className="text-xs text-muted-foreground">Requer Lovable Cloud</p>
        </div>
        <Switch
          id="executeOnServer"
          checked={config.executeOnServer || false}
          onCheckedChange={(checked) => setConfig({ ...config, executeOnServer: checked })}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Use setVariable('nome', valor) e getVariable('nome') para manipular variáveis.
      </p>
    </div>
  );
};
