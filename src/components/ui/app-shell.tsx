"use client";


"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Settings,
  MoreHorizontal,
  LayoutGrid,
  Send,
  PlusCircle,
  Building,
  Vote,
  BarChart3,
  User,
  LogOut,
  KeyRound,
  Trash2,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WionLogo } from "../landing/wion-logo";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { href: "/home", icon: Home, label: "Inicio" },
  { href: "/invite", icon: Send, label: "Invitar" },
  { href: "/community", icon: Users, label: "Comunidad" },
  { href: "/polls", icon: Vote, label: "Encuestas"},
  { href: "/finances", icon: BarChart3, label: "Finanzas"},
  { href: "/more", icon: LayoutGrid, label: "Más" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex h-screen">
        <DesktopSidebar />
        <main className="flex-1 overflow-y-auto bg-muted/40">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </SidebarProvider>
  );
}

function DesktopSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  return (
    <Sidebar className="hidden lg:flex lg:flex-col" variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <WionLogo className="w-8 h-8"/>
            {state === 'expanded' && <h1 className="text-xl font-semibold font-headline">Wion</h1>}
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-1">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer hover:bg-muted p-2 rounded-md">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="user avatar" />
                    <AvatarFallback>JP</AvatarFallback>
                  </Avatar>
                   {state === 'expanded' && (
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-semibold">Juan Pérez</span>
                      <span className="text-xs text-muted-foreground">Propietario</span>
                    </div>
                   )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56 mb-2">
                <DropdownMenuLabel>
                     <p className="font-bold">Juan Pérez</p>
                     <p className="text-xs text-muted-foreground font-normal">juan.perez@email.com</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile"><User className="mr-2"/>Mi Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="#"><KeyRound className="mr-2"/>Cambiar Contraseña</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href="/settings"><Settings className="mr-2"/>Configuración</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href="https://ngs-studiios.com" target="_blank"><Building className="mr-2"/>NGS-Studiios</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                     <Link href="/login"><LogOut className="mr-2"/>Cerrar Sesión</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                     <Link href="#"><Trash2 className="mr-2 text-destructive"/>Eliminar Cuenta</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}


function MobileBottomNav() {
    const pathname = usePathname();
    const mobileNavItems = [
        { href: "/home", icon: Home, label: "Inicio" },
        { href: "/community", icon: Users, label: "Comunidad" },
        { href: "/polls", icon: Vote, label: "Encuestas"},
        { href: "/finances", icon: BarChart3, label: "Finanzas"},
        { href: "/more", icon: LayoutGrid, label: "Más" },
    ]
    return (
      <div className="lg:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t">
        <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex flex-col items-center justify-center px-5 hover:bg-muted ${pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    );
}
