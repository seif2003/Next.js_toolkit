"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Trash2, ArrowDownUp, FileUp, Download, AlertTriangle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function Base64EncoderPage() {
  const [inputText, setInputText] = useState<string>("")
  const [outputText, setOutputText] = useState<string>("")
  const [mode, setMode] = useState<"encode" | "decode">("encode")
  const [error, setError] = useState<string | null>(null)
  const [urlSafe, setUrlSafe] = useState<boolean>(false)
  const [preserveLineBreaks, setPreserveLineBreaks] = useState<boolean>(true)
  const [showFileUpload, setShowFileUpload] = useState<boolean>(false)
  const [fileInfo, setFileInfo] = useState<{name: string, size: number, type: string} | null>(null)

  // Handle input text change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputText(value)
    processText(value)
  }

  // Process text based on current mode
  const processText = (text: string) => {
    setError(null)
    if (!text) {
      setOutputText("")
      return
    }

    try {
      if (mode === "encode") {
        let result: string
        
        if (preserveLineBreaks) {
          result = btoa(unescape(encodeURIComponent(text)))
        } else {
          result = btoa(unescape(encodeURIComponent(text.replace(/\n/g, ''))))
        }
        
        // Convert to URL-safe base64 if needed
        if (urlSafe) {
          result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
        }
        
        setOutputText(result)
      } else {
        // Handle URL-safe base64 if needed
        let processedText = text
        if (urlSafe) {
          processedText = processedText.replace(/-/g, '+').replace(/_/g, '/')
          // Add padding if needed
          while (processedText.length % 4) {
            processedText += '='
          }
        }
        
        const result = decodeURIComponent(escape(atob(processedText)))
        setOutputText(result)
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(`Error: ${error.message}`)
      } else {
        setError(`Invalid ${mode === "encode" ? "text" : "Base64"}`)
      }
      setOutputText("")
    }
  }

  // Swap input and output
  const swapTexts = () => {
    setInputText(outputText)
    setOutputText(inputText)
    setMode(mode === "encode" ? "decode" : "encode")
  }

  // Clear both input and output
  const clearAll = () => {
    setInputText("")
    setOutputText("")
    setError(null)
    setFileInfo(null)
  }

  // Copy output to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputText)
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB for binary, 10MB for text)
    const maxSize = showFileUpload ? 5 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError(`File is too large. Maximum size is ${maxSize / 1024 / 1024}MB.`)
      return
    }

    setFileInfo({
      name: file.name,
      size: file.size,
      type: file.type || "unknown"
    })

    const reader = new FileReader()
    
    if (showFileUpload) {
      // Binary mode (encode only)
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer
          const bytes = new Uint8Array(arrayBuffer)
          let binary = ''
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i])
          }
          const base64 = btoa(binary)
          
          // Convert to URL-safe base64 if needed
          const result = urlSafe ? 
            base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : 
            base64
          
          setMode("encode")
          setInputText(`[Binary data from: ${file.name}]`)
          setOutputText(result)
          setError(null)
        } catch (error) {
          if (error instanceof Error) {
            setError(`Error processing file: ${error.message}`)
          } else {
            setError("Error processing file")
          }
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      // Text mode
      reader.onload = (event) => {
        const content = event.target?.result as string
        setInputText(content)
        processText(content)
      }
      reader.readAsText(file)
    }
  }

  // Download output as a file
  const downloadOutput = () => {
    if (!outputText) return
    
    let filename, content, type
    
    if (mode === "decode" && showFileUpload) {
      // Decode to binary file
      try {
        const binary = atob(outputText)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i)
        }
        content = bytes.buffer
        type = "application/octet-stream"
        filename = "decoded-file.bin"
      } catch (error) {
        setError("Error creating binary file")
        return
      }
    } else {
      // Text file
      content = outputText
      type = "text/plain"
      filename = mode === "encode" ? "encoded.txt" : "decoded.txt"
    }
    
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Base64 Encoder/Decoder</h1>
        <p className="text-muted-foreground">
          Convert text ↔️ base64 easily for debugging headers, tokens, etc.
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <Tabs defaultValue={mode} onValueChange={(value) => setMode(value as "encode" | "decode")} className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="encode">Encode</TabsTrigger>
                <TabsTrigger value="decode">Decode</TabsTrigger>
              </TabsList>
              
              <Button variant="outline" onClick={swapTexts} size="sm">
                <ArrowDownUp className="h-4 w-4 mr-2" />
                Swap
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <Label>{mode === "encode" ? "Text Input" : "Base64 Input"}</Label>
                  <div className="flex gap-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        style={{ display: "none" }}
                      />
                      <Button variant="outline" size="sm">
                        <FileUp className="h-4 w-4 mr-2" />
                        Upload {showFileUpload ? "File" : "Text"}
                      </Button>
                    </label>
                    <Button variant="outline" size="sm" onClick={clearAll}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={mode === "encode" 
                    ? "Enter text to convert to Base64..." 
                    : "Enter Base64 to decode..."
                  }
                  className="min-h-[150px] font-mono"
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <Label>{mode === "encode" ? "Base64 Output" : "Decoded Text"}</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={copyToClipboard}
                      disabled={!outputText}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={downloadOutput}
                      disabled={!outputText}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={outputText}
                  readOnly
                  placeholder={mode === "encode" 
                    ? "Base64 output will appear here..." 
                    : "Decoded text will appear here..."
                  }
                  className="min-h-[150px] font-mono"
                />
              </div>
              
              {fileInfo && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900 border rounded-md">
                  <p className="text-sm">
                    <span className="font-semibold">File:</span> {fileInfo.name} ({(fileInfo.size / 1024).toFixed(2)} KB)
                  </p>
                </div>
              )}
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
              <div className="flex flex-wrap gap-y-2 gap-x-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="url-safe"
                    checked={urlSafe}
                    onCheckedChange={setUrlSafe}
                  />
                  <Label htmlFor="url-safe" className="cursor-pointer">URL-safe format</Label>
                </div>
                
                {mode === "encode" && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="preserve-breaks"
                      checked={preserveLineBreaks}
                      onCheckedChange={setPreserveLineBreaks}
                    />
                    <Label htmlFor="preserve-breaks" className="cursor-pointer">Preserve line breaks</Label>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="binary-mode"
                    checked={showFileUpload}
                    onCheckedChange={setShowFileUpload}
                  />
                  <Label htmlFor="binary-mode" className="cursor-pointer">Binary file mode</Label>
                </div>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">About Base64 Encoding/Decoding</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">What is Base64?</h3>
            <p className="text-sm text-muted-foreground">
              Base64 is a binary-to-text encoding scheme that represents binary data in an ASCII string format. It's commonly used when binary data needs to be stored or transferred over media designed for text.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Common Use Cases</h3>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Embedding images in HTML or CSS</li>
              <li>Encoding binary data in XML or JSON</li>
              <li>Sending binary data in email bodies</li>
              <li>HTTP Basic Authentication</li>
              <li>JWT tokens and OAuth credentials</li>
            </ul>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">URL-Safe Base64</h3>
            <p className="text-sm text-muted-foreground">
              Standard Base64 uses '+' and '/' characters which have special meaning in URLs. URL-safe Base64 replaces these with '-' and '_' to avoid encoding issues when used in URLs or filenames.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Tips</h3>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Base64 encoding increases data size by ~33%</li>
              <li>When decoding fails, check for missing padding ('=')</li>
              <li>For binary files, use the "Binary file mode" option</li>
              <li>JWT tokens use Base64URL (URL-safe) encoding</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}