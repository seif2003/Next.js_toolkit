"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Upload, Download, Trash2, ArrowRight, Loader2, Lock, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"

export default function ImageResizerPage() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileName, setFileName] = useState("")
  const [originalWidth, setOriginalWidth] = useState(0)
  const [originalHeight, setOriginalHeight] = useState(0)
  const [newWidth, setNewWidth] = useState(0)
  const [newHeight, setNewHeight] = useState(0)
  const [keepAspectRatio, setKeepAspectRatio] = useState(true)
  const [quality, setQuality] = useState(90)
  const [imageFormat, setImageFormat] = useState<"image/jpeg" | "image/png" | "image/webp">("image/jpeg")
  const [aspectRatio, setAspectRatio] = useState(1)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5MB.")
      return
    }

    // Store file name for later use
    setFileName(file.name)
    
    // Show original image preview
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setOriginalImage(dataUrl)
      setProcessedImage(null) // Reset processed image
      
      // Get original dimensions
      const img = new window.Image()
      img.onload = () => {
        setOriginalWidth(img.width)
        setOriginalHeight(img.height)
        setNewWidth(img.width)
        setNewHeight(img.height)
        setAspectRatio(img.width / img.height)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseInt(e.target.value) || 0
    setNewWidth(width)
    
    if (keepAspectRatio && width > 0) {
      setNewHeight(Math.round(width / aspectRatio))
    }
  }

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const height = parseInt(e.target.value) || 0
    setNewHeight(height)
    
    if (keepAspectRatio && height > 0) {
      setNewWidth(Math.round(height * aspectRatio))
    }
  }

  const handleAspectRatioToggle = () => {
    setKeepAspectRatio(!keepAspectRatio)
    
    // If enabling aspect ratio, adjust height to match current width
    if (!keepAspectRatio && newWidth > 0) {
      setNewHeight(Math.round(newWidth / aspectRatio))
    }
  }

  const processImage = () => {
    if (!originalImage || newWidth <= 0 || newHeight <= 0) return
    
    setIsProcessing(true)
    
    // Create an image object for processing
    const img = document.createElement("img")
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) {
        setIsProcessing(false)
        return
      }

      // Set canvas dimensions to match target size
      canvas.width = newWidth
      canvas.height = newHeight
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        // Apply image smoothing for better quality
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, newWidth, newHeight)
        
        // Convert canvas to data URL with selected format and quality
        const resizedImage = canvas.toDataURL(imageFormat, quality / 100)
        setProcessedImage(resizedImage)
      }
      
      setIsProcessing(false)
    }
    
    img.src = originalImage
  }

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setImageFormat(e.target.value as "image/jpeg" | "image/png" | "image/webp")
  }

  const getFileExtension = () => {
    switch(imageFormat) {
      case "image/jpeg": return "jpg"
      case "image/png": return "png"
      case "image/webp": return "webp"
      default: return "jpg"
    }
  }

  const handleDownload = () => {
    if (!processedImage) return
    
    // Create a temporary link and trigger download
    const link = document.createElement("a")
    link.href = processedImage
    
    // Use original filename but change extension based on format
    const baseFileName = fileName.replace(/\.[^/.]+$/, "") // Remove original extension
    link.download = `${baseFileName}_${newWidth}x${newHeight}.${getFileExtension()}`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleReset = () => {
    setOriginalImage(null)
    setProcessedImage(null)
    setFileName("")
    setOriginalWidth(0)
    setOriginalHeight(0)
    setNewWidth(0)
    setNewHeight(0)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Image Resizer</h1>
        <p className="text-muted-foreground">
          Resize any image to your preferred dimensions and format.
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
                      <div className="mt-2 text-sm text-center text-muted-foreground">
                        Original: {originalWidth} × {originalHeight}
                      </div>
                    </TabsContent>
                    <TabsContent value="result" className="mt-0">
                      <div 
                        className="relative flex items-center justify-center border rounded-lg overflow-hidden h-[300px] md:h-[400px]"
                      >
                        {processedImage && (
                          <Image
                            src={processedImage}
                            alt="Resized image"
                            fill
                            className="object-contain p-2"
                          />
                        )}
                      </div>
                      <div className="mt-2 text-sm text-center text-muted-foreground">
                        Resized: {newWidth} × {newHeight}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
                
                {/* Resize controls */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="width">Width (px)</Label>
                      <Input
                        id="width"
                        type="number"
                        min="1"
                        step="1"
                        value={newWidth}
                        onChange={handleWidthChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (px)</Label>
                      <Input
                        id="height"
                        type="number"
                        min="1"
                        step="1"
                        value={newHeight}
                        onChange={handleHeightChange}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="aspect-ratio" 
                      checked={keepAspectRatio} 
                      onCheckedChange={handleAspectRatioToggle}
                    />
                    <Label htmlFor="aspect-ratio" className="flex items-center cursor-pointer">
                      {keepAspectRatio ? (
                        <Lock className="h-4 w-4 mr-2" />
                      ) : (
                        <Unlock className="h-4 w-4 mr-2" />
                      )}
                      Maintain aspect ratio
                    </Label>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="quality">Image Quality</Label>
                      <span className="text-sm text-muted-foreground">{quality}%</span>
                    </div>
                    <Slider
                      id="quality"
                      min={10}
                      max={100}
                      step={5}
                      value={[quality]}
                      onValueChange={(values) => setQuality(values[0])}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="format">Output Format</Label>
                    <select
                      id="format"
                      value={imageFormat}
                      onChange={handleFormatChange}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="image/jpeg">JPEG</option>
                      <option value="image/png">PNG</option>
                      <option value="image/webp">WebP</option>
                    </select>
                  </div>
                  
                  <Button 
                    onClick={processImage}
                    disabled={isProcessing || !originalImage || newWidth <= 0 || newHeight <= 0}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Resize Image
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">How it works</h2>
        <p className="text-muted-foreground">
          The image resizer allows you to change the dimensions of your images while maintaining quality.
          You can choose to maintain the original aspect ratio or freely resize to custom dimensions.
          Select your preferred output format and quality settings before downloading.
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
              <ArrowRight className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">2. Set Dimensions</h3>
            <p className="text-sm text-muted-foreground">
              Choose your desired width and height, format, and quality settings.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">3. Download Result</h3>
            <p className="text-sm text-muted-foreground">
              Download your resized image in your preferred format.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}