"use client"

import { LayoutDashboard, ReceiptText, NotebookTabs, LogOut, Settings, Wallet, ShieldAlert, Users, CreditCard, PieChart, Lock, Database, Tag, Clock } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator
} from "@/components/ui/sidebar"

import { useAuth } from "@/context/auth-context"

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/", color: "text-blue-500", section: "CORE" as const, page: "DASHBOARD" as const },
  { title: "Transactions", icon: ReceiptText, url: "/transactions", color: "text-emerald-500", section: "CORE" as const, page: "TRANSACTIONS" as const },
  { title: "Ledgers", icon: NotebookTabs, url: "/ledgers", color: "text-purple-500", section: "CORE" as const, page: "LEDGERS" as const },
  { title: "Categories", icon: Tag, url: "/categories", color: "text-amber-500", section: "CORE" as const, page: "CATEGORIES" as const }, 
  { title: "Budgets", icon: PieChart, url: "/budgets", color: "text-rose-500", section: "CORE" as const, page: "BUDGETS" as const }, 
  { title: "Recurring", icon: Clock, url: "/recurring", color: "text-indigo-500", section: "CORE" as const, page: "RECURRING" as const },
]

import { usePermissions } from "@/hooks/use-permissions"

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth();
  const { canView } = usePermissions();

  const isAdmin = user?.role === "Admin";

  return (
    <Sidebar collapsible="icon" className="border-r border-indigo-100/50 bg-gradient-to-b from-white to-indigo-50/30">
      <SidebarHeader className="border-b border-indigo-50 p-2 group-data-[collapsible=icon]:p-1">
        <div className="flex items-center gap-3 p-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200">
            <Wallet className="h-6 w-6" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-bold tracking-tight text-indigo-950 leading-none">MoneyFlow</span>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-1">Pro Finance</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 space-y-6">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                if (!canView(item.section, item.page)) return null;
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={`
                        w-full justify-start gap-4 px-4 py-3 h-auto rounded-xl transition-all duration-200
                        ${isActive
                          ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }
                      `}
                    >
                      <Link href={item.url} className="flex items-center w-full">
                        <item.icon className={`h-5 w-5 ${isActive ? "text-indigo-600" : item.color} ${isActive ? "fill-indigo-200" : ""}`} />
                        <span className="font-medium text-sm ml-3">{item.title}</span>
                        {isActive && (
                          <motion.div
                            layoutId="active-indicator"
                            className="absolute left-0 w-1 h-8 bg-indigo-600 rounded-r-full"
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(canView("ADMIN", "USER_MANAGEMENT") || 
          canView("ADMIN", "ACCESS_CONTROL") || 
          canView("ADMIN", "MASTERS") || 
          canView("ADMIN", "SYSTEM_AUDIT")) && (
          <SidebarGroup className="mt-auto">
            <SidebarSeparator className="bg-indigo-100/50 mb-2 opacity-50" />
            <SidebarGroupLabel className="px-4 text-[10px] font-black text-rose-300 uppercase tracking-[0.15em] mb-2 group-data-[collapsible=icon]:hidden">
              Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {[
                  { title: "Users", icon: Users, url: "/admin/users", page: "USER_MANAGEMENT" as const },
                  { title: "Access", icon: Lock, url: "/admin/access-control", page: "ACCESS_CONTROL" as const },
                  { title: "Masters", icon: Database, url: "/masters", page: "MASTERS" as const },
                  { title: "Audit", icon: ShieldAlert, url: "/admin/audit", page: "SYSTEM_AUDIT" as const }
                ].map((item) => (
                  canView("ADMIN", item.page) && (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        className={`
                          w-full justify-start gap-4 px-4 py-3 h-auto rounded-xl transition-all duration-300
                          ${pathname === item.url 
                            ? "bg-rose-50 text-rose-700 shadow-sm ring-1 ring-rose-200" 
                            : "text-gray-500 hover:bg-rose-50/50 hover:text-rose-600"
                          }
                        `}
                      >
                        <Link href={item.url} className="flex items-center w-full">
                          <item.icon className={`h-5 w-5 ${pathname === item.url ? 'text-rose-600' : 'text-rose-300'}`} />
                          <span className="font-semibold text-sm ml-3 group-data-[collapsible=icon]:hidden">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-indigo-50 p-2 space-y-2 bg-indigo-50/20 backdrop-blur-sm">
        <SidebarMenu>
          <SidebarMenuItem>
             <div className="flex items-center gap-3 p-2 rounded-xl group-data-[collapsible=icon]:p-0 transition-all">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white font-black group-data-[collapsible=icon]:mx-auto shadow-lg shadow-indigo-200/50 cursor-pointer hover:scale-105 transition-transform">
                   {user?.username?.substring(0, 1).toUpperCase() || "A"}
                </div>
                <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                   <span className="text-sm font-bold text-indigo-950 truncate leading-none">{user?.username || "Admin"}</span>
                   <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-1">{user?.role || "User"}</span>
                </div>
             </div>
          </SidebarMenuItem>
          
          <SidebarMenuItem className="mt-1">
            <SidebarMenuButton
              tooltip="Sign Out"
              onClick={logout}
              className="w-full justify-start gap-4 px-4 py-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-bold text-[10px] uppercase tracking-widest group-data-[collapsible=icon]:hidden">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}