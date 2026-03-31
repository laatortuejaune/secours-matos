"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CheckupSummary {
  id: number;
  date: string;
  note: string | null;
  sac: { id: number; nom: string };
  checkupArticles: Array<{
    quantiteManquante: number;
    quantitePrelevee: number;
  }>;
}

export default function HistoriquePage() {
  const [checkups, setCheckups] = useState<CheckupSummary[]>([]);

  useEffect(() => {
    fetch("/api/checkups")
      .then((r) => r.json())
      .then(setCheckups);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Historique des checkups</h1>

      {checkups.length === 0 ? (
        <p className="text-muted-foreground">Aucun checkup enregistré.</p>
      ) : (
        <div className="space-y-3">
          {checkups.map((checkup) => {
            const totalManque = checkup.checkupArticles.reduce(
              (sum, ca) => sum + ca.quantiteManquante,
              0
            );
            const totalPreleve = checkup.checkupArticles.reduce(
              (sum, ca) => sum + ca.quantitePrelevee,
              0
            );
            return (
              <Link key={checkup.id} href={`/historique/${checkup.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{checkup.sac.nom}</h3>
                          <span className="text-sm text-muted-foreground">
                            {format(
                              new Date(checkup.date),
                              "dd/MM/yyyy HH:mm",
                              { locale: fr }
                            )}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <Badge variant={totalManque > 0 ? "destructive" : "secondary"}>
                            {totalManque > 0
                              ? `${totalManque} manquant(s)`
                              : "Complet"}
                          </Badge>
                          {totalPreleve > 0 && (
                            <Badge variant="secondary">
                              {totalPreleve} prélevé(s) du stock
                            </Badge>
                          )}
                        </div>
                        {checkup.note && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {checkup.note}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
