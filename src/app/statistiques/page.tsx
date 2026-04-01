"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Backpack, ClipboardCheck, Package, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SacStatut {
  id: number; nom: string; localisation: string | null;
  statut: string; dernierCheckup: string | null;
}
interface DashboardData {
  totalSacs: number; sacsCritiques: number; sacsAttention: number;
  sacsAvecStatut: SacStatut[];
  articlesPeremption: Array<{
    id: number; nom: string; datePeremption: string;
    compartiment: { sac: { nom: string } };
  }>;
  stocksBas: Array<{ id: number; nom: string; quantiteDisponible: number; seuilAlerte: number }>;
  derniersCheckups: Array<{ id: number; date: string; sac: { nom: string } }>;
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span><span className="font-medium">{value}</span>
      </div>
      <div className="h-4 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function StatistiquesPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  if (!data) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Chargement...</p></div>;
  }

  const sacsOk = data.sacsAvecStatut.filter((s) => s.statut === "ok").length;
  const sacsInconnu = data.sacsAvecStatut.filter((s) => s.statut === "inconnu").length;
  const total = data.totalSacs;

  const now = new Date();
  const sacsNeverChecked = data.sacsAvecStatut.filter((s) => !s.dernierCheckup).length;
  const sacsCheckedRecently = data.sacsAvecStatut.filter((s) => {
    if (!s.dernierCheckup) return false;
    const days = (now.getTime() - new Date(s.dernierCheckup).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 15;
  }).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Statistiques</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Backpack className="h-4 w-4" />État des sacs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatBar label="OK" value={sacsOk} max={total} color="bg-green-500" />
            <StatBar label="Attention" value={data.sacsAttention} max={total} color="bg-yellow-500" />
            <StatBar label="Critique" value={data.sacsCritiques} max={total} color="bg-red-500" />
            <StatBar label="Inconnu" value={sacsInconnu} max={total} color="bg-gray-400" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />Checkups
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatBar label="Checkup &lt; 15 jours" value={sacsCheckedRecently} max={total} color="bg-green-500" />
            <StatBar label="Jamais checkés" value={sacsNeverChecked} max={total} color="bg-red-500" />
            <p className="text-xs text-muted-foreground pt-2">
              {sacsCheckedRecently}/{total} sacs checkés dans les 15 derniers jours
            </p>
          </CardContent>
        </Card>
      </div>

      {data.articlesPeremption.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Articles proches de la péremption ({data.articlesPeremption.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.articlesPeremption.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span>{a.nom} <span className="text-muted-foreground text-xs">({a.compartiment.sac.nom})</span></span>
                  <Badge variant="destructive">
                    {format(new Date(a.datePeremption), "dd/MM/yyyy", { locale: fr })}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.stocksBas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-500" />Stocks bas ({data.stocksBas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.stocksBas.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span>{s.nom}</span>
                  <Badge variant="destructive">{s.quantiteDisponible} / seuil {s.seuilAlerte}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">État détaillé par sac</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1">
            {data.sacsAvecStatut.map((sac) => (
              <Link key={sac.id} href={`/sacs/${sac.id}`}>
                <div className="flex items-center justify-between p-2 rounded hover:bg-accent text-sm">
                  <span>{sac.nom}{sac.localisation && <span className="text-muted-foreground ml-2 text-xs">({sac.localisation})</span>}</span>
                  <div className="flex items-center gap-2">
                    {sac.dernierCheckup && <span className="text-xs text-muted-foreground">{format(new Date(sac.dernierCheckup), "dd/MM/yy", { locale: fr })}</span>}
                    {sac.statut === "ok" && <Badge className="bg-green-600 text-white">OK</Badge>}
                    {sac.statut === "attention" && <Badge className="bg-yellow-500 text-white">Attention</Badge>}
                    {sac.statut === "critique" && <Badge variant="destructive">Critique</Badge>}
                    {sac.statut === "inconnu" && <Badge variant="secondary">Inconnu</Badge>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
