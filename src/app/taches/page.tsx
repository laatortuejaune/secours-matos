"use client";

import { useEffect, useState } from "react";
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
import { ClipboardList, Plus, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Tache {
  id: number; titre: string; description: string | null;
  statut: string; priorite: string; assigneA: string | null;
  dateEcheance: string | null; dateCree: string;
  vehicule: { id: number; nom: string } | null;
  sac: { id: number; nom: string } | null;
}

interface Vehicule { id: number; nom: string; }
interface Sac { id: number; nom: string; }

const PRIORITE_COLORS: Record<string, string> = {
  basse: "bg-blue-100 text-blue-800",
  normale: "bg-gray-100 text-gray-800",
  haute: "bg-orange-100 text-orange-800",
  urgente: "bg-red-100 text-red-800",
};

export default function TachesPage() {
  const [taches, setTaches] = useState<Tache[]>([]);
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [sacs, setSacs] = useState<Sac[]>([]);
  const [open, setOpen] = useState(false);
  const [filtre, setFiltre] = useState<"toutes" | "en_cours" | "terminee">("en_cours");
  const [form, setForm] = useState({
    titre: "", description: "", priorite: "normale",
    vehiculeId: "", sacId: "", assigneA: "", dateEcheance: "",
  });

  const load = () => fetch("/api/taches").then((r) => r.json()).then(setTaches);
  useEffect(() => {
    load();
    fetch("/api/vehicules").then((r) => r.json()).then(setVehicules);
    fetch("/api/sacs").then((r) => r.json()).then(setSacs);
  }, []);

  const create = async () => {
    if (!form.titre.trim()) return toast.error("Titre requis");
    const res = await fetch("/api/taches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Tâche créée");
      setOpen(false);
      setForm({ titre: "", description: "", priorite: "normale", vehiculeId: "", sacId: "", assigneA: "", dateEcheance: "" });
      load();
    } else toast.error("Erreur");
  };

  const terminer = async (t: Tache) => {
    await fetch(`/api/taches/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...t, statut: "terminee" }),
    });
    toast.success("Tâche terminée");
    load();
  };

  const supprimer = async (id: number) => {
    await fetch(`/api/taches/${id}`, { method: "DELETE" });
    load();
  };

  const filtrees = taches.filter((t) => filtre === "toutes" || t.statut === filtre);
  const enCours = taches.filter((t) => t.statut === "en_cours").length;
  const urgentes = taches.filter((t) => t.statut === "en_cours" && t.priorite === "urgente").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" /> Tâches
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {enCours} ouverte(s){urgentes > 0 && ` · ${urgentes} urgente(s)`}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nouvelle tâche</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvelle tâche</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Titre *</Label><Input value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div>
                <Label>Priorité</Label>
                <Select value={form.priorite} onValueChange={(v) => setForm((f) => ({ ...f, priorite: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basse">Basse</SelectItem>
                    <SelectItem value="normale">Normale</SelectItem>
                    <SelectItem value="haute">Haute</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Véhicule concerné</Label>
                <Select value={form.vehiculeId} onValueChange={(v) => setForm((f) => ({ ...f, vehiculeId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    {vehicules.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sac concerné</Label>
                <Select value={form.sacId} onValueChange={(v) => setForm((f) => ({ ...f, sacId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    {sacs.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Assigné à</Label><Input value={form.assigneA} onChange={(e) => setForm((f) => ({ ...f, assigneA: e.target.value }))} /></div>
              <div><Label>Date d&apos;échéance</Label><Input type="date" value={form.dateEcheance} onChange={(e) => setForm((f) => ({ ...f, dateEcheance: e.target.value }))} /></div>
              <Button className="w-full" onClick={create}>Créer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtre */}
      <div className="flex gap-2 flex-wrap">
        {(["en_cours", "toutes", "terminee"] as const).map((f) => (
          <Button key={f} size="sm" variant={filtre === f ? "default" : "outline"} onClick={() => setFiltre(f)}>
            {f === "en_cours" ? "En cours" : f === "terminee" ? "Terminées" : "Toutes"}
          </Button>
        ))}
      </div>

      {filtrees.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune tâche.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtrees.map((t) => (
            <Card key={t.id} className={t.statut === "terminee" ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className={`font-medium ${t.statut === "terminee" ? "line-through" : ""}`}>{t.titre}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITE_COLORS[t.priorite]}`}>
                        {t.priorite}
                      </span>
                      {t.statut === "terminee" && <Badge variant="secondary" className="text-xs">Terminée</Badge>}
                    </div>
                    {t.description && <p className="text-sm text-muted-foreground mb-2">{t.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {t.vehicule && <span>🚑 {t.vehicule.nom}</span>}
                      {t.sac && <span>🎒 {t.sac.nom}</span>}
                      {t.assigneA && <span>→ {t.assigneA}</span>}
                      {t.dateEcheance && (
                        <span className={new Date(t.dateEcheance) < new Date() && t.statut !== "terminee" ? "text-red-600 font-medium" : ""}>
                          Échéance: {format(new Date(t.dateEcheance), "dd/MM/yyyy", { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {t.statut !== "terminee" && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => terminer(t)} title="Terminer">
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => supprimer(t.id)} title="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
