"use client"

import { LayoutDashboard, ReceiptText, NotebookTabs, LogOut, Settings, Wallet, ShieldAlert, Users, CreditCard, PieChart, Lock, Database, Tag, Clock, PanelLeft, Target } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { usePermissions } from "@/hooks/use-permissions"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface MenuItem {
  title: string
  icon: any
  url: string
  section: "CORE" | "ADMIN"
  page: any
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/", section: "CORE", page: "DASHBOARD" },
  { title: "Transactions", icon: ReceiptText, url: "/transactions", section: "CORE", page: "TRANSACTIONS" },
  { title: "Ledgers", icon: NotebookTabs, url: "/ledgers", section: "CORE", page: "LEDGERS" },
  { title: "Categories", icon: Tag, url: "/categories", section: "CORE", page: "CATEGORIES" },
  { title: "Budgets", icon: PieChart, url: "/budgets", section: "CORE", page: "BUDGETS" },
  { title: "Goals", icon: Target, url: "/goals", section: "CORE", page: "GOALS" },
  { title: "Recurring", icon: Clock, url: "/recurring", section: "CORE", page: "RECURRING" },
]

const adminItems: MenuItem[] = [
  { title: "Users", icon: Users, url: "/admin/users", section: "ADMIN", page: "USER_MANAGEMENT" },
  { title: "Access", icon: Lock, url: "/admin/access-control", section: "ADMIN", page: "ACCESS_CONTROL" },
  { title: "Masters", icon: Database, url: "/masters", section: "ADMIN", page: "MASTERS" },
  { title: "Audit", icon: ShieldAlert, url: "/admin/audit", section: "ADMIN", page: "SYSTEM_AUDIT" },
]

export function AppSidebar({ isExpanded, toggle }: { isExpanded: boolean; toggle: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { canView } = usePermissions()

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "h-screen bg-white border-r border-gray-100 flex flex-col py-6 shrink-0 z-50 transition-all duration-300 ease-in-out sticky top-0",
          isExpanded ? "w-[260px]" : "w-[72px]"
        )}
      >
        {/* Branding/Logo & Toggle */}
        <div className="mb-10 px-3 flex items-center justify-between">
          <button 
            onClick={toggle}
            className="flex items-center gap-3 transition-transform active:scale-95 text-left"
          >
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-200">
              <Wallet className="w-6 h-6" />
            </div>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col whitespace-nowrap"
              >
                <span className="text-sm font-bold text-gray-900">MoneyFlow</span>
                <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Pro Edition</span>
              </motion.div>
            )}
          </button>
          
          {isExpanded && (
            <button 
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-purple-600 transition-colors"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 w-full px-3 flex flex-col gap-2 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            if (!canView(item.section, item.page)) return null
            const isActive = pathname === item.url
            return (
              <SidebarItem key={item.url} item={item} isActive={isActive} isExpanded={isExpanded} />
            )
          })}

          <div className="w-full h-[1px] bg-gray-50 my-4" />

          {adminItems.map((item) => {
            if (!canView(item.section, item.page)) return null
            const isActive = pathname === item.url
            return (
              <SidebarItem key={item.url} item={item} isActive={isActive} isExpanded={isExpanded} isDestructive />
            )
          })}
        </nav>

        {/* Footer section */}
        <div className="mt-auto px-3 flex flex-col gap-4 w-full">
          <div className={cn(
            "flex items-center rounded-xl transition-all p-2",
            isExpanded ? "bg-purple-50" : "justify-center"
          )}>
            <div className="w-10 h-10 shrink-0 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md relative">
              {user?.username?.substring(0, 1).toUpperCase() || "A"}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            </div>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ml-3 flex flex-col min-w-0"
              >
                <span className="text-sm font-bold text-gray-900 truncate">{user?.username || "Admin"}</span>
                <span className="text-[10px] text-purple-600 font-medium uppercase tracking-wider">{user?.role || "User"}</span>
              </motion.div>
            )}
          </div>

          <button 
            onClick={logout}
            className={cn(
              "flex items-center rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all p-2",
              isExpanded ? "gap-3 px-3" : "justify-center w-12 h-12 mx-auto"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isExpanded && <span className="text-sm font-bold">Sign Out</span>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  )
}

function SidebarItem({ item, isActive, isExpanded, isDestructive = false }: { item: MenuItem; isActive: boolean; isExpanded: boolean; isDestructive?: boolean }) {
  const content = (
    <Link
      href={item.url}
      className={cn(
        "relative flex items-center rounded-xl transition-all duration-300 group h-12",
        isActive 
          ? "bg-purple-600 text-white shadow-lg shadow-purple-200" 
          : "text-gray-400 hover:bg-gray-100 hover:text-gray-900",
        isExpanded ? "px-4 gap-4 w-full" : "justify-center w-12 mx-auto"
      )}
    >
      <item.icon className={cn("w-5 h-5 shrink-0 transition-transform duration-300", !isActive && "group-hover:scale-110")} />
      
      {isExpanded && (
        <motion.span 
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-sm font-bold whitespace-nowrap"
        >
          {item.title}
        </motion.span>
      )}

      {isActive && !isExpanded && (
        <motion.div
          layoutId="active-pill"
          className="absolute -left-3 w-1.5 h-6 bg-purple-600 rounded-r-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}

      {!isActive && isDestructive && !isExpanded && (
         <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-400 opacity-50" />
      )}
    </Link>
  )

  if (isExpanded) return content

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {content}
      </TooltipTrigger>
      <TooltipContent side="right" className="font-medium">
        {item.title}
      </TooltipContent>
    </Tooltip>
  )
}