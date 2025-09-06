import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Code, Save } from "lucide-react";

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onSave: () => void;
}

export function CodeEditor({ code, onChange, onSave }: CodeEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  const defaultCode = `
// Exemplo de componente personalizado
function CustomSection() {
  return (
    <section className="py-16 bg-gradient-to-r from-primary/10 to-secondary/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gradient mb-4">
            Seção Personalizada
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Adicione aqui seu conteúdo personalizado usando React e Tailwind CSS.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="card-glow p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">
                Item {item}
              </h3>
              <p className="text-muted-foreground">
                Descrição do item personalizado.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CustomSection;
  `.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Editor de Código Personalizado
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? "Código" : "Preview"}
            </Button>
            <Button size="sm" onClick={onSave}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!showPreview ? (
          <div className="space-y-4">
            <Textarea
              value={code || defaultCode}
              onChange={(e) => onChange(e.target.value)}
              placeholder={defaultCode}
              className="font-mono text-sm min-h-[400px] resize-none"
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Use React functional components</p>
              <p>• Utilize classes do Tailwind CSS para estilização</p>
              <p>• Classes disponíveis: text-gradient, card-glow, btn-neon, animate-float</p>
              <p>• Não esqueça de exportar o componente como default</p>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4 min-h-[400px] bg-muted/50">
            <div className="text-center text-muted-foreground">
              <p className="mb-2">Preview da Seção Personalizada</p>
              <p className="text-xs">
                O preview real será renderizado na landing page quando salvo
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}