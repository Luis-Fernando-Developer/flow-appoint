import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";

interface CustomizationData {
  header_position: string;
  header_background_type: string;
  header_background_color: string;
  header_background_gradient: any;
  font_family: string;
  font_size_base: number;
  font_color_type: string;
  font_color: string;
  font_gradient: any;
  hero_banner_type: string;
  hero_banner_urls: string[];
  hero_background_type: string;
  hero_background_color: string;
  hero_background_gradient: any;
  hero_title: string;
  hero_description: string;
  cards_show_images: boolean;
  cards_layout: string;
  cards_font_family: string;
  cards_color_type: string;
  cards_color: string;
  cards_gradient: any;
  extra_section_enabled: boolean;
  extra_section_code: string;
  footer_background_type: string;
  footer_background_color: string;
  footer_background_gradient: any;
  footer_font_family: string;
}

export default function CustomLandingPage() {
  const { slug } = useParams();
  const [company, setCompany] = useState<any>(null);
  const [customization, setCustomization] = useState<CustomizationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchData();
    }
  }, [slug]);

  const fetchData = async () => {
    try {
      // Fetch company data
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (companyError || !companyData) {
        setLoading(false);
        return;
      }

      setCompany(companyData);

      // Fetch customization data
      const { data: customizationData } = await supabase
        .from('company_customizations')
        .select('*')
        .eq('company_id', companyData.id)
        .maybeSingle();

      setCustomization(customizationData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateGradient = (gradientData: any) => {
    if (!gradientData) return '';
    const { type, angle, colors } = gradientData;
    const colorString = colors.join(', ');
    return type === 'linear' 
      ? `linear-gradient(${angle}deg, ${colorString})`
      : `radial-gradient(${colorString})`;
  };

  const applyCustomStyles = () => {
    if (!customization) return {};

    const styles: any = {};

    // Apply font settings
    if (customization.font_family) {
      styles['--font-family'] = customization.font_family;
    }
    if (customization.font_size_base) {
      styles['--font-size-base'] = `${customization.font_size_base}px`;
    }

    // Apply color settings
    if (customization.font_color_type === 'gradient' && customization.font_gradient) {
      styles['--text-gradient'] = generateGradient(customization.font_gradient);
    } else if (customization.font_color) {
      styles['--text-color'] = customization.font_color;
    }

    // Apply hero background
    if (customization.hero_background_type === 'gradient' && customization.hero_background_gradient) {
      styles['--hero-background'] = generateGradient(customization.hero_background_gradient);
    } else if (customization.hero_background_color) {
      styles['--hero-background'] = customization.hero_background_color;
    }

    // Apply header background
    if (customization.header_background_type === 'gradient' && customization.header_background_gradient) {
      styles['--header-background'] = generateGradient(customization.header_background_gradient);
    } else if (customization.header_background_color) {
      styles['--header-background'] = customization.header_background_color;
    }

    // Apply footer background
    if (customization.footer_background_type === 'gradient' && customization.footer_background_gradient) {
      styles['--footer-background'] = generateGradient(customization.footer_background_gradient);
    } else if (customization.footer_background_color) {
      styles['--footer-background'] = customization.footer_background_color;
    }

    return styles;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gradient mb-4">Empresa não encontrada</h1>
          <p className="text-muted-foreground mb-8">A empresa que você procura não existe ou está inativa.</p>
        </div>
      </div>
    );
  }

  const customStyles = applyCustomStyles();

  return (
    <div 
      className="min-h-screen"
      style={customStyles}
    >
      {/* Apply custom CSS for dynamic styling */}
      <style>
        {`
          :root {
            ${customStyles['--font-family'] ? `--font-primary: ${customStyles['--font-family']};` : ''}
            ${customStyles['--font-size-base'] ? `--font-size-base: ${customStyles['--font-size-base']};` : ''}
          }
          
          ${customStyles['--hero-background'] ? `
          .hero-custom-bg {
            background: ${customStyles['--hero-background']} !important;
          }
          ` : ''}
          
          ${customStyles['--header-background'] ? `
          .header-custom-bg {
            background: ${customStyles['--header-background']} !important;
          }
          ` : ''}
          
          ${customStyles['--footer-background'] ? `
          .footer-custom-bg {
            background: ${customStyles['--footer-background']} !important;
          }
          ` : ''}
          
          ${customStyles['--text-gradient'] ? `
          .text-custom-gradient {
            background: ${customStyles['--text-gradient']};
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          ` : ''}
          
          ${customStyles['--text-color'] ? `
          .text-custom-color {
            color: ${customStyles['--text-color']} !important;
          }
          ` : ''}
          
          ${customization?.font_family ? `
          body, * {
            font-family: ${customization.font_family}, system-ui, sans-serif !important;
          }
          ` : ''}
        `}
      </style>

      {/* Header */}
      {customization?.header_position === 'fixed' && (
        <header className={`fixed top-0 left-0 right-0 z-50 border-b border-primary/20 backdrop-blur-sm ${customization.header_background_type ? 'header-custom-bg' : 'bg-card/30'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {company.logo_url && (
                  <img src={company.logo_url} alt={company.name} className="w-10 h-10 rounded-lg" />
                )}
                <h1 className={`text-2xl font-bold ${customization?.font_color_type === 'gradient' ? 'text-custom-gradient' : customization?.font_color ? 'text-custom-color' : 'text-gradient'}`}>
                  {company.name}
                </h1>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className={customization?.header_position === 'fixed' ? 'pt-20' : ''}>
        {/* Hero Section with Custom Styling */}
        <section className={`relative min-h-screen flex items-center justify-center overflow-hidden ${customization?.hero_background_type ? 'hero-custom-bg' : 'bg-gradient-hero'}`}>
          {/* Background Elements */}
          <div className="absolute inset-0">
            {customization?.hero_banner_urls && customization.hero_banner_urls.length > 0 && (
              customization.hero_banner_type === 'carousel' ? (
                <div className="absolute inset-0">
                  {/* Carousel implementation would go here */}
                  <img 
                    src={customization.hero_banner_urls[0]} 
                    alt="Hero banner"
                    className="w-full h-full object-cover opacity-20"
                  />
                </div>
              ) : (
                <div className="absolute inset-0">
                  <img 
                    src={customization.hero_banner_urls[0]} 
                    alt="Hero banner"
                    className="w-full h-full object-cover opacity-20"
                  />
                </div>
              )
            )}
            <div className="absolute top-20 left-10 w-72 h-72 bg-neon-violet/10 rounded-full blur-3xl animate-pulse-glow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-pink/10 rounded-full blur-3xl animate-float"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className={`text-5xl lg:text-7xl font-bold mb-6 ${customization?.font_color_type === 'gradient' ? 'text-custom-gradient' : customization?.font_color ? 'text-custom-color' : ''}`}>
                {customization?.hero_title || 'Agendamentos Inteligentes'}
              </h1>
              
              <p className={`text-xl mb-8 max-w-2xl mx-auto ${customization?.font_color ? 'text-custom-color' : 'text-muted-foreground'}`}>
                {customization?.hero_description || 'Transforme a gestão do seu negócio com nossa plataforma completa de agendamentos online.'}
              </p>
            </div>
          </div>
        </section>

        {/* Extra Section */}
        {customization?.extra_section_enabled && customization.extra_section_code && (
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div dangerouslySetInnerHTML={{ __html: customization.extra_section_code }} />
            </div>
          </section>
        )}

        {/* Features */}
        <Features />

        {/* Pricing */}
        <Pricing />

        {/* Footer */}
        <footer className={`${customization?.footer_background_type ? 'footer-custom-bg' : ''}`}>
          <Footer />
        </footer>
      </div>
    </div>
  );
}