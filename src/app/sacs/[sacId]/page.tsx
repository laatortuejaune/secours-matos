"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { PhotoUpload } from "@/components/photo-upload";
import { Plus, ArrowLeft, FolderOpen, Trash2, Printer, QrCode, ClipboardCheck, MapPin } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Article {
  id: number; nom: string; quantiteRequise: number;
  datePeremption: string | null;
  stock: { nom: string; quantiteDisponible: number } | null;
}
interface Compartiment {
  id: number; nom: string; photo: string | null; ordre: number;
  articles: Article[];
  _count: { articles: number };
}
interface Sac {
  id: number; nom: string; photo: string | null;
  localisation: string | null; description: string | null;
  dernierCheckup: string | null;
  compartiments: Compartiment[];
}

export default function SacDetailPage() {
  const params = useParams();
  const sacId = parseInt(params.sacId as string);
  const [sac, setSac] = useState<Sac | null>(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [editLoc, setEditLoc] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const fetchSac = useCallback(() =>
    fetch(`/api/sacs/${sacId}`).then((r) => r.json()).then((data) => {
      setSac(data);
      setEditLoc(data.localisation || "");
      setEditDesc(data.description || "");
    }), [sacId]);

  useEffect(() => { fetchSac(); }, [fetchSac]);

  async function handleCreate() {
    if (!nom.trim()) return;
    await fetch("/api/compartiments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, photo, sacId, ordre: (sac?.compartiments.length || 0) + 1 }),
    });
    setNom(""); setPhoto(null); setOpen(false);
    toast.success("Compartiment créé");
    fetchSac();
  }

  async function handleSaveEdit() {
    await fetch(`/api/sacs/${sacId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ localisation: editLoc || null, description: editDesc || null }),
    });
    setEditOpen(false);
    toast.success("Informations mises à jour");
    fetchSac();
  }

  async function handleDeleteComp(id: number, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!confirm("Supprimer ce compartiment et ses articles ?")) return;
    await fetch(`/api/compartiments/${id}`, { method: "DELETE" });
    toast.success("Compartiment supprimé");
    fetchSac();
  }

  if (!sac) return <p className="text-muted-foreground">Chargement...</p>;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/sacs"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{sac.nom}</h1>
          {sac.localisation && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />{sac.localisation}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/checkup/${sacId}`}>
            <Button variant="outline" size="sm"><ClipboardCheck className="h-4 w-4 mr-2" />Checkup</Button>
          </Link>
          <Link href={`/sacs/${sacId}/imprimer`} target="_blank">
            <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-2" />Imprimer</Button>
          </Link>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Modifier</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Modifier le sac</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Localisation</Label>
                  <Input value={editLoc} onChange={(e) => setEditLoc(e.target.value)} placeholder="Ex: Véhicule 1, Entrepôt A..." />
                </div>
                <div><Label>Description</Label>
                  <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Notes sur ce sac..." />
                </div>
                <Button onClick={handleSaveEdit} className="w-full">Enregistrer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {sac.description && (
        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{sac.description}</p>
      )}

      {sac.dernierCheckup && (
        <p className="text-sm text-muted-foreground">
          Dernier checkup : {format(new Date(sac.dernierCheckup), "dd/MM/yyyy HH:mm", { locale: fr })}
        </p>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <p className="text-sm text-muted-foreground">{sac.compartiments.length} compartiment(s)</p>
        <div className="flex items-center gap-3">
          {/* QR Code */}
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-muted-foreground" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR Code" width={60} height={60} className="rounded border" />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nouveau compartiment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Créer un compartiment</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nom</Label>
                  <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Poche avant" />
                </div>
                <div><Label>Photo</Label>
                  <PhotoUpload onUpload={setPhoto} onRemove={() => setPhoto(null)} />
                </div>
                <Button onClick={handleCreate} className="w-full">Créer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {sac.compartiments.length === 0 ? (
        <p className="text-muted-foreground">Aucun compartiment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sac.compartiments.map((comp) => (
            <Link key={comp.id} href={`/sacs/${sacId}/compartiments/${comp.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {comp.photo ? (
                      <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
                        <Image src={comp.photo} alt={comp.nom} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <FolderOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{comp.nom}</h3>
                      <p className="text-sm text-muted-foreground">{comp._count.articles} article(s)</p>
                      <Button size="sm" variant="ghost" className="text-destructive mt-1 p-0 h-auto"
                        onClick={(e) => handleDeleteComp(comp.id, e)}>
                        <Trash2 className="h-3 w-3 mr-1" />Supprimer
                      </Button>
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
