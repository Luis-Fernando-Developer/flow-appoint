import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Phone, Mail, Menu, LogInIcon, UserPlus2, ChevronDown, DoorClosedIcon, X, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BookingLogo } from "@/components/BookingLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Divide as Hamburger } from 'hamburger-react';

interface CustomizationData {
  header_position: string;
  header_background_type: string;
  header_background_color: string;
  header_background_gradient: any;
  logo_type?: string;
  logo_url?: string;
  logo_upload_path?: string;
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
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeServices, setEmployeeServices] = useState<any[]>([]);
  const [customization, setCustomization] = useState<CustomizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannerIndex, setBannerIndex] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [optionHeader, setOptionHeader] = useState(false);
  const [visibleServices, setVisibleServices] = useState(4);
  const [visibleEmployees, setVisibleEmployees] = useState(4);

  useEffect(() => {
    if ( slug) {
      fetchData();
    }
    if (customization?.header_position === 'fixed' && headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, [slug]);

  useLayoutEffect(() => {
    if (customization?.header_position === 'fixed' && headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, [customization, company]);

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

      // Fetch services data
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', companyData.id)
        .eq('is_active', true);

      setServices(servicesData || []);

      // Fetch employees data - apenas funcionários ativos
      const { data: employeesData } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyData.id)
        .eq('is_active', true);

      setEmployees(employeesData || []);

      // Fetch employee services relationship
      if (employeesData && employeesData.length > 0) {
        const { data: employeeServicesData } = await supabase
          .from('employee_services')
          .select(`
            employee_id,
            service_id,
            services (
              id,
              name
            )
          `)
          .in('employee_id', employeesData.map(emp => emp.id));

        setEmployeeServices(employeeServicesData || []);
      }

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

  // const handlerOptionsHeader = () => {
  //   setOptionHeader(true);
  // }

  const nextBanner = () => {
    if (customization?.hero_banner_urls && customization.hero_banner_urls.length > 1) {
      setBannerIndex((prevIndex) => (prevIndex + 1) % customization.hero_banner_urls.length);
    }
  };

  const prevBanner = () => {
    if (customization?.hero_banner_urls && customization.hero_banner_urls.length > 1) {
      setBannerIndex((prevIndex) => (prevIndex - 1 + customization.hero_banner_urls.length) % customization.hero_banner_urls.length);
    }
  };

  const getLogoUrl = () => {
    if (!customization) return null;
    
    if (customization.logo_type === 'upload' && customization.logo_upload_path) {
      const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(customization.logo_upload_path);
      return data.publicUrl;
    }
    
    if (customization.logo_type === 'url' && customization.logo_url) {
      return customization.logo_url;
    }
    
    return null;
  };

  const loadMoreServices = () => {
    setVisibleServices(prev => Math.min(prev + 2, services.length));
  };

  const loadMoreEmployees = () => {
    setVisibleEmployees(prev => Math.min(prev + 2, employees.length));
  };

  const getEmployeeServices = (employeeId: string) => {
    return employeeServices
      .filter(es => es.employee_id === employeeId)
      .map(es => es.services?.name)
      .filter(Boolean);
  };

  const generateCardsStyles = () => {
    if (!customization) return {};
    
    const styles: any = {};
    
    if (customization.cards_color_type === 'gradient' && customization.cards_gradient) {
      styles['--cards-background'] = generateGradient(customization.cards_gradient);
    } else if (customization.cards_color) {
      styles['--cards-color'] = customization.cards_color;
    }
    
    return styles;
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
          
          ${generateCardsStyles()['--cards-background'] ? `
          .cards-custom-bg {
            background: ${generateCardsStyles()['--cards-background']} !important;
          }
          ` : ''}
          
          ${generateCardsStyles()['--cards-color'] ? `
          .cards-custom-color {
            color: ${generateCardsStyles()['--cards-color']} !important;
          }
          ` : ''}
          
          ${customization?.font_family ? `
          .custom-font {
            font-family: ${customization.font_family}, system-ui, sans-serif !important;
          }
          ` : ''}

      
          
          ${customization?.cards_font_family && customization.cards_font_family !== 'Inter' ? `
          .cards-custom-font {
            font-family: ${customization.cards_font_family}, system-ui, sans-serif !important;
          }
          ` : ''}
        `}
      </style>

      {/* Header */}
      {customization?.header_position === 'fixed' && (
        <header 
          ref={headerRef}
          className={`fixed top-0 left-0 right-0 z-50  backdrop-blur-sm ${customization.header_background_type ? 'header-custom-bg' : 'bg-card/30'}`}>
          <div className="max-w-7xl  mx-auto  px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center  justify-between">
              <div className="w-full justify-between flex items-center gap-4 ">
                {getLogoUrl() ? (
                  <img 
                    src={getLogoUrl()!} 
                    alt={`Logo ${company.name}`}
                    className="w-8 h-8 object-contain"
                  />

                ) : (
                  <div className='p-0'>
                    {company.name}
                  </div>
                )}
                <h1 className={`text-2xl font-bold ${customization?.font_color_type === 'gradient' ? 'text-custom-gradient' : customization?.font_color ? 'text-custom-color' : 'text-gradient'}`}>
                  {company.name}
                </h1>
              <div className="flex items-center">
                  <Button variant={optionHeader ? "none2" : "none"} onClick={() => setOptionHeader(!optionHeader)} className="transparent p-0 ">
                  <Hamburger size={20} duration={1} toggled={optionHeader} toggle={setOptionHeader} color="white" />
                </Button>
              </div>
              </div>
            </div>
              {optionHeader && (
                <div className={`flex ${customization?.header_background_type ? 'p-0 mt-2 border-t border-primary/40 pt-2' : ''}`}>
                  <div className="flex gap-1 justify-end items-center w-full ">
                    <Button 
                      variant="ghost" 
                      className=" bg-black/20 font-bold custom-font"
                      onClick={() => navigate(`/${slug}/entrar`)}
                    >
                      <LogInIcon />
                      Entrar
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="bg-black/20 font-bold custom-font"
                      onClick={() => navigate(`/${slug}/cadastro`)}
                    >
                      <UserPlus2 />
                      Cadastrar
                    </Button>
                  </div>
                  
                </div>
              )}
          </div>
        </header>
      )}
      {customization?.header_position === 'relative' && (
        <header 
          ref={headerRef}
          className={`relative top-0 left-0 right-0 z-50  backdrop-blur-sm ${customization.header_background_type ? 'header-custom-bg' : 'bg-card/30'}`}>
          <div className="max-w-7xl  mx-auto  px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center  justify-between">
              <div className="w-full justify-between flex items-center gap-4 ">
                {getLogoUrl() ? (
                  <img 
                    src={getLogoUrl()!} 
                    alt={`Logo ${company.name}`}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <BookingLogo showText={false} className="pt-0" />
                )}
                <h1 className={`text-2xl font-bold ${customization?.font_color_type === 'gradient' ? 'text-custom-gradient' : customization?.font_color ? 'text-custom-color' : 'text-gradient'}`}>
                  {company.name}
                </h1>
              <div className="flex items-center">
                <Button variant={optionHeader ? "ghost" : "link"} onClick={() => setOptionHeader(!optionHeader)} className="transparent p-0">
                  <Hamburger size={20} duration={1} toggled={optionHeader} toggle={setOptionHeader} color="white" />
                </Button>
              </div>
              </div>
            </div>
              {optionHeader && (
                <div className={`flex ${customization?.header_background_type ? 'p-0 mt-2 border-t border-primary/40 pt-2' : ''}`}>
                  <div className="flex gap-1 justify-end items-center w-full ">
                    <Button 
                      variant="ghost" 
                      className=" bg-black/20 font-bold custom-font"
                      onClick={() => navigate(`/${slug}/entrar`)}
                    >
                      <LogInIcon />
                      ENTRAR
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="bg-black/20 font-bold custom-font"
                      onClick={() => navigate(`/${slug}/cadastro`)}
                    >
                      <UserPlus2 />
                      CADASTRAR
                    </Button>
                  </div>
                  
                </div>
              )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <div style={customization?.header_position === 'fixed' ? {paddingTop: headerHeight} : {}}>
        {/* Hero Section with Custom Styling */}
        <section className={`relative h-[500px] flex items-center justify-center overflow-hidden ${customization?.hero_background_type ? 'hero-custom-bg' : 'bg-gradient-hero'}`}>
          {/* Background Elements */}
          <div className="absolute inset-0">
            {customization?.hero_banner_urls && customization.hero_banner_urls.length > 0 && (
              <div className="absolute inset-0 ">
                <img
                  src={customization.hero_banner_urls[bannerIndex]}
                  alt="Hero banner"
                  className="w-full h-full object-fit opacity-50"
                />
                {customization.hero_banner_urls.length > 1 && (
                  <>
                    <button
                      onClick={prevBanner}
                      className=" absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition"
                      style={{ zIndex: 20 }}
                    >&#8592;</button>
                    <button
                      onClick={nextBanner}
                      className=" absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition"
                      style={{ zIndex: 20 }}
                    >&#8594;</button>
                  </>
                )}
              </div>
            )}
            <div className="absolute top-20 left-10 w-72 h-72 bg-neon-violet/10 rounded-full blur-3xl animate-pulse-glow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-pink/10 rounded-full blur-3xl animate-float"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className={`text-5xl lg:text-7xl font-bold mb-6 ${customization?.font_color_type === 'gradient' ? 'text-custom-gradient' : customization?.font_color ? 'text-custom-color' : ''}`}>
                {customization?.hero_title || ''}
              </h1>
              
              <p className={`text-xl mb-8 max-w-2xl mx-auto ${customization?.font_color ? 'text-custom-color' : 'text-muted-foreground'}`}>
                {customization?.hero_description || ''}
              </p>
            </div>
          </div>
        </section>

        {/* Extra Section */}
        {customization?.extra_section_enabled && customization.extra_section_code && (
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
              <div dangerouslySetInnerHTML={{ __html: customization.extra_section_code }} />
            </div>
          </section>
        )}

        {/* Serviços */}
        <section className="py-16 bg-card/30  border-2 border-green-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className={`text-3xl font-bold mb-4 ${customization?.font_color_type === 'gradient' ? 'text-custom-gradient' : customization?.font_color ? 'text-custom-color' : 'text-gradient'}`}>
                Nossos Serviços
              </h2>
              <p className={`max-w-2xl mx-auto custom-font ${customization?.cards_color_type === 'gradient' ? 'cards-custom-color' : customization?.cards_color ? 'cards-custom-color' : 'text-muted-foreground'}`}>
                Conheça todos os serviços que oferecemos para você
              </p>
              
            </div>
            
            <div className={`grid gap-6 ${
              customization?.cards_layout === 'horizontal' 
                ? 'grid-cols-1' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {services.slice(0, visibleServices).map((service) => (
                <div 
                  key={service.id} 
                  className={`rounded-lg border border-primary/20 p-6 hover:border-primary/40 transition-colors custom-font ${
                    customization?.cards_layout === 'horizontal' ? 'flex gap-6 items-center' : ''
                  } ${
                    customization?.cards_color_type === 'gradient' ? 'cards-custom-bg' : 'bg-card'
                  } ${
                    customization?.cards_font_family ? 'cards-custom-font' : ''
                  }`}
                >
                  {customization?.cards_show_images && service.image_url && (
                    <img 
                      src={service.image_url} 
                      alt={service.name}
                      className={`object-cover rounded-lg ${
                        customization?.cards_layout === 'horizontal' 
                          ? 'w-32 h-32 flex-shrink-0' 
                          : 'w-full h-48 mb-4'
                      }`}
                    />
                  )}
                  <div className="flex-1">
                    <h3 className={`text-xl font-semibold mb-2 custom-font ${
                      customization?.cards_color_type === 'gradient' ? 'cards-custom-color' : customization?.cards_color ? 'cards-custom-color' : ''
                    }`}>
                      {service.name}
                    </h3>
                    {service.description && (
                      <p className={`mb-4 custom-font ${
                        customization?.cards_color_type === 'gradient' ? 'cards-custom-color' : customization?.cards_color ? 'cards-custom-color' : 'text-muted-foreground'
                      }`}>
                        {service.description}
                      </p>
                    )}
                    <div className={`flex justify-between items-center ${
                      customization?.cards_layout === 'horizontal' ? 'mt-4' : ''
                    }`}>
                      <span className="text-2xl font-bold text-primary custom-font">
                        R$ {Number(service.price).toFixed(2)}
                      </span>
                      <span className={`text-sm custom-font ${
                        customization?.cards_color_type === 'gradient' ? 'cards-custom-color' : customization?.cards_color ? 'cards-custom-color' : 'text-muted-foreground'
                      }`}>
                        {service.duration_minutes} min
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {visibleServices < services.length && (
              <div className="text-center mt-8">
                <Button 
                  variant="outline" 
                  onClick={loadMoreServices}
                  className="px-6 py-2 custom-font"
                >
                  Carregar mais serviços <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            )}
            
            <div className="text-center mt-12">
              <button 
                onClick={() => navigate(`/${slug}/agendar`)}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Agendar Agora
              </button>
            </div>
          </div>
        </section>

        {/* Profissionais */}
        {employees.length > 0 && (
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className={`text-3xl font-bold mb-4 ${customization?.cards_font_family ? 'cards-custom-font' : ''} ${customization?.font_color_type === 'gradient' ? 'text-custom-gradient' : customization?.font_color ? 'text-custom-color' : 'text-gradient'}`}>
                  Nossa Equipe
                </h2>
                <p className={`max-w-2xl mx-auto ${customization?.cards_color_type === 'gradient' ? 'cards-custom-color' : customization?.cards_color ? 'cards-custom-color' : 'text-muted-foreground'}`}>
                  Conheça nossos profissionais especializados
                </p>
              </div>
              
              <div className={`grid gap-6 ${
                customization?.cards_layout === 'horizontal' 
                  ? 'grid-cols-1' 
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {employees.slice(0, visibleEmployees).map((employee) => {
                  const employeeServiceNames = getEmployeeServices(employee.id);
                  
                  return (
                    <div 
                      key={employee.id} 
                      className={`rounded-lg border border-primary/20 p-6 hover:border-primary/40 transition-colors ${
                        customization?.cards_layout === 'horizontal' ? 'flex gap-6 items-center' : ''
                      } ${
                        customization?.cards_color_type === 'gradient' ? 'cards-custom-bg' : 'bg-card'
                      } ${
                        customization?.cards_font_family ? 'cards-custom-font' : ''
                      }`}
                    >
                      {customization?.cards_show_images && employee.avatar_url && (
                        <img 
                          src={employee.avatar_url} 
                          alt={employee.name}
                          className={`object-cover rounded-full ${
                            customization?.cards_layout === 'horizontal' 
                              ? 'w-20 h-20 flex-shrink-0' 
                              : 'w-24 h-24 mx-auto mb-4'
                          }`}
                        />
                      )}
                      <div className={`flex-1 ${customization?.cards_layout === 'horizontal' ? '' : 'text-center'}`}>
                        <h3 className={`text-xl font-semibold mb-2 ${
                          customization?.cards_color_type === 'gradient' ? 'cards-custom-color' : customization?.cards_color ? 'cards-custom-color' : ''
                        }`}>
                          {employee.name}
                        </h3>
                        {employeeServiceNames.length > 0 && (
                          <div className="flex flex-wrap gap-2 justify-center">
                            {employeeServiceNames.map((serviceName, index) => (
                              <Badge 
                                key={index}
                                variant="secondary"
                                className="text-xs custom-font"
                              >
                                {serviceName}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {visibleEmployees < employees.length && (
                <div className="text-center mt-8">
                  <Button 
                    variant="outline" 
                    onClick={loadMoreEmployees}
                    className="px-6 py-2"
                  >
                    Carregar mais profissionais <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Informações da Empresa */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gradient mb-6">Sobre {company.name}</h2>
                <div className="space-y-4">
                  {company.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span>{company.address}, {company.city} - {company.state}</span>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <span>{company.owner_email}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-card/50 rounded-lg p-8 border border-primary/20">
                <h3 className="text-xl font-semibold mb-4">Horário de Funcionamento</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>Segunda a Sexta: 8:00 - 18:00</p>
                  <p>Sábado: 8:00 - 16:00</p>
                  <p>Domingo: Fechado</p>
                </div>
                <div className="mt-6">
                  <button 
                    onClick={() => navigate(`/${slug}/agendar`)}
                    className="w-full bg-neon-violet text-white px-6 py-3 rounded-lg font-semibold hover:bg-neon-violet/90 transition-colors"
                  >
                    Fazer Agendamento
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Simples */}
        <footer className={`py-8 border-t border-primary/20 ${customization?.footer_background_type ? 'footer-custom-bg' : 'bg-card/30'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-muted-foreground">
                © 2024 {company.name}. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}