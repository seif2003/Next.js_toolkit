"use client"

import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { tomorrow } from "react-syntax-highlighter/dist/cjs/styles/prism"
import { jsPDF } from "jspdf"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Folder,
  Plus,
  Save,
  Download,
  Tag,
  Search,
  Trash,
  FileDown,
  FilePlus,
} from "lucide-react"

// Interface definitions
interface NoteTag {
  id: string
  name: string
  color: string
}

interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  folderId: string
  tags: string[] // Array of tag IDs
}

interface Folder {
  id: string
  name: string
  createdAt: string
}

interface NotesState {
  notes: Note[]
  folders: Folder[]
  tags: NoteTag[]
  activeNoteId: string | null
  activeFolderId: string | null
}

// Generate a random ID
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

// Get current date-time string
const getCurrentDateTime = (): string => {
  return new Date().toISOString()
}

// Available tag colors
const TAG_COLORS = [
  "bg-red-100 text-red-800",
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-yellow-100 text-yellow-800",
  "bg-purple-100 text-purple-800",
  "bg-pink-100 text-pink-800",
  "bg-indigo-100 text-indigo-800",
  "bg-gray-100 text-gray-800",
]

// Default folder and note
const DEFAULT_FOLDER: Folder = {
  id: "default",
  name: "My Notes",
  createdAt: getCurrentDateTime(),
}

const DEFAULT_NOTE: Note = {
  id: "welcome",
  title: "Welcome to Markdown Notes",
  content: `# Welcome to Markdown Notes! 📝

This is a simple markdown editor where you can:

- Write notes with **markdown** formatting
- Organize notes in folders
- Tag your notes for better organization
- Export notes as PDF or Markdown files
- All notes are saved locally in your browser

## Markdown Examples

### Text Formatting

*This text is in italic*
**This text is bold**

### Lists

1. Ordered item 1
2. Ordered item 2
   - Unordered sub-item

- Unordered item
- Another item

### Code

\`\`\`javascript
// Here's some code
function hello() {
  console.log("Hello world!");
}
\`\`\`

### Quotes

> This is a blockquote.
> It can span multiple lines.

Enjoy writing your notes! ✨
`,
  createdAt: getCurrentDateTime(),
  updatedAt: getCurrentDateTime(),
  folderId: "default",
  tags: [],
}

// Initial state
const INITIAL_STATE: NotesState = {
  notes: [DEFAULT_NOTE],
  folders: [DEFAULT_FOLDER],
  tags: [],
  activeNoteId: "welcome",
  activeFolderId: "default",
}

export default function MarkdownNotesPage() {
  const [notesState, setNotesState] = useState<NotesState>(INITIAL_STATE)
  const [editMode, setEditMode] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // UI state
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [newNoteDialogOpen, setNewNoteDialogOpen] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [newTagDialogOpen, setNewTagDialogOpen] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [selectedTagColor, setSelectedTagColor] = useState(TAG_COLORS[0])
  
  // Active note content
  const activeNote = notesState.notes.find(note => note.id === notesState.activeNoteId) || DEFAULT_NOTE
  const [noteContent, setNoteContent] = useState(activeNote.content)
  const [noteTitle, setNoteTitle] = useState(activeNote.title)
  
  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("markdown_notes_data")
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setNotesState(parsedData)
      } catch (error) {
        console.error("Failed to load notes data:", error)
      }
    }
  }, [])
  
  // Update note content when active note changes
  useEffect(() => {
    if (notesState.activeNoteId) {
      const note = notesState.notes.find(n => n.id === notesState.activeNoteId)
      if (note) {
        setNoteContent(note.content)
        setNoteTitle(note.title)
      }
    }
  }, [notesState.activeNoteId, notesState.notes])
  
  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("markdown_notes_data", JSON.stringify(notesState))
  }, [notesState])
  
  // Create a new folder
  const handleCreateFolder = () => {
    if (newFolderName.trim() === "") return
    
    const newFolder: Folder = {
      id: generateId(),
      name: newFolderName,
      createdAt: getCurrentDateTime(),
    }
    
    setNotesState(prev => ({
      ...prev,
      folders: [...prev.folders, newFolder],
      activeFolderId: newFolder.id,
    }))
    
    setNewFolderName("")
    setNewFolderDialogOpen(false)
  }
  
  // Create a new note
  const handleCreateNote = () => {
    if (newNoteTitle.trim() === "") return
    
    const newNote: Note = {
      id: generateId(),
      title: newNoteTitle,
      content: `# ${newNoteTitle}\n\n`,
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime(),
      folderId: notesState.activeFolderId || "default",
      tags: [],
    }
    
    setNotesState(prev => ({
      ...prev,
      notes: [...prev.notes, newNote],
      activeNoteId: newNote.id,
    }))
    
    setNewNoteTitle("")
    setNewNoteDialogOpen(false)
  }
  
  // Create a new tag
  const handleCreateTag = () => {
    if (newTagName.trim() === "") return
    
    const newTag: NoteTag = {
      id: generateId(),
      name: newTagName,
      color: selectedTagColor,
    }
    
    setNotesState(prev => ({
      ...prev,
      tags: [...prev.tags, newTag],
    }))
    
    setNewTagName("")
    setNewTagDialogOpen(false)
  }
  
  // Save the current note
  const saveNote = () => {
    setNotesState(prev => ({
      ...prev,
      notes: prev.notes.map(note =>
        note.id === notesState.activeNoteId
          ? {
              ...note,
              title: noteTitle,
              content: noteContent,
              updatedAt: getCurrentDateTime(),
            }
          : note
      ),
    }))
  }
  
  // Delete a note
  const deleteNote = (noteId: string) => {
    setNotesState(prev => {
      const filteredNotes = prev.notes.filter(note => note.id !== noteId)
      const newActiveNoteId = prev.activeNoteId === noteId
        ? filteredNotes.length > 0 ? filteredNotes[0].id : null
        : prev.activeNoteId
        
      return {
        ...prev,
        notes: filteredNotes,
        activeNoteId: newActiveNoteId,
      }
    })
  }
  
  // Delete a folder
  const deleteFolder = (folderId: string) => {
    setNotesState(prev => {
      const filteredFolders = prev.folders.filter(folder => folder.id !== folderId)
      
      // If we're deleting the active folder, select another one
      const newActiveFolderId = prev.activeFolderId === folderId
        ? filteredFolders.length > 0 ? filteredFolders[0].id : null
        : prev.activeFolderId
        
      return {
        ...prev,
        folders: filteredFolders,
        activeFolderId: newActiveFolderId,
        // Move notes to default folder
        notes: prev.notes.map(note => 
          note.folderId === folderId
            ? { ...note, folderId: "default" }
            : note
        ),
      }
    })
  }
  
  // Toggle tag on active note
  const toggleNoteTag = (tagId: string) => {
    setNotesState(prev => ({
      ...prev,
      notes: prev.notes.map(note =>
        note.id === notesState.activeNoteId
          ? {
              ...note,
              tags: note.tags.includes(tagId)
                ? note.tags.filter(id => id !== tagId)
                : [...note.tags, tagId],
              updatedAt: getCurrentDateTime(),
            }
          : note
      ),
    }))
  }
  
  // Delete a tag
  const deleteTag = (tagId: string) => {
    setNotesState(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag.id !== tagId),
      // Remove tag from all notes
      notes: prev.notes.map(note => ({
        ...note,
        tags: note.tags.filter(id => id !== tagId),
      })),
    }))
  }
  
  // Export note as markdown file
  const exportAsMarkdown = () => {
    const blob = new Blob([noteContent], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${noteTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  // Export note as PDF
  const exportAsPDF = () => {
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(24)
    doc.text(noteTitle, 20, 20)
    
    // Add content (very basic, just text)
    doc.setFontSize(12)
    const contentLines = noteContent.split("\n")
    let y = 30
    
    contentLines.forEach(line => {
      if (line.startsWith("# ")) {
        doc.setFontSize(20)
        doc.text(line.substring(2), 20, y)
        doc.setFontSize(12)
      } else if (line.startsWith("## ")) {
        doc.setFontSize(16)
        doc.text(line.substring(3), 20, y)
        doc.setFontSize(12)
      } else if (line.startsWith("### ")) {
        doc.setFontSize(14)
        doc.text(line.substring(4), 20, y)
        doc.setFontSize(12)
      } else {
        doc.text(line, 20, y)
      }
      y += 7
      
      // Add new page if content exceeds page height
      if (y > 280) {
        doc.addPage()
        y = 20
      }
    })
    
    doc.save(`${noteTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`)
  }
  
  // Filter notes based on search term and active folder
  const filteredNotes = notesState.notes.filter(note => {
    const matchesSearch = searchTerm === "" || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
      
    const matchesFolder = notesState.activeFolderId === null || 
      note.folderId === notesState.activeFolderId
    
    return matchesSearch && matchesFolder
  })
  
  // Get tags for current note
  const activeNoteTags = notesState.tags.filter(tag => 
    activeNote.tags.includes(tag.id)
  )
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Markdown Notes</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => saveNote()}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={exportAsMarkdown}>
            <Download className="h-4 w-4 mr-2" />
            .md
          </Button>
          <Button variant="outline" size="sm" onClick={exportAsPDF}>
            <FileDown className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
        {/* Sidebar */}
        <div className="md:col-span-1 border rounded-lg p-4 overflow-auto space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-medium">Folders</h2>
            <Button variant="ghost" size="sm" onClick={() => setNewFolderDialogOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-1">
            {notesState.folders.map(folder => (
              <div 
                key={folder.id}
                className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${
                  folder.id === notesState.activeFolderId
                    ? "bg-blue-100 text-blue-800"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setNotesState(prev => ({ ...prev, activeFolderId: folder.id }))}
              >
                <div className="flex items-center space-x-2">
                  <Folder className="h-4 w-4" />
                  <span className="truncate">{folder.name}</span>
                </div>
                {folder.id !== "default" && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-60 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFolder(folder.id);
                    }}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <h2 className="font-medium">Tags</h2>
            <Button variant="ghost" size="sm" onClick={() => setNewTagDialogOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-1">
            {notesState.tags.map(tag => (
              <div 
                key={tag.id}
                className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-100"
              >
                <div 
                  className={`flex items-center px-2 py-0.5 rounded text-sm ${tag.color}`}
                  onClick={() => {
                    if (notesState.activeNoteId) {
                      toggleNoteTag(tag.id)
                    }
                  }}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  <span>{tag.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-60 hover:opacity-100"
                  onClick={() => deleteTag(tag.id)}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="pt-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="pt-2">
            <Button 
              onClick={() => setNewNoteDialogOpen(true)} 
              className="w-full"
              disabled={!notesState.activeFolderId}
            >
              <FilePlus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>
        
        {/* Notes List */}
        <div className="md:col-span-3 flex flex-col h-full">
          {/* Notes header */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">
              {notesState.activeFolderId ? 
                `Notes in ${notesState.folders.find(f => f.id === notesState.activeFolderId)?.name}` : 
                "All Notes"}
            </h2>
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditMode(!editMode)}
                className={editMode ? "bg-gray-100" : ""}
              >
                {editMode ? "Preview Mode" : "Edit Mode"}
              </Button>
            </div>
          </div>
          
          {/* Notes grid */}
          <div className="grid gap-4 mb-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredNotes.length > 0 ? (
              filteredNotes.map(note => (
                <Card
                  key={note.id}
                  className={`cursor-pointer overflow-hidden transition-shadow hover:shadow-md ${
                    note.id === notesState.activeNoteId ? "border-blue-500 border-2" : ""
                  }`}
                  onClick={() => setNotesState(prev => ({ ...prev, activeNoteId: note.id }))}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium truncate">{note.title}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-60 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {note.content.replace(/[#*`]/g, "").substring(0, 100)}...
                    </p>
                    <div className="mt-2 flex gap-1">
                      {notesState.tags
                        .filter(tag => note.tags.includes(tag.id))
                        .map(tag => (
                          <span
                            key={tag.id}
                            className={`text-xs px-2 py-0.5 rounded-full ${tag.color}`}
                          >
                            {tag.name}
                          </span>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {searchTerm ? (
                  <p>No notes match your search.</p>
                ) : (
                  <p>No notes in this folder. Create one to get started!</p>
                )}
              </div>
            )}
          </div>
          
          {/* Editor/Preview */}
          {notesState.activeNoteId && (
            <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
              <div className="border-b p-2 flex items-center">
                <Input
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="border-0 text-lg font-medium focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
                  placeholder="Note Title"
                />
                <div className="flex gap-1 ml-2 flex-wrap">
                  {activeNoteTags.map(tag => (
                    <span
                      key={tag.id}
                      className={`text-xs px-2 py-0.5 rounded-full flex items-center ${tag.color}`}
                    >
                      {tag.name}
                      <button
                        className="ml-1 opacity-60 hover:opacity-100"
                        onClick={() => toggleNoteTag(tag.id)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              {editMode ? (
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="flex-1 p-4 resize-none focus-visible:ring-0 focus-visible:outline-none font-mono"
                  placeholder="Write your markdown note here..."
                />
              ) : (
                <div className="flex-1 overflow-auto p-6 prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      code({inline, className, children, ...props}: React.HTMLAttributes<HTMLElement> & {inline?: boolean}) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={tomorrow as any}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {noteContent}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Create Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Note Dialog */}
      <Dialog open={newNoteDialogOpen} onOpenChange={setNewNoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Note title"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNote}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Tag Dialog */}
      <Dialog open={newTagDialogOpen} onOpenChange={setNewTagDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="w-full"
              />
            </div>
            <div>
              <div className="mb-2">Tag color:</div>
              <div className="grid grid-cols-4 gap-2">
                {TAG_COLORS.map((color, index) => (
                  <button
                    key={index}
                    className={`w-full h-8 rounded-md ${color} ${
                      selectedTagColor === color ? "ring-2 ring-offset-2 ring-blue-500" : ""
                    }`}
                    onClick={() => setSelectedTagColor(color)}
                  ></button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTag}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}