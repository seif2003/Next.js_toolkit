"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Code, Copy, FileUp, Trash, Play } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function HtmlPreviewerPage() {
  const [htmlContent, setHtmlContent] = useState<string>(`<!DOCTYPE html>
<html>
<head>
  <title>HTML Preview Example</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { color: #2563eb; }
    p { margin-bottom: 16px; }
    .highlight { background-color: yellow; padding: 3px; }
  </style>
</head>
<body>
  <h1>HTML Preview Example</h1>
  <p>This is a <span class="highlight">live preview</span> of your HTML code.</p>
  <p>Edit the HTML in the editor to see changes in real-time.</p>
  
  <h2>Features</h2>
  <ul>
    <li>Live preview as you type</li>
    <li>Syntax highlighting</li>
    <li>CSS styling support</li>
    <li>JavaScript execution</li>
  </ul>
</body>
</html>`)
  const [activeTab, setActiveTab] = useState<string>("editor")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [iframeHeight, setIframeHeight] = useState<number>(500)
  const [isIframeDarkMode, setIsIframeDarkMode] = useState<boolean>(false)

  // Safe HTML rendering in iframe
  const renderHtmlSafely = () => {
    try {
      return { __html: htmlContent }
    } catch (error) {
      setErrorMessage("Error rendering HTML content")
      return { __html: "<p>Error rendering content</p>" }
    }
  }

  // Handle HTML content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtmlContent(e.target.value)
    setErrorMessage(null) // Reset error message when content changes
  }

  // Clear the editor
  const clearEditor = () => {
    if (confirm("Are you sure you want to clear all HTML content?")) {
      setHtmlContent("")
      setErrorMessage(null)
    }
  }

  // Copy HTML content to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(htmlContent)
      .then(() => {
        // Could show a notification here
      })
      .catch(err => {
        console.error("Failed to copy text: ", err)
      })
  }

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("File is too large. Maximum size is 5MB.")
      return
    }

    // Check file type
    if (!file.name.toLowerCase().endsWith(".html") && !file.name.toLowerCase().endsWith(".htm")) {
      setErrorMessage("Please upload an HTML file (.html or .htm)")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setHtmlContent(content)
      setErrorMessage(null)
    }
    reader.onerror = () => setErrorMessage("Error reading file")
    reader.readAsText(file)
  }

  // Update iframe height
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setIframeHeight(value)
    }
  }

  // Toggle dark mode in the iframe
  const toggleIframeDarkMode = () => {
    setIsIframeDarkMode(!isIframeDarkMode)
  }

  // Create a blob URL from the HTML content
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  useEffect(() => {
    // Create a blob URL for the iframe
    const htmlWithDarkMode = isIframeDarkMode
      ? htmlContent.replace('</head>', '<style>body { background-color: #121212; color: #e0e0e0; }</style></head>')
      : htmlContent

    const blob = new Blob([htmlWithDarkMode], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    setBlobUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [htmlContent, isIframeDarkMode])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">HTML Previewer</h1>
        <p className="text-muted-foreground">
          Write HTML code and see a live preview of the rendered output.
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <TabsList>
                <TabsTrigger value="editor">
                  <Code className="h-4 w-4 mr-2" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Play className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="file"
                    accept=".html,.htm"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                  <Button variant="outline" size="sm">
                    <FileUp className="h-4 w-4 mr-2" />
                    Upload HTML
                  </Button>
                </label>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={clearEditor}>
                  <Trash className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>

            <TabsContent value="editor" className="p-0 m-0">
              <div className="p-4">
                <Textarea
                  value={htmlContent}
                  onChange={handleContentChange}
                  className="w-full h-[500px] font-mono text-sm"
                  placeholder="Type or paste your HTML code here..."
                />
                {errorMessage && (
                  <div className="mt-2 p-3 bg-red-50 text-red-600 border border-red-200 rounded-md">
                    {errorMessage}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="p-0 m-0">
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">
                      Height:
                      <Input
                        type="number"
                        min="100"
                        max="2000"
                        value={iframeHeight}
                        onChange={handleHeightChange}
                        className="w-20 ml-2 h-8"
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isIframeDarkMode}
                        onChange={toggleIframeDarkMode}
                      />
                      Dark Mode Preview
                    </label>
                  </div>
                </div>

                <div 
                  className="border rounded-md overflow-hidden"
                  style={{ height: `${iframeHeight}px` }}
                >
                  <iframe
                    srcDoc={htmlContent}
                    src={blobUrl || ''}
                    title="HTML Preview"
                    className="w-full h-full"
                    sandbox="allow-scripts" // Allow scripts but restrict other capabilities
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Tips for Using the HTML Previewer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Basic HTML Structure</h3>
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md text-xs overflow-auto">
{`<!DOCTYPE html>
<html>
<head>
  <title>Your Page Title</title>
  <style>
    /* Your CSS goes here */
  </style>
</head>
<body>
  <!-- Your content here -->
</body>
</html>`}
            </pre>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Testing External Resources</h3>
            <p className="text-sm text-muted-foreground">
              You can include external scripts and stylesheets:
            </p>
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md text-xs overflow-auto mt-2">
{`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}