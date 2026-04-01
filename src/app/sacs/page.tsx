"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { PhotoUpload } from "@/components/photo-upload";
import { Plus, Backpack, ClipboardCheck, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Sac {
  id: number;
  nom: string;
  photo: string | null;
  localisation: string | null;
  statut: "ok" | "attention" | "critique" | "inconnu";
  dernierCheckup: string | null;
  _count: { compartiments: number; checkups: number };
}

function StatutBadge({ statut }: { statut: string }) {
  if (statut === "ok") return <Badge className="bg-green-600 text-white">OK</Badge>;
  if (statut === "attention") return <Badge className="bg-yellow-500 text-white">Attention</Badge>;
  if (statut === "critique") return <Badge variant="destructive">Critique</Badge>;
  return <Badge variant="secondary">Inconnu</Badge>;
}

export default function SacsPage() {
  const [sacs, setSacs] = useState<Sac[]>([]);
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  const fetchSacs = () => fetch("/api/sacs").then((r) => r.json()).then(setSacs);
  useEffect(() => { fetchSacs(); }, []);

  async function handleCreate() {
    if (!nom.trim()) return;
    await fetch("/api/sacs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, photo, localisation: localisation || null }),
    });
    setNom(""); setLocalisation(""); setPhoto(null); setOpen(false);
    toast.success("Sac créé");
    fetchSacs();
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!confirm("Supprimer ce sac et tout son contenu ?")) return;
    await fetch(`/api/sacs/${id}`, { method: "DELETE" });
    toast.success("Sac supprimé");
    fetchSacs();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sacs de secours</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nouveau sac</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer un sac</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Sac PSE 1" />
              </div>
              <div>
                <Label htmlFor="loc">Localisation</Label>
                <Input id="loc" value={localisation} onChange={(e) => setLocalisation(e.target.value)} placeholder="Ex: Véhicule 1, Entrepôt..." />
              </div>
              <div>
                <Label>Photo</Label>
                <PhotoUpload onUpload={setPhoto} onRemove={() => setPhoto(null)} />
              </div>
              <Button onClick={handleCreate} className="w-full">Créer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sacs.length === 0 ? (
        <p className="text-muted-foreground">Aucun sac enregistré.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sacs.map((sac) => (
            <Link key={sac.id} href={`/sacs/${sac.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {sac.photo ? (
                      <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
                        <Image src={sac.photo} alt={sac.nom} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Backpack className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{sac.nom}</h3>
                        <StatutBadge statut={sac.statut} />
                      </div>
                      {sac.localisation && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />{sac.localisation}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">{sac._count.compartiments} compartiment(s)</p>
                      {sac.dernierCheckup && (
                        <p className="text-xs text-muted-foreground">
                          Checkup : {format(new Date(sac.dernierCheckup), "dd/MM/yyyy", { locale: fr })}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Link href={`/checkup/${sac.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="outline">
                            <ClipboardCheck className="h-3 w-3 mr-1" />Checkup
                          </Button>
                        </Link>
                        <Button size="sm" variant="ghost" className="text-destructive"
                          onClick={(e) => handleDelete(sac.id, e)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
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
