"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Article {
  id: number; nom: string; quantiteRequise: number;
  datePeremption: string | null;
  stockId: number | null;
  stock: { nom: string } | null;
}
interface Compartiment { id: number; nom: string; articles: Article[]; }
interface SacData { id: number; nom: string; compartiments: Compartiment[]; }
interface Prelevement { stockNom: string; quantite: number; disponible: number; }

const STATUTS = [
  { value: "ok", label: "OK" },
  { value: "manquant", label: "Manquant" },
  { value: "perime", label: "Périmé" },
  { value: "abime", label: "Abîmé" },
];

export default function CheckupPage() {
  const params = useParams();
  const sacId = parseInt(params.sacId as string);
  const [sac, setSac] = useState<SacData | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [statuts, setStatuts] = useState<Record<number, string>>({});
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ prelevements: Prelevement[]; checkupId: number } | null>(null);
  const [fullCompartiments, setFullCompartiments] = useState<Compartiment[]>([]);

  useEffect(() => {
    fetch(`/api/sacs/${sacId}`).then((r) => r.json()).then(setSac);
  }, [sacId]);

  useEffect(() => {
    if (!sac) return;
    Promise.all(sac.compartiments.map((c) =>
      fetch(`/api/compartiments/${c.id}`).then((r) => r.json())
    )).then(setFullCompartiments);
  }, [sac]);

  function setQty(articleId: number, qty: number) {
    setQuantities((prev) => ({ ...prev, [articleId]: qty }));
  }
  function setStatut(articleId: number, val: string) {
    setStatuts((prev) => ({ ...prev, [articleId]: val }));
  }

  async function handleSubmit() {
    const articles = fullCompartiments.flatMap((c) =>
      c.articles.map((a) => ({
        articleId: a.id,
        quantiteTrouvee: quantities[a.id] ?? 0,
        statut: statuts[a.id] || undefined,
      }))
    );
    if (articles.length === 0) { toast.error("Aucun article à vérifier"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sacId, note: note || null, articles }),
      });
      const data = await res.json();
      setResult({ prelevements: data.prelevements, checkupId: data.checkup.id });
      toast.success("Checkup enregistré !");
    } catch { toast.error("Erreur lors de l'enregistrement"); }
    finally { setSubmitting(false); }
  }

  if (!sac) return <p className="text-muted-foreground">Chargement...</p>;

  if (result) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Checkup terminé</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />Récapitulatif
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.prelevements.length > 0 ? (
              <>
                <p className="font-medium">Prélèvements effectués sur le stock :</p>
                <div className="space-y-2">
                  {result.prelevements.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                      <span>{p.stockNom}</span>
                      <div className="flex items-center gap-2">
                        <Badge>-{p.quantite}</Badge>
                        <span className="text-muted-foreground">(reste : {p.disponible})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun prélèvement sur le stock nécessaire.</p>
            )}
            <div className="flex gap-2 pt-4">
              <Link href={`/historique/${result.checkupId}`}><Button>Voir le détail</Button></Link>
              <Link href="/sacs"><Button variant="outline">Retour aux sacs</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sacs"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">Checkup : {sac.nom}</h1>
          <p className="text-sm text-muted-foreground">Vérifiez le contenu de chaque compartiment</p>
        </div>
      </div>

      {fullCompartiments.length === 0 ? (
        <p className="text-muted-foreground">Chargement des articles...</p>
      ) : (
        <div className="space-y-4">
          {fullCompartiments.map((comp) => (
            <Card key={comp.id}>
              <CardHeader><CardTitle className="text-base">{comp.nom}</CardTitle></CardHeader>
              <CardContent>
                {comp.articles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun article</p>
                ) : (
                  <div className="space-y-4">
                    {comp.articles.map((article) => {
                      const qty = quantities[article.id] ?? 0;
                      const manque = Math.max(0, article.quantiteRequise - qty);
                      const isExpired = article.datePeremption && new Date(article.datePeremption) < new Date();
                      return (
                        <div key={article.id} className="space-y-2 border-b pb-3 last:border-0 last:pb-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="font-medium text-sm">{article.nom}</p>
                              <p className="text-xs text-muted-foreground">
                                Requis : {article.quantiteRequise}
                                {article.datePeremption && (
                                  <span className={isExpired ? "text-red-600 font-medium ml-2" : "ml-2"}>
                                    · Péremption : {format(new Date(article.datePeremption), "dd/MM/yyyy", { locale: fr })}
                                    {isExpired && " ⚠ EXPIRÉ"}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Label className="text-xs">Trouvé :</Label>
                                <Input type="number" min={0} className="w-20" value={qty}
                                  onChange={(e) => setQty(article.id, parseInt(e.target.value) || 0)} />
                              </div>
                              {manque > 0 && <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />-{manque}</Badge>}
                              {manque === 0 && qty >= article.quantiteRequise && <Badge className="bg-green-600"><Check className="h-3 w-3 mr-1" />OK</Badge>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Statut :</Label>
                            <Select value={statuts[article.id] || ""} onValueChange={(v) => setStatut(article.id, v)}>
                              <SelectTrigger className="h-7 text-xs w-32">
                                <SelectValue placeholder="Auto" />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <Label htmlFor="note">Note (optionnel)</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Observations..." />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
            {submitting ? "Enregistrement..." : "Valider le checkup"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
