import { NodeConfig } from "@/types/chatbot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SetVariableConfigProps {
  config: NodeConfig;
  setConfig: (config: NodeConfig) => void;
}

export const SetVariableConfig = ({ config, setConfig }: SetVariableConfigProps) => {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="variableName">Nome da Variável</Label>
        <Input
          id="variableName"
          type="text"
          placeholder="nome_variavel"
          value={config.variableName || ""}
          onChange={(e) => setConfig({ ...config, variableName: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="value">Valor</Label>
        <Input
          id="value"
          type="text"
          placeholder="Valor ou expressão"
          value={config.value || ""}
          onChange={(e) => setConfig({ ...config, value: e.target.value })}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Use {"{{variavel}}"} para referenciar outras variáveis. Suporta expressões matemáticas simples.
      </p>
    </div>
  );
};
