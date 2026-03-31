"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Backpack,
  AlertTriangle,
  Package,
  ClipboardCheck,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DashboardData {
  totalSacs: number;
  articlesPeremption: Array<{
    id: number;
    nom: string;
    datePeremption: string;
    compartiment: { sac: { nom: string } };
  }>;
  stocksBas: Array<{
    id: number;
    nom: string;
    quantiteDisponible: number;
    seuilAlerte: number;
  }>;
  stocksPeremption: Array<{
    id: number;
    nom: string;
    datePeremption: string;
  }>;
  derniersCheckups: Array<{
    id: number;
    date: string;
    sac: { nom: string; id: number };
  }>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sacs</CardTitle>
            <Backpack className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSacs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Péremptions proches
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {data.articlesPeremption.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stocks bas</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {data.stocksBas.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Stocks péremption
            </CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {data.stocksPeremption.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/sacs">
          <Button>
            <Backpack className="h-4 w-4 mr-2" />
            Gérer les sacs
          </Button>
        </Link>
        <Link href="/stock">
          <Button variant="outline">
            <Package className="h-4 w-4 mr-2" />
            Stock central
          </Button>
        </Link>
        <Link href="/historique">
          <Button variant="outline">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Historique
          </Button>
        </Link>
      </div>

      {data.articlesPeremption.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Articles en alerte péremption ({"<"} 30 jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.articlesPeremption.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {article.nom}{" "}
                    <span className="text-muted-foreground">
                      ({article.compartiment.sac.nom})
                    </span>
                  </span>
                  <Badge variant="destructive">
                    {format(new Date(article.datePeremption), "dd/MM/yyyy", {
                      locale: fr,
                    })}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.stocksBas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-500" />
              Stocks bas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.stocksBas.map((stock) => (
                <div
                  key={stock.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{stock.nom}</span>
                  <Badge variant="destructive">
                    {stock.quantiteDisponible} / seuil {stock.seuilAlerte}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Derniers checkups</CardTitle>
        </CardHeader>
        <CardContent>
          {data.derniersCheckups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun checkup effectué
            </p>
          ) : (
            <div className="space-y-2">
              {data.derniersCheckups.map((checkup) => (
                <Link
                  key={checkup.id}
                  href={`/historique/${checkup.id}`}
                  className="flex items-center justify-between text-sm hover:bg-accent p-2 rounded-md transition-colors"
                >
                  <span className="font-medium">{checkup.sac.nom}</span>
                  <span className="text-muted-foreground">
                    {format(new Date(checkup.date), "dd/MM/yyyy HH:mm", {
                      locale: fr,
                    })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
