import { Calendar, Clock, Database, Dices, FileText, Home, Palette, Trash, Code, Book, Image } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
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
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Toolkit</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
