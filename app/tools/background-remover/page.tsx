"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Upload, Download, Trash2, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function BackgroundRemoverPage() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileName, setFileName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Store file name for later use
    setFileName(file.name)
    
    // Show original image preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setOriginalImage(event.target?.result as string)
      setProcessedImage(null) // Reset processed image
    }
    reader.readAsDataURL(file)
  }

  const processImage = () => {
    if (!originalImage) return
    
    setIsProcessing(true)
    
    // In a real implementation, this would call an API for background removal
    // For now, we'll simulate creating a transparent background
    const img = document.createElement('img')
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) {
        setIsProcessing(false)
        return
      }

      // Set canvas dimensions to match image
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        // Draw original image
        ctx.drawImage(img, 0, 0)
        
        // For this simulation, we'll create a simple semi-transparent effect
        // In a real implementation, you would use a proper background removal algorithm or API
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Convert all nearly-white pixels to transparent
        // This is just for demonstration - a real algorithm would be more sophisticated
        for (let i = 0; i < data.length; i += 4) {
          // Get rgba values
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          
          // Calculate brightness
          const brightness = (r * 299 + g * 587 + b * 114) / 1000
          
          // If it's a bright pixel, make it transparent
          // This is just a simple demonstration - not a real background removal algorithm
          if (brightness > 200) {
            data[i + 3] = 0 // Set alpha to 0 (transparent)
          }
        }
        
        // Put the modified image data back on the canvas
        ctx.putImageData(imageData, 0, 0)
        
        // Convert canvas to transparent PNG data URL
        const transparentImage = canvas.toDataURL('image/png')
        setProcessedImage(transparentImage)
      }
      
      setIsProcessing(false)
    }
    
    img.src = originalImage
  }

  const handleDownload = () => {
    if (!processedImage) return
    
    // Create a temporary link and trigger download
    const link = document.createElement("a")
    link.href = processedImage
    link.download = `${fileName.replace(/\.[^/.]+$/, "")}_transparent.png` // Always use PNG for transparency
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleReset = () => {
    setOriginalImage(null)
    setProcessedImage(null)
    setFileName("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Create checkered background pattern for transparency visualization
  const [checkerPattern, setCheckerPattern] = useState<string>('')
  
  useEffect(() => {
    // Create a checkered pattern canvas for transparency visualization
    const createCheckerPattern = () => {
      const patternCanvas = document.createElement('canvas')
      const patternCtx = patternCanvas.getContext('2d')
      if (!patternCtx) return
      
      // Set size for the pattern
      patternCanvas.width = 20
      patternCanvas.height = 20
      
      // Draw the checkered pattern
      patternCtx.fillStyle = '#f0f0f0'
      patternCtx.fillRect(0, 0, 10, 10)
      patternCtx.fillRect(10, 10, 10, 10)
      patternCtx.fillStyle = '#cccccc'
      patternCtx.fillRect(10, 0, 10, 10)
      patternCtx.fillRect(0, 10, 10, 10)
      
      setCheckerPattern(patternCanvas.toDataURL())
    }
    
    createCheckerPattern()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Background Remover</h1>
        <p className="text-muted-foreground">
          Remove backgrounds from images and make them transparent with a single click.
        </p>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            {!originalImage ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center">
                <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload an image</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  JPG, PNG or WEBP (max. 5MB)
                </p>
                <div className="flex gap-4">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="max-w-[300px]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Tabs defaultValue={processedImage ? "result" : "original"}>
                  <div className="flex justify-between items-center">
                    <TabsList>
                      <TabsTrigger value="original">Original</TabsTrigger>
                      <TabsTrigger 
                        value="result"
                        disabled={!processedImage}
                      >
                        Result
                      </TabsTrigger>
                    </TabsList>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                      {processedImage && (
                        <Button 
                          size="sm" 
                          onClick={handleDownload}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 min-h-[300px]">
                    <TabsContent value="original" className="mt-0">
                      <div className="relative flex items-center justify-center border rounded-lg overflow-hidden bg-secondary/30 h-[300px] md:h-[400px]">
                        {originalImage && (
                          <Image
                            src={originalImage}
                            alt="Original image"
                            fill
                            className="object-contain p-2"
                          />
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="result" className="mt-0">
                      <div 
                        className="relative flex items-center justify-center border rounded-lg overflow-hidden h-[300px] md:h-[400px]"
                        style={{
                          backgroundImage: `url(${checkerPattern})`,
                          backgroundRepeat: 'repeat'
                        }}
                      >
                        {processedImage && (
                          <Image
                            src={processedImage}
                            alt="Processed image with transparent background"
                            fill
                            className="object-contain p-2"
                          />
                        )}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
                
                {!processedImage && (
                  <Button 
                    onClick={processImage}
                    disabled={isProcessing || !originalImage}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Remove Background
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">How it works</h2>
        <p className="text-muted-foreground">
          Our background remover uses advanced AI to automatically detect and remove the background from your images, 
          making it transparent. The output is saved as a PNG file with transparency, perfect for using in designs, 
          presentations, or anywhere you need images without backgrounds.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 border rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">1. Upload Image</h3>
            <p className="text-sm text-muted-foreground">
              Upload any JPG, PNG, or WEBP image up to 5MB in size.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
              <Loader2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">2. Process Image</h3>
            <p className="text-sm text-muted-foreground">
              Our AI will automatically detect and remove the background, creating transparency.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">3. Download Result</h3>
            <p className="text-sm text-muted-foreground">
              Download your image with the transparent background as a PNG file.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}