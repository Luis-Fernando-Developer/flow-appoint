import { useState } from "react";
import { NodeConfig, ButtonConfig } from "@/types/chatbot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface InputButtonConfigProps {
  config: NodeConfig;
  setConfig: (config: NodeConfig) => void;
}

export const InputButtonConfig = ({ config, setConfig }: InputButtonConfigProps) => {
  const buttons: ButtonConfig[] = config.buttons || [];

  const addButton = () => {
    const newButton: ButtonConfig = {
      id: `btn-${Date.now()}`,
      label: "Novo Botão",
      saveVariable: "",
    };
    setConfig({ ...config, buttons: [...buttons, newButton] });
  };

  const updateButton = (index: number, field: keyof ButtonConfig, value: string) => {
    const updatedButtons = [...buttons];
    updatedButtons[index] = { ...updatedButtons[index], [field]: value };
    setConfig({ ...config, buttons: updatedButtons });
  };

  const removeButton = (index: number) => {
    const updatedButtons = buttons.filter((_, i) => i !== index);
    setConfig({ ...config, buttons: updatedButtons });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Label>Botões</Label>
        <Button size="sm" variant="outline" onClick={addButton}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      <div className="space-y-3">
        {buttons.map((button, index) => (
          <div key={button.id} className="p-3 border rounded-lg space-y-2 bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Botão {index + 1}</span>
              <Button size="icon" variant="ghost" onClick={() => removeButton(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <Input
              placeholder="Texto do botão"
              value={button.label}
              onChange={(e) => updateButton(index, "label", e.target.value)}
            />
            <Input
              placeholder="Salvar em variável (opcional)"
              value={button.saveVariable || ""}
              onChange={(e) => updateButton(index, "saveVariable", e.target.value)}
            />
          </div>
        ))}
      </div>

      {buttons.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum botão adicionado. Clique em "Adicionar" para criar um botão.
        </p>
      )}
    </div>
  );
};
