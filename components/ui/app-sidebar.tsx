"use client"
import { useState } from "react"
import { Calendar, Clock, Database, Dices, FileText, Home, Palette, Trash, Code, Book, Image, QrCode, Ruler, DiffIcon, KeySquare, FileCode, CaseSensitive, Binary, Brackets, Search, Timer, Coffee, Globe } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarInput
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "API Tester",
    url: "/tools/api-tester",
    icon: Globe,
  },
  {
    title: "Pomodoro Timer",
    url: "/tools/pomodoro",
    icon: Coffee,
  },
  {
    title: "Chronometer",
    url: "/tools/chronometer",
    icon: Timer,
  },
  {
    title: "Color Picker",
    url: "/tools/color-picker",
    icon: Palette,
  },
  {
    title: "Password Generator",
    url: "/tools/password-generator",
    icon: Dices,
  },
  {
    title: "Password Manager",
    url: "/tools/password-manager",
    icon: Database,
  },
  {
    title: "Regex Tester",
    url: "/tools/regex-generator",
    icon: Code,
  },
  {
    title: "UUID Generator",
    url: "/tools/uuid-generator",
    icon: KeySquare,
  },
  {
    title: "Diff Checker",
    url: "/tools/diff-checker",
    icon: DiffIcon,
  },
  {
    title: "Unit Converter",
    url: "/tools/unit-converter",
    icon: Ruler,
  },
  {
    title: "QR Code Generator",
    url: "/tools/qr-code-generator",
    icon: QrCode,
  },
  {
    title: "Base64 Encoder",
    url: "/tools/base64-encoder",
    icon: Binary,
  },
  {
    title: "Text Case Converter",
    url: "/tools/text-case-converter",
    icon: CaseSensitive,
  },
  {
    title: "HTML Previewer",
    url: "/tools/html-previewer",
    icon: FileCode,
  },
  {
    title: "JSON Formatter",
    url: "/tools/json-formatter",
    icon: Brackets,
  },
  {
    title: "TimeZone Buddy",
    url: "/tools/timezone-buddy",
    icon: Clock,
  },
  {
    title: "Retro Calendar",
    url: "/tools/retro-calendar",
    icon: Calendar,
  },
  {
    title: "Notes Manager",
    url: "/tools/notes-manager",
    icon: Book,
  },
  {
    title: "Markdown Notes",
    url: "/tools/markdown-notes",
    icon: FileText,
  },
  {
    title: "Background Remover",
    url: "/tools/background-remover",
    icon: Trash,
  },
  {
    title: "Image Resizer",
    url: "/tools/image-resizer",
    icon: Image,
  }
]

export function AppSidebar() {
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  
  // Filter items based on search query
  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <SidebarInput
              placeholder="Search tools..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel>Toolkit</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link 
                        href={item.url}
                        className={isActive ? "bg-accent text-accent-foreground" : ""}
                      >
                        <item.icon className={isActive ? "text-primary" : ""} />
                        <span>{item.title}</span>
                        {isActive && (
                          <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
              {filteredItems.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No tools found
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
