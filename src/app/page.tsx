"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Backpack, AlertTriangle, Package, ClipboardCheck,
  Siren, BarChart3, CheckCircle, XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SacStatut {
  id: number;
  nom: string;
  localisation: string | null;
  statut: "ok" | "attention" | "critique" | "inconnu";
  dernierCheckup: string | null;
}
interface Intervention {
  id: number; date: string; lieu: string;
  sac: { id: number; nom: string };
}
interface DashboardData {
  totalSacs: number;
  sacsCritiques: number;
  sacsAttention: number;
  sacsAvecStatut: SacStatut[];
  articlesPeremption: Array<{
    id: number; nom: string; datePeremption: string;
    compartiment: { sac: { nom: string } };
  }>;
  stocksBas: Array<{ id: number; nom: string; quantiteDisponible: number; seuilAlerte: number }>;
  derniersCheckups: Array<{ id: number; date: string; sac: { nom: string; id: number } }>;
  dernieresInterventions: Intervention[];
}

function StatutBadge({ statut }: { statut: string }) {
  if (statut === "ok") return <Badge className="bg-green-600 text-white">OK</Badge>;
  if (statut === "attention") return <Badge className="bg-yellow-500 text-white">Attention</Badge>;
  if (statut === "critique") return <Badge variant="destructive">Critique</Badge>;
  return <Badge variant="secondary">Inconnu</Badge>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const sacsOk = data.sacsAvecStatut.filter((s) => s.statut === "ok").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total sacs</CardTitle>
            <Backpack className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{data.totalSacs}</div></CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Critiques</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{data.sacsCritiques}</div></CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-500">{data.sacsAttention}</div></CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-600">OK</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{sacsOk}</div></CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/sacs"><Button><Backpack className="h-4 w-4 mr-2" />Gérer les sacs</Button></Link>
        <Link href="/interventions"><Button variant="outline"><Siren className="h-4 w-4 mr-2" />Interventions</Button></Link>
        <Link href="/statistiques"><Button variant="outline"><BarChart3 className="h-4 w-4 mr-2" />Statistiques</Button></Link>
        <Link href="/stock"><Button variant="outline"><Package className="h-4 w-4 mr-2" />Stock</Button></Link>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">État des sacs</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1">
            {data.sacsAvecStatut.map((sac) => (
              <Link key={sac.id} href={`/sacs/${sac.id}`}>
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors">
                  <div>
                    <span className="font-medium text-sm">{sac.nom}</span>
                    {sac.localisation && (
                      <span className="text-xs text-muted-foreground ml-2">({sac.localisation})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {sac.dernierCheckup && (
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {format(new Date(sac.dernierCheckup), "dd/MM/yy", { locale: fr })}
                      </span>
                    )}
                    <StatutBadge statut={sac.statut} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {data.articlesPeremption.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Articles en alerte péremption (&lt; 30 jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.articlesPeremption.map((article) => (
                <div key={article.id} className="flex items-center justify-between text-sm">
                  <span>{article.nom} <span className="text-muted-foreground">({article.compartiment.sac.nom})</span></span>
                  <Badge variant="destructive">
                    {format(new Date(article.datePeremption), "dd/MM/yyyy", { locale: fr })}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Siren className="h-4 w-4" />Dernières interventions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.dernieresInterventions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune intervention enregistrée</p>
            ) : (
              <div className="space-y-2">
                {data.dernieresInterventions.map((i) => (
                  <div key={i.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{i.lieu}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{i.sac.nom}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(i.date), "dd/MM/yy", { locale: fr })}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link href="/interventions">
              <Button variant="ghost" size="sm" className="mt-3 w-full">Voir tout</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />Derniers checkups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.derniersCheckups.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun checkup effectué</p>
            ) : (
              <div className="space-y-2">
                {data.derniersCheckups.map((checkup) => (
                  <Link key={checkup.id} href={`/historique/${checkup.id}`}
                    className="flex items-center justify-between text-sm hover:bg-accent p-2 rounded-md transition-colors">
                    <span className="font-medium">{checkup.sac.nom}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(checkup.date), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
