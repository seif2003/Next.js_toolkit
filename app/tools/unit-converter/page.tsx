"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Repeat, Copy } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Conversion types
type ConversionCategory = "length" | "weight" | "temperature" | "time"

// Conversion unit configuration
interface UnitConfig {
  name: string
  shortName: string
  conversionFactor: number
}

interface TemperatureUnitConfig {
  name: string
  shortName: string
  toBase: (value: number) => number
  fromBase: (value: number) => number
}

// Unit conversion functions and mappings
const lengthUnits: UnitConfig[] = [
  { name: "Millimeters", shortName: "mm", conversionFactor: 0.001 },
  { name: "Centimeters", shortName: "cm", conversionFactor: 0.01 },
  { name: "Meters", shortName: "m", conversionFactor: 1 },
  { name: "Kilometers", shortName: "km", conversionFactor: 1000 },
  { name: "Inches", shortName: "in", conversionFactor: 0.0254 },
  { name: "Feet", shortName: "ft", conversionFactor: 0.3048 },
  { name: "Yards", shortName: "yd", conversionFactor: 0.9144 },
  { name: "Miles", shortName: "mi", conversionFactor: 1609.344 },
]

const weightUnits: UnitConfig[] = [
  { name: "Milligrams", shortName: "mg", conversionFactor: 0.000001 },
  { name: "Grams", shortName: "g", conversionFactor: 0.001 },
  { name: "Kilograms", shortName: "kg", conversionFactor: 1 },
  { name: "Metric Tons", shortName: "t", conversionFactor: 1000 },
  { name: "Ounces", shortName: "oz", conversionFactor: 0.0283495 },
  { name: "Pounds", shortName: "lb", conversionFactor: 0.453592 },
  { name: "Stone", shortName: "st", conversionFactor: 6.35029 },
  { name: "US Tons", shortName: "ton", conversionFactor: 907.185 },
]

const temperatureUnits: TemperatureUnitConfig[] = [
  { 
    name: "Celsius", 
    shortName: "°C", 
    toBase: (celsius) => celsius, 
    fromBase: (celsius) => celsius 
  },
  { 
    name: "Fahrenheit", 
    shortName: "°F", 
    toBase: (fahrenheit) => (fahrenheit - 32) * 5/9,
    fromBase: (celsius) => celsius * 9/5 + 32
  },
  { 
    name: "Kelvin", 
    shortName: "K", 
    toBase: (kelvin) => kelvin - 273.15, 
    fromBase: (celsius) => celsius + 273.15 
  }
]

const timeUnits: UnitConfig[] = [
  { name: "Milliseconds", shortName: "ms", conversionFactor: 1 / 1000 / 60 / 60 },
  { name: "Seconds", shortName: "sec", conversionFactor: 1 / 60 / 60 },
  { name: "Minutes", shortName: "min", conversionFactor: 1 / 60 },
  { name: "Hours", shortName: "hr", conversionFactor: 1 },
  { name: "Days", shortName: "day", conversionFactor: 24 },
  { name: "Weeks", shortName: "wk", conversionFactor: 24 * 7 },
  { name: "Months (avg)", shortName: "mon", conversionFactor: 24 * 30.44 },
  { name: "Years", shortName: "yr", conversionFactor: 24 * 365.25 },
]

export default function UnitConverterPage() {
  const [category, setCategory] = useState<ConversionCategory>("length")
  const [value, setValue] = useState<string>("1")
  const [fromUnit, setFromUnit] = useState<string>("m")
  const [toUnit, setToUnit] = useState<string>("cm")
  const [result, setResult] = useState<string>("")
  const [formula, setFormula] = useState<string>("")

  // Helper to get the active units based on the selected category
  const getUnits = () => {
    switch (category) {
      case "length": return lengthUnits
      case "weight": return weightUnits
      case "time": return timeUnits
      default: return lengthUnits
    }
  }

  // Get user-friendly name of the unit
  const getUnitName = (shortName: string) => {
    const units = category === "temperature" 
      ? temperatureUnits 
      : getUnits()
    
    return units.find(u => u.shortName === shortName)?.name || shortName
  }

  // Reset to appropriate default units when category changes
  useEffect(() => {
    let defaultFrom, defaultTo
    
    switch (category) {
      case "length":
        defaultFrom = "m"
        defaultTo = "cm"
        break
      case "weight":
        defaultFrom = "kg"
        defaultTo = "g"
        break
      case "temperature":
        defaultFrom = "°C"
        defaultTo = "°F"
        break
      case "time":
        defaultFrom = "hr"
        defaultTo = "min"
        break
    }
    
    setFromUnit(defaultFrom)
    setToUnit(defaultTo)
    convert(value, defaultFrom, defaultTo)
  }, [category])

  // Swap from and to units
  const swapUnits = () => {
    const temp = fromUnit
    setFromUnit(toUnit)
    setToUnit(temp)
    convert(value, toUnit, fromUnit)
  }

  // Copy result to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(result)
  }

  // Convert the value
  const convert = (inputValue: string, from: string, to: string) => {
    const numValue = parseFloat(inputValue)
    
    if (isNaN(numValue)) {
      setResult("")
      setFormula("")
      return
    }
    
    // Special handling for temperature
    if (category === "temperature") {
      const fromUnit = temperatureUnits.find(u => u.shortName === from)
      const toUnit = temperatureUnits.find(u => u.shortName === to)
      
      if (fromUnit && toUnit) {
        // Convert to Celsius first (base unit for temperature)
        const celsiusValue = fromUnit.toBase(numValue)
        // Then convert from Celsius to target unit
        const resultValue = toUnit.fromBase(celsiusValue)
        
        setResult(resultValue.toFixed(4))
        
        // Create formula explanation
        let formulaText = `${numValue} ${from} = `
        
        if (from !== "°C") {
          formulaText += `${celsiusValue.toFixed(2)} °C = `
        }
        
        formulaText += `${resultValue.toFixed(4)} ${to}`
        setFormula(formulaText)
      }
    } else {
      // For other unit types that use simple conversion factors
      const units = getUnits()
      const fromUnitConfig = units.find(u => u.shortName === from)
      const toUnitConfig = units.find(u => u.shortName === to)
      
      if (fromUnitConfig && toUnitConfig) {
        // Convert to base unit, then to target unit
        const baseValue = numValue * fromUnitConfig.conversionFactor
        const resultValue = baseValue / toUnitConfig.conversionFactor
        
        setResult(resultValue.toFixed(4))
        
        // Create formula explanation
        const formulaText = `${numValue} ${from} = ${resultValue.toFixed(4)} ${to}`
        setFormula(formulaText)
      }
    }
  }

  // Handle input changes
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    convert(newValue, fromUnit, toUnit)
  }

  const handleFromUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value
    setFromUnit(newUnit)
    convert(value, newUnit, toUnit)
  }

  const handleToUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value
    setToUnit(newUnit)
    convert(value, fromUnit, newUnit)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Unit Converter</h1>
        <p className="text-muted-foreground">
          Convert between different units of measurement
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <Tabs 
            defaultValue={category} 
            value={category} 
            onValueChange={(value) => setCategory(value as ConversionCategory)}
            className="w-full"
          >
            <TabsList className="mb-6 w-full justify-start">
              <TabsTrigger value="length">Length</TabsTrigger>
              <TabsTrigger value="weight">Weight</TabsTrigger>
              <TabsTrigger value="temperature">Temperature</TabsTrigger>
              <TabsTrigger value="time">Time</TabsTrigger>
            </TabsList>
            
            <div className="space-y-6">
              {/* Input Row */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-end gap-4">
                {/* From Value and Unit */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="from-value">Value</Label>
                    <span className="text-xs font-medium text-muted-foreground">
                      From: {getUnitName(fromUnit)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="from-value"
                      type="number"
                      value={value}
                      onChange={handleValueChange}
                      className="flex-1"
                    />
                    <select
                      value={fromUnit}
                      onChange={handleFromUnitChange}
                      className="h-10 w-24 rounded-md border px-3 py-2 text-sm"
                    >
                      {category === "temperature" 
                        ? temperatureUnits.map((unit) => (
                            <option key={unit.shortName} value={unit.shortName}>
                              {unit.shortName}
                            </option>
                          ))
                        : getUnits().map((unit) => (
                            <option key={unit.shortName} value={unit.shortName}>
                              {unit.shortName}
                            </option>
                          ))
                      }
                    </select>
                  </div>
                </div>
                
                {/* Swap Button */}
                <div className="flex items-center justify-center">
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={swapUnits}
                    className="h-10 w-10 rounded-full"
                  >
                    <Repeat className="h-4 w-4" />
                    <span className="sr-only">Swap Units</span>
                  </Button>
                </div>
                
                {/* To Value and Unit */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="to-value">Result</Label>
                    <span className="text-xs font-medium text-muted-foreground">
                      To: {getUnitName(toUnit)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="to-value"
                      value={result}
                      readOnly
                      className="flex-1 bg-muted cursor-default font-medium"
                    />
                    <select
                      value={toUnit}
                      onChange={handleToUnitChange}
                      className="h-10 w-24 rounded-md border px-3 py-2 text-sm"
                    >
                      {category === "temperature" 
                        ? temperatureUnits.map((unit) => (
                            <option key={unit.shortName} value={unit.shortName}>
                              {unit.shortName}
                            </option>
                          ))
                        : getUnits().map((unit) => (
                            <option key={unit.shortName} value={unit.shortName}>
                              {unit.shortName}
                            </option>
                          ))
                      }
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Formula */}
              <div className="text-center py-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Formula:</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0" 
                    disabled={!result}
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy result</span>
                  </Button>
                </div>
                <div className="font-mono text-sm mt-1 opacity-90">{formula}</div>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <h2 className="font-medium mb-2">Common Conversions</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            {category === "length" && (
              <ul className="space-y-1">
                <li>1 meter = 100 centimeters</li>
                <li>1 kilometer = 0.621371 miles</li>
                <li>1 inch = 2.54 centimeters</li>
                <li>1 foot = 0.3048 meters</li>
              </ul>
            )}
            
            {category === "weight" && (
              <ul className="space-y-1">
                <li>1 kilogram = 1000 grams</li>
                <li>1 pound = 0.453592 kilograms</li>
                <li>1 ounce = 28.3495 grams</li>
                <li>1 stone = 6.35029 kilograms</li>
              </ul>
            )}
            
            {category === "temperature" && (
              <ul className="space-y-1">
                <li>°C = (°F - 32) × 5/9</li>
                <li>°F = (°C × 9/5) + 32</li>
                <li>K = °C + 273.15</li>
                <li>Water freezes: 0°C = 32°F = 273.15K</li>
              </ul>
            )}
            
            {category === "time" && (
              <ul className="space-y-1">
                <li>1 hour = 60 minutes = 3600 seconds</li>
                <li>1 day = 24 hours</li>
                <li>1 week = 7 days = 168 hours</li>
                <li>1 year = 365.25 days (average)</li>
              </ul>
            )}
          </div>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h2 className="font-medium mb-2">Usage Tips</h2>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Click the swap button to reverse the conversion</li>
            <li>Results are rounded to 4 decimal places</li>
            <li>Click the copy button to copy the result</li>
            <li>Use the dropdown menus to select different units</li>
          </ul>
        </div>
      </div>
    </div>
  )
}