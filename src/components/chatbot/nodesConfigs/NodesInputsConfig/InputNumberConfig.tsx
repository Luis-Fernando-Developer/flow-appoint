import { NodeConfig } from "@/types/chatbot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InputNumberConfigProps {
  config: NodeConfig;
  setConfig: (config: NodeConfig) => void;
}

export const InputNumberConfig = ({ config, setConfig }: InputNumberConfigProps) => {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="placeholder">Placeholder</Label>
        <Input
          id="placeholder"
          type="text"
          placeholder="Digite um número..."
          value={config.resPonseUserNumber || ""}
          onChange={(e) => setConfig({ ...config, resPonseUserNumber: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="saveVariable">Salvar em variável</Label>
        <Input
          id="saveVariable"
          type="text"
          placeholder="nome_variavel"
          value={config.saveVariable || ""}
          onChange={(e) => setConfig({ ...config, saveVariable: e.target.value })}
        />
      </div>
    </div>
  );
};
