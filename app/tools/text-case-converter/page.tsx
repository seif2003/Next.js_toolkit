"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Check, ArrowDownToLine, Trash2 } from "lucide-react"

// Case converter functions
const convertToSnakeCase = (text: string): string => {
  return text
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/([a-z])([A-Z])/g, '$1_$2') // Handle camelCase
    .toLowerCase() // Convert to lowercase
}

const convertToCamelCase = (text: string): string => {
  return text
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
    .replace(/\s/g, '')
    .replace(/_(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, firstChar => firstChar.toLowerCase()) // Ensure first character is lowercase
}

const convertToPascalCase = (text: string): string => {
  const camelCase = convertToCamelCase(text)
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1)
}

const convertToKebabCase = (text: string): string => {
  return text
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

const convertToUpperCase = (text: string): string => {
  return text.toUpperCase()
}

const convertToLowerCase = (text: string): string => {
  return text.toLowerCase()
}

// String formatting functions
const makeTitleCase = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const makeSentenceCase = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s*\w)/g, match => match.toUpperCase())
}

export default function TextCaseConverterPage() {
  const [inputText, setInputText] = useState<string>("")
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  
  // Handle text conversion and copy to clipboard
  const handleCopy = (convertedText: string, label: string) => {
    navigator.clipboard.writeText(convertedText)
    setCopySuccess(label)
    setTimeout(() => setCopySuccess(null), 2000)
  }

  // Clear the input text
  const clearText = () => {
    setInputText("")
  }

  // Create a conversion button with copy functionality
  const ConversionButton = ({
    label,
    convert,
    className = "",
  }: {
    label: string
    convert: (text: string) => string
    className?: string
  }) => {
    const convertedText = convert(inputText)
    const isCopied = copySuccess === label
    
    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">{label}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => handleCopy(convertedText, label)}
            disabled={!inputText}
          >
            {isCopied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copy {label}</span>
          </Button>
        </div>
        <div className="bg-muted/50 rounded-md p-2 min-h-12 relative">
          {convertedText ? (
            <p className="font-mono text-sm whitespace-pre-wrap break-all">{convertedText}</p>
          ) : (
            <p className="text-muted-foreground text-sm text-center">Enter text to convert</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Text Case Converter</h1>
        <p className="text-muted-foreground">
          Convert text between different case formats: snake_case, camelCase, PascalCase, kebab-case, and more
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium">Input Text</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearText}
                    disabled={!inputText}
                    className="h-8 flex gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="Type or paste text here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[100px] font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Type or paste text to convert between different case formats
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Case Formats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ConversionButton 
            label="snake_case" 
            convert={convertToSnakeCase} 
          />
          <ConversionButton 
            label="camelCase" 
            convert={convertToCamelCase} 
          />
          <ConversionButton 
            label="PascalCase" 
            convert={convertToPascalCase} 
          />
          <ConversionButton 
            label="kebab-case" 
            convert={convertToKebabCase} 
          />
          <ConversionButton 
            label="UPPERCASE" 
            convert={convertToUpperCase} 
          />
          <ConversionButton 
            label="lowercase" 
            convert={convertToLowerCase} 
          />
          <ConversionButton 
            label="Title Case" 
            convert={makeTitleCase} 
          />
          <ConversionButton 
            label="Sentence case" 
            convert={makeSentenceCase} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Case Format Examples</h3>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>snake_case: used in Python, Ruby</li>
            <li>camelCase: used in JavaScript, Java</li>
            <li>PascalCase: used for class names in C#, Java</li>
            <li>kebab-case: used in HTML/CSS, URLs</li>
          </ul>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Usage Tips</h3>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Click the copy icon to copy the converted text</li>
            <li>Use sentence case for natural language text</li>
            <li>Use programming specific cases for code</li>
            <li>Special characters are removed in most formats</li>
          </ul>
        </div>
      </div>
    </div>
  )
}