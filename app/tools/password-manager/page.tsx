"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Plus, Check, Copy, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import CryptoJS from "crypto-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"

// Define the password entry interface
interface PasswordEntry {
  id: string
  websiteName: string
  username: string
  password: string
  url: string
  notes: string
  dateCreated: string
  dateModified: string
}

// In a real app, use a proper secret key management system
// For this demo, we use a hardcoded key (not secure for production)
const ENCRYPTION_KEY = "your-secret-encryption-key-2025"
const LOCAL_STORAGE_KEY = "encrypted_password_manager_data"

export default function PasswordManagerPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [passwordEntries, setPasswordEntries] = useState<PasswordEntry[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [currentEntry, setCurrentEntry] = useState<PasswordEntry | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null) // Track which item was copied
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null)
  
  // Password generator settings
  const [passwordLength, setPasswordLength] = useState(16)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [generatedPassword, setGeneratedPassword] = useState("")
  
  // Form state
  const [formData, setFormData] = useState({
    websiteName: "",
    username: "",
    password: "",
    url: "",
    notes: "",
  })
  const [formError, setFormError] = useState<string | null>(null)

  // Load password entries from localStorage on component mount
  useEffect(() => {
    const loadEncryptedData = () => {
      const encryptedData = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (encryptedData) {
        try {
          // Decrypt data
          const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
          const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8)
          const parsedData = JSON.parse(decryptedText)
          
          if (Array.isArray(parsedData)) {
            setPasswordEntries(parsedData)
          }
        } catch (error) {
          console.error("Error decrypting data:", error)
        }
      }
    }
    
    loadEncryptedData()
  }, [])
  
  // Save encrypted data to localStorage whenever passwordEntries changes
  useEffect(() => {
    const saveEncryptedData = () => {
      const dataString = JSON.stringify(passwordEntries)
      const encryptedData = CryptoJS.AES.encrypt(dataString, ENCRYPTION_KEY).toString()
      localStorage.setItem(LOCAL_STORAGE_KEY, encryptedData)
    }
    
    if (passwordEntries.length > 0) {
      saveEncryptedData()
    }
  }, [passwordEntries])

  // Generate a random password
  const generatePassword = useCallback(() => {
    let charset = ""
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz"
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if (includeNumbers) charset += "0123456789"
    if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?/"
    
    // If no character sets selected, default to lowercase
    if (charset === "") {
      charset = "abcdefghijklmnopqrstuvwxyz"
      setIncludeLowercase(true)
    }
    
    let newPassword = ""
    for (let i = 0; i < passwordLength; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      newPassword += charset[randomIndex]
    }
    
    setGeneratedPassword(newPassword)
    
    // If in edit mode, update the form data with the generated password
    if (isEditing || showAddDialog) {
      setFormData(prev => ({
        ...prev,
        password: newPassword
      }))
    }
  }, [passwordLength, includeUppercase, includeLowercase, includeNumbers, includeSymbols, isEditing, showAddDialog])
  
  // Generate a password on component mount
  useEffect(() => {
    generatePassword()
  }, [generatePassword])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Add new password entry
  const handleAddEntry = () => {
    if (!formData.websiteName.trim()) {
      setFormError("Website name is required.")
      return
    }

    if (passwordEntries.some(entry => entry.websiteName === formData.websiteName)) {
      setFormError("Website name must be unique.")
      return
    }

    const newEntry: PasswordEntry = {
      id: Date.now().toString(),
      ...formData,
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString()
    }
    
    setPasswordEntries(prev => [...prev, newEntry])
    resetFormAndCloseDialogs()
  }
  
  // Update existing password entry
  const handleUpdateEntry = () => {
    if (!currentEntry) return
    
    if (!formData.websiteName.trim()) {
      setFormError("Website name is required.")
      return
    }

    // Check if the website name is unique (excluding the current entry being edited)
    if (passwordEntries.some(entry => 
      entry.websiteName === formData.websiteName && entry.id !== currentEntry.id
    )) {
      setFormError("Website name must be unique.")
      return
    }
    
    const updatedEntries = passwordEntries.map(entry => {
      if (entry.id === currentEntry.id) {
        return {
          ...entry,
          ...formData,
          dateModified: new Date().toISOString()
        }
      }
      return entry
    })
    
    setPasswordEntries(updatedEntries)
    resetFormAndCloseDialogs()
  }
  
  // Delete password entry
  const handleDeleteEntry = (id: string) => {
    setPasswordEntries(prev => prev.filter(entry => entry.id !== id))
    resetFormAndCloseDialogs()
  }
  
  // Copy password to clipboard
  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }
  
  // Open view dialog with selected entry
  const viewEntry = (entry: PasswordEntry) => {
    setCurrentEntry(entry)
    setShowViewDialog(true)
    setIsEditing(false)
    setFormData({
      websiteName: entry.websiteName,
      username: entry.username,
      password: entry.password,
      url: entry.url,
      notes: entry.notes
    })
  }
  
  // Reset form and close dialogs
  const resetFormAndCloseDialogs = () => {
    setFormData({
      websiteName: "",
      username: "",
      password: "",
      url: "",
      notes: ""
    })
    setFormError(null)
    setCurrentEntry(null)
    setShowAddDialog(false)
    setShowViewDialog(false)
    setIsEditing(false)
    setShowPassword(false)
    setShowDeleteConfirmation(false)
    setEntryToDelete(null)
  }
  
  // Filter entries based on search term
  const filteredEntries = passwordEntries.filter(entry => {
    const searchLower = searchTerm.toLowerCase()
    return entry.websiteName.toLowerCase().includes(searchLower) || 
           entry.username.toLowerCase().includes(searchLower) ||
           entry.url.toLowerCase().includes(searchLower)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Password Manager</h1>
        <p className="text-muted-foreground">
          Securely store, generate, and manage your passwords with local encryption.
        </p>
      </div>
      
      {/* Main Password Manager Interface */}
      <div className="flex items-center gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search passwords..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add New
        </Button>
      </div>
      
      {/* Password Entries List */}
      <div className="grid gap-4">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => (
            <Card key={entry.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex justify-between items-center p-4">
                  <div 
                    className="flex-grow cursor-pointer"
                    onClick={() => viewEntry(entry)}
                  >
                    <h3 className="font-medium">{entry.websiteName}</h3>
                    <p className="text-sm text-muted-foreground">{entry.username}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(entry.id, entry.password)}
                    >
                      {copiedId === entry.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">
              {searchTerm ? "No matching passwords found" : "No passwords saved yet"}
            </p>
            <Button 
              variant="outline"
              className="mt-4"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Your First Password
            </Button>
          </div>
        )}
      </div>
      
      {/* Add/Edit Password Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Password</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {formError && <p className="text-red-500 text-sm">{formError}</p>}
            <div className="grid gap-2">
              <Label htmlFor="websiteName">Website Name <span className="text-red-500">*</span></Label>
              <Input
                id="websiteName"
                name="websiteName"
                placeholder="Google, Twitter, etc."
                value={formData.websiteName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username / Email</Label>
              <Input
                id="username"
                name="username"
                placeholder="your.email@example.com"
                value={formData.username}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(prev => !prev)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, password: generatedPassword }))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue="generator">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="generator">Password Generator</TabsTrigger>
                <TabsTrigger value="details">Additional Details</TabsTrigger>
              </TabsList>
              <TabsContent value="generator" className="mt-2 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Password Length: {passwordLength}</Label>
                    <span className="text-sm text-muted-foreground">{passwordLength} characters</span>
                  </div>
                  <Slider
                    value={[passwordLength]}
                    min={8}
                    max={32}
                    step={1}
                    onValueChange={(value) => setPasswordLength(value[0])}
                    className="[&>[role=slider]]:bg-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="uppercase"
                      checked={includeUppercase}
                      onCheckedChange={setIncludeUppercase}
                    />
                    <Label htmlFor="uppercase">A-Z</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="lowercase"
                      checked={includeLowercase}
                      onCheckedChange={setIncludeLowercase}
                    />
                    <Label htmlFor="lowercase">a-z</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="numbers"
                      checked={includeNumbers}
                      onCheckedChange={setIncludeNumbers}
                    />
                    <Label htmlFor="numbers">0-9</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="symbols"
                      checked={includeSymbols}
                      onCheckedChange={setIncludeSymbols}
                    />
                    <Label htmlFor="symbols">!@#$%</Label>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    value={generatedPassword}
                    readOnly
                    className="font-mono"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5"
                      onClick={() => generatePassword()}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5"
                      onClick={() => copyToClipboard("", generatedPassword)}
                    >
                      {copiedId === "" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="details" className="space-y-4 mt-2">
                <div className="grid gap-2">
                  <Label htmlFor="url">Website URL</Label>
                  <Input
                    id="url"
                    name="url"
                    placeholder="https://example.com"
                    value={formData.url}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    name="notes"
                    placeholder="Additional information..."
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="min-h-[100px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetFormAndCloseDialogs}>Cancel</Button>
            <Button onClick={handleAddEntry}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View/Edit Password Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Password" : "Password Details"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isEditing ? (
              <>
                {formError && <p className="text-red-500 text-sm">{formError}</p>}
                <div className="grid gap-2">
                  <Label htmlFor="edit-websiteName">Website Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-websiteName"
                    name="websiteName"
                    value={formData.websiteName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-username">Username / Email</Label>
                  <Input
                    id="edit-username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-password">Password</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <Input
                        id="edit-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(prev => !prev)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() => generatePassword()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-url">Website URL</Label>
                  <Input
                    id="edit-url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <textarea
                    id="edit-notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="min-h-[100px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </>
            ) : currentEntry && (
              <>
                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="text-sm font-medium">Website:</span>
                  <span>{currentEntry.websiteName}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="text-sm font-medium">Username:</span>
                  <div className="flex items-center gap-2">
                    <span className="truncate">{currentEntry.username}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(currentEntry.id, currentEntry.username)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="text-sm font-medium">Password:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">
                    {showPassword ? currentEntry.password : "•".repeat(currentEntry.password.length)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(currentEntry.id, currentEntry.password)}
                    >
                      {copiedId === currentEntry.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                {currentEntry.url && (
                  <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                    <span className="text-sm font-medium">URL:</span>
                    <a 
                      href={currentEntry.url.startsWith('http') ? currentEntry.url : `https://${currentEntry.url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline truncate"
                    >
                      {currentEntry.url}
                    </a>
                  </div>
                )}
                {currentEntry.notes && (
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-sm font-medium">Notes:</span>
                    <p className="whitespace-pre-wrap">{currentEntry.notes}</p>
                  </div>
                )}
                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(currentEntry.dateCreated).toLocaleString()}
                  </span>
                </div>
                {currentEntry.dateModified !== currentEntry.dateCreated && (
                  <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                    <span className="text-sm font-medium">Modified:</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(currentEntry.dateModified).toLocaleString()}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleUpdateEntry}>Save Changes</Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mr-auto">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setShowDeleteConfirmation(true)
                      setEntryToDelete(currentEntry?.id || null)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
                <Button variant="outline" onClick={resetFormAndCloseDialogs}>
                  Close
                </Button>
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this password? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetFormAndCloseDialogs}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (entryToDelete) {
                  handleDeleteEntry(entryToDelete)
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}