"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, Command, X, Keyboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// Define our tools data structure
const tools = [
  { id: 'api-tester', name: 'API Tester', description: 'Test API endpoints', href: '/tools/api-tester' },
  { id: 'background-remover', name: 'Background Remover', description: 'Remove image backgrounds', href: '/tools/background-remover' },
  { id: 'base64-encoder', name: 'Base64 Encoder', description: 'Encode and decode Base64', href: '/tools/base64-encoder' },
  { id: 'chronometer', name: 'Chronometer', description: 'Track time with precision', href: '/tools/chronometer' },
  { id: 'color-picker', name: 'Color Picker', description: 'Select and manage colors', href: '/tools/color-picker' },
  { id: 'diff-checker', name: 'Diff Checker', description: 'Compare text differences', href: '/tools/diff-checker' },
  { id: 'html-previewer', name: 'HTML Previewer', description: 'Preview HTML code', href: '/tools/html-previewer' },
  { id: 'image-resizer', name: 'Image Resizer', description: 'Resize images easily', href: '/tools/image-resizer' },
  { id: 'json-formatter', name: 'JSON Formatter', description: 'Format and validate JSON', href: '/tools/json-formatter' },
  { id: 'markdown-notes', name: 'Markdown Notes', description: 'Create markdown notes', href: '/tools/markdown-notes' },
  { id: 'notes-manager', name: 'Notes Manager', description: 'Organize your notes', href: '/tools/notes-manager' },
  { id: 'password-generator', name: 'Password Generator', description: 'Generate secure passwords', href: '/tools/password-generator' },
  { id: 'password-manager', name: 'Password Manager', description: 'Store passwords securely', href: '/tools/password-manager' },
  { id: 'pomodoro', name: 'Pomodoro', description: 'Boost productivity with timers', href: '/tools/pomodoro' },
  { id: 'qr-code-generator', name: 'QR Code Generator', description: 'Generate QR codes', href: '/tools/qr-code-generator' },
  { id: 'regex-generator', name: 'Regex Generator', description: 'Create regular expressions', href: '/tools/regex-generator' },
  { id: 'retro-calendar', name: 'Retro Calendar', description: 'Stylish calendar tool', href: '/tools/retro-calendar' },
  { id: 'text-case-converter', name: 'Text Case Converter', description: 'Convert text case formats', href: '/tools/text-case-converter' },
  { id: 'timezone-buddy', name: 'Timezone Buddy', description: 'Manage different timezones', href: '/tools/timezone-buddy' },
  { id: 'unit-converter', name: 'Unit Converter', description: 'Convert between units', href: '/tools/unit-converter' },
  { id: 'uuid-generator', name: 'UUID Generator', description: 'Generate UUID strings', href: '/tools/uuid-generator' },
]

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showTip, setShowTip] = useState(true)
  const router = useRouter()
  
  // Filter tools based on search query
  const filteredTools = query === ''
    ? tools
    : tools.filter((tool) => {
        return tool.name.toLowerCase().includes(query.toLowerCase()) || 
               tool.description.toLowerCase().includes(query.toLowerCase())
      })

  // Handle keyboard shortcut (Ctrl+I)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault()
        setIsOpen(true)
      }
      
      if (!isOpen) return
      
      // Navigation with arrow keys
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredTools.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0)
      } else if (e.key === 'Enter' && filteredTools[selectedIndex]) {
        e.preventDefault()
        handleSelect(filteredTools[selectedIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredTools])

  // Navigate to selected tool
  const handleSelect = (tool: typeof tools[number]) => {
    router.push(tool.href)
    setIsOpen(false)
  }
  
  // Reset selection on input change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 gap-0 glass-effect overflow-hidden max-h-[85vh] animate-fade-in">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools..."
              className="h-12 w-full border-0 bg-transparent pl-11 pr-4 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
        </div>

        <div className="max-h-[60vh] overflow-y-auto styled-scrollbar">
          {filteredTools.length > 0 ? (
            <div className="p-2">
              {filteredTools.map((tool, index) => (
                <Button
                  key={tool.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left px-3 py-5 h-auto mb-1 card-hover",
                    index === selectedIndex && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleSelect(tool)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1">
                      <p className="font-medium text-base">{tool.name}</p>
                      <p className={cn(
                        "text-xs text-muted-foreground",
                        index === selectedIndex && "text-accent-foreground/80"
                      )}>
                        {tool.description}
                      </p>
                    </div>
                    <ArrowRight 
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground",
                        index === selectedIndex && "text-accent-foreground"
                      )}
                    />
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-10 text-center text-muted-foreground animate-fade-in">
              No tools found for "{query}"
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between border-t border-border p-2 px-3 text-xs text-muted-foreground">
          <div className="flex gap-2 items-center">
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground flex items-center gap-1">
              <Command className="h-3 w-3" />
              <span>K</span>
            </kbd>
            <span>or</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground flex items-center gap-1">
              <span>Ctrl</span>
              <span>+</span>
              <span>I</span>
            </kbd>
          </div>
          <div className="flex gap-2">
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">↑</kbd>
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">↓</kbd>
            <span>to navigate</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground ml-1">Enter</kbd>
            <span>to select</span>
          </div>
        </div>      </DialogContent>
    </Dialog>
    
    {showTip && (
      <Card className="fixed bottom-6 right-6 w-72 shadow-lg animate-slide-up z-50 border-accent/50">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 font-medium">
              <Keyboard className="h-4 w-4 text-primary" />
              <span>Quick Navigation Tip</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0" 
              onClick={() => setShowTip(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">I</kbd> anytime for faster tool navigation.
          </p>
          <Button 
            variant="default" 
            size="sm" 
            className="w-full" 
            onClick={() => setShowTip(false)}
          >
            Got it
          </Button>
        </CardContent>
      </Card>
    )}
    </>
  )
}
