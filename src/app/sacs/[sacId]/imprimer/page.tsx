"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Article {
  id: number; nom: string; quantiteRequise: number;
  datePeremption: string | null;
  stock: { nom: string; quantiteDisponible: number } | null;
}
interface Compartiment {
  id: number; nom: string;
  articles: Article[];
}
interface Sac {
  id: number; nom: string; localisation: string | null;
  description: string | null; dernierCheckup: string | null;
  compartiments: Compartiment[];
}

export default function ImprimerPage() {
  const params = useParams();
  const sacId = parseInt(params.sacId as string);
  const [sac, setSac] = useState<Sac | null>(null);

  useEffect(() => {
    fetch(`/api/sacs/${sacId}`).then((r) => r.json()).then(setSac);
  }, [sacId]);

  if (!sac) return <p className="p-8 text-center">Chargement...</p>;

  const today = format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr });
  const totalArticles = sac.compartiments.reduce((s, c) => s + c.articles.length, 0);

  return (
    <div className="p-8 max-w-4xl mx-auto print:p-4">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-xl font-bold">Inventaire : {sac.nom}</h1>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />Imprimer
        </Button>
      </div>

      <div className="print:block">
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold">Inventaire du sac : {sac.nom}</h1>
          {sac.localisation && <p className="text-sm text-gray-600">Localisation : {sac.localisation}</p>}
          {sac.description && <p className="text-sm text-gray-600">{sac.description}</p>}
          <p className="text-sm text-gray-500 mt-1">Édité le : {today}</p>
          {sac.dernierCheckup && (
            <p className="text-sm text-gray-500">
              Dernier checkup : {format(new Date(sac.dernierCheckup), "dd/MM/yyyy HH:mm", { locale: fr })}
            </p>
          )}
          <p className="text-sm text-gray-500">{totalArticles} article(s) au total</p>
        </div>

        {sac.compartiments.map((comp) => (
          <div key={comp.id} className="mb-6">
            <h2 className="text-lg font-semibold mb-3 border-b pb-1">{comp.nom}</h2>
            {comp.articles.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Aucun article</p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 print:bg-gray-100">
                    <th className="text-left p-2 border">Article</th>
                    <th className="text-center p-2 border">Qté requise</th>
                    <th className="text-center p-2 border">Péremption</th>
                    <th className="text-left p-2 border">Stock lié</th>
                    <th className="text-center p-2 border w-24">Trouvé ☐</th>
                  </tr>
                </thead>
                <tbody>
                  {comp.articles.map((art) => (
                    <tr key={art.id} className="border-b">
                      <td className="p-2 border">{art.nom}</td>
                      <td className="p-2 border text-center">{art.quantiteRequise}</td>
                      <td className="p-2 border text-center">
                        {art.datePeremption
                          ? format(new Date(art.datePeremption), "dd/MM/yyyy", { locale: fr })
                          : "—"}
                      </td>
                      <td className="p-2 border text-sm text-gray-600">{art.stock?.nom || "—"}</td>
                      <td className="p-2 border text-center">___</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}

        <div className="mt-8 pt-4 border-t">
          <p className="text-sm text-gray-500">Signature : _____________________________ Date : ___________</p>
        </div>
      </div>
    </div>
  );
}
