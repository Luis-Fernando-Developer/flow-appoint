import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, Crown, Rocket } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "R$ 29",
    period: "/mês",
    description: "Perfeito para começar",
    icon: Zap,
    features: [
      "Até 100 agendamentos/mês",
      "1 funcionário",
      "Agenda online",
      "Notificações básicas",
      "Suporte por email"
    ],
    popular: false
  },
  {
    name: "Professional",
    price: "R$ 59",
    period: "/mês",
    description: "Ideal para estabelecimentos",
    icon: Crown,
    features: [
      "Agendamentos ilimitados",
      "Até 5 funcionários",
      "Relatórios avançados",
      "Pagamentos online",
      "WhatsApp integrado",
      "Personalização completa",
      "Suporte prioritário"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "R$ 99",
    period: "/mês",
    description: "Para múltiplas unidades",
    icon: Rocket,
    features: [
      "Tudo do Professional",
      "Funcionários ilimitados",
      "Múltiplas unidades",
      "API personalizada",
      "Integrações avançadas",
      "Gerente de conta dedicado",
      "Suporte 24/7"
    ],
    popular: false
  }
];

export function Pricing() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-neon-violet/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-pink/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-gradient">Planos Flexíveis</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Escolha o plano ideal para o seu negócio. Sem taxa de setup, sem fidelidade, cancele quando quiser.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative card-glow transition-all duration-300 ${
                plan.popular 
                  ? 'border-primary bg-gradient-to-b from-primary/10 to-transparent scale-105' 
                  : 'bg-card/50 backdrop-blur-sm border-primary/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-primary text-white px-4 py-1 rounded-full text-sm font-medium animate-pulse-glow">
                    Mais Popular
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                  <plan.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold text-gradient">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.popular ? "neon" : "outline"} 
                  className="w-full"
                  size="lg"
                >
                  {plan.popular ? "Começar Agora" : "Escolher Plano"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            💳 Aceitamos cartão, PIX e boleto • 🔒 Dados protegidos • 📞 Suporte em português
          </p>
          <p className="text-sm text-muted-foreground">
            Teste grátis por 7 dias. Sem compromisso. Cancele quando quiser.
          </p>
        </div>
      </div>
    </section>
  );
}