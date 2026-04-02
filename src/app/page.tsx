"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Backpack, AlertTriangle, Package, ClipboardCheck,
  Siren, BarChart3, CheckCircle, XCircle, Truck, ClipboardList, Droplets, Download,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SacStatut {
  id: number; nom: string; localisation: string | null;
  vehicule: { id: number; nom: string } | null;
  statut: "ok" | "attention" | "critique" | "inconnu";
  dernierCheckup: string | null;
}
interface VehiculeStatut {
  id: number; nom: string; immatriculation: string | null;
  type: string; statut: string; nbSacs: number; nbTaches: number;
}
interface Tache {
  id: number; titre: string; priorite: string;
  vehicule: { nom: string } | null;
  sac: { nom: string } | null;
}
interface DashboardData {
  totalSacs: number;
  sacsCritiques: number;
  sacsAttention: number;
  sacsAvecStatut: SacStatut[];
  articlesPeremption: Array<{ id: number; nom: string; datePeremption: string; compartiment: { sac: { nom: string } } }>;
  stocksBas: Array<{ id: number; nom: string; quantiteDisponible: number; seuilAlerte: number }>;
  derniersCheckups: Array<{ id: number; date: string; sac: { nom: string; id: number } }>;
  dernieresInterventions: Array<{ id: number; date: string; lieu: string; sac: { nom: string; id: number } }>;
  vehiculesAvecStatut: VehiculeStatut[];
  tachesOuvertes: Tache[];
  nbHygieneRetard: number;
}

const LED_COLORS: Record<string, string> = {
  ok: "bg-green-500", attention: "bg-yellow-400", critique: "bg-red-500", inconnu: "bg-gray-400",
};

function LED({ statut }: { statut: string }) {
  return <div className={`w-3 h-3 rounded-full flex-shrink-0 ${LED_COLORS[statut] ?? "bg-gray-400"}`} />;
}

function StatutBadge({ statut }: { statut: string }) {
  if (statut === "ok") return <Badge className="bg-green-600 text-white text-xs">OK</Badge>;
  if (statut === "attention") return <Badge className="bg-yellow-500 text-white text-xs">Attention</Badge>;
  if (statut === "critique") return <Badge variant="destructive" className="text-xs">Critique</Badge>;
  return <Badge variant="secondary" className="text-xs">Inconnu</Badge>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Chargement...</p></div>;

  const sacsOk = data.sacsAvecStatut.filter((s) => s.statut === "ok").length;
  const vehiculesCritiques = data.vehiculesAvecStatut.filter((v) => v.statut === "critique").length;
  const urgentes = data.tachesOuvertes.filter((t) => t.priorite === "urgente").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <a href="/api/export?type=peremptions" download>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export péremptions</Button>
        </a>
      </div>

      {/* Alertes urgentes */}
      {(data.sacsCritiques > 0 || vehiculesCritiques > 0 || data.nbHygieneRetard > 0 || urgentes > 0) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:bg-red-950/20 dark:border-red-900">
          <p className="font-semibold text-red-700 dark:text-red-400 mb-2">⚠️ Alertes actives</p>
          <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
            {data.sacsCritiques > 0 && <li>• {data.sacsCritiques} sac(s) en état critique</li>}
            {vehiculesCritiques > 0 && <li>• {vehiculesCritiques} véhicule(s) critique(s)</li>}
            {data.nbHygieneRetard > 0 && <li>• {data.nbHygieneRetard} protocole(s) d&apos;hygiène en retard</li>}
            {urgentes > 0 && <li>• {urgentes} tâche(s) urgente(s) en attente</li>}
          </ul>
        </div>
      )}

      {/* Stats sacs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* Véhicules avec LED */}
      {data.vehiculesAvecStatut.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4" /> Véhicules
              </CardTitle>
              <Link href="/vehicules"><Button variant="ghost" size="sm">Voir tout</Button></Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data.vehiculesAvecStatut.map((v) => (
                <Link key={v.id} href={`/vehicules/${v.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <LED statut={v.statut} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{v.nom}</p>
                    {v.immatriculation && <p className="text-xs text-muted-foreground font-mono">{v.immatriculation}</p>}
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{v.nbSacs} sac(s)</span>
                    {v.nbTaches > 0 && <span className="text-orange-600 font-medium">{v.nbTaches} tâche(s)</span>}
                  </div>
                  <StatutBadge statut={v.statut} />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tâches urgentes */}
      {data.tachesOuvertes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> Tâches en cours ({data.tachesOuvertes.length})
              </CardTitle>
              <Link href="/taches"><Button variant="ghost" size="sm">Voir tout</Button></Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data.tachesOuvertes.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.titre}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.vehicule?.nom ?? t.sac?.nom ?? "—"}
                    </p>
                  </div>
                  <Badge
                    className={`text-xs ${t.priorite === "urgente" ? "bg-red-100 text-red-800" : t.priorite === "haute" ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-800"}`}
                    variant="outline"
                  >
                    {t.priorite}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hygiène */}
      {data.nbHygieneRetard > 0 && (
        <Card className="border-orange-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Droplets className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium text-sm">{data.nbHygieneRetard} protocole(s) d&apos;hygiène en retard</p>
                <p className="text-xs text-muted-foreground">Des procédures de biopropreté nécessitent votre attention</p>
              </div>
            </div>
            <Link href="/hygiene"><Button size="sm" variant="outline">Voir</Button></Link>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <div className="flex flex-wrap gap-2">
        <Link href="/sacs"><Button><Backpack className="h-4 w-4 mr-2" />Sacs</Button></Link>
        <Link href="/vehicules"><Button variant="outline"><Truck className="h-4 w-4 mr-2" />Véhicules</Button></Link>
        <Link href="/taches"><Button variant="outline"><ClipboardList className="h-4 w-4 mr-2" />Tâches</Button></Link>
        <Link href="/hygiene"><Button variant="outline"><Droplets className="h-4 w-4 mr-2" />Hygiène</Button></Link>
        <Link href="/interventions"><Button variant="outline"><Siren className="h-4 w-4 mr-2" />Interventions</Button></Link>
        <Link href="/statistiques"><Button variant="outline"><BarChart3 className="h-4 w-4 mr-2" />Statistiques</Button></Link>
        <Link href="/stock"><Button variant="outline"><Package className="h-4 w-4 mr-2" />Stock</Button></Link>
      </div>

      {/* État des sacs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">État des sacs</CardTitle>
            <div className="flex gap-2">
              <a href="/api/export?type=checkups" download>
                <Button variant="ghost" size="sm"><Download className="h-3 w-3 mr-1" />Checkups</Button>
              </a>
              <a href="/api/export?type=stock" download>
                <Button variant="ghost" size="sm"><Download className="h-3 w-3 mr-1" />Stock</Button>
              </a>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {data.sacsAvecStatut.map((sac) => (
              <Link key={sac.id} href={`/sacs/${sac.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                <LED statut={sac.statut} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{sac.nom}</p>
                  {sac.localisation && <p className="text-xs text-muted-foreground">{sac.localisation}</p>}
                  {sac.vehicule && <p className="text-xs text-muted-foreground">🚑 {sac.vehicule.nom}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {sac.dernierCheckup && (
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {format(new Date(sac.dernierCheckup), "dd/MM/yy", { locale: fr })}
                    </span>
                  )}
                  <StatutBadge statut={sac.statut} />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Péremptions */}
      {data.articlesPeremption.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Articles expirant bientôt (&lt;30 jours)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data.articlesPeremption.map((a) => {
                const jours = Math.ceil((new Date(a.datePeremption).getTime() - Date.now()) / 86400000);
                return (
                  <div key={a.id} className="flex items-center justify-between px-4 py-2 text-sm">
                    <span>{a.nom} <span className="text-muted-foreground text-xs">({a.compartiment.sac.nom})</span></span>
                    <Badge variant={jours <= 0 ? "destructive" : "outline"} className="text-xs">
                      {jours <= 0 ? "Expiré" : `J-${jours}`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Derniers checkups & interventions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Siren className="h-4 w-4" /> Dernières interventions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.dernieresInterventions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune intervention</p>
            ) : (
              <div className="space-y-2">
                {data.dernieresInterventions.map((i) => (
                  <div key={i.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{i.lieu}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{i.sac.nom}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{format(new Date(i.date), "dd/MM/yy", { locale: fr })}</span>
                  </div>
                ))}
              </div>
            )}
            <Link href="/interventions"><Button variant="ghost" size="sm" className="mt-3 w-full">Voir tout</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Derniers checkups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.derniersCheckups.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun checkup</p>
            ) : (
              <div className="space-y-1">
                {data.derniersCheckups.map((c) => (
                  <Link key={c.id} href={`/historique/${c.id}`} className="flex items-center justify-between text-sm hover:bg-accent p-2 rounded-md transition-colors">
                    <span className="font-medium">{c.sac.nom}</span>
                    <span className="text-muted-foreground text-xs">{format(new Date(c.date), "dd/MM/yyyy HH:mm", { locale: fr })}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock bas */}
      {data.stocksBas.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-500" /> Stock bas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data.stocksBas.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>{s.nom}</span>
                  <Badge variant="outline" className="text-orange-600 text-xs">{s.quantiteDisponible}/{s.seuilAlerte}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
