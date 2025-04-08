"use client"

import React, { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd"

// Emoji sticker options for mood tracking
const STICKERS = [
  { id: "happy", emoji: "😀", label: "Happy" },
  { id: "cool", emoji: "😎", label: "Cool" },
  { id: "love", emoji: "❤️", label: "Love" },
  { id: "party", emoji: "🎉", label: "Party" },
  { id: "sleepy", emoji: "😴", label: "Sleepy" },
  { id: "star", emoji: "⭐", label: "Star" },
  { id: "angry", emoji: "😡", label: "Angry" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "fire", emoji: "🔥", label: "Fire" },
  { id: "music", emoji: "🎵", label: "Music" },
  { id: "pizza", emoji: "🍕", label: "Pizza" },
  { id: "poop", emoji: "💩", label: "Poop" },
]

// Interface definitions
interface Task {
  id: string
  content: string
  completed: boolean
}

interface DayData {
  date: string
  tasks: Task[]
  sticker?: string
  notes?: string
}

interface WeekData {
  startDate: string
  days: { [key: string]: DayData }
}

interface TaskDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (task: string) => void
  task?: string
  dialogTitle?: string
}

interface StickerSelectorProps {
  selectedSticker?: string
  onSelectSticker: (stickerId: string) => void
}

// Get the Monday of the current week
const getMonday = (d: Date): Date => {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

// Format date to YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0]
}

// Get an array of dates for the week
const getWeekDates = (startDate: Date): Date[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    return date
  })
}

// Get a readable format of the date
const getReadableDateFormat = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

// Generate a random ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9)
}

// Task Dialog Component
const TaskDialog = ({ isOpen, onClose, onSave, task = "", dialogTitle = "Add New Task" }: TaskDialogProps) => {
  const [taskInput, setTaskInput] = useState(task)

  useEffect(() => {
    setTaskInput(task)
  }, [task])

  const handleSave = () => {
    if (taskInput.trim()) {
      onSave(taskInput)
      setTaskInput("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="Enter your task..."
            className="w-full"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Sticker Selector Component
const StickerSelector = ({ selectedSticker, onSelectSticker }: StickerSelectorProps) => {
  return (
    <div className="mt-2 grid grid-cols-6 gap-1">
      {STICKERS.map((sticker) => (
        <button
          key={sticker.id}
          className={`text-2xl p-1 rounded-md ${
            selectedSticker === sticker.id
              ? "bg-primary/10 border border-primary"
              : "hover:bg-muted"
          }`}
          onClick={() => onSelectSticker(sticker.id)}
          title={sticker.label}
        >
          {sticker.emoji}
        </button>
      ))}
    </div>
  )
}

export default function RetroCalendarPage() {
  const [currentWeek, setCurrentWeek] = useState<WeekData>({
    startDate: formatDate(getMonday(new Date())),
    days: {},
  })
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [currentDay, setCurrentDay] = useState<string>("")
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("retro_calendar_data")
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setCurrentWeek(parsedData)
      } catch (error) {
        console.error("Failed to load calendar data:", error)
      }
    } else {
      // Initialize the week data if none exists
      initializeWeekData()
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("retro_calendar_data", JSON.stringify(currentWeek))
  }, [currentWeek])

  // Initialize week data with empty tasks for each day
  const initializeWeekData = () => {
    const monday = getMonday(new Date())
    const weekDates = getWeekDates(monday)
    
    const days: { [key: string]: DayData } = {}
    weekDates.forEach((date) => {
      const dateKey = formatDate(date)
      days[dateKey] = {
        date: dateKey,
        tasks: [],
      }
    })

    setCurrentWeek({
      startDate: formatDate(monday),
      days,
    })
  }

  // Navigate to previous week
  const goToPrevWeek = () => {
    const prevMonday = new Date(currentWeek.startDate)
    prevMonday.setDate(prevMonday.getDate() - 7)
    
    const newStartDate = formatDate(prevMonday)
    const weekDates = getWeekDates(prevMonday)
    
    const days: { [key: string]: DayData } = { ...currentWeek.days }
    weekDates.forEach((date) => {
      const dateKey = formatDate(date)
      if (!days[dateKey]) {
        days[dateKey] = {
          date: dateKey,
          tasks: [],
        }
      }
    })

    setCurrentWeek({
      startDate: newStartDate,
      days,
    })
  }

  // Navigate to next week
  const goToNextWeek = () => {
    const nextMonday = new Date(currentWeek.startDate)
    nextMonday.setDate(nextMonday.getDate() + 7)
    
    const newStartDate = formatDate(nextMonday)
    const weekDates = getWeekDates(nextMonday)
    
    const days: { [key: string]: DayData } = { ...currentWeek.days }
    weekDates.forEach((date) => {
      const dateKey = formatDate(date)
      if (!days[dateKey]) {
        days[dateKey] = {
          date: dateKey,
          tasks: [],
        }
      }
    })

    setCurrentWeek({
      startDate: newStartDate,
      days,
    })
  }

  // Go to current week
  const goToCurrentWeek = () => {
    const today = new Date()
    const monday = getMonday(today)
    
    const newStartDate = formatDate(monday)
    const weekDates = getWeekDates(monday)
    
    const days: { [key: string]: DayData } = { ...currentWeek.days }
    weekDates.forEach((date) => {
      const dateKey = formatDate(date)
      if (!days[dateKey]) {
        days[dateKey] = {
          date: dateKey,
          tasks: [],
        }
      }
    })

    setCurrentWeek({
      startDate: newStartDate,
      days,
    })
  }

  // Open task dialog for a specific day
  const openAddTaskDialog = (date: string) => {
    setCurrentDay(date)
    setEditingTask(null)
    setTaskDialogOpen(true)
  }

  // Open task dialog to edit a task
  const openEditTaskDialog = (date: string, task: Task) => {
    setCurrentDay(date)
    setEditingTask(task)
    setTaskDialogOpen(true)
  }

  // Add or update task
  const handleSaveTask = (taskContent: string) => {
    if (!currentDay) return

    const updatedWeek = { ...currentWeek }
    if (!updatedWeek.days[currentDay]) {
      updatedWeek.days[currentDay] = {
        date: currentDay,
        tasks: [],
      }
    }

    if (editingTask) {
      // Update existing task
      updatedWeek.days[currentDay].tasks = updatedWeek.days[currentDay].tasks.map((task) =>
        task.id === editingTask.id ? { ...task, content: taskContent } : task
      )
    } else {
      // Add new task
      updatedWeek.days[currentDay].tasks.push({
        id: generateId(),
        content: taskContent,
        completed: false,
      })
    }

    setCurrentWeek(updatedWeek)
  }

  // Toggle task completion
  const toggleTaskCompletion = (date: string, taskId: string) => {
    const updatedWeek = { ...currentWeek }
    
    if (updatedWeek.days[date]) {
      updatedWeek.days[date].tasks = updatedWeek.days[date].tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
      setCurrentWeek(updatedWeek)
    }
  }

  // Delete task
  const deleteTask = (date: string, taskId: string) => {
    const updatedWeek = { ...currentWeek }
    
    if (updatedWeek.days[date]) {
      updatedWeek.days[date].tasks = updatedWeek.days[date].tasks.filter(
        (task) => task.id !== taskId
      )
      setCurrentWeek(updatedWeek)
    }
  }

  // Set sticker for a day
  const setDaySticker = (date: string, stickerId: string) => {
    const updatedWeek = { ...currentWeek }
    
    if (!updatedWeek.days[date]) {
      updatedWeek.days[date] = {
        date,
        tasks: [],
      }
    }
    
    updatedWeek.days[date].sticker = stickerId
    setCurrentWeek(updatedWeek)
  }

  // Save notes for a day
  const saveDayNotes = (date: string, notes: string) => {
    const updatedWeek = { ...currentWeek }
    
    if (!updatedWeek.days[date]) {
      updatedWeek.days[date] = {
        date,
        tasks: [],
      }
    }
    
    updatedWeek.days[date].notes = notes
    setCurrentWeek(updatedWeek)
  }

  // Handle drag and drop of tasks
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const { source, destination } = result
    const sourceDate = source.droppableId
    const destDate = destination.droppableId

    // Clone the current week data
    const updatedWeek = { ...currentWeek }
    
    // Get the task that was dragged
    const sourceDay = updatedWeek.days[sourceDate]
    const [movedTask] = sourceDay.tasks.splice(source.index, 1)
    
    // Add the task to the destination day
    const destDay = updatedWeek.days[destDate]
    destDay.tasks.splice(destination.index, 0, movedTask)
    
    setCurrentWeek(updatedWeek)
  }

  // Get the dates for the current week
  const weekDates = getWeekDates(new Date(currentWeek.startDate))
  const today = formatDate(new Date())

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Planner</h1>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={goToPrevWeek}
            variant="outline"
            size="sm"
          >
            ◄ Prev Week
          </Button>
          <Button 
            onClick={goToCurrentWeek}
            variant="default"
            size="sm"
          >
            Today
          </Button>
          <Button 
            onClick={goToNextWeek}
            variant="outline"
            size="sm"
          >
            Next Week ►
          </Button>
        </div>
      </div>

      <Card className="border shadow-sm">
        <div className="border-b p-3">
          <h2 className="text-lg font-semibold text-center">
            Week of {new Date(currentWeek.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </h2>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4">
            {weekDates.map((date) => {
              const dateKey = formatDate(date)
              const dayData = currentWeek.days[dateKey] || { date: dateKey, tasks: [] }
              const isToday = dateKey === today
              const sticker = dayData.sticker ? STICKERS.find(s => s.id === dayData.sticker) : null

              return (
                <div 
                  key={dateKey} 
                  className={`border rounded-lg ${isToday ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
                >
                  <div className={`text-center py-2 mb-1 ${isToday ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-foreground'} rounded-t-md`}>
                    {getReadableDateFormat(dateKey)}
                    {sticker && (
                      <div className="text-2xl mt-1">{sticker.emoji}</div>
                    )}
                  </div>

                  <Tabs defaultValue="tasks" className="w-full px-2 pb-2">
                    <TabsList className="w-full grid grid-cols-3 mb-2 h-8">
                      <TabsTrigger 
                        value="tasks" 
                        className="text-xs"
                      >
                        Tasks
                      </TabsTrigger>
                      <TabsTrigger 
                        value="stickers" 
                        className="text-xs"
                      >
                        Mood
                      </TabsTrigger>
                      <TabsTrigger 
                        value="notes" 
                        className="text-xs"
                      >
                        Notes
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="tasks" className="mt-0">
                      <Droppable droppableId={dateKey} isDropDisabled={false}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="space-y-2 min-h-[150px]"
                          >
                            {dayData.tasks.length === 0 ? (
                              <div className="text-center text-muted-foreground py-4 text-sm">
                                No tasks yet
                              </div>
                            ) : (
                              dayData.tasks.map((task, index) => (
                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`p-2 rounded-md bg-card border text-sm flex justify-between items-center ${task.completed ? 'line-through opacity-70' : ''}`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={task.completed}
                                          onChange={() => toggleTaskCompletion(dateKey, task.id)}
                                          className="w-3 h-3"
                                        />
                                        <span className="truncate text-sm">{task.content}</span>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          onClick={() => openEditTaskDialog(dateKey, task)}
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                        >
                                          ✎
                                        </Button>
                                        <Button
                                          onClick={() => deleteTask(dateKey, task.id)}
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-destructive"
                                        >
                                          ×
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                      <Button
                        onClick={() => openAddTaskDialog(dateKey)}
                        variant="secondary"
                        size="sm"
                        className="w-full mt-2 text-xs"
                      >
                        Add Task
                      </Button>
                    </TabsContent>

                    <TabsContent value="stickers" className="mt-0">
                      <StickerSelector 
                        selectedSticker={dayData.sticker}
                        onSelectSticker={(stickerId) => setDaySticker(dateKey, stickerId)}
                      />
                    </TabsContent>

                    <TabsContent value="notes" className="mt-0">
                      <textarea
                        value={dayData.notes || ""}
                        onChange={(e) => saveDayNotes(dateKey, e.target.value)}
                        className="w-full h-24 p-2 text-xs border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Add your notes for the day..."
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      </Card>

      <TaskDialog
        isOpen={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
        onSave={handleSaveTask}
        task={editingTask ? editingTask.content : ""}
        dialogTitle={editingTask ? "Edit Task" : "Add New Task"}
      />
    </div>
  )
}