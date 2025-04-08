"use client"

import { useState, useEffect } from "react"
import { Code, Copy, Download, Trash2, Upload, Eye, FileJson, Table, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { JSX } from "react/jsx-runtime"

export default function JsonFormatterPage() {
  const [inputJson, setInputJson] = useState("")
  const [formattedJson, setFormattedJson] = useState("")
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("raw")
  const [indentSize, setIndentSize] = useState(2)
  const [processedObject, setProcessedObject] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [filterText, setFilterText] = useState("")

  // Function to format JSON with proper indentation
  const formatJson = (jsonString: string, spaces: number) => {
    try {
      if (!jsonString.trim()) {
        setFormattedJson("")
        setProcessedObject(null)
        setJsonError(null)
        return
      }
      
      // Parse and then stringify with indentation
      const parsedJson = JSON.parse(jsonString)
      const formatted = JSON.stringify(parsedJson, null, spaces)
      setFormattedJson(formatted)
      setProcessedObject(parsedJson)
      setJsonError(null)
      return formatted
    } catch (error) {
      if (error instanceof Error) {
        setJsonError(error.message)
      } else {
        setJsonError("Invalid JSON")
      }
      return null
    }
  }

  // Handler for input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputJson(value)
    if (value.trim()) {
      // Only auto-format if not empty
      formatJson(value, indentSize)
    } else {
      // Reset if empty
      setFormattedJson("")
      setProcessedObject(null)
      setJsonError(null)
    }
  }

  // Handle formatting button click
  const handleFormat = () => {
    setIsProcessing(true)
    setTimeout(() => {
      formatJson(inputJson, indentSize)
      setIsProcessing(false)
    }, 100) // Small delay for better UX
  }

  // Handle clear button click
  const handleClear = () => {
    setInputJson("")
    setFormattedJson("")
    setProcessedObject(null)
    setJsonError(null)
    setFilterText("")
  }

  // Copy formatted JSON to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson)
  }

  // Download formatted JSON as a file
  const handleDownload = () => {
    if (!formattedJson) return
    
    const blob = new Blob([formattedJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "formatted-json.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Upload JSON file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setInputJson(content)
      formatJson(content, indentSize)
    }
    reader.readAsText(file)
  }

  // Render JSON as a table recursively
  const renderJsonTable = (obj: any, path = ""): JSX.Element => {
    if (obj === null) return <span className="text-gray-500">null</span>
    if (obj === undefined) return <span className="text-gray-500">undefined</span>
    
    // If object is array or object with properties, render as table
    if (typeof obj === "object") {
      const isArray = Array.isArray(obj)
      const entries = isArray ? 
        Object.entries(obj) : 
        Object.entries(obj).filter(([key]) => 
          !filterText || key.toLowerCase().includes(filterText.toLowerCase())
        )
      
      if (entries.length === 0 && isArray) {
        return <span className="text-gray-500">[ ]</span>
      }
      
      if (entries.length === 0) {
        return <span className="text-gray-500">{ }</span>
      }
      
      return (
        <div className="overflow-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {isArray ? "Index" : "Key"}
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {entries.map(([key, value]) => {
                const currentPath = path ? `${path}.${key}` : key
                const valueType = Array.isArray(value) 
                  ? "array" 
                  : value === null 
                    ? "null" 
                    : typeof value
                
                return (
                  <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {key}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        valueType === "object" 
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" 
                          : valueType === "array" 
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : valueType === "string"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : valueType === "number"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                : valueType === "boolean"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                        {valueType}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {typeof value === "object" && value !== null ? (
                        renderJsonTable(value, currentPath)
                      ) : typeof value === "string" ? (
                        <span className="text-green-500">"{value}"</span>
                      ) : typeof value === "number" ? (
                        <span className="text-purple-500">{value}</span>
                      ) : typeof value === "boolean" ? (
                        <span className="text-red-500">{value.toString()}</span>
                      ) : (
                        <span className="text-gray-500">null</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    }
    
    // For primitive types
    return (
      <span className={
        typeof obj === "string" 
          ? "text-green-500" 
          : typeof obj === "number" 
            ? "text-purple-500" 
            : typeof obj === "boolean" 
              ? "text-red-500" 
              : "text-gray-500"
      }>
        {typeof obj === "string" ? `"${obj}"` : String(obj)}
      </span>
    )
  }

  // Syntax highlighting for JSON
  const renderFormattedJson = () => {
    if (!formattedJson) {
      return null
    }

    const lines = formattedJson.split("\n")
    
    return (
      <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md overflow-auto text-sm">
        <code>
          {lines.map((line, index) => {
            // Split the line into parts for syntax highlighting
            const parts: JSX.Element[] = []
            let lastIndex = 0
            
            // Regular expression to match JSON parts
            const jsonPartsRegex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g
            
            let match
            while ((match = jsonPartsRegex.exec(line)) !== null) {
              // Add text before the match
              if (match.index > lastIndex) {
                parts.push(
                  <span key={`${index}-text-${lastIndex}`} className="text-gray-800 dark:text-gray-300">
                    {line.substring(lastIndex, match.index)}
                  </span>
                )
              }
              
              // Determine the className based on the matched part
              let className = "text-gray-800 dark:text-gray-300" // default color
              
              // Check if this is a property key
              if (/^".*":$/.test(match[0])) {
                className = "text-purple-600 dark:text-purple-400" // property keys
              } 
              // Check if this is a string value
              else if (/^"/.test(match[0])) {
                className = "text-green-600 dark:text-green-400" // string values
              } 
              // Check if this is a number
              else if (/^-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?$/.test(match[0])) {
                className = "text-blue-600 dark:text-blue-400" // numbers
              } 
              // Check if this is a boolean or null
              else if (/^(true|false|null)$/.test(match[0])) {
                if (match[0] === 'null') {
                  className = "text-gray-600 dark:text-gray-400" // null
                } else {
                  className = "text-red-600 dark:text-red-400" // boolean
                }
              }
              
              // Add the highlighted match
              parts.push(
                <span className={className} key={`${index}-match-${match.index}`}>
                  {match[0]}
                </span>
              )
              
              lastIndex = match.index + match[0].length
            }
            
            // Add any remaining text after the last match
            if (lastIndex < line.length) {
              parts.push(
                <span key={`${index}-text-end`} className="text-gray-800 dark:text-gray-300">
                  {line.substring(lastIndex)}
                </span>
              )
            }

            return (
              <div key={index} className="flex">
                {showLineNumbers && (
                  <span className="inline-block w-8 text-right mr-4 text-gray-400 select-none">
                    {index + 1}
                  </span>
                )}
                <span className="whitespace-pre">{parts}</span>
              </div>
            )
          })}
        </code>
      </pre>
    )
  }

  // Apply filter when it changes
  useEffect(() => {
    if (processedObject) {
      // Re-render the table with the current filter
      setActiveTab("table")
    }
  }, [filterText])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">JSON Formatter & Viewer</h1>
        <p className="text-muted-foreground">
          Format, validate, and view JSON data in a structured way.
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="jsonInput">Input JSON</Label>
              <div className="flex gap-2 mb-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const fileInput = document.getElementById("fileInput")
                    if (fileInput) fileInput.click()
                  }}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload JSON
                </Button>
                <Input
                  type="file"
                  id="fileInput"
                  accept="application/json,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={!inputJson}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
              <Textarea
                id="jsonInput"
                placeholder="Paste your JSON here..."
                value={inputJson}
                onChange={handleInputChange}
                className="min-h-[200px] font-mono"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleFormat}
                disabled={!inputJson.trim() || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Code className="h-4 w-4 mr-2" />
                    Format JSON
                  </>
                )}
              </Button>
              <div className="flex items-center space-x-2 ml-auto">
                <Label htmlFor="indentSize" className="whitespace-nowrap">Indent Size:</Label>
                <Input
                  type="number"
                  id="indentSize"
                  min={1}
                  max={8}
                  value={indentSize}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 2
                    setIndentSize(value)
                    if (formattedJson) {
                      formatJson(inputJson, value)
                    }
                  }}
                  className="w-16"
                />
              </div>
            </div>

            {jsonError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                <p className="text-sm font-medium">Error: {jsonError}</p>
              </div>
            )}

            {formattedJson && !jsonError && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex justify-between items-center">
                      <TabsList>
                        <TabsTrigger value="raw">
                          <FileJson className="h-4 w-4 mr-2" />
                          Raw JSON
                        </TabsTrigger>
                        <TabsTrigger value="table">
                          <Table className="h-4 w-4 mr-2" />
                          Table View
                        </TabsTrigger>
                      </TabsList>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopy}
                          disabled={!formattedJson}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownload}
                          disabled={!formattedJson}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>

                    <TabsContent value="raw" className="mt-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showLineNumbers"
                            checked={showLineNumbers}
                            onCheckedChange={setShowLineNumbers}
                          />
                          <Label htmlFor="showLineNumbers">Show line numbers</Label>
                        </div>

                        <div className="border rounded-md overflow-hidden">
                          {renderFormattedJson()}
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="table" className="mt-4">
                      <div className="space-y-2">
                        <Input
                          placeholder="Filter keys..."
                          value={filterText}
                          onChange={(e) => setFilterText(e.target.value)}
                          className="mb-2"
                        />

                        <div className="border rounded-md overflow-hidden">
                          {processedObject && (
                            <div className="overflow-x-auto">
                              {renderJsonTable(processedObject)}
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">How it works</h2>
        <p className="text-muted-foreground">
          The JSON Formatter helps you validate, format, and visualize JSON data. 
          You can paste JSON text, format it with your preferred indentation, and view it in different ways.
          Use the table view to explore nested objects and arrays in a structured format.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 border rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">1. Input JSON</h3>
            <p className="text-sm text-muted-foreground">
              Paste JSON text or upload a JSON file to get started.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
              <Code className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">2. Format & Validate</h3>
            <p className="text-sm text-muted-foreground">
              Format your JSON with the desired indentation and check for syntax errors.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">3. Visualize & Export</h3>
            <p className="text-sm text-muted-foreground">
              View your JSON as formatted text or explore it in a table view. Download or copy the result.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}