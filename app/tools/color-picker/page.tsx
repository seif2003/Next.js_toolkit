"use client"

import { useState, useEffect } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { motion, AnimatePresence } from "framer-motion"

interface Color {
  hex: string
  rgb: { r: number; g: number; b: number }
}

export default function ColorPickerPage() {
  const [color, setColor] = useState<Color>({
    hex: "#1E40AF",
    rgb: { r: 30, g: 64, b: 175 }
  })
  const [swatches, setSwatches] = useState<Color[]>([
    { hex: "#1E40AF", rgb: { r: 30, g: 64, b: 175 } },
    { hex: "#1D4ED8", rgb: { r: 29, g: 78, b: 216 } },
    { hex: "#2563EB", rgb: { r: 37, g: 99, b: 235 } },
    { hex: "#3B82F6", rgb: { r: 59, g: 130, b: 246 } },
    { hex: "#60A5FA", rgb: { r: 96, g: 165, b: 250 } }
  ])
  const [copied, setCopied] = useState(false)
  const [copiedColorId, setCopiedColorId] = useState<string | null>(null)
  
  // Load saved swatches from localStorage
  useEffect(() => {
    const savedSwatches = localStorage.getItem('color_picker_swatches')
    if (savedSwatches) {
      try {
        const parsedSwatches = JSON.parse(savedSwatches)
        if (Array.isArray(parsedSwatches) && parsedSwatches.length > 0) {
          setSwatches(parsedSwatches)
        }
      } catch (error) {
        console.error('Failed to load saved colors:', error)
      }
    }
  }, [])
  
  // Save swatches to localStorage when they change
  useEffect(() => {
    localStorage.setItem('color_picker_swatches', JSON.stringify(swatches))
  }, [swatches])

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value
    setColor({
      hex,
      rgb: hexToRgb(hex)
    })
  }

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: number[]) => {
    const newRgb = { ...color.rgb, [channel]: value[0] }
    setColor({
      hex: rgbToHex(newRgb),
      rgb: newRgb
    })
  }

  const addToSwatches = () => {
    if (swatches.some(s => s.hex === color.hex)) return
    setSwatches([...swatches, color])
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const copyColorHex = (hex: string, index: number) => {
    navigator.clipboard.writeText(hex)
    setCopiedColorId(`${hex}-${index}`)
    setTimeout(() => setCopiedColorId(null), 2000)
  }

  const removeFromSwatches = (hex: string) => {
    setSwatches(swatches.filter(s => s.hex !== hex))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Color Picker</h1>
        <p className="text-muted-foreground">Create, explore, and export beautiful color palettes.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <motion.div 
            className="w-full h-40 rounded-lg border shadow-sm flex items-center justify-center"
            style={{ backgroundColor: color.hex }}
            animate={{ backgroundColor: color.hex }}
            transition={{ duration: 0.5 }}
          >
            <span className={`font-mono text-lg ${isLightColor(color.rgb) ? 'text-black' : 'text-white'}`}>
              {color.hex}
            </span>
          </motion.div>
          
          <div className="flex gap-2">
            <Input 
              type="color" 
              value={color.hex} 
              onChange={handleColorChange} 
              className="w-12 h-12 p-0 border" 
            />
            <Input 
              type="text" 
              value={color.hex} 
              onChange={handleColorChange}
              maxLength={7}
              className="font-mono" 
            />
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => copyToClipboard(color.hex)}
                className="flex-shrink-0"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Check className="h-4 w-4 text-green-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Copy className="h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Red</label>
                <motion.span 
                  key={color.rgb.r} 
                  initial={{ scale: 1.2 }} 
                  animate={{ scale: 1 }}
                  className="text-sm text-muted-foreground"
                >
                  {color.rgb.r}
                </motion.span>
              </div>
              <Slider
                defaultValue={[color.rgb.r]}
                value={[color.rgb.r]}
                min={0}
                max={255}
                step={1}
                onValueChange={(value) => handleRgbChange('r', value)}
                className="[&>[role=slider]]:bg-red-500"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Green</label>
                <motion.span 
                  key={color.rgb.g} 
                  initial={{ scale: 1.2 }} 
                  animate={{ scale: 1 }}
                  className="text-sm text-muted-foreground"
                >
                  {color.rgb.g}
                </motion.span>
              </div>
              <Slider
                defaultValue={[color.rgb.g]}
                value={[color.rgb.g]}
                min={0}
                max={255}
                step={1}
                onValueChange={(value) => handleRgbChange('g', value)}
                className="[&>[role=slider]]:bg-green-500"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Blue</label>
                <motion.span 
                  key={color.rgb.b} 
                  initial={{ scale: 1.2 }} 
                  animate={{ scale: 1 }}
                  className="text-sm text-muted-foreground"
                >
                  {color.rgb.b}
                </motion.span>
              </div>
              <Slider
                defaultValue={[color.rgb.b]}
                value={[color.rgb.b]}
                min={0}
                max={255}
                step={1}
                onValueChange={(value) => handleRgbChange('b', value)}
                className="[&>[role=slider]]:bg-blue-500"
              />
            </div>
          </div>
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={addToSwatches} className="w-full">
              Add to Swatches
            </Button>
          </motion.div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Saved Colors</h3>
          <div className="grid grid-cols-3 gap-2">
            {swatches.map((swatch, index) => (
              <div
                key={index}
                className="flex flex-col gap-1 group"
              >
                <motion.button
                  className="h-14 rounded-md border shadow-sm flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: swatch.hex }}
                  onClick={() => setColor(swatch)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className={`text-xs font-mono ${isLightColor(swatch.rgb) ? 'text-black' : 'text-white'}`}>
                      {swatch.hex}
                    </span>
                  </div>
                </motion.button>
                <div className="flex gap-1">
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 flex-1 text-xs"
                      onClick={() => copyColorHex(swatch.hex, index)}
                    >
                      <AnimatePresence mode="wait">
                        {copiedColorId === `${swatch.hex}-${index}` ? (
                          <motion.div
                            key="check"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center"
                          >
                            <Check className="h-3 w-3 mr-1 text-green-500" />
                            <span>Copied</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="copy"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            <span>Copy</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2"
                      onClick={() => removeFromSwatches(swatch.hex)}
                    >
                      &times;
                    </Button>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }
}

const rgbToHex = ({ r, g, b }: { r: number, g: number, b: number }) => {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

const isLightColor = ({ r, g, b }: { r: number, g: number, b: number }) => {
  // Calculate the perceived brightness using the formula (0.299*R + 0.587*G + 0.114*B)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128
}