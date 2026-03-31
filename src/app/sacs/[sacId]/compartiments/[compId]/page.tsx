"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhotoUpload } from "@/components/photo-upload";
import { Plus, ArrowLeft, Package, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Article {
  id: number;
  nom: string;
  photo: string | null;
  codeBarre: string | null;
  quantiteRequise: number;
  datePeremption: string | null;
  stockId: number | null;
  stock: { id: number; nom: string } | null;
}

interface Compartiment {
  id: number;
  nom: string;
  photo: string | null;
  sac: { id: number; nom: string };
  articles: Article[];
}

interface StockItem {
  id: number;
  nom: string;
}

export default function CompartimentDetailPage() {
  const params = useParams();
  const sacId = params.sacId as string;
  const compId = parseInt(params.compId as string);

  const [comp, setComp] = useState<Compartiment | null>(null);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editArticle, setEditArticle] = useState<Article | null>(null);

  // Form state
  const [nom, setNom] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [codeBarre, setCodeBarre] = useState("");
  const [quantiteRequise, setQuantiteRequise] = useState(1);
  const [datePeremption, setDatePeremption] = useState("");
  const [stockId, setStockId] = useState<string>("");

  const fetchComp = useCallback(() =>
    fetch(`/api/compartiments/${compId}`)
      .then((r) => r.json())
      .then(setComp),
  [compId]);

  const fetchStocks = useCallback(() =>
    fetch("/api/stock")
      .then((r) => r.json())
      .then(setStocks),
  []);

  useEffect(() => {
    fetchComp();
    fetchStocks();
  }, [fetchComp, fetchStocks]);

  function resetForm() {
    setNom("");
    setPhoto(null);
    setCodeBarre("");
    setQuantiteRequise(1);
    setDatePeremption("");
    setStockId("");
    setEditArticle(null);
  }

  function openEdit(article: Article) {
    setEditArticle(article);
    setNom(article.nom);
    setPhoto(article.photo);
    setCodeBarre(article.codeBarre || "");
    setQuantiteRequise(article.quantiteRequise);
    setDatePeremption(
      article.datePeremption
        ? new Date(article.datePeremption).toISOString().split("T")[0]
        : ""
    );
    setStockId(article.stockId?.toString() || "");
    setOpen(true);
  }

  async function handleSave() {
    if (!nom.trim()) return;
    const data = {
      nom,
      photo,
      codeBarre: codeBarre || null,
      quantiteRequise,
      datePeremption: datePeremption || null,
      stockId: stockId ? parseInt(stockId) : null,
      compartimentId: compId,
    };

    if (editArticle) {
      await fetch(`/api/articles/${editArticle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      toast.success("Article modifié");
    } else {
      await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      toast.success("Article créé");
    }

    resetForm();
    setOpen(false);
    fetchComp();
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cet article ?")) return;
    await fetch(`/api/articles/${id}`, { method: "DELETE" });
    toast.success("Article supprimé");
    fetchComp();
  }

  if (!comp) {
    return <p className="text-muted-foreground">Chargement...</p>;
  }

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/sacs/${sacId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{comp.nom}</h1>
          <p className="text-sm text-muted-foreground">
            {comp.sac.nom} &rarr; {comp.nom}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {comp.articles.length} article(s)
        </p>
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
              Nouvel article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editArticle ? "Modifier l'article" : "Créer un article"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="art-nom">Nom</Label>
                <Input
                  id="art-nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Compresse stérile"
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
                <Label htmlFor="art-code">Code-barre (optionnel)</Label>
                <Input
                  id="art-code"
                  value={codeBarre}
                  onChange={(e) => setCodeBarre(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="art-qty">Quantité requise</Label>
                <Input
                  id="art-qty"
                  type="number"
                  min={1}
                  value={quantiteRequise}
                  onChange={(e) => setQuantiteRequise(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor="art-date">Date de péremption (optionnel)</Label>
                <Input
                  id="art-date"
                  type="date"
                  value={datePeremption}
                  onChange={(e) => setDatePeremption(e.target.value)}
                />
              </div>
              <div>
                <Label>Lier au stock central (optionnel)</Label>
                <Select value={stockId} onValueChange={setStockId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {stocks.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full">
                {editArticle ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {comp.articles.length === 0 ? (
        <p className="text-muted-foreground">Aucun article.</p>
      ) : (
        <div className="space-y-3">
          {comp.articles.map((article) => {
            const isExpiringSoon =
              article.datePeremption &&
              new Date(article.datePeremption) <= in30Days;
            return (
              <Card key={article.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {article.photo ? (
                      <div className="relative w-14 h-14 rounded-md overflow-hidden shrink-0">
                        <Image
                          src={article.photo}
                          alt={article.nom}
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
                        <h3 className="font-semibold">{article.nom}</h3>
                        {article.stock && (
                          <Badge variant="secondary">
                            Stock: {article.stock.nom}
                          </Badge>
                        )}
                        {isExpiringSoon && (
                          <Badge variant="destructive">Péremption proche</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                        <span>Qté requise : {article.quantiteRequise}</span>
                        {article.codeBarre && (
                          <span>Code : {article.codeBarre}</span>
                        )}
                        {article.datePeremption && (
                          <span>
                            Péremption :{" "}
                            {format(
                              new Date(article.datePeremption),
                              "dd/MM/yyyy",
                              { locale: fr }
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(article)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(article.id)}
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
