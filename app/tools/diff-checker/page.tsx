"use client"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowDownToLine, Trash2, FileUp } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import * as diffLib from 'diff'
import { JSX } from "react/jsx-runtime"

type DiffType = 'chars' | 'words' | 'lines' | 'sentences'

export default function DiffCheckerPage() {
  const [leftText, setLeftText] = useState<string>("")
  const [rightText, setRightText] = useState<string>("")
  const [diffType, setDiffType] = useState<DiffType>('words')
  const [ignoreCase, setIgnoreCase] = useState<boolean>(false)
  const [ignoreWhitespace, setIgnoreWhitespace] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split')
  
  // Process the diff between the two texts
  const processDiff = useCallback(() => {
    // Apply case insensitivity if enabled
    let leftProcessed = leftText
    let rightProcessed = rightText

    if (ignoreCase) {
      leftProcessed = leftProcessed.toLowerCase()
      rightProcessed = rightProcessed.toLowerCase()
    }

    if (ignoreWhitespace) {
      // Remove excessive whitespace but preserve newlines for line diffs
      if (diffType === 'lines') {
        leftProcessed = leftProcessed.split('\n').map(line => line.trim()).join('\n')
        rightProcessed = rightProcessed.split('\n').map(line => line.trim()).join('\n')
      } else {
        leftProcessed = leftProcessed.replace(/\s+/g, ' ').trim()
        rightProcessed = rightProcessed.replace(/\s+/g, ' ').trim()
      }
    }

    // Choose diff method based on diffType
    let diffResult: diffLib.Change[]
    
    switch(diffType) {
      case 'chars':
        diffResult = diffLib.diffChars(leftProcessed, rightProcessed)
        break
      case 'words':
        diffResult = diffLib.diffWords(leftProcessed, rightProcessed)
        break
      case 'lines':
        diffResult = diffLib.diffLines(leftProcessed, rightProcessed)
        break
      case 'sentences':
        diffResult = diffLib.diffSentences(leftProcessed, rightProcessed)
        break
      default:
        diffResult = diffLib.diffWords(leftProcessed, rightProcessed)
    }
    
    return diffResult
  }, [leftText, rightText, diffType, ignoreCase, ignoreWhitespace])

  // Clear both text areas
  const clearAll = () => {
    setLeftText("")
    setRightText("")
  }

  // Swap the contents of both text areas
  const swapTexts = () => {
    setLeftText(rightText)
    setRightText(leftText)
  }

  // Handle file upload for left text area
  const handleLeftFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setLeftText(event.target.result as string)
      }
    }
    reader.readAsText(file)
  }

  // Handle file upload for right text area
  const handleRightFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setRightText(event.target.result as string)
      }
    }
    reader.readAsText(file)
  }

  // Render the diff content based on mode
  const renderDiffContent = () => {
    const diff = processDiff()
    
    if (viewMode === 'unified') {
      return (
        <div className="font-mono text-sm whitespace-pre-wrap border rounded-md p-4 bg-muted/20 overflow-auto max-h-[500px]">
          {diff.map((part, index) => {
            const className = part.added 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
              : part.removed 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                : ''
                
            return (
              <span key={index} className={className}>
                {part.value}
              </span>
            )
          })}
        </div>
      )
    }
    
    // Split view
    const leftParts: JSX.Element[] = []
    const rightParts: JSX.Element[] = []

    diff.forEach((part, index) => {
      if (part.added) {
        rightParts.push(
          <span key={index} className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            {part.value}
          </span>
        )
      } else if (part.removed) {
        leftParts.push(
          <span key={index} className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
            {part.value}
          </span>
        )
      } else {
        leftParts.push(<span key={`left-${index}`}>{part.value}</span>)
        rightParts.push(<span key={`right-${index}`}>{part.value}</span>)
      }
    })

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="font-mono text-sm whitespace-pre-wrap border rounded-md p-4 bg-muted/20 overflow-auto max-h-[500px]">
          {leftParts}
        </div>
        <div className="font-mono text-sm whitespace-pre-wrap border rounded-md p-4 bg-muted/20 overflow-auto max-h-[500px]">
          {rightParts}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Diff Checker</h1>
        <p className="text-muted-foreground">
          Compare text to find differences between two versions
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Text Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="left-text">Original Text</Label>
                  <div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        onChange={handleLeftFileUpload}
                        style={{ display: "none" }}
                      />
                      <Button variant="outline" size="sm">
                        <FileUp className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </label>
                  </div>
                </div>
                <Textarea
                  id="left-text"
                  value={leftText}
                  onChange={(e) => setLeftText(e.target.value)}
                  className="min-h-[200px] font-mono"
                  placeholder="Paste original text here..."
                />
              </div>

              {/* Right Text Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="right-text">Modified Text</Label>
                  <div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        onChange={handleRightFileUpload}
                        style={{ display: "none" }}
                      />
                      <Button variant="outline" size="sm">
                        <FileUp className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </label>
                  </div>
                </div>
                <Textarea
                  id="right-text"
                  value={rightText}
                  onChange={(e) => setRightText(e.target.value)}
                  className="min-h-[200px] font-mono"
                  placeholder="Paste modified text here..."
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={swapTexts} 
                  variant="outline" 
                  size="sm"
                >
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                  Swap
                </Button>
                
                <Button 
                  onClick={clearAll}
                  variant="outline" 
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="ignore-case"
                      checked={ignoreCase}
                      onCheckedChange={setIgnoreCase}
                    />
                    <Label htmlFor="ignore-case">Ignore case</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      id="ignore-whitespace"
                      checked={ignoreWhitespace}
                      onCheckedChange={setIgnoreWhitespace}
                    />
                    <Label htmlFor="ignore-whitespace">Ignore whitespace</Label>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label>Diff by:</Label>
                  <select
                    value={diffType}
                    onChange={(e) => setDiffType(e.target.value as DiffType)}
                    className="h-8 rounded-md border px-2 text-sm"
                  >
                    <option value="chars">Characters</option>
                    <option value="words">Words</option>
                    <option value="lines">Lines</option>
                    <option value="sentences">Sentences</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Differences</h2>
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as 'split' | 'unified')}
          >
            <TabsList>
              <TabsTrigger value="split">Split View</TabsTrigger>
              <TabsTrigger value="unified">Unified View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-4">
          {(!leftText || !rightText) ? (
            <div className="text-center p-8 border rounded-md bg-muted/20">
              <p className="text-muted-foreground">Enter text in both fields to see the differences</p>
            </div>
          ) : (
            renderDiffContent()
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">How to Use</h3>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Paste or upload text in both panels</li>
            <li>Choose different comparison options</li>
            <li>Added text is highlighted in green</li>
            <li>Removed text is highlighted in red</li>
            <li>Switch between split and unified views</li>
          </ul>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Comparison Options</h3>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Compare by characters, words, lines, or sentences</li>
            <li>Ignore case for case-insensitive comparison</li>
            <li>Ignore whitespace to focus on content</li>
            <li>Upload files to compare their content</li>
          </ul>
        </div>
      </div>
    </div>
  )
}