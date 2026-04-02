"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Backpack,
  Package,
  ClipboardCheck,
  History,
  Siren,
  BarChart3,
  Truck,
  ClipboardList,
  Droplets,
} from "lucide-react";

const links = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/vehicules", label: "Véhicules", icon: Truck },
  { href: "/sacs", label: "Sacs", icon: Backpack },
  { href: "/taches", label: "Tâches", icon: ClipboardList },
  { href: "/hygiene", label: "Hygiène", icon: Droplets },
  { href: "/stock", label: "Stock central", icon: Package },
  { href: "/historique", label: "Historique", icon: History },
  { href: "/interventions", label: "Interventions", icon: Siren },
  { href: "/statistiques", label: "Statistiques", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 border-r bg-card">
      <div className="p-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">SecoursMatos</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
