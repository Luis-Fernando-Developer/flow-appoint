import { NodeConfig } from "@/types/chatbot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InputMailConfigProps {
  config: NodeConfig;
  setConfig: (config: NodeConfig) => void;
}

export const InputMailConfig = ({ config, setConfig }: InputMailConfigProps) => {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="placeholder">Placeholder</Label>
        <Input
          id="placeholder"
          type="text"
          placeholder="Digite seu email..."
          value={config.responseUserTextInput || ""}
          onChange={(e) => setConfig({ ...config, responseUserTextInput: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="saveVariable">Salvar em variável</Label>
        <Input
          id="saveVariable"
          type="text"
          placeholder="email"
          value={config.saveVariable || ""}
          onChange={(e) => setConfig({ ...config, saveVariable: e.target.value })}
        />
      </div>
    </div>
  );
};
