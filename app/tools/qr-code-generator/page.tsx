"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Copy, Upload, Camera, Check, RefreshCw, X } from "lucide-react"
import QRCode from "qrcode"

export default function QrCodeGeneratorPage() {
  const [text, setText] = useState<string>("")
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("")
  const [errorCorrection, setErrorCorrection] = useState<"L" | "M" | "Q" | "H">("M")
  const [colorDark, setColorDark] = useState<string>("#000000")
  const [colorLight, setColorLight] = useState<string>("#ffffff")
  const [size, setSize] = useState<number>(300)
  const [margin, setMargin] = useState<number>(4)
  const [activeTab, setActiveTab] = useState<"generate" | "read">("generate")
  const [fileResult, setFileResult] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [scanning, setScanning] = useState<boolean>(false)
  const [copySuccess, setCopySuccess] = useState<boolean>(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasReaderRef = useRef<HTMLCanvasElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  
  // Generate QR code when parameters change
  useEffect(() => {
    if (!text) {
      setQrCodeDataURL("")
      return
    }
    
    const generateQRCode = async () => {
      try {
        const options = {
          errorCorrectionLevel: errorCorrection,
          margin: margin,
          color: {
            dark: colorDark,
            light: colorLight
          },
          width: size,
        }
        
        const dataURL = await QRCode.toDataURL(text, options)
        setQrCodeDataURL(dataURL)
      } catch (error) {
        console.error("Error generating QR code:", error)
      }
    }
    
    generateQRCode()
  }, [text, errorCorrection, colorDark, colorLight, size, margin])
  
  // Copy QR code text content to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(text)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }
  
  // Download QR code as image
  const downloadQRCode = () => {
    if (!qrCodeDataURL) return
    
    const link = document.createElement("a")
    link.href = qrCodeDataURL
    link.download = "qrcode.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Process file for QR code reading
  const processFile = async (file: File) => {
    setFileResult(null)
    setFileError(null)
    
    if (!file) return
    
    try {
      const imageUrl = URL.createObjectURL(file)
      const img = new Image()
      img.src = imageUrl
      
      img.onload = async () => {
        try {
          // Use the QRCode library to decode the image
          const canvas = canvasRef.current
          if (!canvas) return
          
          const ctx = canvas.getContext("2d")
          if (!ctx) return
          
          // Resize canvas to match image dimensions
          canvas.width = img.width
          canvas.height = img.height
          
          // Draw image on canvas
          ctx.drawImage(img, 0, 0)
          
          // Use jsQR to decode
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          
          // Import jsQR dynamically
          const jsQR = (await import("jsqr")).default
          const code = jsQR(imageData.data, imageData.width, imageData.height)
          
          if (code) {
            setFileResult(code.data)
          } else {
            setFileError("No QR code found in image")
          }
          
          URL.revokeObjectURL(imageUrl)
        } catch (error) {
          console.error("Error decoding QR code:", error)
          setFileError("Failed to decode QR code")
        }
      }
      
      img.onerror = () => {
        setFileError("Invalid image file")
        URL.revokeObjectURL(imageUrl)
      }
    } catch (error) {
      console.error("Error processing file:", error)
      setFileError("Failed to process image")
    }
  }

  // Handle file upload for QR code reading
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  // Handle drag events for drop zone
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Check if the drag is leaving the drop zone (not just entering a child element)
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      // Update file input to reflect the dropped file
      if (fileInputRef.current) {
        // Create a DataTransfer object to set files on the input
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        fileInputRef.current.files = dataTransfer.files
      }
      await processFile(file)
    }
  }

  // Handle camera scanning
  const startCameraScanning = async () => {
    setScanning(true)
    setFileResult(null)
    setFileError(null)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        
        // Start scanning loop
        scanQRCode()
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      setFileError("Could not access camera")
      setScanning(false)
    }
  }
  
  // Stop camera scanning
  const stopCameraScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const tracks = stream.getTracks()
      
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    
    setScanning(false)
  }
  
  // Scan QR code from camera feed
  const scanQRCode = async () => {
    if (!scanning || !videoRef.current || !canvasReaderRef.current) return
    
    const canvas = canvasReaderRef.current
    const ctx = canvas.getContext("2d")
    
    if (!ctx) return
    
    try {
      if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        // Set canvas size to match video
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        
        // Draw video frame to canvas
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        
        // Import jsQR dynamically
        const jsQR = (await import("jsqr")).default
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        
        if (code) {
          // Found QR code
          setFileResult(code.data)
          stopCameraScanning()
          return
        }
      }
      
      // Continue scanning
      requestAnimationFrame(scanQRCode)
    } catch (error) {
      console.error("Error during QR scanning:", error)
      setFileError("Error during scanning")
      stopCameraScanning()
    }
  }
  
  // Clear file input
  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setFileResult(null)
    setFileError(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">QR Code Generator & Reader</h1>
        <p className="text-muted-foreground">
          Generate and read QR codes for sharing links, text and contact info
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <Tabs 
            defaultValue="generate" 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "generate" | "read")}
            className="w-full"
          >
            <TabsList className="mb-6 grid grid-cols-2 w-full">
              <TabsTrigger value="generate">Generate QR Code</TabsTrigger>
              <TabsTrigger value="read">Read QR Code</TabsTrigger>
            </TabsList>
            
            <TabsContent value="generate" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="qr-text">Text or URL</Label>
                <Input
                  id="qr-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text, URL, or contact info..."
                  className="font-mono"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {qrCodeDataURL ? (
                    <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-white dark:bg-black">
                      <img 
                        src={qrCodeDataURL}
                        alt="QR Code"
                        className="max-w-full"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-4 border rounded-lg h-[300px] bg-muted/20">
                      <p className="text-muted-foreground text-center">
                        Enter text above to generate a QR code
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-center gap-2">
                    <Button
                      onClick={downloadQRCode}
                      disabled={!qrCodeDataURL}
                      className="flex gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      onClick={copyToClipboard}
                      disabled={!text}
                      variant="outline"
                      className="flex gap-2"
                    >
                      {copySuccess ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copySuccess ? "Copied!" : "Copy Text"}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="error-correction" className="mb-2 block">Error Correction</Label>
                    <select
                      id="error-correction"
                      value={errorCorrection}
                      onChange={(e) => setErrorCorrection(e.target.value as "L" | "M" | "Q" | "H")}
                      className="w-full h-10 rounded-md border px-3 py-2"
                    >
                      <option value="L">Low (7%)</option>
                      <option value="M">Medium (15%)</option>
                      <option value="Q">Quartile (25%)</option>
                      <option value="H">High (30%)</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Higher error correction allows QR codes to remain readable even when partially damaged or obscured
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="color-dark" className="mb-2 block">Foreground Color</Label>
                      <div className="flex gap-2">
                        <div
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: colorDark }}
                        />
                        <Input
                          id="color-dark"
                          type="color"
                          value={colorDark}
                          onChange={(e) => setColorDark(e.target.value)}
                          className="w-full h-10 p-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="color-light" className="mb-2 block">Background Color</Label>
                      <div className="flex gap-2">
                        <div
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: colorLight }}
                        />
                        <Input
                          id="color-light"
                          type="color"
                          value={colorLight}
                          onChange={(e) => setColorLight(e.target.value)}
                          className="w-full h-10 p-1"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="size" className="mb-2 block">Size (pixels): {size}</Label>
                      <Input
                        id="size"
                        type="range"
                        min="100"
                        max="500"
                        step="10"
                        value={size}
                        onChange={(e) => setSize(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="margin" className="mb-2 block">Margin: {margin}</Label>
                      <Input
                        id="margin"
                        type="range"
                        min="0"
                        max="10"
                        value={margin}
                        onChange={(e) => setMargin(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="read" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Upload QR Code Image</h3>
                      {(fileResult || fileError) && (
                        <Button variant="ghost" size="sm" onClick={clearFileInput}>
                          <RefreshCw className="h-4 w-4 mr-2" /> Reset
                        </Button>
                      )}
                    </div>
                    
                    <div>
                      <label className="block w-full">
                        <div 
                          ref={dropZoneRef}
                          className={`flex items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 ${isDragging ? 'border-primary bg-primary/10' : ''}`}
                          onDragEnter={handleDragEnter}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <div className="flex flex-col items-center">
                            <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">Click to upload or drag & drop</span>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          ref={fileInputRef}
                        />
                      </label>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div className="w-full border-t my-2" />
                      <span className="bg-background px-3 -mt-4 text-xs text-muted-foreground">OR</span>
                    </div>
                    
                    <div className="flex justify-center">
                      {!scanning ? (
                        <Button onClick={startCameraScanning}>
                          <Camera className="h-4 w-4 mr-2" /> Scan with Camera
                        </Button>
                      ) : (
                        <Button variant="destructive" onClick={stopCameraScanning}>
                          <X className="h-4 w-4 mr-2" /> Stop Scanning
                        </Button>
                      )}
                    </div>
                    
                    {scanning && (
                      <div className="mt-4">
                        <div className="relative">
                          <video
                            ref={videoRef}
                            className="w-full rounded-lg"
                            muted
                            playsInline
                          />
                          <div className="absolute top-0 left-0 w-full h-full border-2 border-dashed border-primary/50 rounded-lg" />
                        </div>
                        <p className="text-xs text-center mt-2 text-muted-foreground">Point your camera at a QR code</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 h-full">
                    <h3 className="font-medium mb-4">Result</h3>
                    
                    {fileError ? (
                      <div className="flex flex-col items-center justify-center h-40 bg-red-50 dark:bg-red-950/20 rounded-lg p-4 text-red-700 dark:text-red-400">
                        <X className="h-8 w-8 mb-2" />
                        <p>{fileError}</p>
                      </div>
                    ) : fileResult ? (
                      <div className="flex flex-col h-full">
                        <div className="bg-muted/20 border rounded-lg p-3 mb-4">
                          <div className="font-medium text-sm mb-1">Detected Content:</div>
                          <p className="font-mono break-all">{fileResult}</p>
                        </div>
                        
                        {fileResult.startsWith('http://') || fileResult.startsWith('https://') ? (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Detected URL</span>
                            <Button size="sm" asChild>
                              <a href={fileResult} target="_blank" rel="noopener noreferrer">
                                Open Link
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(fileResult)
                              setCopySuccess(true)
                              setTimeout(() => setCopySuccess(false), 2000)
                            }}
                          >
                            {copySuccess ? (
                              <Check className="h-4 w-4 mr-2" />
                            ) : (
                              <Copy className="h-4 w-4 mr-2" />
                            )}
                            {copySuccess ? "Copied!" : "Copy to Clipboard"}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 bg-muted/20 rounded-lg">
                        <p className="text-muted-foreground">Scan or upload a QR code to see results</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Hidden elements for QR code processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={canvasReaderRef} style={{ display: 'none' }} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <h2 className="font-medium mb-2">Tips for QR Code Generator</h2>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Use higher error correction levels for public display</li>
            <li>Ensure good contrast between foreground and background colors</li>
            <li>Test your QR code on different devices before using</li>
            <li>Shorter text produces simpler codes that are easier to scan</li>
          </ul>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h2 className="font-medium mb-2">QR Code Ideas</h2>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Website URLs</li>
            <li>Contact information (vCard format)</li>
            <li>WiFi network credentials</li>
            <li>Payment information</li>
            <li>Event tickets or digital passes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}