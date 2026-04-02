"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Menu,
  LayoutDashboard,
  Backpack,
  Package,
  History,
  ClipboardCheck,
  Siren,
  BarChart3,
  Truck,
  ClipboardList,
  Droplets,
} from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/", label: "Accueil", icon: LayoutDashboard },
  { href: "/vehicules", label: "Véhicules", icon: Truck },
  { href: "/sacs", label: "Sacs", icon: Backpack },
  { href: "/taches", label: "Tâches", icon: ClipboardList },
  { href: "/hygiene", label: "Hygiène", icon: Droplets },
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/historique", label: "Historique", icon: History },
  { href: "/interventions", label: "Interventions", icon: Siren },
  { href: "/statistiques", label: "Stats", icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
      <Link href="/" className="flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-primary" />
        <span className="font-bold">SecoursMatos</span>
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <nav className="mt-6 space-y-1">
            {links.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
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
        </SheetContent>
      </Sheet>
    </header>
  );
}
