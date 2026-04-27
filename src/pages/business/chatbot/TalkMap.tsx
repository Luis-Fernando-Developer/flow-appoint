import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChatbotTalkMap() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (!slug || !user) return;
      try {
        const { data: company } = await supabase
          .from("companies")
          .select("id, name")
          .eq("slug", slug)
          .maybeSingle();
        if (!company) throw new Error("Empresa não encontrada");
        setCompanyId(company.id);
        setCompanyName(company.name);

        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot-integration/sign-embed-token`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ company_id: company.id, user_id: user.id, plan: "pro" }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Falha ao gerar token de integração");

        const base = json.builder_base_url || "https://talkbuilder.lovable.app";
        setIframeSrc(`${base}/#/embed#embed_token=${json.token}&host=bookingfy`);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [slug, user]);

  if (loading) {
    return (
      <BusinessLayout companySlug={slug!} companyName={companyName} companyId={companyId!} userRole="owner" currentUser={user}>
        <div className="flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin h-8 w-8" /></div>
      </BusinessLayout>
    );
  }

  if (error || !iframeSrc) {
    return (
      <BusinessLayout companySlug={slug!} companyName={companyName} companyId={companyId!} userRole="owner" currentUser={user}>
        <div className="p-6 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Integração não disponível
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">{error || "É necessário conectar uma chave de API do TalkMap antes de usar o construtor."}</p>
              <Button onClick={() => navigate(`/${slug}/admin/chatbot/integracao`)}>Ir para Integração</Button>
            </CardContent>
          </Card>
        </div>
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout companySlug={slug!} companyName={companyName} companyId={companyId!} userRole="owner" currentUser={user}>
      <iframe
        src={iframeSrc}
        title="TalkMap Builder"
        className="w-full border-0"
        style={{ height: "calc(100vh - 64px)" }}
        allow="clipboard-read; clipboard-write"
      />
    </BusinessLayout>
  );
}
