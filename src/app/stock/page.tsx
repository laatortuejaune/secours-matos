"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Package, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface StockItem {
  id: number;
  nom: string;
  photo: string | null;
  codeBarre: string | null;
  quantiteDisponible: number;
  datePeremption: string | null;
  seuilAlerte: number;
  _count: { articles: number };
}

export default function StockPage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);

  const [nom, setNom] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [codeBarre, setCodeBarre] = useState("");
  const [quantiteDisponible, setQuantiteDisponible] = useState(0);
  const [datePeremption, setDatePeremption] = useState("");
  const [seuilAlerte, setSeuilAlerte] = useState(5);

  const fetchStocks = () =>
    fetch("/api/stock").then((r) => r.json()).then(setStocks);

  useEffect(() => { fetchStocks(); }, []);

  function resetForm() {
    setNom("");
    setPhoto(null);
    setCodeBarre("");
    setQuantiteDisponible(0);
    setDatePeremption("");
    setSeuilAlerte(5);
    setEditItem(null);
  }

  function openEdit(item: StockItem) {
    setEditItem(item);
    setNom(item.nom);
    setPhoto(item.photo);
    setCodeBarre(item.codeBarre || "");
    setQuantiteDisponible(item.quantiteDisponible);
    setDatePeremption(
      item.datePeremption
        ? new Date(item.datePeremption).toISOString().split("T")[0]
        : ""
    );
    setSeuilAlerte(item.seuilAlerte);
    setOpen(true);
  }

  async function handleSave() {
    if (!nom.trim()) return;
    const data = {
      nom,
      photo,
      codeBarre: codeBarre || null,
      quantiteDisponible,
      datePeremption: datePeremption || null,
      seuilAlerte,
    };

    if (editItem) {
      await fetch(`/api/stock/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      toast.success("Stock modifié");
    } else {
      await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      toast.success("Stock créé");
    }

    resetForm();
    setOpen(false);
    fetchStocks();
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer ce produit du stock ?")) return;
    await fetch(`/api/stock/${id}`, { method: "DELETE" });
    toast.success("Stock supprimé");
    fetchStocks();
  }

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stock central</h1>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau produit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editItem ? "Modifier le produit" : "Nouveau produit"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="stock-nom">Nom</Label>
                <Input
                  id="stock-nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Compresses 10x10"
                />
              </div>
              <div>
                <Label>Photo</Label>
                <PhotoUpload
                  currentPhoto={photo}
                  onUpload={setPhoto}
                  onRemove={() => setPhoto(null)}
                />
              </div>
              <div>
                <Label htmlFor="stock-code">Code-barre (optionnel)</Label>
                <Input
                  id="stock-code"
                  value={codeBarre}
                  onChange={(e) => setCodeBarre(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="stock-qty">Quantité disponible</Label>
                <Input
                  id="stock-qty"
                  type="number"
                  min={0}
                  value={quantiteDisponible}
                  onChange={(e) =>
                    setQuantiteDisponible(parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="stock-date">
                  Date de péremption (optionnel)
                </Label>
                <Input
                  id="stock-date"
                  type="date"
                  value={datePeremption}
                  onChange={(e) => setDatePeremption(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="stock-seuil">Seuil d&apos;alerte</Label>
                <Input
                  id="stock-seuil"
                  type="number"
                  min={0}
                  value={seuilAlerte}
                  onChange={(e) =>
                    setSeuilAlerte(parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                {editItem ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {stocks.length === 0 ? (
        <p className="text-muted-foreground">Aucun produit en stock.</p>
      ) : (
        <div className="space-y-3">
          {stocks.map((item) => {
            const isLow = item.quantiteDisponible < item.seuilAlerte;
            const isExpiring =
              item.datePeremption &&
              new Date(item.datePeremption) <= in30Days;
            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {item.photo ? (
                      <div className="relative w-14 h-14 rounded-md overflow-hidden shrink-0">
                        <Image
                          src={item.photo}
                          alt={item.nom}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{item.nom}</h3>
                        {isLow && (
                          <Badge variant="destructive">Stock bas</Badge>
                        )}
                        {isExpiring && (
                          <Badge variant="destructive">
                            Péremption proche
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                        <span>
                          Disponible : {item.quantiteDisponible} (seuil :{" "}
                          {item.seuilAlerte})
                        </span>
                        {item.codeBarre && (
                          <span>Code : {item.codeBarre}</span>
                        )}
                        {item.datePeremption && (
                          <span>
                            Péremption :{" "}
                            {format(
                              new Date(item.datePeremption),
                              "dd/MM/yyyy",
                              { locale: fr }
                            )}
                          </span>
                        )}
                        <span>
                          {item._count.articles} article(s) liés
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(item)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
