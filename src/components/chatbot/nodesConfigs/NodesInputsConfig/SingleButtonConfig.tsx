import { useState, useEffect } from "react";
import { ButtonConfig } from "@/types/chatbot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface SingleButtonConfigProps {
  button: ButtonConfig | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<ButtonConfig>) => void;
  onDelete: () => void;
}

export const SingleButtonConfig = ({
  button,
  open,
  onClose,
  onSave,
  onDelete,
}: SingleButtonConfigProps) => {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (button) {
      setLabel(button.label || "");
      setValue(button.value || "");
      setDescription(button.description || "");
    }
  }, [button]);

  const handleSave = () => {
    onSave({
      label: label.trim() || "Botão",
      value: value.trim() || undefined,
      description: description.trim() || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  if (!button) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Configurar Botão</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="btn-label">Texto do Botão</Label>
            <Input
              id="btn-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Sim, quero!"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="btn-value">
              Valor a Salvar{" "}
              <span className="text-muted-foreground text-xs">
                (opcional, padrão = texto)
              </span>
            </Label>
            <Input
              id="btn-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ex: yes"
            />
            <p className="text-xs text-muted-foreground">
              Se vazio, o texto do botão será usado como valor.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="btn-description">
              Descrição{" "}
              <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Textarea
              id="btn-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição adicional..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="mr-auto"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
