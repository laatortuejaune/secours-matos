"use client";

import { useEffect, useState } from "react";
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
import { Droplets, Plus, Check, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Protocole {
  id: number; nom: string; description: string | null;
  frequenceDays: number;
  vehicule: { id: number; nom: string } | null;
  dernierRecord: { id: number; date: string; agent: string; conforme: boolean } | null;
  joursDepuis: number | null;
  enRetard: boolean;
}

interface Vehicule { id: number; nom: string; }

export default function HygienePage() {
  const [protocoles, setProtocoles] = useState<Protocole[]>([]);
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState<number | null>(null);
  const [form, setForm] = useState({ nom: "", description: "", frequenceDays: "7", vehiculeId: "" });
  const [recordForm, setRecordForm] = useState({ agent: "", notes: "", conforme: true });

  const load = () => fetch("/api/hygiene").then((r) => r.json()).then(setProtocoles);
  useEffect(() => {
    load();
    fetch("/api/vehicules").then((r) => r.json()).then(setVehicules);
  }, []);

  const createProtocole = async () => {
    if (!form.nom.trim()) return toast.error("Nom requis");
    const res = await fetch("/api/hygiene", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { toast.success("Protocole créé"); setCreateOpen(false); setForm({ nom: "", description: "", frequenceDays: "7", vehiculeId: "" }); load(); }
    else toast.error("Erreur");
  };

  const addRecord = async (protocolId: number) => {
    if (!recordForm.agent.trim()) return toast.error("Agent requis");
    const res = await fetch(`/api/hygiene/${protocolId}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recordForm),
    });
    if (res.ok) { toast.success("Protocole enregistré"); setRecordOpen(null); setRecordForm({ agent: "", notes: "", conforme: true }); load(); }
    else toast.error("Erreur");
  };

  const deleteProtocole = async (id: number) => {
    await fetch(`/api/hygiene/${id}`, { method: "DELETE" });
    load();
  };

  const enRetard = protocoles.filter((p) => p.enRetard).length;
  const conformes = protocoles.filter((p) => !p.enRetard).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Droplets className="h-6 w-6" /> Hygiène & Biopropreté
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {protocoles.length} protocole(s) — {conformes} conforme(s) · {enRetard} en retard
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nouveau protocole</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouveau protocole d&apos;hygiène</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nom *</Label><Input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} placeholder="Ex: Désinfection habitacle" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div><Label>Fréquence (jours)</Label><Input type="number" min="1" value={form.frequenceDays} onChange={(e) => setForm((f) => ({ ...f, frequenceDays: e.target.value }))} /></div>
              <div>
                <Label>Véhicule</Label>
                <Select value={form.vehiculeId} onValueChange={(v) => setForm((f) => ({ ...f, vehiculeId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Aucun (général)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Général</SelectItem>
                    {vehicules.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={createProtocole}>Créer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <div><div className="text-xl font-bold">{conformes}</div><div className="text-xs text-muted-foreground">Conformes</div></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <div><div className="text-xl font-bold">{enRetard}</div><div className="text-xs text-muted-foreground">En retard</div></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Droplets className="h-4 w-4 text-blue-500" />
          <div><div className="text-xl font-bold">{protocoles.length}</div><div className="text-xs text-muted-foreground">Protocoles</div></div>
        </CardContent></Card>
      </div>

      {protocoles.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun protocole d&apos;hygiène. Créez-en un pour commencer le suivi.</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {protocoles.map((p) => (
            <Card key={p.id} className={p.enRetard ? "border-red-200" : "border-green-200"}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${p.enRetard ? "bg-red-500" : "bg-green-500"}`} />
                    {p.nom}
                  </CardTitle>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 flex-shrink-0" onClick={() => deleteProtocole(p.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {p.vehicule && <p className="text-xs text-muted-foreground">🚑 {p.vehicule.nom}</p>}
              </CardHeader>
              <CardContent className="space-y-2">
                {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Tous les <strong>{p.frequenceDays}</strong> jour(s)</span>
                </div>
                {p.dernierRecord ? (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Dernier: </span>
                    <span className="font-medium">{format(new Date(p.dernierRecord.date), "dd/MM/yyyy HH:mm", { locale: fr })}</span>
                    <span className="text-muted-foreground ml-1">par {p.dernierRecord.agent}</span>
                    {p.joursDepuis !== null && (
                      <Badge variant={p.enRetard ? "destructive" : "secondary"} className="ml-2 text-xs">
                        J+{p.joursDepuis}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-red-600 font-medium">Jamais effectué</p>
                )}

                <Dialog open={recordOpen === p.id} onOpenChange={(o) => setRecordOpen(o ? p.id : null)}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full mt-2" variant={p.enRetard ? "default" : "outline"}>
                      <Check className="h-3 w-3 mr-1" /> Enregistrer une exécution
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Exécution : {p.nom}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Agent *</Label><Input value={recordForm.agent} onChange={(e) => setRecordForm((f) => ({ ...f, agent: e.target.value }))} placeholder="Nom de l'agent" /></div>
                      <div><Label>Notes</Label><Textarea value={recordForm.notes} onChange={(e) => setRecordForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="conforme" checked={recordForm.conforme} onChange={(e) => setRecordForm((f) => ({ ...f, conforme: e.target.checked }))} />
                        <label htmlFor="conforme" className="text-sm">Conforme au protocole</label>
                      </div>
                      <Button className="w-full" onClick={() => addRecord(p.id)}>Valider</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
