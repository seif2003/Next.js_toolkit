"use client"

import React from "react"
import { Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t bg-background mt-auto">
      <div className="container flex flex-col sm:flex-row items-center justify-between py-4 md:py-6 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Next.js Toolkit
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <a 
            href="https://www.benamara.tn" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Created by Seif Ddine Ben Amara
          </a>
          <a
            href="https://github.com/seif2003/Next.js_toolkit.git"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
            title="View on GitHub"
          >
            <Github size={18} />
            <span className="hidden sm:inline text-sm">GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  )
}