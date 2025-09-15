import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ColorPicker } from "./ColorPicker";
import { CodeEditor } from "./CodeEditor";
import { Save, Lock, Unlock, Upload, Link, Palette, Type, Image, Layout, Code } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LandingPageCustomizerProps {
  companyId: string;
  companyPlan: string;
  canEdit: boolean;
}

interface CustomizationData {
  // Header
  header_position: string;
  header_background_type: string;
  header_background_color: string;
  header_background_gradient: any;
  
  // Font
  font_family: string;
  font_size_base: number;
  font_color_type: string;
  font_color: string;
  font_gradient: any;
  
  // Hero
  hero_banner_type: string;
  hero_banner_urls: string[];
  hero_background_type: string;
  hero_background_color: string;
  hero_background_gradient: any;
  hero_title: string;
  hero_description: string;
  
  // Cards
  cards_show_images: boolean;
  cards_layout: string;
  cards_font_family: string;
  cards_color_type: string;
  cards_color: string;
  cards_gradient: any;
  
  // Extra section
  extra_section_enabled: boolean;
  extra_section_code: string;
  
  // Footer
  footer_background_type: string;
  footer_background_color: string;
  footer_background_gradient: any;
  footer_font_family: string;
}

const fontOptions = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Poppins", label: "Poppins" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Montserrat", label: "Montserrat" },
];

export function LandingPageCustomizer({ companyId, companyPlan, canEdit }: LandingPageCustomizerProps) {
  const [customization, setCustomization] = useState<CustomizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const isPremiumPlan = companyPlan !== "starter";
  const isLocked = !isPremiumPlan || !canEdit;

  useEffect(() => {
    fetchCustomization();
  }, [companyId]);

  const fetchCustomization = async () => {
    try {
      const { data, error } = await supabase
        .from('company_customizations')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCustomization(data);
      } else {
        // Create default customization
        const defaultData = {
          header_position: 'fixed',
          header_background_type: 'solid',
          header_background_color: 'hsl(251, 91%, 65%)',
          header_background_gradient: { type: "linear", angle: 45, colors: ["hsl(251, 91%, 65%)", "hsl(308, 56%, 85%)"] },
          font_family: 'Inter',
          font_size_base: 16,
          font_color_type: 'solid',
          font_color: 'hsl(240, 10%, 3.9%)',
          font_gradient: { type: "linear", angle: 45, colors: ["hsl(240, 10%, 3.9%)", "hsl(251, 91%, 65%)"] },
          hero_banner_type: 'single',
          hero_banner_urls: [],
          hero_background_type: 'gradient',
          hero_background_color: 'hsl(240, 10%, 3.9%)',
          hero_background_gradient: { type: "linear", angle: 135, colors: ["hsl(251, 91%, 65%)", "hsl(308, 56%, 85%)", "hsl(240, 10%, 3.9%)"] },
          hero_title: 'Agendamentos Inteligentes',
          hero_description: 'Transforme a gestão do seu negócio com nossa plataforma completa de agendamentos online.',
          cards_show_images: false,
          cards_layout: 'vertical',
          cards_font_family: 'Inter',
          cards_color_type: 'solid',
          cards_color: 'hsl(240, 10%, 3.9%)',
          cards_gradient: { type: "linear", angle: 45, colors: ["hsl(240, 10%, 3.9%)", "hsl(251, 91%, 65%)"] },
          extra_section_enabled: false,
          extra_section_code: '',
          footer_background_type: 'gradient',
          footer_background_color: 'hsl(240, 10%, 3.9%)',
          footer_background_gradient: { type: "linear", angle: 180, colors: ["hsl(240, 10%, 3.9%)", "hsl(251, 91%, 65%)"] },
          footer_font_family: 'Inter',
        };
        
        setCustomization(defaultData);
      }
    } catch (error) {
      console.error('Error fetching customization:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de personalização",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCustomization = async () => {
    if (!customization) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('company_customizations')
        .upsert({
          company_id: companyId,
          ...customization
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Personalização salva com sucesso!",
      });
    } catch (error) {
      console.error('Error saving customization:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar personalização",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateCustomization = (field: keyof CustomizationData, value: any) => {
    if (!customization) return;
    setCustomization({ ...customization, [field]: value });
  };

  const addBannerUrl = () => {
    if (!customization) return;
    const urls = [...customization.hero_banner_urls, ""];
    updateCustomization('hero_banner_urls', urls);
  };

  const updateBannerUrl = (index: number, url: string) => {
    if (!customization) return;
    const urls = [...customization.hero_banner_urls];
    urls[index] = url;
    updateCustomization('hero_banner_urls', urls);
  };

  const removeBannerUrl = (index: number) => {
    if (!customization) return;
    const urls = customization.hero_banner_urls.filter((_, i) => i !== index);
    updateCustomization('hero_banner_urls', urls);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (!customization) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Personalização da Landing Page
            {isLocked && (
              <Badge variant="secondary" className="ml-2">
                <Lock className="w-3 h-3 mr-1" />
                {!isPremiumPlan ? "Plano Premium Necessário" : "Sem Permissão"}
              </Badge>
            )}
            {!isLocked && (
              <Badge variant="outline" className="ml-2">
                <Unlock className="w-3 h-3 mr-1" />
                Desbloqueado
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {!isPremiumPlan && (
              <Button variant="outline" size="sm">
                Upgrade de Plano
              </Button>
            )}
            <Button onClick={saveCustomization} disabled={saving || isLocked} size="sm">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="header" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="header">Header</TabsTrigger>
            <TabsTrigger value="font">Font</TabsTrigger>
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="extra">Extra</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
          </TabsList>

          <TabsContent value="header" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Posição do Header</Label>
                <Select 
                  value={customization.header_position} 
                  onValueChange={(value) => updateCustomization('header_position', value)}
                  disabled={isLocked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixo</SelectItem>
                    <SelectItem value="relative">Relativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ColorPicker
                type={customization.header_background_type as "solid" | "gradient"}
                solidColor={customization.header_background_color}
                gradientSettings={customization.header_background_gradient}
                onTypeChange={(type) => updateCustomization('header_background_type', type)}
                onSolidColorChange={(color) => updateCustomization('header_background_color', color)}
                onGradientChange={(gradient) => updateCustomization('header_background_gradient', gradient)}
                label="Cor do Header"
              />
            </div>
          </TabsContent>

          <TabsContent value="font" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Família da Fonte</Label>
                <Select 
                  value={customization.font_family} 
                  onValueChange={(value) => updateCustomization('font_family', value)}
                  disabled={isLocked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tamanho Base (px)</Label>
                <Input
                  type="number"
                  value={customization.font_size_base}
                  onChange={(e) => updateCustomization('font_size_base', parseInt(e.target.value))}
                  disabled={isLocked}
                />
              </div>
            </div>

            <ColorPicker
              type={customization.font_color_type as "solid" | "gradient"}
              solidColor={customization.font_color}
              gradientSettings={customization.font_gradient}
              onTypeChange={(type) => updateCustomization('font_color_type', type)}
              onSolidColorChange={(color) => updateCustomization('font_color', color)}
              onGradientChange={(gradient) => updateCustomization('font_gradient', gradient)}
              label="Cor da Fonte"
            />
          </TabsContent>

          <TabsContent value="hero" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={customization.hero_title}
                  onChange={(e) => updateCustomization('hero_title', e.target.value)}
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Banner</Label>
                <Select 
                  value={customization.hero_banner_type} 
                  onValueChange={(value) => updateCustomization('hero_banner_type', value)}
                  disabled={isLocked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Banner Único</SelectItem>
                    <SelectItem value="carousel">Carrossel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={customization.hero_description}
                onChange={(e) => updateCustomization('hero_description', e.target.value)}
                disabled={isLocked}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>URLs dos Banners</Label>
              <div className="space-y-2">
                {customization.hero_banner_urls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={url}
                      onChange={(e) => updateBannerUrl(index, e.target.value)}
                      placeholder="https://exemplo.com/imagem.jpg"
                      disabled={isLocked}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeBannerUrl(index)}
                      disabled={isLocked}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  onClick={addBannerUrl}
                  disabled={isLocked}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Adicionar Banner
                </Button>
              </div>
            </div>

            <ColorPicker
              type={customization.hero_background_type as "solid" | "gradient"}
              solidColor={customization.hero_background_color}
              gradientSettings={customization.hero_background_gradient}
              onTypeChange={(type) => updateCustomization('hero_background_type', type)}
              onSolidColorChange={(color) => updateCustomization('hero_background_color', color)}
              onGradientChange={(gradient) => updateCustomization('hero_background_gradient', gradient)}
              label="Fundo do Hero"
            />
          </TabsContent>

          <TabsContent value="cards" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Layout dos Cards</Label>
                <Select 
                  value={customization.cards_layout} 
                  onValueChange={(value) => updateCustomization('cards_layout', value)}
                  disabled={isLocked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vertical">Vertical</SelectItem>
                    <SelectItem value="horizontal">Horizontal (com imagem)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fonte dos Cards</Label>
                <Select 
                  value={customization.cards_font_family} 
                  onValueChange={(value) => updateCustomization('cards_font_family', value)}
                  disabled={isLocked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mostrar Imagens nos Cards</Label>
                <p className="text-sm text-muted-foreground">
                  Permite adicionar imagens aos cards de serviços
                </p>
              </div>
              <Switch
                checked={customization.cards_show_images}
                onCheckedChange={(checked) => updateCustomization('cards_show_images', checked)}
                disabled={isLocked}
              />
            </div>

            <ColorPicker
              type={customization.cards_color_type as "solid" | "gradient"}
              solidColor={customization.cards_color}
              gradientSettings={customization.cards_gradient}
              onTypeChange={(type) => updateCustomization('cards_color_type', type)}
              onSolidColorChange={(color) => updateCustomization('cards_color', color)}
              onGradientChange={(gradient) => updateCustomization('cards_gradient', gradient)}
              label="Cor dos Cards"
            />
          </TabsContent>

          <TabsContent value="extra" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Habilitar Seção Extra</Label>
                <p className="text-sm text-muted-foreground">
                  Adiciona uma seção personalizada abaixo do hero
                </p>
              </div>
              <Switch
                checked={customization.extra_section_enabled}
                onCheckedChange={(checked) => updateCustomization('extra_section_enabled', checked)}
                disabled={isLocked}
              />
            </div>

            {customization.extra_section_enabled && (
              <CodeEditor
                code={customization.extra_section_code}
                onChange={(code) => updateCustomization('extra_section_code', code)}
                onSave={saveCustomization}
              />
            )}
          </TabsContent>

          <TabsContent value="footer" className="space-y-4">
            <div className="space-y-2">
              <Label>Fonte do Footer</Label>
              <Select 
                value={customization.footer_font_family} 
                onValueChange={(value) => updateCustomization('footer_font_family', value)}
                disabled={isLocked}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ColorPicker
              type={customization.footer_background_type as "solid" | "gradient"}
              solidColor={customization.footer_background_color}
              gradientSettings={customization.footer_background_gradient}
              onTypeChange={(type) => updateCustomization('footer_background_type', type)}
              onSolidColorChange={(color) => updateCustomization('footer_background_color', color)}
              onGradientChange={(gradient) => updateCustomization('footer_background_gradient', gradient)}
              label="Fundo do Footer"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}