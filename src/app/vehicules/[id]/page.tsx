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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Backpack, ClipboardList, Droplets, BookOpen, Trash2, Check, X, Shield } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SacDetail {
  id: number; nom: string; localisation: string | null;
  statut: string; dernierCheckup: string | null;
  scelle: { numero: string; posePar: string | null; date: string } | null;
}

interface Tache {
  id: number; titre: string; description: string | null;
  statut: string; priorite: string; assigneA: string | null;
  dateEcheance: string | null; dateCree: string;
}

interface CarnetEntry {
  id: number; date: string; type: string; valeur: number | null; description: string | null; agent: string | null;
}

interface VehiculeDetail {
  id: number; nom: string; immatriculation: string | null;
  type: string; statut: string; statutOperationnel: string;
  notes: string | null;
  sacsAvecStatut: SacDetail[];
  taches: Tache[];
  carnetEntries: CarnetEntry[];
}

const LED = ({ statut }: { statut: string }) => {
  const c = { ok: "bg-green-500", attention: "bg-yellow-400", critique: "bg-red-500", inconnu: "bg-gray-400" }[statut] ?? "bg-gray-400";
  return <div className={`w-3 h-3 rounded-full flex-shrink-0 ${c}`} />;
};

const PRIORITE_COLORS: Record<string, string> = {
  basse: "bg-blue-100 text-blue-800",
  normale: "bg-gray-100 text-gray-800",
  haute: "bg-orange-100 text-orange-800",
  urgente: "bg-red-100 text-red-800",
};

const CARNET_TYPES = [
  { value: "kilometrage", label: "Kilométrage" },
  { value: "carburant", label: "Carburant" },
  { value: "maintenance", label: "Maintenance" },
  { value: "panne", label: "Panne" },
  { value: "controle", label: "Contrôle technique" },
  { value: "autre", label: "Autre" },
];

export default function VehiculeDetailPage() {
  const params = useParams();
  const vehiculeId = parseInt(params.id as string);
  const [vehicule, setVehicule] = useState<VehiculeDetail | null>(null);
  const [tacheOpen, setTacheOpen] = useState(false);
  const [carnetOpen, setCarnetOpen] = useState(false);
  const [tacheForm, setTacheForm] = useState({ titre: "", description: "", priorite: "normale", assigneA: "", dateEcheance: "" });
  const [carnetForm, setCarnetForm] = useState({ type: "kilometrage", valeur: "", description: "", agent: "" });

  const load = () =>
    fetch(`/api/vehicules/${vehiculeId}`).then((r) => r.json()).then(setVehicule);
  useEffect(() => { load(); }, [vehiculeId]);

  const createTache = async () => {
    if (!tacheForm.titre.trim()) return toast.error("Titre requis");
    const res = await fetch("/api/taches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...tacheForm, vehiculeId }),
    });
    if (res.ok) { toast.success("Tâche créée"); setTacheOpen(false); setTacheForm({ titre: "", description: "", priorite: "normale", assigneA: "", dateEcheance: "" }); load(); }
    else toast.error("Erreur");
  };

  const terminerTache = async (id: number, t: Tache) => {
    await fetch(`/api/taches/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...t, statut: "terminee" }),
    });
    load();
  };

  const supprimerTache = async (id: number) => {
    await fetch(`/api/taches/${id}`, { method: "DELETE" });
    load();
  };

  const addCarnet = async () => {
    const res = await fetch("/api/carnet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...carnetForm, vehiculeId }),
    });
    if (res.ok) { toast.success("Entrée ajoutée"); setCarnetOpen(false); setCarnetForm({ type: "kilometrage", valeur: "", description: "", agent: "" }); load(); }
    else toast.error("Erreur");
  };

  if (!vehicule) return <p className="text-muted-foreground">Chargement...</p>;

  const tachesOuvertes = vehicule.taches.filter((t) => t.statut === "en_cours");
  const tachesTerminees = vehicule.taches.filter((t) => t.statut === "terminee");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/vehicules"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <LED statut={vehicule.statut ?? "inconnu"} />
            <h1 className="text-2xl font-bold">{vehicule.nom}</h1>
            {vehicule.immatriculation && <span className="text-sm text-muted-foreground font-mono">({vehicule.immatriculation})</span>}
          </div>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline">{vehicule.type}</Badge>
            <Badge variant={vehicule.statutOperationnel === "operationnel" ? "secondary" : "destructive"}>
              {vehicule.statutOperationnel === "operationnel" ? "Opérationnel" : vehicule.statutOperationnel === "en_maintenance" ? "En maintenance" : "Hors service"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Sacs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Backpack className="h-4 w-4" /> Sacs ({vehicule.sacsAvecStatut.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {vehicule.sacsAvecStatut.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 pb-4">Aucun sac associé à ce véhicule.</p>
          ) : (
            <div className="divide-y">
              {vehicule.sacsAvecStatut.map((sac) => (
                <Link key={sac.id} href={`/sacs/${sac.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <LED statut={sac.statut} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{sac.nom}</p>
                    {sac.localisation && <p className="text-xs text-muted-foreground">{sac.localisation}</p>}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {sac.dernierCheckup
                      ? format(new Date(sac.dernierCheckup), "dd/MM/yyyy", { locale: fr })
                      : "Jamais vérifié"}
                  </div>
                  {sac.scelle && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Shield className="h-3 w-3 text-blue-500" />
                      <span className="font-mono">{sac.scelle.numero}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tâches */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Tâches ouvertes ({tachesOuvertes.length})
            </CardTitle>
            <Dialog open={tacheOpen} onOpenChange={setTacheOpen}>
              <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />Ajouter</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouvelle tâche</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Titre *</Label><Input value={tacheForm.titre} onChange={(e) => setTacheForm((f) => ({ ...f, titre: e.target.value }))} /></div>
                  <div><Label>Description</Label><Textarea value={tacheForm.description} onChange={(e) => setTacheForm((f) => ({ ...f, description: e.target.value }))} rows={2} /></div>
                  <div>
                    <Label>Priorité</Label>
                    <Select value={tacheForm.priorite} onValueChange={(v) => setTacheForm((f) => ({ ...f, priorite: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basse">Basse</SelectItem>
                        <SelectItem value="normale">Normale</SelectItem>
                        <SelectItem value="haute">Haute</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Assigné à</Label><Input value={tacheForm.assigneA} onChange={(e) => setTacheForm((f) => ({ ...f, assigneA: e.target.value }))} /></div>
                  <div><Label>Date d&apos;échéance</Label><Input type="date" value={tacheForm.dateEcheance} onChange={(e) => setTacheForm((f) => ({ ...f, dateEcheance: e.target.value }))} /></div>
                  <Button className="w-full" onClick={createTache}>Créer</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tachesOuvertes.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 pb-4">Aucune tâche ouverte.</p>
          ) : (
            <div className="divide-y">
              {tachesOuvertes.map((t) => (
                <div key={t.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{t.titre}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITE_COLORS[t.priorite]}`}>{t.priorite}</span>
                    </div>
                    {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      {t.assigneA && <span>→ {t.assigneA}</span>}
                      {t.dateEcheance && <span>Échéance: {format(new Date(t.dateEcheance), "dd/MM/yyyy", { locale: fr })}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => terminerTache(t.id, t)} title="Terminer">
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => supprimerTache(t.id)} title="Supprimer">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tachesTerminees.length > 0 && (
            <div className="px-4 pb-3">
              <p className="text-xs text-muted-foreground">{tachesTerminees.length} tâche(s) terminée(s)</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Carnet de bord */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Carnet de bord
            </CardTitle>
            <Dialog open={carnetOpen} onOpenChange={setCarnetOpen}>
              <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />Ajouter</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouvelle entrée</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={carnetForm.type} onValueChange={(v) => setCarnetForm((f) => ({ ...f, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CARNET_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Valeur (km, L…)</Label><Input type="number" value={carnetForm.valeur} onChange={(e) => setCarnetForm((f) => ({ ...f, valeur: e.target.value }))} /></div>
                  <div><Label>Description</Label><Textarea value={carnetForm.description} onChange={(e) => setCarnetForm((f) => ({ ...f, description: e.target.value }))} rows={2} /></div>
                  <div><Label>Agent</Label><Input value={carnetForm.agent} onChange={(e) => setCarnetForm((f) => ({ ...f, agent: e.target.value }))} /></div>
                  <Button className="w-full" onClick={addCarnet}>Enregistrer</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {vehicule.carnetEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 pb-4">Aucune entrée.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicule.carnetEntries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap text-sm">{format(new Date(e.date), "dd/MM/yyyy", { locale: fr })}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{CARNET_TYPES.find((t) => t.value === e.type)?.label ?? e.type}</Badge></TableCell>
                      <TableCell className="text-sm">{e.valeur ?? "—"}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{e.description ?? "—"}</TableCell>
                      <TableCell className="text-sm">{e.agent ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {vehicule.notes && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{vehicule.notes}</p></CardContent>
        </Card>
      )}

      {/* Placeholder hygiène */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets className="h-4 w-4" /> Hygiène
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Gérez les protocoles d&apos;hygiène depuis la page{" "}
            <Link href="/hygiene" className="text-primary underline">Hygiène</Link>.
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="destructive" size="sm" onClick={async () => {
          if (!confirm("Supprimer ce véhicule ?")) return;
          await fetch(`/api/vehicules/${vehiculeId}`, { method: "DELETE" });
          window.location.href = "/vehicules";
        }}>
          <X className="h-4 w-4 mr-1" /> Supprimer le véhicule
        </Button>
      </div>
    </div>
  );
}
