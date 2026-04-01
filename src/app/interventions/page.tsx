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
import { Plus, Trash2, Siren, MapPin, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Sac { id: number; nom: string; }
interface Intervention {
  id: number; date: string; lieu: string;
  description: string | null; responsable: string | null;
  sac: { id: number; nom: string };
}

export default function InterventionsPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [sacs, setSacs] = useState<Sac[]>([]);
  const [open, setOpen] = useState(false);
  const [lieu, setLieu] = useState("");
  const [description, setDescription] = useState("");
  const [responsable, setResponsable] = useState("");
  const [sacId, setSacId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchAll = () => {
    fetch("/api/interventions").then((r) => r.json()).then(setInterventions);
    fetch("/api/sacs").then((r) => r.json()).then(setSacs);
  };
  useEffect(() => { fetchAll(); }, []);

  async function handleCreate() {
    if (!lieu.trim() || !sacId) { toast.error("Lieu et sac requis"); return; }
    await fetch("/api/interventions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lieu, description: description || null,
        responsable: responsable || null,
        sacId: parseInt(sacId),
        date: new Date(date).toISOString(),
      }),
    });
    setLieu(""); setDescription(""); setResponsable(""); setSacId(""); setOpen(false);
    toast.success("Intervention enregistrée");
    fetchAll();
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cette intervention ?")) return;
    await fetch(`/api/interventions/${id}`, { method: "DELETE" });
    toast.success("Intervention supprimée");
    fetchAll();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Interventions</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nouvelle intervention</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Enregistrer une intervention</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label>Lieu</Label>
                <Input value={lieu} onChange={(e) => setLieu(e.target.value)} placeholder="Ex: Salle des fêtes, Route D12..." />
              </div>
              <div>
                <Label>Sac utilisé</Label>
                <Select value={sacId} onValueChange={setSacId}>
                  <SelectTrigger><SelectValue placeholder="Choisir un sac" /></SelectTrigger>
                  <SelectContent>
                    {sacs.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Responsable</Label>
                <Input value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Nom du responsable" />
              </div>
              <div>
                <Label>Description (optionnel)</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Détails de l'intervention..." />
              </div>
              <Button onClick={handleCreate} className="w-full">Enregistrer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {interventions.length === 0 ? (
        <p className="text-muted-foreground">Aucune intervention enregistrée.</p>
      ) : (
        <div className="space-y-3">
          {interventions.map((intervention) => (
            <Card key={intervention.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />{intervention.lieu}
                      </span>
                      <Badge variant="outline">{intervention.sac.nom}</Badge>
                    </div>
                    {intervention.responsable && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />{intervention.responsable}
                      </p>
                    )}
                    {intervention.description && (
                      <p className="text-sm">{intervention.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(intervention.date), "EEEE d MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive shrink-0"
                    onClick={() => handleDelete(intervention.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
