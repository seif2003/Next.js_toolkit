"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Check, Copy } from "lucide-react"

// Common regex patterns for quick selection
const COMMON_PATTERNS = [
  { name: "Email", description: "Match email addresses", regex: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$", example: "example@email.com" },
  { name: "URL", description: "Match URLs", regex: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)", example: "https://example.com" },
  { name: "Phone Number", description: "Match common phone number formats", regex: "^\\+?[1-9]\\d{1,14}$", example: "+1234567890" },
  { name: "Date (YYYY-MM-DD)", description: "Match ISO dates", regex: "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$", example: "2025-04-08" },
  { name: "Username", description: "Alphanumeric with underscores, 3-16 chars", regex: "^[a-zA-Z0-9_]{3,16}$", example: "user_123" },
  { name: "Password", description: "Min 8 chars with numbers and special chars", regex: "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$", example: "Pass@123" },
  { name: "Hex Color", description: "Match hex color codes", regex: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", example: "#3B82F6" }
]

// Regex flags explanation
const REGEX_FLAGS = [
  { flag: "g", name: "Global", description: "Find all matches rather than stopping after the first match" },
  { flag: "i", name: "Case Insensitive", description: "Ignore case when matching" },
  { flag: "m", name: "Multiline", description: "Treat beginning and end characters (^ and $) as working over multiple lines" },
  { flag: "s", name: "Dot All", description: "Allows . to match newline characters" },
  { flag: "u", name: "Unicode", description: "Treat pattern as a sequence of Unicode code points" },
  { flag: "y", name: "Sticky", description: "Matches only from the index indicated by the lastIndex property" }
]

export default function RegexGeneratorPage() {
  const [regex, setRegex] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [flags, setFlags] = useState<{ [key: string]: boolean }>({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
    y: false
  })
  const [testString, setTestString] = useState<string>("")
  const [matches, setMatches] = useState<string[]>([])
  const [copied, setCopied] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Select a common pattern
  const selectPattern = (pattern: {regex: string, description: string, example?: string}) => {
    setRegex(pattern.regex)
    setDescription(pattern.description)
    if (pattern.example) {
      setTestString(pattern.example)
    }
    setError(null)
    
    // Test immediately after selecting
    try {
      testRegex(pattern.regex, getActiveFlags())
    } catch {
      // Ignore errors during auto-test
    }
  }
  
  // Toggle a regex flag
  const toggleFlag = (flag: string) => {
    setFlags(prev => ({
      ...prev,
      [flag]: !prev[flag]
    }))
  }
  
  // Get active flags as string
  const getActiveFlags = useCallback(() => {
    return Object.entries(flags)
      .filter(([flag, active]) => { 
            console.log(flag, active)
            return active 
        })
      .map(([flag]) => flag)
      .join("")
  }, [flags])
  
  // Test the regex against the input string
  const testRegex = useCallback((regexStr = regex, flagsStr = getActiveFlags()) => {
    setError(null)
    setMatches([])
    
    if (!regexStr) return
    
    try {
      const re = new RegExp(regexStr, flagsStr)
      let matches: string[] = []
      
      if (flags.g) {
        const allMatches = [...testString.matchAll(re)]
        matches = allMatches.map(match => match[0])
      } else {
        const match = testString.match(re)
        if (match) matches = [match[0]]
      }
      
      setMatches(matches)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Invalid regular expression")
      }
    }
  }, [regex, testString, flags, getActiveFlags])
  
  // Copy regex to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(`/${regex}/${getActiveFlags()}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  // Test regex when it changes or flags change
  useEffect(() => {
    testRegex()
  }, [regex, flags, testString, testRegex])
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Regex Tester</h1>
        <p className="text-muted-foreground">
          Test and debug regular expressions with our interactive tool.
        </p>
      </div>
      
      <Card>
        <CardHeader className="px-6">
          <CardTitle>Test Regular Expression</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="regex">Regular Expression</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-muted-foreground">/</span>
                  </div>
                  <Input 
                    id="regex"
                    value={regex}
                    onChange={(e) => setRegex(e.target.value)}
                    className="pl-6 pr-24 font-mono"
                    placeholder="Enter regex pattern"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <span className="text-muted-foreground pr-3">/</span>
                    <span className="text-muted-foreground pr-3 font-mono">{getActiveFlags()}</span>
                  </div>
                </div>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
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
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Flags</Label>
              <div className="flex flex-wrap gap-2">
                {REGEX_FLAGS.map(({ flag, name, description }) => (
                  <motion.div 
                    key={flag}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant={flags[flag] ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFlag(flag)}
                      title={description}
                      className="h-8"
                    >
                      {name} ({flag})
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="test-string">Test String</Label>
              <Textarea
                id="test-string"
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                placeholder="Enter text to test against the regex"
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Results</Label>
                {matches.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {matches.length} match{matches.length !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>
              
              {error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
                  <p className="text-sm">{error}</p>
                </div>
              ) : matches.length > 0 ? (
                <div className="p-4 border rounded-md space-y-2 bg-muted/50">
                  {matches.map((match, i) => (
                    <motion.div 
                      key={`${match}-${i}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="p-2 bg-background border rounded-sm font-mono text-sm flex justify-between"
                    >
                      <span>{match}</span>
                      <span className="text-muted-foreground">Match {i + 1}</span>
                    </motion.div>
                  ))}
                </div>
              ) : testString && regex ? (
                <div className="p-4 bg-yellow-50 text-yellow-600 rounded-md border border-yellow-200">
                  <p className="text-sm">No matches found</p>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Common Patterns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {COMMON_PATTERNS.map((pattern) => (
            <motion.div key={pattern.name} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full justify-between h-auto py-3"
                onClick={() => selectPattern(pattern)}
              >
                <span>{pattern.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {pattern.example}
                </span>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}