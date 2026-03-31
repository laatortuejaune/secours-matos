"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PhotoUpload } from "@/components/photo-upload";
import { Plus, ArrowLeft, FolderOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Sac {
  id: number;
  nom: string;
  photo: string | null;
  compartiments: Array<{
    id: number;
    nom: string;
    photo: string | null;
    ordre: number;
    _count: { articles: number };
  }>;
}

export default function SacDetailPage() {
  const params = useParams();
  const sacId = parseInt(params.sacId as string);
  const [sac, setSac] = useState<Sac | null>(null);
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  const fetchSac = useCallback(() =>
    fetch(`/api/sacs/${sacId}`)
      .then((r) => r.json())
      .then(setSac),
  [sacId]);

  useEffect(() => { fetchSac(); }, [fetchSac]);

  async function handleCreate() {
    if (!nom.trim()) return;
    await fetch("/api/compartiments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom,
        photo,
        sacId,
        ordre: (sac?.compartiments.length || 0) + 1,
      }),
    });
    setNom("");
    setPhoto(null);
    setOpen(false);
    toast.success("Compartiment créé");
    fetchSac();
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Supprimer ce compartiment et ses articles ?")) return;
    await fetch(`/api/compartiments/${id}`, { method: "DELETE" });
    toast.success("Compartiment supprimé");
    fetchSac();
  }

  if (!sac) {
    return <p className="text-muted-foreground">Chargement...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sacs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{sac.nom}</h1>
          <p className="text-sm text-muted-foreground">Compartiments du sac</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sac.compartiments.length} compartiment(s)
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau compartiment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un compartiment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Poche avant"
                />
              </div>
              <div>
                <Label>Photo</Label>
                <PhotoUpload
                  onUpload={setPhoto}
                  onRemove={() => setPhoto(null)}
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Créer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sac.compartiments.length === 0 ? (
        <p className="text-muted-foreground">Aucun compartiment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sac.compartiments.map((comp) => (
            <Link
              key={comp.id}
              href={`/sacs/${sacId}/compartiments/${comp.id}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {comp.photo ? (
                      <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
                        <Image
                          src={comp.photo}
                          alt={comp.nom}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <FolderOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{comp.nom}</h3>
                      <p className="text-sm text-muted-foreground">
                        {comp._count.articles} article(s)
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive mt-1 p-0 h-auto"
                        onClick={(e) => handleDelete(comp.id, e)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Supprimer
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
