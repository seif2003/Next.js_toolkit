"use client"

import { useState, useEffect, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import { format } from "date-fns"
import { motion } from "framer-motion"
import {
  FileText,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
  ChevronRight,
  Edit,
  Save,
  Clock,
  ArrowUpDown,
  Check,
  Download,
  Upload,
  Star,
  StarOff,
  StickyNote,
  List,
  Grid,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Types
interface NoteTag {
  id: string
  name: string
  color: string
}

interface Note {
  id: string
  title: string
  content: string
  summary?: string
  folderId: string
  tagIds: string[]
  createdAt: string
  updatedAt: string
  isPinned: boolean
  attachments: Attachment[]
  coverImage?: string
}

interface Folder {
  id: string
  name: string
  parentId: string | null
  createdAt: string
}

interface Attachment {
  id: string
  name: string
  type: string
  url: string
  size: number
  createdAt: string
}

interface AppState {
  notes: Note[]
  folders: Folder[]
  tags: NoteTag[]
  activeNoteId: string | null
  activeFolderId: string | null
  defaultFolderId: string
}

// Tag color options
const TAG_COLORS = [
  "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  "bg-lime-100 text-lime-800 border-lime-300 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800",
  "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800",
  "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
  "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
  "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 dark:bg-fuchsia-900/30 dark:text-fuchsia-800 dark:border-fuchsia-800",
  "bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
  "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
  "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700",
]

// Sort Options
const SORT_OPTIONS = [
  { id: "updated_desc", name: "Last Updated", field: "updatedAt", order: "desc" },
  { id: "updated_asc", name: "First Updated", field: "updatedAt", order: "asc" },
  { id: "created_desc", name: "Newest", field: "createdAt", order: "desc" },
  { id: "created_asc", name: "Oldest", field: "createdAt", order: "asc" },
  { id: "title_asc", name: "Title (A-Z)", field: "title", order: "asc" },
  { id: "title_desc", name: "Title (Z-A)", field: "title", order: "desc" },
]

// Welcome note content
const WELCOME_NOTE_CONTENT = `# Welcome to Advanced Notes Manager! 📝

This is your advanced note-taking workspace, designed to help you organize your thoughts, plans, and ideas in a powerful yet easy-to-use interface.

## Key Features 🌟

- **Rich Text Editing**: Format your notes with Markdown
- **Hierarchical Organization**: Create folders and subfolders
- **Tagging System**: Categorize notes with customizable tags
- **Pinning**: Keep important notes at the top
- **Search**: Find anything quickly with full-text search
- **Attachments**: Upload and link files to your notes
- **Dark/Light mode**: Comfortable viewing in any environment

## Getting Started 🚀

1. **Create a note**: Click the + button in the toolbar
2. **Organize with folders**: Create folders in the sidebar
3. **Add tags**: Categorize your notes for easier filtering
4. **Pin important notes**: Keep critical information readily available

Enjoy capturing and organizing your ideas! ✨
`

export default function NotesManagerPage() {
  // Local state
  const [appState, setAppState] = useState<AppState>(() => {
    // Default state with initial folder and welcome note
    const defaultState: AppState = {
      notes: [],
      folders: [],
      tags: [],
      activeNoteId: null,
      activeFolderId: null,
      defaultFolderId: "",
    }

    return defaultState
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddingFolder, setIsAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null)
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [tempNoteContent, setTempNoteContent] = useState("")
  const [tempNoteTitle, setTempNoteTitle] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0])
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string } | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  
  // Initialize app with default data if none exists
  useEffect(() => {
    const savedData = localStorage.getItem("notes_manager_data")
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setAppState(parsedData)
      } catch (error) {
        console.error("Failed to parse saved data:", error)
        initializeDefaultData()
      }
    } else {
      initializeDefaultData()
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (appState.defaultFolderId) { // Only save if initialized
      localStorage.setItem("notes_manager_data", JSON.stringify(appState))
    }
  }, [appState])

  // Set up autofocus when editing a note
  useEffect(() => {
    if (isEditingNote && textAreaRef.current) {
      textAreaRef.current.focus()
    }
  }, [isEditingNote])

  // Initialize default data
  const initializeDefaultData = () => {
    const defaultFolderId = uuidv4()
    const welcomeNoteId = uuidv4()
    const personalFolderId = uuidv4()
    const workFolderId = uuidv4()
    
    const defaultWorkspaces = [
      { id: defaultFolderId, name: "All Notes", parentId: null, createdAt: new Date().toISOString() },
      { id: personalFolderId, name: "Personal", parentId: null, createdAt: new Date().toISOString() },
      { id: workFolderId, name: "Work", parentId: null, createdAt: new Date().toISOString() },
    ]
    
    const defaultTags = [
      { id: uuidv4(), name: "Important", color: TAG_COLORS[0] },
      { id: uuidv4(), name: "Project", color: TAG_COLORS[4] },
      { id: uuidv4(), name: "Idea", color: TAG_COLORS[9] },
      { id: uuidv4(), name: "Todo", color: TAG_COLORS[14] },
    ]

    const welcomeNote = {
      id: welcomeNoteId,
      title: "Welcome to Advanced Notes Manager",
      content: WELCOME_NOTE_CONTENT,
      summary: "An introduction to the Advanced Notes Manager application",
      folderId: defaultFolderId,
      tagIds: [defaultTags[0].id], // Add "Important" tag
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: true,
      attachments: [],
    }

    setAppState({
      notes: [welcomeNote],
      folders: defaultWorkspaces,
      tags: defaultTags,
      activeNoteId: welcomeNoteId,
      activeFolderId: defaultFolderId,
      defaultFolderId,
    })
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Create a new folder
  const createFolder = () => {
    if (!newFolderName.trim()) return

    const newFolder: Folder = {
      id: uuidv4(),
      name: newFolderName.trim(),
      parentId: newFolderParentId,
      createdAt: new Date().toISOString(),
    }

    setAppState((prev) => ({
      ...prev,
      folders: [...prev.folders, newFolder],
    }))

    // Expand parent folder if nested
    if (newFolderParentId) {
      setExpandedFolders(prev => ({
        ...prev,
        [newFolderParentId]: true
      }))
    }

    resetFolderForm()
  }

  // Reset folder form
  const resetFolderForm = () => {
    setNewFolderName("")
    setNewFolderParentId(null)
    setIsAddingFolder(false)
  }

  // Create a new tag
  const createTag = () => {
    if (!newTagName.trim()) return

    const newTag: NoteTag = {
      id: uuidv4(),
      name: newTagName.trim(),
      color: newTagColor,
    }

    setAppState((prev) => ({
      ...prev,
      tags: [...prev.tags, newTag],
    }))

    setNewTagName("")
    setNewTagColor(TAG_COLORS[0])
    setIsAddingTag(false)
  }

  // Create a new note
  const createNote = () => {
    const newNoteId = uuidv4()
    const newNote: Note = {
      id: newNoteId,
      title: "Untitled Note",
      content: "",
      folderId: appState.activeFolderId || appState.defaultFolderId,
      tagIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false,
      attachments: [],
    }

    setAppState((prev) => ({
      ...prev,
      notes: [...prev.notes, newNote],
      activeNoteId: newNoteId,
    }))

    setIsAddingNote(false)
    setIsEditingNote(true)
    setTempNoteTitle("Untitled Note")
    setTempNoteContent("")
  }

  // Save the current note
  const saveNote = () => {
    if (!appState.activeNoteId) return

    setAppState((prev) => ({
      ...prev,
      notes: prev.notes.map((note) =>
        note.id === appState.activeNoteId
          ? {
              ...note,
              title: tempNoteTitle || "Untitled Note",
              content: tempNoteContent,
              updatedAt: new Date().toISOString(),
              summary: generateSummary(tempNoteContent),
            }
          : note
      ),
    }))

    setIsEditingNote(false)
  }

  // Generate a summary from note content
  const generateSummary = (content: string): string => {
    // Remove markdown formatting
    const plainText = content
      .replace(/#{1,6}\s?([^\n]+)/g, "$1") // headers
      .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
      .replace(/\*([^*]+)\*/g, "$1") // italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
      .replace(/`([^`]+)`/g, "$1") // inline code
      .replace(/```[\s\S]*?```/g, "") // code blocks
      .replace(/~~([^~]+)~~/g, "$1") // strikethrough

    // Get the first few words (around 25 words)
    const words = plainText.split(/\s+/)
    return words.slice(0, 25).join(" ") + (words.length > 25 ? "..." : "")
  }

  // Toggle note pin status
  const togglePinNote = (noteId: string) => {
    setAppState((prev) => ({
      ...prev,
      notes: prev.notes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              isPinned: !note.isPinned,
              updatedAt: new Date().toISOString(),
            }
          : note
      ),
    }))
  }

  // Delete a note
  const deleteNote = (noteId: string) => {
    setItemToDelete({ type: "note", id: noteId })
    setConfirmDialogOpen(true)
  }

  // Delete a folder and optionally its notes
  const deleteFolder = (folderId: string) => {
    if (folderId === appState.defaultFolderId) return // Don't allow deleting the default folder
    
    setItemToDelete({ type: "folder", id: folderId })
    setConfirmDialogOpen(true)
  }

  // Delete a tag
  const deleteTag = (tagId: string) => {
    setItemToDelete({ type: "tag", id: tagId })
    setConfirmDialogOpen(true)
  }

  // Confirm deletion of an item
  const confirmDelete = () => {
    if (!itemToDelete) return
    
    const { type, id } = itemToDelete
    
    if (type === "note") {
      setAppState((prev) => {
        const filteredNotes = prev.notes.filter((note) => note.id !== id)
        const newActiveNoteId = 
          prev.activeNoteId === id
            ? filteredNotes.length > 0 ? filteredNotes[0].id : null
            : prev.activeNoteId
            
        return {
          ...prev,
          notes: filteredNotes,
          activeNoteId: newActiveNoteId,
        }
      })
    }
    else if (type === "folder") {
      setAppState((prev) => {
        // Remove the folder and its children
        const folderIdsToRemove = getFolderAndDescendants(id, prev.folders)
        const filteredFolders = prev.folders.filter(
          folder => !folderIdsToRemove.includes(folder.id)
        )
        
        // Move notes to the default folder
        const updatedNotes = prev.notes.map(note => 
          folderIdsToRemove.includes(note.folderId) 
            ? { ...note, folderId: prev.defaultFolderId }
            : note
        )
        
        // Update active folder if necessary
        const newActiveFolderId = 
          folderIdsToRemove.includes(prev.activeFolderId || "")
            ? prev.defaultFolderId
            : prev.activeFolderId
            
        return {
          ...prev,
          folders: filteredFolders,
          notes: updatedNotes,
          activeFolderId: newActiveFolderId,
        }
      })
    }
    else if (type === "tag") {
      setAppState((prev) => ({
        ...prev,
        tags: prev.tags.filter(tag => tag.id !== id),
        notes: prev.notes.map(note => ({
          ...note,
          tagIds: note.tagIds.filter(tagId => tagId !== id)
        }))
      }))
    }
    
    setConfirmDialogOpen(false)
    setItemToDelete(null)
  }

  // Get folder and all its descendants
  const getFolderAndDescendants = (folderId: string, folders: Folder[]): string[] => {
    const result = [folderId]
    
    const childFolders = folders.filter(f => f.parentId === folderId)
    childFolders.forEach(child => {
      result.push(...getFolderAndDescendants(child.id, folders))
    })
    
    return result
  }

  // Toggle a tag on the active note
  const toggleTag = (tagId: string) => {
    if (!appState.activeNoteId) return

    setAppState((prev) => ({
      ...prev,
      notes: prev.notes.map((note) =>
        note.id === appState.activeNoteId
          ? {
              ...note,
              tagIds: note.tagIds.includes(tagId)
                ? note.tagIds.filter((id) => id !== tagId)
                : [...note.tagIds, tagId],
              updatedAt: new Date().toISOString(),
            }
          : note
      ),
    }))
  }

  // Toggle folder expanded state
  const toggleFolderExpanded = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }))
  }

  // Set the active folder
  const setActiveFolder = (folderId: string | null) => {
    setAppState(prev => ({
      ...prev,
      activeFolderId: folderId,
      // Select the first note in this folder if available
      activeNoteId: folderId === null 
        ? prev.notes[0]?.id || null
        : prev.notes.find(n => n.folderId === folderId)?.id || prev.activeNoteId
    }))
  }

  // Export all notes as JSON
  const exportNotes = () => {
    const exportData = JSON.stringify(appState, null, 2)
    const blob = new Blob([exportData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `notes_export_${format(new Date(), 'yyyy-MM-dd')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Import notes from JSON file
  const importNotes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader()
    
    fileReader.onload = (event) => {
      try {
        if (event.target?.result) {
          const importedData = JSON.parse(event.target.result as string)
          
          // Validate the imported data has the expected structure
          if (
            importedData.notes &&
            importedData.folders &&
            importedData.tags &&
            importedData.defaultFolderId
          ) {
            // Make sure to clear the input field for future imports
            if (e.target) {
              e.target.value = ''
            }
            
            // Set all the data at once to ensure consistent state
            setAppState({
              notes: importedData.notes || [],
              folders: importedData.folders || [],
              tags: importedData.tags || [],
              defaultFolderId: importedData.defaultFolderId,
              activeNoteId: importedData.notes.length > 0 ? importedData.notes[0].id : null,
              activeFolderId: null
            })
            
            // Show success message
            alert("Notes imported successfully!")
          } else {
            alert("Invalid import file format. The file must contain notes, folders, tags, and defaultFolderId.")
          }
        }
      } catch (error) {
        console.error("Import error:", error)
        alert("Failed to import notes. The file may be corrupted or in an incorrect format.")
      }
    }
    
    if (e.target.files?.[0]) {
      fileReader.readAsText(e.target.files[0])
    }
  }

  // Filter and sort notes based on current state
  const getFilteredNotes = () => {
    // Start with all notes
    let filteredNotes = [...appState.notes]
    
    // Filter by folder if a folder is selected
    if (appState.activeFolderId) {
      // Get all child folder IDs for hierarchical filtering
      const folderIds = getFolderAndDescendants(appState.activeFolderId, appState.folders)
      filteredNotes = filteredNotes.filter(note => folderIds.includes(note.folderId))
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filteredNotes = filteredNotes.filter(
        note =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          // Search in tags
          note.tagIds.some(tagId => 
            appState.tags
              .find(tag => tag.id === tagId)?.name
              .toLowerCase()
              .includes(query)
          )
      )
    }
    
    // Sorting
    filteredNotes.sort((a, b) => {
      // Always put pinned notes at the top
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1
      }
      
      const field = sortOption.field as keyof Note
      const order = sortOption.order
      
      if (field === "title") {
        return order === "asc" 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title)
      }
      
      return order === "asc"
        ? new Date(a[field] as string).getTime() - new Date(b[field] as string).getTime()
        : new Date(b[field] as string).getTime() - new Date(a[field] as string).getTime()
    })
    
    return filteredNotes
  }

  // Recursive function to render the folder tree
  const renderFolderTree = (parentId: string | null = null, depth = 0) => {
    const folders = appState.folders.filter(f => f.parentId === parentId)
    
    return folders.map(folder => {
      const hasChildren = appState.folders.some(f => f.parentId === folder.id)
      const isExpanded = expandedFolders[folder.id]
      const folderNotes = appState.notes.filter(note => note.folderId === folder.id)
      const noteCount = folderNotes.length
      const isActive = folder.id === appState.activeFolderId
      
      return (
        <div key={folder.id} className={`pl-${depth * 4}`}>
          <div 
            className={`flex items-center py-1 px-2 rounded-md mb-1 hover:bg-secondary/50 cursor-pointer ${
              isActive ? "bg-secondary" : ""
            }`}
          >
            {hasChildren ? (
              <button 
                onClick={() => toggleFolderExpanded(folder.id)}
                className="p-1 rounded-md hover:bg-secondary mr-1"
              >
                <ChevronRight 
                  className={`h-3 w-3 transition-transform ${isExpanded ? "transform rotate-90" : ""}`} 
                />
              </button>
            ) : (
              <div className="w-5" />
            )}
            
            <div 
              className="flex-1 flex items-center"
              onClick={() => setActiveFolder(folder.id)}
            >
              <Folder className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium truncate">{folder.name}</span>
              {noteCount > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">{noteCount}</span>
              )}
            </div>
            
            {folder.id !== appState.defaultFolderId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setIsAddingFolder(true)
                    setNewFolderParentId(folder.id)
                  }}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Add Subfolder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => deleteFolder(folder.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {/* Display notes within folder when expanded */}
          {isExpanded && noteCount > 0 && (
            <div className={`ml-6 mb-2 space-y-1`}>
              {folderNotes.map(note => (
                <div 
                  key={note.id}
                  className={`flex items-center py-1 px-2 text-sm rounded-md hover:bg-secondary/50 cursor-pointer ${
                    note.id === appState.activeNoteId ? "bg-secondary/70" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAppState(prev => ({ ...prev, activeNoteId: note.id }))
                  }}
                >
                  <FileText className="h-3 w-3 mr-2 text-muted-foreground" />
                  <span className="truncate">{note.title}</span>
                  {note.isPinned && <Star className="h-3 w-3 ml-1 text-yellow-500" />}
                </div>
              ))}
            </div>
          )}
          
          {hasChildren && isExpanded && (
            <div className="ml-4">
              {renderFolderTree(folder.id, depth + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  // Get active note
  const activeNote = appState.notes.find(note => note.id === appState.activeNoteId)

  // Get tags for the active note
  const activeNoteTags = appState.tags.filter(tag => 
    activeNote?.tagIds.includes(tag.id)
  )

  // Filtered notes based on current folder and search
  const filteredNotes = getFilteredNotes()

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Advanced Notes Manager</h1>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
                {sortOption.name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem 
                  key={option.id}
                  onClick={() => setSortOption(option)}
                  className={`flex items-center justify-between ${sortOption.id === option.id ? "bg-secondary" : ""}`}
                >
                  {option.name}
                  {sortOption.id === option.id && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant={viewMode === "grid" ? "default" : "outline"} 
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          
          <Button 
            variant={viewMode === "list" ? "default" : "outline"} 
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
        {/* Sidebar */}
        <div className="md:col-span-1 border rounded-lg p-4 overflow-auto space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          {/* Toolbar */}
          <div className="flex justify-between items-center">
            <Button
              onClick={() => setIsAddingNote(true)}
              size="sm"
              className="w-full"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> New Note
            </Button>
          </div>
          
          {/* Folders */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-sm">Folders</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => setIsAddingFolder(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="sr-only">Add folder</span>
              </Button>
            </div>
            
            <div
              className={`flex items-center py-1 px-2 rounded-md mb-1 hover:bg-secondary/50 cursor-pointer ${
                appState.activeFolderId === null ? "bg-secondary" : ""
              }`}
              onClick={() => setActiveFolder(null)}
            >
              <StickyNote className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">All Notes</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {appState.notes.length}
              </span>
            </div>
            
            {renderFolderTree()}
          </div>
          
          {/* Tags */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-sm">Tags</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => setIsAddingTag(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="sr-only">Add tag</span>
              </Button>
            </div>
            
            <div className="space-y-1">
              {appState.tags.map(tag => {
                const taggedNoteCount = appState.notes.filter(
                  note => note.tagIds.includes(tag.id)
                ).length
                
                return (
                  <div 
                    key={tag.id}
                    className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-secondary/50"
                  >
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full ${tag.color.split(" ")[0]}`} />
                      <span className="text-sm ml-2">{tag.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{taggedNoteCount}</span>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-50 hover:opacity-100"
                      onClick={() => deleteTag(tag.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Export/Import */}
          <div className="pt-4 border-t">
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={exportNotes}
              >
                <Download className="h-3.5 w-3.5 mr-1" /> Export
              </Button>
              <label htmlFor="import-notes" className="flex-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  <Upload className="h-3.5 w-3.5 mr-1" /> Import
                </Button>
                <input 
                  id="import-notes" 
                  type="file" 
                  accept=".json" 
                  className="hidden"
                  onChange={importNotes}
                />
              </label>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="md:col-span-3 flex flex-col h-full">
          {/* Notes grid/list */}
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-auto pb-4" : "flex flex-col gap-2 overflow-auto pb-4"}>
            {filteredNotes.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center h-40 text-muted-foreground">
                <FileText className="h-10 w-10 mb-2 opacity-30" />
                <p>No notes found</p>
                <Button
                  variant="link"
                  onClick={() => setIsAddingNote(true)}
                >
                  Create a new note
                </Button>
              </div>
            ) : (
              filteredNotes.map(note => {
                const noteTags = appState.tags.filter(tag => note.tagIds.includes(tag.id))
                const folder = appState.folders.find(f => f.id === note.folderId)
                
                return (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card 
                      className={`overflow-hidden ${
                        note.id === appState.activeNoteId ? "border-primary" : ""
                      } ${
                        viewMode === "list" ? "flex" : "block"
                      } hover:shadow-md transition-shadow cursor-pointer`}
                      onClick={() => setAppState(prev => ({ ...prev, activeNoteId: note.id }))}
                    >
                      {note.coverImage && viewMode === "grid" && (
                        <div 
                          className="h-32 bg-cover bg-center" 
                          style={{ backgroundImage: `url(${note.coverImage})` }}
                        />
                      )}
                      
                      <CardContent 
                        className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center">
                            {note.isPinned && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div onClick={(e) => {
                                      e.stopPropagation()
                                      togglePinNote(note.id)
                                    }}>
                                      <Star className="h-4 w-4 text-yellow-500 mr-1 cursor-pointer" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Pinned note</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <h3 className="font-medium truncate">{note.title}</h3>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                togglePinNote(note.id)
                              }}>
                                {note.isPinned ? (
                                  <>
                                    <StarOff className="h-4 w-4 mr-2" />
                                    Unpin
                                  </>
                                ) : (
                                  <>
                                    <Star className="h-4 w-4 mr-2" />
                                    Pin
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                deleteNote(note.id)
                              }}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {viewMode === "grid" && (
                          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                            {note.summary || note.content.substring(0, 100)}
                          </p>
                        )}
                        
                        <div className={`flex justify-between items-center mt-2 ${viewMode === "list" ? "flex-1" : ""}`}>
                          <div className="flex flex-wrap gap-1">
                            {noteTags.slice(0, 3).map(tag => (
                              <span 
                                key={tag.id} 
                                className={`text-xs px-2 py-0.5 rounded-full border ${tag.color}`}
                              >
                                {tag.name}
                              </span>
                            ))}
                            {noteTags.length > 3 && (
                              <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">
                                +{noteTags.length - 3}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center text-xs text-muted-foreground">
                            {folder && <span className="mr-2">{folder.name}</span>}
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(note.updatedAt), "MMM d")}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })
            )}
          </div>
          
          {/* Note view/edit area */}
          {appState.activeNoteId && activeNote && (
            <Card className="mt-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b">
                {isEditingNote ? (
                  <Input
                    value={tempNoteTitle}
                    onChange={(e) => setTempNoteTitle(e.target.value)}
                    className="text-lg font-medium border-none focus-visible:ring-0 p-0"
                    placeholder="Note title"
                  />
                ) : (
                  <h2 className="text-lg font-medium">{activeNote.title}</h2>
                )}
                
                <div className="flex items-center gap-2">
                  {isEditingNote ? (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsEditingNote(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={saveNote}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setTempNoteContent(activeNote.content)
                        setTempNoteTitle(activeNote.title)
                        setIsEditingNote(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="p-4 flex gap-2 flex-wrap border-b">
                {activeNoteTags.map(tag => (
                  <span 
                    key={tag.id} 
                    className={`text-xs px-2 py-0.5 rounded-full border ${tag.color} cursor-pointer hover:opacity-80`}
                    onClick={() => toggleTag(tag.id)}
                  >
                    <span>{tag.name}</span>
                    <X className="h-3 w-3 inline ml-1" />
                  </span>
                ))}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      Add Tag
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {appState.tags.map(tag => {
                      const isTagged = activeNote.tagIds.includes(tag.id)
                      
                      return (
                        <DropdownMenuItem 
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                        >
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full ${tag.color.split(" ")[0]}`} />
                            <span className="ml-2">{tag.name}</span>
                            {isTagged && <Check className="ml-2 h-3 w-3" />}
                          </div>
                        </DropdownMenuItem>
                      )
                    })}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsAddingTag(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Create New Tag
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex-1 overflow-auto">
                {isEditingNote ? (
                  <textarea
                    ref={textAreaRef}
                    value={tempNoteContent}
                    onChange={(e) => setTempNoteContent(e.target.value)}
                    className="w-full h-full p-4 resize-none focus:outline-none font-mono text-sm"
                    placeholder="Write your note here..."
                  />
                ) : (
                  <div className="p-4 prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary">
                    {/* This would normally use a Markdown renderer */}
                    <pre className="whitespace-pre-wrap font-sans">{activeNote.content}</pre>
                  </div>
                )}
              </div>
              
              <div className="px-4 py-2 bg-muted/30 border-t">
                <div className="text-xs text-muted-foreground flex justify-between">
                  <div>
                    Last updated: {format(new Date(activeNote.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                  <div>
                    Created: {format(new Date(activeNote.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
      
      {/* Add Folder Dialog */}
      <Dialog open={isAddingFolder} onOpenChange={setIsAddingFolder}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-name">Name</Label>
              <Input
                id="folder-name"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Parent Folder (Optional)</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={newFolderParentId || ""}
                onChange={(e) => setNewFolderParentId(e.target.value || null)}
              >
                <option value="">None (Top Level)</option>
                {appState.folders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetFolderForm}>
              Cancel
            </Button>
            <Button onClick={createFolder}>Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Tag Dialog */}
      <Dialog open={isAddingTag} onOpenChange={setIsAddingTag}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tag-name">Name</Label>
              <Input
                id="tag-name"
                placeholder="Tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="grid grid-cols-8 gap-2">
                {TAG_COLORS.map((color, i) => (
                  <div
                    key={i}
                    className={`h-8 rounded cursor-pointer border ${
                      newTagColor === color 
                        ? "ring-2 ring-primary ring-offset-2" 
                        : ""
                    } ${color}`}
                    onClick={() => setNewTagColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingTag(false)}>
              Cancel
            </Button>
            <Button onClick={createTag}>Create Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Note Dialog */}
      <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Create a new note in {appState.activeFolderId 
                ? `folder: ${appState.folders.find(f => f.id === appState.activeFolderId)?.name}`
                : "your default folder"
              }
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingNote(false)}>
              Cancel
            </Button>
            <Button onClick={createNote}>Create Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {itemToDelete?.type === "note" && "Are you sure you want to delete this note? This action cannot be undone."}
              {itemToDelete?.type === "folder" && "Are you sure you want to delete this folder? All notes will be moved to your default folder."}
              {itemToDelete?.type === "tag" && "Are you sure you want to delete this tag? It will be removed from all notes."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setConfirmDialogOpen(false)
              setItemToDelete(null)
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}