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
import { ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Article {
  id: number;
  nom: string;
  quantiteRequise: number;
  stockId: number | null;
  stock: { nom: string } | null;
}

interface Compartiment {
  id: number;
  nom: string;
  articles: Article[];
}

interface SacData {
  id: number;
  nom: string;
  compartiments: Compartiment[];
}

interface Prelevement {
  stockNom: string;
  quantite: number;
  disponible: number;
}

export default function CheckupPage() {
  const params = useParams();
  const sacId = parseInt(params.sacId as string);

  const [sac, setSac] = useState<SacData | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    prelevements: Prelevement[];
    checkupId: number;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/sacs/${sacId}`)
      .then((r) => r.json())
      .then((data) => {
        // We need articles with stock info, fetch compartments individually
        setSac(data);
      });
  }, [sacId]);

  // Fetch full compartiment data with articles+stock
  const [fullCompartiments, setFullCompartiments] = useState<Compartiment[]>([]);

  useEffect(() => {
    if (!sac) return;
    Promise.all(
      sac.compartiments.map((c) =>
        fetch(`/api/compartiments/${c.id}`).then((r) => r.json())
      )
    ).then(setFullCompartiments);
  }, [sac]);

  function setQty(articleId: number, qty: number) {
    setQuantities((prev) => ({ ...prev, [articleId]: qty }));
  }

  async function handleSubmit() {
    const articles = fullCompartiments.flatMap((c) =>
      c.articles.map((a) => ({
        articleId: a.id,
        quantiteTrouvee: quantities[a.id] ?? 0,
      }))
    );

    if (articles.length === 0) {
      toast.error("Aucun article à vérifier");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sacId, note: note || null, articles }),
      });
      const data = await res.json();
      setResult({
        prelevements: data.prelevements,
        checkupId: data.checkup.id,
      });
      toast.success("Checkup enregistré !");
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  }

  if (!sac) {
    return <p className="text-muted-foreground">Chargement...</p>;
  }

  if (result) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Checkup terminé</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Récapitulatif
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.prelevements.length > 0 ? (
              <>
                <p className="font-medium">Prélèvements effectués sur le stock :</p>
                <div className="space-y-2">
                  {result.prelevements.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm bg-muted p-2 rounded"
                    >
                      <span>{p.stockNom}</span>
                      <div className="flex items-center gap-2">
                        <Badge>-{p.quantite}</Badge>
                        <span className="text-muted-foreground">
                          (reste : {p.disponible})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun prélèvement sur le stock nécessaire.
              </p>
            )}

            {/* Show articles with manques not fulfilled from stock */}
            <div className="flex gap-2 pt-4">
              <Link href={`/historique/${result.checkupId}`}>
                <Button>Voir le détail</Button>
              </Link>
              <Link href="/sacs">
                <Button variant="outline">Retour aux sacs</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sacs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Checkup : {sac.nom}</h1>
          <p className="text-sm text-muted-foreground">
            Vérifiez le contenu de chaque compartiment
          </p>
        </div>
      </div>

      {fullCompartiments.length === 0 ? (
        <p className="text-muted-foreground">Chargement des articles...</p>
      ) : (
        <div className="space-y-4">
          {fullCompartiments.map((comp) => (
            <Card key={comp.id}>
              <CardHeader>
                <CardTitle className="text-base">{comp.nom}</CardTitle>
              </CardHeader>
              <CardContent>
                {comp.articles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun article
                  </p>
                ) : (
                  <div className="space-y-3">
                    {comp.articles.map((article) => {
                      const qty = quantities[article.id] ?? 0;
                      const manque = Math.max(
                        0,
                        article.quantiteRequise - qty
                      );
                      return (
                        <div
                          key={article.id}
                          className="flex items-center gap-3 flex-wrap sm:flex-nowrap"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {article.nom}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Requis : {article.quantiteRequise}
                              {article.stock && (
                                <> &middot; Stock : {article.stock.nom}</>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs whitespace-nowrap">
                              Trouvé :
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              className="w-20"
                              value={qty}
                              onChange={(e) =>
                                setQty(
                                  article.id,
                                  parseInt(e.target.value) || 0
                                )
                              }
                            />
                            {manque > 0 && (
                              <Badge
                                variant="destructive"
                                className="whitespace-nowrap"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                -{manque}
                              </Badge>
                            )}
                            {manque === 0 && qty >= article.quantiteRequise && (
                              <Badge className="bg-green-600 whitespace-nowrap">
                                <Check className="h-3 w-3 mr-1" />
                                OK
                              </Badge>
                            )}
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
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Observations..."
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full"
            size="lg"
          >
            {submitting ? "Enregistrement..." : "Valider le checkup"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
