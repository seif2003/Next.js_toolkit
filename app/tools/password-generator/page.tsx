"use client"

import { useState, useEffect, useCallback } from "react"
import { Check, Copy, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

export default function PasswordGeneratorPage() {
  const [password, setPassword] = useState("")
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  })
  const [copied, setCopied] = useState(false)
  const [strengthScore, setStrengthScore] = useState(0)
  const [strengthText, setStrengthText] = useState("")

  const calculatePasswordStrength = (pwd: string) => {
    let score = 0
    
    // Length-based score
    score += pwd.length * 4
    
    // Character variety score
    if (/[a-z]/.test(pwd)) score += 10
    if (/[A-Z]/.test(pwd)) score += 10
    if (/[0-9]/.test(pwd)) score += 10
    if (/[^A-Za-z0-9]/.test(pwd)) score += 15
    
    // Mix of characters score
    const uniqueChars = new Set(pwd).size
    score += uniqueChars * 3
    
    // Cap at 100
    return Math.min(100, score)
  }

  const generatePassword = useCallback(() => {
    let charset = ""
    if (options.lowercase) charset += "abcdefghijklmnopqrstuvwxyz"
    if (options.uppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if (options.numbers) charset += "0123456789"
    if (options.symbols) charset += "!@#$%^&*()_+=-[]{}|;:,.<>?/"
    
    // If no options are selected, default to lowercase
    if (charset === "") charset = "abcdefghijklmnopqrstuvwxyz"
    
    let newPassword = ""
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      newPassword += charset[randomIndex]
    }
    
    setPassword(newPassword)
    const score = calculatePasswordStrength(newPassword)
    setStrengthScore(score)
    
    // Set strength text based on score
    if (score < 40) setStrengthText("Weak")
    else if (score < 70) setStrengthText("Good")
    else if (score < 100) setStrengthText("Strong")
    else setStrengthText("Very Strong")
  }, [length, options])
  
  const copyToClipboard = () => {
    if (!password) return
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleOptionChange = (option: keyof typeof options) => {
    // Make sure at least one option remains selected
    const newOptions = { ...options, [option]: !options[option] }
    if (Object.values(newOptions).some(Boolean)) {
      setOptions(newOptions)
    }
  }
  
  // Generate a password when the component mounts
  useEffect(() => {
    generatePassword()
  }, [generatePassword])
  
  // Generate a new password whenever length or options change
  useEffect(() => {
    generatePassword()
  }, [length, options, generatePassword])
  
  const getStrengthColor = () => {
    if (strengthScore < 40) return "bg-red-500"
    if (strengthScore < 70) return "bg-yellow-500"
    if (strengthScore < 100) return "bg-green-500"
    return "bg-emerald-500"
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Password Generator</h1>
        <p className="text-muted-foreground">
          Generate strong, secure passwords customized to your needs.
        </p>
      </div>
      
      <Card className="border shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-grow">
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  key={password} // This makes the animation trigger on password change
                >
                  <Input
                    value={password}
                    readOnly
                    className="pr-24 font-mono text-sm h-12"
                  />
                </motion.div>
                <div className="absolute right-2 top-2 flex gap-1">
                  <motion.div
                    whileTap={{ scale: 0.9, rotate: -360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={generatePassword}
                      className="h-8 w-8"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span className="sr-only">Generate new password</span>
                    </Button>
                  </motion.div>
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyToClipboard}
                      disabled={!password}
                      className="h-8 w-8"
                    >
                      <AnimatePresence mode="wait">
                        {copied ? 
                          <motion.div
                            key="check"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </motion.div> 
                          : 
                          <motion.div
                            key="copy"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Copy className="h-4 w-4" />
                          </motion.div>
                        }
                      </AnimatePresence>
                      <span className="sr-only">Copy password</span>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label>Password Length: {length}</Label>
                <motion.span 
                  key={length}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-sm text-muted-foreground"
                >
                  {length} characters
                </motion.span>
              </div>
              <Slider
                value={[length]}
                min={8}
                max={60}
                step={1}
                onValueChange={(value) => setLength(value[0])}
                className="[&>[role=slider]]:bg-primary"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="uppercase"
                  checked={options.uppercase}
                  onCheckedChange={() => handleOptionChange('uppercase')}
                />
                <Label htmlFor="uppercase">Include Uppercase</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="lowercase"
                  checked={options.lowercase}
                  onCheckedChange={() => handleOptionChange('lowercase')}
                />
                <Label htmlFor="lowercase">Include Lowercase</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="numbers"
                  checked={options.numbers}
                  onCheckedChange={() => handleOptionChange('numbers')}
                />
                <Label htmlFor="numbers">Include Numbers</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="symbols"
                  checked={options.symbols}
                  onCheckedChange={() => handleOptionChange('symbols')}
                />
                <Label htmlFor="symbols">Include Symbols</Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Password Strength</Label>
                <motion.span 
                  key={strengthText}
                  initial={{ scale: 1.2, y: -5 }}
                  animate={{ scale: 1, y: 0 }}
                  className="text-sm font-medium"
                >
                  {strengthText}
                </motion.span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${getStrengthColor()} transition-all`}
                  style={{ width: `${strengthScore}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${strengthScore}%` }}
                  transition={{ duration: 0.5 }}
                ></motion.div>
              </div>
            </div>
            
            <div>
              <Button onClick={generatePassword} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate New Password
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Tips for Strong Passwords</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Use a minimum of 12 characters</li>
          <li>Include a mix of uppercase and lowercase letters</li>
          <li>Add numbers and special characters</li>
          <li>Avoid using easily guessable information like names or birthdates</li>
          <li>Use a unique password for each account</li>
        </ul>
      </div>
    </div>
  )
}