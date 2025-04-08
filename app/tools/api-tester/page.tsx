"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Save, Copy, Trash2, Download, Upload, Play, Plus, Minus, ArrowRight, Globe, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { JSX } from "react/jsx-runtime"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
type ContentType = "application/json" | "application/xml" | "multipart/form-data" | "application/x-www-form-urlencoded" | "text/plain" | "none";
type AuthType = "none" | "basic" | "bearer" | "api-key";

interface RequestHeader {
  key: string;
  value: string;
  enabled: boolean;
}

interface RequestParam {
  key: string;
  value: string;
  enabled: boolean;
}

interface FormDataItem {
  key: string;
  value: string;
  type: "text" | "file";
  enabled: boolean;
}

interface SavedRequest {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  headers: RequestHeader[];
  params: RequestParam[];
  contentType: ContentType;
  rawBody: string;
  formData: FormDataItem[];
  urlEncodedData: RequestParam[];
  authType: AuthType;
  authData: {
    username: string;
    password: string;
    token: string;
    key: string;
    value: string;
  };
}

export default function ApiTesterPage() {
  const [url, setUrl] = useState<string>("")
  const [method, setMethod] = useState<HttpMethod>("GET")
  const [contentType, setContentType] = useState<ContentType>("application/json")
  const [headers, setHeaders] = useState<RequestHeader[]>([
    { key: "Content-Type", value: "application/json", enabled: true },
    { key: "Accept", value: "application/json", enabled: true }
  ])
  const [params, setParams] = useState<RequestParam[]>([
    { key: "", value: "", enabled: true }
  ])
  const [rawBody, setRawBody] = useState<string>("")
  const [formData, setFormData] = useState<FormDataItem[]>([
    { key: "", value: "", type: "text", enabled: true }
  ])
  const [urlEncodedData, setUrlEncodedData] = useState<RequestParam[]>([
    { key: "", value: "", enabled: true }
  ])
  const [authType, setAuthType] = useState<AuthType>("none")
  const [authData, setAuthData] = useState({
    username: "",
    password: "",
    token: "",
    key: "",
    value: ""
  })
  
  const [responseData, setResponseData] = useState<any>(null)
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({})
  const [responseStatus, setResponseStatus] = useState<number | null>(null)
  const [responseStatusText, setResponseStatusText] = useState<string>("")
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [responseSize, setResponseSize] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [responseBodyView, setResponseBodyView] = useState<"pretty" | "raw" | "preview">("pretty")
  
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([])
  const [currentRequestName, setCurrentRequestName] = useState<string>("")
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false)
  
  // Preset examples
  const examples = [
    {
      name: "GitHub User Info",
      url: "https://api.github.com/users/octocat",
      method: "GET" as HttpMethod
    },
    {
      name: "JSONPlaceholder Posts",
      url: "https://jsonplaceholder.typicode.com/posts",
      method: "GET" as HttpMethod
    },
    {
      name: "Random User",
      url: "https://randomuser.me/api/",
      method: "GET" as HttpMethod
    }
  ]

  // Load saved requests from localStorage on mount
  useEffect(() => {
    const savedRequestsData = localStorage.getItem("api-tester-saved-requests")
    if (savedRequestsData) {
      try {
        setSavedRequests(JSON.parse(savedRequestsData))
      } catch (e) {
        console.error("Failed to load saved requests", e)
      }
    }
  }, [])

  // Save to localStorage whenever savedRequests changes
  useEffect(() => {
    if (savedRequests.length > 0) {
      localStorage.setItem("api-tester-saved-requests", JSON.stringify(savedRequests))
    }
  }, [savedRequests])

  // Helper for generating request headers
  const getRequestHeaders = () => {
    const reqHeaders: Record<string, string> = {}
    
    // Add authentication headers
    if (authType === "basic") {
      reqHeaders["Authorization"] = `Basic ${btoa(`${authData.username}:${authData.password}`)}`
    } else if (authType === "bearer") {
      reqHeaders["Authorization"] = `Bearer ${authData.token}`
    } else if (authType === "api-key") {
      reqHeaders[authData.key] = authData.value
    }
    
    // Add custom headers
    headers
      .filter(h => h.enabled && h.key.trim() !== "")
      .forEach(h => {
        reqHeaders[h.key] = h.value
      })
    
    // Don't add content-type header for GET, HEAD or OPTION methods unless explicitly specified
    if (["GET", "HEAD", "OPTIONS"].includes(method) && !headers.some(h => h.enabled && h.key.toLowerCase() === "content-type")) {
      delete reqHeaders["Content-Type"]
    }
    
    return reqHeaders
  }

  // Build the URL with query parameters
  const getFullUrl = () => {
    try {
      const urlObj = new URL(url)
      
      // Add query parameters
      params
        .filter(p => p.enabled && p.key.trim() !== "")
        .forEach(p => {
          urlObj.searchParams.append(p.key, p.value)
        })
      
      return urlObj.toString()
    } catch (e) {
      // If URL is invalid, just return it as is
      return url
    }
  }

  // Build the request body based on content type
  const getRequestBody = () => {
    if (["GET", "HEAD"].includes(method)) {
      return undefined
    }
    
    if (contentType === "application/json") {
      return rawBody
    } else if (contentType === "application/x-www-form-urlencoded") {
      const formData = new URLSearchParams()
      urlEncodedData
        .filter(item => item.enabled && item.key.trim() !== "")
        .forEach(item => {
          formData.append(item.key, item.value)
        })
      return formData
    } else if (contentType === "multipart/form-data") {
      const formDataObj = new FormData()
      formData
        .filter(item => item.enabled && item.key.trim() !== "")
        .forEach(item => {
          formDataObj.append(item.key, item.value)
        })
      return formDataObj
    } else if (contentType === "text/plain") {
      return rawBody
    }
    
    return undefined
  }

  // Handle sending the request
  const handleSendRequest = async () => {
    if (!url.trim()) {
      setError("Please enter a URL")
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      setResponseData(null)
      setResponseHeaders({})
      setResponseStatus(null)
      setResponseStatusText("")
      setResponseTime(null)
      setResponseSize(null)
      
      const fullUrl = getFullUrl()
      const headers = getRequestHeaders()
      const body = getRequestBody()
      
      const startTime = performance.now()
      
      // Create request options
      const requestOptions: RequestInit = {
        method,
        headers,
        // Skip body for GET and HEAD requests
        ...(method !== "GET" && method !== "HEAD" && body !== undefined && { body }),
      }
      
      // Send request
      const response = await fetch(fullUrl, requestOptions)
      
      const endTime = performance.now()
      setResponseTime(endTime - startTime)
      
      // Process response headers
      const responseHeadersObj: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeadersObj[key] = value
      })
      setResponseHeaders(responseHeadersObj)
      
      // Set status
      setResponseStatus(response.status)
      setResponseStatusText(response.statusText)
      
      // Try to parse response as JSON
      try {
        const contentType = response.headers.get("content-type") || ""
        let responseBody
        
        if (contentType.includes("application/json")) {
          responseBody = await response.json()
          setResponseData(responseBody)
        } else if (contentType.includes("text")) {
          responseBody = await response.text()
          setResponseData(responseBody)
          try {
            // Try to parse as JSON anyway
            const jsonData = JSON.parse(responseBody)
            setResponseData(jsonData)
          } catch {
            // If it's not valid JSON, keep it as text
          }
        } else {
          // For binary data, just show content type
          const text = await response.text()
          setResponseData(text)
        }
        
        // Calculate response size
        const responseText = JSON.stringify(responseBody || "")
        setResponseSize(new Blob([responseText]).size)
      } catch (e) {
        // If parsing fails, get as text
        const text = await response.text()
        setResponseData(text)
        setResponseSize(new Blob([text]).size)
      }
    } catch (err) {
      console.error("Request failed", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Header management
  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "", enabled: true }])
  }
  
  const removeHeader = (index: number) => {
    const newHeaders = [...headers]
    newHeaders.splice(index, 1)
    setHeaders(newHeaders)
  }
  
  const updateHeader = (index: number, field: "key" | "value" | "enabled", value: string | boolean) => {
    const newHeaders = [...headers]
    newHeaders[index] = { ...newHeaders[index], [field]: value }
    setHeaders(newHeaders)
  }

  // Param management
  const addParam = () => {
    setParams([...params, { key: "", value: "", enabled: true }])
  }
  
  const removeParam = (index: number) => {
    const newParams = [...params]
    newParams.splice(index, 1)
    setParams(newParams)
  }
  
  const updateParam = (index: number, field: "key" | "value" | "enabled", value: string | boolean) => {
    const newParams = [...params]
    newParams[index] = { ...newParams[index], [field]: value }
    setParams(newParams)
  }

  // Form data management
  const addFormDataItem = () => {
    setFormData([...formData, { key: "", value: "", type: "text", enabled: true }])
  }
  
  const removeFormDataItem = (index: number) => {
    const newFormData = [...formData]
    newFormData.splice(index, 1)
    setFormData(newFormData)
  }
  
  const updateFormDataItem = (index: number, field: keyof FormDataItem, value: string | boolean) => {
    const newFormData = [...formData]
    newFormData[index] = { ...newFormData[index], [field]: value }
    setFormData(newFormData)
  }

  // URL encoded data management
  const addUrlEncodedItem = () => {
    setUrlEncodedData([...urlEncodedData, { key: "", value: "", enabled: true }])
  }
  
  const removeUrlEncodedItem = (index: number) => {
    const newUrlEncodedData = [...urlEncodedData]
    newUrlEncodedData.splice(index, 1)
    setUrlEncodedData(newUrlEncodedData)
  }
  
  const updateUrlEncodedItem = (index: number, field: "key" | "value" | "enabled", value: string | boolean) => {
    const newUrlEncodedData = [...urlEncodedData]
    newUrlEncodedData[index] = { ...newUrlEncodedData[index], [field]: value }
    setUrlEncodedData(newUrlEncodedData)
  }
  // Save current request to local storage
  const saveCurrentRequest = () => {
    if (!currentRequestName.trim()) {
      alert("Please enter a name for this request")
      return
    }
    
    const newRequest: SavedRequest = {
      id: Date.now().toString(),
      name: currentRequestName,
      url,
      method,
      headers,
      params,
      contentType,
      rawBody,
      formData,
      urlEncodedData,
      authType,
      // Ensure we're passing all required fields with their correct types
      authData: {
        username: authData.username || "",
        password: authData.password || "",
        token: authData.token || "",
        key: authData.key || "",
        value: authData.value || ""
      }
    }
    
    setSavedRequests([...savedRequests, newRequest])
    setShowSaveDialog(false)
    setCurrentRequestName("")
  }
  // Load a saved request
  const loadSavedRequest = (request: SavedRequest) => {
    setUrl(request.url)
    setMethod(request.method)
    setHeaders(request.headers)
    setParams(request.params)
    setContentType(request.contentType)
    setRawBody(request.rawBody)
    setFormData(request.formData)
    setUrlEncodedData(request.urlEncodedData)
    setAuthType(request.authType)
    // Ensure all required fields are present when loading auth data
    setAuthData({
      username: request.authData.username || "",
      password: request.authData.password || "",
      token: request.authData.token || "",
      key: request.authData.key || "",
      value: request.authData.value || ""
    })
  }

  // Delete a saved request
  const deleteSavedRequest = (id: string) => {
    if (confirm("Are you sure you want to delete this request?")) {
      const newSavedRequests = savedRequests.filter(req => req.id !== id)
      setSavedRequests(newSavedRequests)
    }
  }

  // Load an example
  const loadExample = (example: typeof examples[0]) => {
    setUrl(example.url)
    setMethod(example.method)
  }

  // Copy response as cURL
  const copyAsCurl = () => {
    let curlCommand = `curl -X ${method} "${getFullUrl()}"`;
    
    // Add headers
    headers
      .filter(h => h.enabled && h.key.trim() !== "")
      .forEach(h => {
        curlCommand += ` -H "${h.key}: ${h.value}"`;
      });
      
    // Add auth if needed
    if (authType === "basic") {
      curlCommand += ` -u "${authData.username}:${authData.password}"`;
    } else if (authType === "bearer") {
      curlCommand += ` -H "Authorization: Bearer ${authData.token}"`;
    } else if (authType === "api-key") {
      curlCommand += ` -H "${authData.key}: ${authData.value}"`;
    }
    
    // Add body for non-GET requests
    if (method !== "GET" && method !== "HEAD") {
      if (contentType === "application/json" && rawBody.trim()) {
        curlCommand += ` -d '${rawBody}'`;
      } else if (contentType === "application/x-www-form-urlencoded") {
        const formDataStr = urlEncodedData
          .filter(item => item.enabled && item.key.trim() !== "")
          .map(item => `${encodeURIComponent(item.key)}=${encodeURIComponent(item.value)}`)
          .join("&");
        if (formDataStr) {
          curlCommand += ` -d "${formDataStr}"`;
        }
      }
    }
    
    navigator.clipboard.writeText(curlCommand);
    alert("cURL command copied to clipboard!");
  };

  // Copy response to clipboard
  const copyResponseToClipboard = () => {
    navigator.clipboard.writeText(
      typeof responseData === 'object' 
        ? JSON.stringify(responseData, null, 2) 
        : String(responseData)
    );
    alert("Response copied to clipboard");
  };

  // Download response as file
  const downloadResponse = () => {
    if (!responseData) return;
    
    let contentType = 'text/plain';
    let filename = 'response.txt';
    let content = typeof responseData === 'string' ? responseData : JSON.stringify(responseData, null, 2);
    
    if (typeof responseData === 'object') {
      contentType = 'application/json';
      filename = 'response.json';
    }
    
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format raw JSON string
  const formatJsonString = (jsonStr: string): string => {
    try {
      return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch (e) {
      return jsonStr;
    }
  };

  // Render JSON with syntax highlighting
  const renderJson = (data: any): JSX.Element => {
    if (typeof data !== 'object' || data === null) {
      return <span className="text-gray-800 dark:text-gray-300">{String(data)}</span>;
    }
    
    return (
      <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
        {Object.entries(data).map(([key, value], index) => (
          <div key={index} className="mb-1">
            <span className="text-purple-600 dark:text-purple-400">{`"${key}": `}</span>
            {typeof value === 'object' && value !== null ? (
              <>
                {Array.isArray(value) ? '[' : '{'}
                {renderJson(value)}
                {Array.isArray(value) ? ']' : '}'}
              </>
            ) : typeof value === 'string' ? (
              <span className="text-green-600 dark:text-green-400">{`"${value}"`}</span>
            ) : typeof value === 'number' ? (
              <span className="text-blue-600 dark:text-blue-400">{value}</span>
            ) : typeof value === 'boolean' ? (
              <span className="text-red-600 dark:text-red-400">{String(value)}</span>
            ) : (
              <span className="text-gray-600 dark:text-gray-400">null</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render response body
  const renderResponseBody = () => {
    if (!responseData) return null;
    
    if (responseBodyView === "pretty") {
      if (typeof responseData === 'object') {
        return (
          <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-auto text-sm">
            {renderJson(responseData)}
          </pre>
        );
      } else {
        try {
          // Try to parse as JSON
          const parsedJson = JSON.parse(responseData);
          return (
            <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-auto text-sm">
              {renderJson(parsedJson)}
            </pre>
          );
        } catch {
          // If not JSON, just return as text
          return (
            <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap">
              {responseData}
            </pre>
          );
        }
      }
    } else if (responseBodyView === "raw") {
      return (
        <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap">
          {typeof responseData === 'object' ? JSON.stringify(responseData, null, 2) : responseData}
        </pre>
      );
    } else if (responseBodyView === "preview") {
      // Try to render HTML preview
      const contentType = responseHeaders['content-type'] || '';
      if (contentType.includes('html')) {
        return (
          <div className="border rounded-md overflow-hidden h-[500px]">
            <iframe 
              srcDoc={typeof responseData === 'string' ? responseData : ''}
              style={{ width: '100%', height: '100%', border: 'none' }}
              sandbox="allow-same-origin"
              title="Response Preview"
            />
          </div>
        );
      }
      
      // For other types like image
      if (contentType.includes('image')) {
        return <p className="text-gray-500">Preview not available for this content type</p>;
      }
      
      return <p className="text-gray-500">Preview not available for this content type</p>;
    }
    
    return null;
  };

  // Get status badge color
  const getStatusColor = (status: number | null) => {
    if (!status) return 'bg-gray-500';
    if (status >= 200 && status < 300) return 'bg-green-500';
    if (status >= 300 && status < 400) return 'bg-blue-500';
    if (status >= 400 && status < 500) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API Tester</h1>
        <p className="text-muted-foreground">
          Test API endpoints with different methods, headers, and request bodies
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Sidebar with saved requests */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardContent className="p-4">
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Saved Requests</h2>
                
                {savedRequests.length === 0 && (
                  <p className="text-sm text-muted-foreground">No saved requests yet</p>
                )}

                <div className="max-h-[300px] overflow-auto">
                  {savedRequests.map((request) => (
                    <div key={request.id} className="mb-2 p-2 border rounded-md hover:bg-accent flex items-center gap-2">
                      <Badge className="uppercase">{request.method}</Badge>
                      <div className="flex-grow truncate" onClick={() => loadSavedRequest(request)}>
                        <span className="text-sm font-medium block">{request.name}</span>
                        <span className="text-xs text-muted-foreground truncate block">{request.url}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSavedRequest(request.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <h2 className="font-semibold text-lg mt-4">Examples</h2>
                <div className="space-y-2">
                  {examples.map((example, index) => (
                    <div
                      key={index}
                      className="p-2 border rounded-md hover:bg-accent cursor-pointer flex items-center gap-2"
                      onClick={() => loadExample(example)}
                    >
                      <Badge className="uppercase">{example.method}</Badge>
                      <div className="flex-grow truncate">
                        <span className="text-sm font-medium block">{example.name}</span>
                        <span className="text-xs text-muted-foreground truncate block">{example.url}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-5 space-y-6">
          {/* Request Card */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* URL & Method Row */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={method} onValueChange={(val) => setMethod(val as HttpMethod)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                      <SelectItem value="HEAD">HEAD</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    className="flex-grow"
                    placeholder="Enter request URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  
                  <Button 
                    type="submit" 
                    className="min-w-[120px]" 
                    onClick={handleSendRequest}
                    disabled={isLoading || !url.trim()}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send
                      </>
                    )}
                  </Button>

                  <div className="flex space-x-2">
                    <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Save className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Save Request</DialogTitle>
                          <DialogDescription>
                            Save this request for future use
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Label htmlFor="requestName">Request Name</Label>
                          <Input
                            id="requestName"
                            placeholder="My Request"
                            value={currentRequestName}
                            onChange={(e) => setCurrentRequestName(e.target.value)}
                            className="mt-2"
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={saveCurrentRequest}>
                            Save
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="outline" size="icon" onClick={copyAsCurl} title="Copy as cURL">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Request Configuration Tabs */}
                <Tabs defaultValue="params">
                  <TabsList>
                    <TabsTrigger value="params">Query Params</TabsTrigger>
                    <TabsTrigger value="auth">Authorization</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="body">Body</TabsTrigger>
                  </TabsList>

                  {/* Query Parameters Tab */}
                  <TabsContent value="params" className="space-y-4">
                    <div className="space-y-2">
                      {params.map((param, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Switch
                            checked={param.enabled}
                            onCheckedChange={(checked) => updateParam(index, "enabled", checked)}
                          />
                          <Input
                            placeholder="Parameter name"
                            value={param.key}
                            onChange={(e) => updateParam(index, "key", e.target.value)}
                            className="flex-grow"
                            disabled={!param.enabled}
                          />
                          <Input
                            placeholder="Value"
                            value={param.value}
                            onChange={(e) => updateParam(index, "value", e.target.value)}
                            className="flex-grow"
                            disabled={!param.enabled}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeParam(index)}
                            className="h-8 w-8"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button variant="outline" size="sm" onClick={addParam} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Parameter
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Authorization Tab */}
                  <TabsContent value="auth" className="space-y-4">
                    <div>
                      <Label>Authorization Type</Label>
                      <Select value={authType} onValueChange={(val) => setAuthType(val as AuthType)}>
                        <SelectTrigger>
                          <SelectValue placeholder="No Auth" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Auth</SelectItem>
                          <SelectItem value="basic">Basic Auth</SelectItem>
                          <SelectItem value="bearer">Bearer Token</SelectItem>
                          <SelectItem value="api-key">API Key</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {authType === "basic" && (
                      <div className="space-y-2">
                        <div>
                          <Label>Username</Label>
                          <Input
                            value={authData.username}
                            onChange={(e) => setAuthData({ ...authData, username: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Password</Label>
                          <Input
                            type="password"
                            value={authData.password}
                            onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {authType === "bearer" && (
                      <div>
                        <Label>Token</Label>
                        <Input
                          value={authData.token}
                          onChange={(e) => setAuthData({ ...authData, token: e.target.value })}
                        />
                      </div>
                    )}

                    {authType === "api-key" && (
                      <div className="space-y-2">
                        <div>
                          <Label>Key</Label>
                          <Input
                            value={authData.key}
                            onChange={(e) => setAuthData({ ...authData, key: e.target.value })}
                            placeholder="X-API-Key"
                          />
                        </div>
                        <div>
                          <Label>Value</Label>
                          <Input
                            value={authData.value}
                            onChange={(e) => setAuthData({ ...authData, value: e.target.value })}
                            placeholder="your-api-key-here"
                          />
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Headers Tab */}
                  <TabsContent value="headers" className="space-y-4">
                    <div className="space-y-2">
                      {headers.map((header, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Switch
                            checked={header.enabled}
                            onCheckedChange={(checked) => updateHeader(index, "enabled", checked)}
                          />
                          <Input
                            placeholder="Header name"
                            value={header.key}
                            onChange={(e) => updateHeader(index, "key", e.target.value)}
                            className="flex-grow"
                            disabled={!header.enabled}
                          />
                          <Input
                            placeholder="Value"
                            value={header.value}
                            onChange={(e) => updateHeader(index, "value", e.target.value)}
                            className="flex-grow"
                            disabled={!header.enabled}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeHeader(index)}
                            className="h-8 w-8"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button variant="outline" size="sm" onClick={addHeader} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Header
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Body Tab */}
                  <TabsContent value="body" className="space-y-4">
                    <div>
                      <Label>Content Type</Label>
                      <Select 
                        value={contentType} 
                        onValueChange={(val) => setContentType(val as ContentType)}
                        disabled={["GET", "HEAD"].includes(method)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Content Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="application/json">JSON</SelectItem>
                          <SelectItem value="application/x-www-form-urlencoded">URL Encoded</SelectItem>
                          <SelectItem value="multipart/form-data">Form Data</SelectItem>
                          <SelectItem value="text/plain">Plain Text</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {["GET", "HEAD"].includes(method) && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Body is not available for {method} requests
                        </p>
                      )}
                    </div>
                    
                    {!["GET", "HEAD"].includes(method) && contentType === "application/json" && (
                      <div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mb-2"
                          onClick={() => {
                            try {
                              setRawBody(formatJsonString(rawBody));
                            } catch (e) {
                              // If not valid JSON, do nothing
                            }
                          }}
                        >
                          Format JSON
                        </Button>
                        <Textarea
                          placeholder={`{\n  "key": "value"\n}`}
                          value={rawBody}
                          onChange={(e) => setRawBody(e.target.value)}
                          className="min-h-[200px] font-mono"
                        />
                      </div>
                    )}
                    
                    {!["GET", "HEAD"].includes(method) && contentType === "application/x-www-form-urlencoded" && (
                      <div className="space-y-2">
                        {urlEncodedData.map((item, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Switch
                              checked={item.enabled}
                              onCheckedChange={(checked) => updateUrlEncodedItem(index, "enabled", checked)}
                            />
                            <Input
                              placeholder="Key"
                              value={item.key}
                              onChange={(e) => updateUrlEncodedItem(index, "key", e.target.value)}
                              className="flex-grow"
                              disabled={!item.enabled}
                            />
                            <Input
                              placeholder="Value"
                              value={item.value}
                              onChange={(e) => updateUrlEncodedItem(index, "value", e.target.value)}
                              className="flex-grow"
                              disabled={!item.enabled}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeUrlEncodedItem(index)}
                              className="h-8 w-8"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        
                        <Button variant="outline" size="sm" onClick={addUrlEncodedItem} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </div>
                    )}
                    
                    {!["GET", "HEAD"].includes(method) && contentType === "multipart/form-data" && (
                      <div className="space-y-2">
                        {formData.map((item, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Switch
                              checked={item.enabled}
                              onCheckedChange={(checked) => updateFormDataItem(index, "enabled", checked)}
                            />
                            <Input
                              placeholder="Key"
                              value={item.key}
                              onChange={(e) => updateFormDataItem(index, "key", e.target.value)}
                              className="flex-grow"
                              disabled={!item.enabled}
                            />
                            <Input
                              placeholder="Value"
                              value={item.value}
                              onChange={(e) => updateFormDataItem(index, "value", e.target.value)}
                              className="flex-grow"
                              disabled={!item.enabled}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFormDataItem(index)}
                              className="h-8 w-8"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        
                        <Button variant="outline" size="sm" onClick={addFormDataItem} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </div>
                    )}
                    
                    {!["GET", "HEAD"].includes(method) && contentType === "text/plain" && (
                      <Textarea
                        placeholder="Enter text body"
                        value={rawBody}
                        onChange={(e) => setRawBody(e.target.value)}
                        className="min-h-[200px]"
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Response Card */}
          <Card className={responseData || error ? "block" : "hidden"}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-lg">Response</h2>
                    {responseStatus && (
                      <Badge className={getStatusColor(responseStatus)}>
                        {responseStatus} {responseStatusText}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {responseTime !== null && <span>{responseTime.toFixed(0)} ms</span>}
                    {responseSize !== null && <span>{(responseSize / 1024).toFixed(2)} KB</span>}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                {responseData && !error && (
                  <>
                    {/* Tabs for viewing response in different formats */}
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Button 
                          variant={responseBodyView === "pretty" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setResponseBodyView("pretty")}
                        >
                          Pretty
                        </Button>
                        <Button 
                          variant={responseBodyView === "raw" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setResponseBodyView("raw")}
                        >
                          Raw
                        </Button>
                        <Button 
                          variant={responseBodyView === "preview" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setResponseBodyView("preview")}
                        >
                          Preview
                        </Button>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={copyResponseToClipboard}>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={downloadResponse}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                    
                    {/* Response Headers Accordion */}
                    <Accordion type="single" collapsible>
                      <AccordionItem value="headers">
                        <AccordionTrigger>Response Headers</AccordionTrigger>
                        <AccordionContent>
                          <div className="border rounded-md overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Header</TableHead>
                                  <TableHead>Value</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Object.entries(responseHeaders).map(([key, value]) => (
                                  <TableRow key={key}>
                                    <TableCell className="font-medium">{key}</TableCell>
                                    <TableCell className="font-mono text-sm whitespace-pre-wrap">{value}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    
                    {/* Response Body */}
                    <div className="border rounded-md">
                      {renderResponseBody()}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">How it works</h2>
        <p className="text-muted-foreground">
          The API Tester tool helps you test and debug API endpoints with a powerful and intuitive interface. 
          Send requests with different methods, headers, and payloads, then analyze the responses.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 border rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">1. Configure Request</h3>
            <p className="text-sm text-muted-foreground">
              Choose a method, enter your endpoint URL, and configure headers, parameters, and body data.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
              <Send className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">2. Send & Analyze</h3>
            <p className="text-sm text-muted-foreground">
              Send your request and analyze the response data, headers, and status codes in real-time.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
              <Save className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">3. Save & Reuse</h3>
            <p className="text-sm text-muted-foreground">
              Save your requests for later use, export as cURL commands, and download response data.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
