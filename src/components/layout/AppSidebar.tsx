// src/components/layout/AppSidebar.tsx
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, PlusCircle, Settings, LogOut, UserCircle, HelpCircle } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
  { href: '/tours/create', label: 'Create Demo', icon: PlusCircle, requiresAuth: true },
  // { href: '/guides', label: 'Guides', icon: BookOpen, requiresAuth: false },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login');
    } catch (error) {
      toast({ variant: "destructive", title: "Logout Failed", description: (error as Error).message });
    }
  };

  const getInitials = (email?: string | null) => {
    if (!email) return 'PD'; // Product Demo
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };


  return (
    <Sidebar variant="sidebar" collapsible="icon" side="left">
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <Logo className="h-8 w-auto text-primary" />
          <span className="font-semibold text-lg text-foreground">Product Demo</span>
        </Link>
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <Separator className="my-0" />
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.filter(item => !item.requiresAuth || (item.requiresAuth && user)).map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                tooltip={{ children: item.label, side: 'right', align: 'center' }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <Separator className="my-0" />
      <SidebarFooter className="p-2">
        <SidebarMenu>
           {user && (
            <SidebarMenuItem className="group-data-[collapsible=icon]:hidden mb-2">
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                        <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                        <p className="font-semibold truncate">{user.displayName || user.email}</p>
                    </div>
                </div>
            </SidebarMenuItem>
           )}
           <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                // isActive={pathname === '/settings'} // Placeholder for future settings page
                tooltip={{ children: 'Settings', side: 'right', align: 'center' }}
              >
                <Link href="#"> {/* TODO: Implement settings page */}
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             {user && (
               <SidebarMenuItem>
                 <SidebarMenuButton
                   onClick={handleLogout}
                   tooltip={{ children: 'Logout', side: 'right', align: 'center' }}
                 >
                   <LogOut />
                   <span>Logout</span>
                 </SidebarMenuButton>
               </SidebarMenuItem>
             )}
             {!user && !loading && (
                <SidebarMenuItem>
                 <SidebarMenuButton
                   asChild
                   isActive={pathname === '/login'}
                   tooltip={{ children: 'Login', side: 'right', align: 'center' }}
                 >
                   <Link href="/login">
                    <UserCircle/>
                    <span>Login / Signup</span>
                   </Link>
                 </SidebarMenuButton>
               </SidebarMenuItem>
             )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
