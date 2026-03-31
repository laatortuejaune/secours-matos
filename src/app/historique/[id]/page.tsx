"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CheckupDetail {
  id: number;
  date: string;
  note: string | null;
  sac: { id: number; nom: string };
  checkupArticles: Array<{
    id: number;
    quantiteTrouvee: number;
    quantiteManquante: number;
    quantitePrelevee: number;
    article: {
      id: number;
      nom: string;
      quantiteRequise: number;
      compartiment: { nom: string };
      stock: { nom: string } | null;
    };
  }>;
}

export default function CheckupDetailPage() {
  const params = useParams();
  const checkupId = parseInt(params.id as string);
  const [checkup, setCheckup] = useState<CheckupDetail | null>(null);

  useEffect(() => {
    fetch(`/api/checkups/${checkupId}`)
      .then((r) => r.json())
      .then(setCheckup);
  }, [checkupId]);

  if (!checkup) {
    return <p className="text-muted-foreground">Chargement...</p>;
  }

  const totalManque = checkup.checkupArticles.reduce(
    (sum, ca) => sum + ca.quantiteManquante,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/historique">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Détail du checkup</h1>
          <p className="text-sm text-muted-foreground">
            {checkup.sac.nom} &mdash;{" "}
            {format(new Date(checkup.date), "dd/MM/yyyy HH:mm", {
              locale: fr,
            })}
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge variant={totalManque > 0 ? "destructive" : "secondary"}>
          {totalManque > 0 ? `${totalManque} manquant(s)` : "Checkup complet"}
        </Badge>
      </div>

      {checkup.note && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Note</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{checkup.note}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Articles vérifiés</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead>Compartiment</TableHead>
                  <TableHead className="text-center">Requis</TableHead>
                  <TableHead className="text-center">Trouvé</TableHead>
                  <TableHead className="text-center">Manque</TableHead>
                  <TableHead className="text-center">Prélevé stock</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkup.checkupArticles.map((ca) => (
                  <TableRow key={ca.id}>
                    <TableCell className="font-medium">
                      {ca.article.nom}
                    </TableCell>
                    <TableCell>{ca.article.compartiment.nom}</TableCell>
                    <TableCell className="text-center">
                      {ca.article.quantiteRequise}
                    </TableCell>
                    <TableCell className="text-center">
                      {ca.quantiteTrouvee}
                    </TableCell>
                    <TableCell className="text-center">
                      {ca.quantiteManquante > 0 ? (
                        <span className="flex items-center justify-center gap-1 text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          {ca.quantiteManquante}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1 text-green-600">
                          <Check className="h-3 w-3" />0
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {ca.quantitePrelevee > 0 ? (
                        <Badge variant="secondary">
                          {ca.quantitePrelevee}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {ca.article.stock?.nom || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
