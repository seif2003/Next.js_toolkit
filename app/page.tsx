"use client"

import { useState } from "react";
import Link from "next/link";
import { 
  Dices, 
  Palette, 
  Trash, 
  FileText, 
  Calendar, 
  Clock, 
  KeyRound, 
  Code, 
  ImageIcon, 
  Brackets, 
  QrCode, 
  Ruler, 
  DiffIcon, 
  KeySquare, 
  FileCode,
  CaseSensitive,
  Binary,
  Search,
  Book,
  Timer,
  Coffee,
  Globe
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const tools = [
    {
      title: "API Tester",
      description: "Test API endpoints with different methods, headers, and request bodies",
      icon: Globe,
      url: "/tools/api-tester",
    },
    {
      title: "Pomodoro Timer",
      description: "Boost productivity with timed work sessions and strategic breaks",
      icon: Coffee,
      url: "/tools/pomodoro",
    },
    {
      title: "Chronometer",
      description: "Precise timing with lap recording for various activities",
      icon: Timer,
      url: "/tools/chronometer",
    },
    {
      title: "Color Picker",
      description: "Create, explore, and export beautiful color palettes",
      icon: Palette,
      url: "/tools/color-picker",
    },
    {
      title: "Password Generator",
      description: "Generate strong, secure passwords customized to your needs",
      icon: Dices,
      url: "/tools/password-generator",
    },
    {
      title: "UUID Generator",
      description: "Generate cryptographically secure UUIDs with one click",
      icon: KeySquare,
      url: "/tools/uuid-generator",
    },
    {
      title: "Diff Checker",
      description: "Compare text to highlight differences between versions",
      icon: DiffIcon,
      url: "/tools/diff-checker",
    },
    {
      title: "Unit Converter",
      description: "Convert between different units of measurement",
      icon: Ruler,
      url: "/tools/unit-converter",
    },
    {
      title: "QR Code Generator",
      description: "Generate and scan QR codes for sharing information",
      icon: QrCode,
      url: "/tools/qr-code-generator",
    },
    {
      title: "Base64 Encoder",
      description: "Encode and decode text using Base64 encoding",
      icon: Binary,
      url: "/tools/base64-encoder",
    },
    {
      title: "Text Case Converter",
      description: "Convert text between different case formats",
      icon: CaseSensitive,
      url: "/tools/text-case-converter",
    },
    {
      title: "HTML Previewer",
      description: "Preview HTML code with real-time rendering",
      icon: FileCode,
      url: "/tools/html-previewer",
    },
    {
      title: "Background Remover",
      description: "Remove backgrounds from images with a single click",
      icon: Trash,
      url: "/tools/background-remover",
    },
    {
      title: "Markdown Notes",
      description: "Create, organize and manage your notes with Markdown formatting",
      icon: FileText,
      url: "/tools/markdown-notes",
    },
    {
      title: "Regex Generator",
      description: "Generate and test regular expressions with natural language",
      icon: Code,
      url: "/tools/regex-generator",
    },
    {
      title: "Password Manager",
      description: "Securely store and manage your passwords locally",
      icon: KeyRound,
      url: "/tools/password-manager",
    },
    {
      title: "Timezone Buddy",
      description: "Compare and convert times across different timezones",
      icon: Clock,
      url: "/tools/timezone-buddy",
    },
    {
      title: "Retro Calendar",
      description: "A nostalgic calendar with customizable themes",
      icon: Calendar,
      url: "/tools/retro-calendar",
    },
    {
      title: "Image Resizer",
      description: "Resize any image to your preferred dimensions and format",
      icon: ImageIcon,
      url: "/tools/image-resizer",
    },
    {
      title: "JSON Formatter",
      description: "Format, validate, and view JSON data in a structured way",
      icon: Brackets,
      url: "/tools/json-formatter",
    },
    {
      title: "Notes Manager",
      description: "Create, organize, and manage your notes efficiently",
      icon: Book,
      url: "/tools/notes-manager",
    },
  ];

  // Filter tools based on search query
  const filteredTools = tools.filter((tool) => 
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Welcome to the Toolkit</h2>
        <p className="text-muted-foreground">
          A collection of useful tools to help with your everyday tasks.
        </p>
        
        {/* Search bar */}
        <div className="relative mt-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for tools..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {filteredTools.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No tools found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => (
            <Link key={tool.title} href={tool.url}>
              <div className="group flex flex-col h-48 rounded-lg border bg-card text-card-foreground shadow-sm transition-colors hover:border-primary hover:bg-accent p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <tool.icon className="h-6 w-6 text-primary" />
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1"
                  >
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold">{tool.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
