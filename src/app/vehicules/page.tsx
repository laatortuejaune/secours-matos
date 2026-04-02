"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
import { Truck, Plus, ChevronRight, Backpack, ClipboardList } from "lucide-react";
import { toast } from "sonner";

interface Vehicule {
  id: number;
  nom: string;
  immatriculation: string | null;
  type: string;
  statut: string;
  statutOperationnel: string;
  notes: string | null;
  nbSacs: number;
  nbTachesOuvertes: number;
}

const LED_COLORS: Record<string, string> = {
  ok: "bg-green-500",
  attention: "bg-yellow-400",
  critique: "bg-red-500",
  inconnu: "bg-gray-400",
};

const LED_LABELS: Record<string, string> = {
  ok: "Conforme",
  attention: "Attention",
  critique: "Critique",
  inconnu: "Non vérifié",
};

const TYPE_LABELS: Record<string, string> = {
  vsav: "VSAV",
  assu: "ASSU",
  smur: "SMUR",
  vl: "VL",
  vtp: "VTP",
  autre: "Autre",
};

const STATUT_OP_LABELS: Record<string, string> = {
  operationnel: "Opérationnel",
  en_maintenance: "En maintenance",
  hors_service: "Hors service",
};

export default function VehiculesPage() {
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nom: "", immatriculation: "", type: "autre", statut: "operationnel", notes: "",
  });

  const load = () => fetch("/api/vehicules").then((r) => r.json()).then(setVehicules);
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.nom.trim()) return toast.error("Nom requis");
    const res = await fetch("/api/vehicules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Véhicule créé");
      setOpen(false);
      setForm({ nom: "", immatriculation: "", type: "autre", statut: "operationnel", notes: "" });
      load();
    } else toast.error("Erreur");
  };

  const ok = vehicules.filter((v) => v.statut === "ok").length;
  const attention = vehicules.filter((v) => v.statut === "attention").length;
  const critique = vehicules.filter((v) => v.statut === "critique").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" /> Véhicules
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {vehicules.length} véhicule(s) — {ok} OK · {attention} attention · {critique} critique(s)
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Ajouter un véhicule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouveau véhicule</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nom *</Label><Input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} placeholder="Ex: Ambulance 1" /></div>
              <div><Label>Immatriculation</Label><Input value={form.immatriculation} onChange={(e) => setForm((f) => ({ ...f, immatriculation: e.target.value }))} placeholder="AA-123-BB" /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Statut opérationnel</Label>
                <Select value={form.statut} onValueChange={(v) => setForm((f) => ({ ...f, statut: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUT_OP_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
              <Button className="w-full" onClick={create}>Créer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* LED stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "ok", label: "Conformes", count: ok },
          { key: "attention", label: "Attention", count: attention },
          { key: "critique", label: "Critiques", count: critique },
          { key: "inconnu", label: "Non vérifiés", count: vehicules.filter((v) => v.statut === "inconnu").length },
        ].map((item) => (
          <Card key={item.key}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full flex-shrink-0 ${LED_COLORS[item.key]}`} />
              <div>
                <div className="text-xl font-bold">{item.count}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {vehicules.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun véhicule. Commencez par en ajouter un.</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vehicules.map((v) => (
            <Link key={v.id} href={`/vehicules/${v.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${LED_COLORS[v.statut]}`} title={LED_LABELS[v.statut]} />
                        <h3 className="font-semibold truncate">{v.nom}</h3>
                      </div>
                      {v.immatriculation && (
                        <p className="text-xs text-muted-foreground font-mono">{v.immatriculation}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="outline" className="text-xs">{TYPE_LABELS[v.type] ?? v.type}</Badge>
                        <Badge
                          variant={v.statutOperationnel === "operationnel" ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {STATUT_OP_LABELS[v.statutOperationnel] ?? v.statutOperationnel}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                  <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Backpack className="h-3 w-3" />{v.nbSacs} sac(s)</span>
                    {v.nbTachesOuvertes > 0 && (
                      <span className="flex items-center gap-1 text-orange-600 font-medium">
                        <ClipboardList className="h-3 w-3" />{v.nbTachesOuvertes} tâche(s)
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
