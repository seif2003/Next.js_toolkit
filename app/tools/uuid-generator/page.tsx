"use client"

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { Copy, RefreshCw, Trash2, Clock } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export default function UuidGeneratorPage() {
  const [uuid, setUuid] = useState<string>("")
  const [history, setHistory] = useState<{ id: number; value: string; timestamp: Date }[]>([])

  // Generate a new UUID
  const generateUuid = () => {
    const newUuid = uuidv4();
    setUuid(newUuid)
    
    // Add to history
    const newEntry = {
      id: Date.now(),
      value: newUuid,
      timestamp: new Date()
    }
    setHistory(prev => [newEntry, ...prev.slice(0, 49)]) // Keep last 50 entries
    
    // Save to local storage
    const updatedHistory = [newEntry, ...history.slice(0, 49)]
    localStorage.setItem('uuidHistory', JSON.stringify(updatedHistory))
  }

  // Copy UUID to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(uuid)
  }

  // Clear history
  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('uuidHistory')
  }

  // Copy specific UUID from history
  const copyHistoryItem = (value: string) => {
    navigator.clipboard.writeText(value)
  }

  // Load history from localStorage on component mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('uuidHistory')
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory)
        setHistory(parsedHistory.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })))
      }
      // Generate a UUID on initial load
      generateUuid()
    } catch (error) {
      console.error("Error loading UUID history:", error)
    }
  }, [])

  // Format timestamp
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">UUID Generator</h1>
        <p className="text-muted-foreground">
          Generate cryptographically secure UUIDv4 identifiers with one click
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Generated UUID</h3>
                </div>
                <div className="flex gap-2">
                  <Button onClick={generateUuid} size="sm" variant="default">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate New
                  </Button>
                  <Button 
                    onClick={copyToClipboard} 
                    size="sm" 
                    variant="outline"
                    disabled={!uuid}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
              <Textarea 
                value={uuid}
                readOnly
                className="font-mono text-lg h-16 flex items-center"
              />
              <p className="text-xs text-muted-foreground">
                A UUIDv4 is a 128-bit randomly generated identifier with extremely low collision probability
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">History</h2>
          <Button 
            onClick={clearHistory} 
            size="sm"
            variant="outline"
            disabled={history.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        </div>
        
        <div className="border rounded-lg divide-y">
          {history.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No history yet. Generate some UUIDs!
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id}
                className="p-3 flex justify-between items-center hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(new Date(item.timestamp))}
                  </div>
                  <code className="font-mono text-sm">{item.value}</code>
                </div>
                <Button 
                  onClick={() => copyHistoryItem(item.value)} 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy</span>
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}