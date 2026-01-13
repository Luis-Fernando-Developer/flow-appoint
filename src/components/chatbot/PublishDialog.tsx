import React, { useState, useEffect } from 'react';
import { Globe, Copy, Check, Send, XCircle, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabaseClient } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Container, Edge } from '@/types/chatbot';

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  currentPublicId: string | null;
  isPublished: boolean;
  companySlug: string;
  containers: Container[];
  edges: Edge[];
  onPublishSuccess: (publicId: string, isPublished: boolean) => void;
}

export function PublishDialog({
  open,
  onOpenChange,
  flowId,
  currentPublicId,
  isPublished,
  companySlug,
  containers,
  edges,
  onPublishSuccess,
}: PublishDialogProps) {
  const [publicId, setPublicId] = useState(currentPublicId || '');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (currentPublicId) {
      setPublicId(currentPublicId);
    }
  }, [currentPublicId]);

  const getPublicUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/${companySlug}/flow/${publicId}`;
  };

  const validatePublicId = (value: string) => {
    if (!value) {
      setValidationError('O ID público é obrigatório');
      return false;
    }
    if (value.length < 3) {
      setValidationError('Mínimo 3 caracteres');
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(value)) {
      setValidationError('Apenas letras minúsculas, números e hífens');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handlePublicIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setPublicId(value);
    validatePublicId(value);
  };

  const handlePublish = async () => {
    if (!validatePublicId(publicId)) return;

    setIsPublishing(true);
    try {
      // Check if public_id is already in use by another flow
      const { data: allFlows } = await supabaseClient
        .from('chatbot_flows')
        .select('id')
        .neq('id', flowId);

      const existing = (allFlows as any[])?.find(f => (f as any).public_id === publicId);
      if (existing) {
        setValidationError('Este ID já está em uso por outro fluxo');
        setIsPublishing(false);
        return;
      }

      // Publish the flow - use any to bypass type checking for new columns
      const updateData: any = {
        public_id: publicId,
        is_published: true,
        published_at: new Date().toISOString(),
        published_containers: containers,
        published_edges: edges,
      };

      const { error } = await supabaseClient
        .from('chatbot_flows')
        .update(updateData)
        .eq('id', flowId);

      if (error) throw error;

      toast.success('Bot publicado com sucesso!');
      onPublishSuccess(publicId, true);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error publishing flow:', error);
      toast.error('Erro ao publicar: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setIsUnpublishing(true);
    try {
      const updateData: any = { is_published: false };
      const { error } = await supabaseClient
        .from('chatbot_flows')
        .update(updateData)
        .eq('id', flowId);

      if (error) throw error;

      toast.success('Bot despublicado');
      onPublishSuccess(publicId, false);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error unpublishing flow:', error);
      toast.error('Erro ao despublicar');
    } finally {
      setIsUnpublishing(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(getPublicUrl());
    setCopied(true);
    toast.success('URL copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  const openPreview = () => {
    window.open(getPublicUrl(), '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Publicar Chatbot
          </DialogTitle>
          <DialogDescription>
            {isPublished 
              ? 'Seu bot está publicado. Você pode atualizar ou despublicar.'
              : 'Configure o ID público para compartilhar seu chatbot.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="publicId">ID Público</Label>
            <Input
              id="publicId"
              value={publicId}
              onChange={handlePublicIdChange}
              placeholder="ex: atendimento-inicial"
              className={validationError ? 'border-destructive' : ''}
            />
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Este ID aparecerá na URL pública do seu chatbot
            </p>
          </div>

          {publicId && !validationError && (
            <div className="space-y-2">
              <Label>URL Pública</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={getPublicUrl()}
                  readOnly
                  className="text-xs bg-muted"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={copyUrl}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                {isPublished && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={openPreview}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {isPublished && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Seu chatbot está publicado e acessível
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isPublished && (
            <Button
              variant="outline"
              onClick={handleUnpublish}
              disabled={isUnpublishing}
              className="text-destructive hover:text-destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {isUnpublishing ? 'Despublicando...' : 'Despublicar'}
            </Button>
          )}
          <Button
            onClick={handlePublish}
            disabled={isPublishing || !!validationError || !publicId}
          >
            <Send className="h-4 w-4 mr-2" />
            {isPublishing ? 'Publicando...' : isPublished ? 'Atualizar' : 'Publicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
