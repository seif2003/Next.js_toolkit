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

// Import shared meeting storage key from Timezone Buddy
const SHARED_MEETING_STORAGE_KEY = "timezone_buddy_meetings"

// Interface for Timezone Buddy shared meetings
interface TimezoneBuddyMeeting {
  id: string
  title: string
  date: string
  time: string
  cities: {
    name: string
    timezone: string
    localTime: string
  }[]
}

// Interface definitions
interface Task {
  id: string
  content: string
  completed: boolean
  isMeeting?: boolean
  meetingTime?: string
  meetingDetails?: string  // For storing detailed meeting information
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
  onSave: (task: string, isMeeting?: boolean, meetingTime?: string) => void
  task?: string
  dialogTitle?: string
  isMeeting?: boolean
  meetingTime?: string
}

interface StickerSelectorProps {
  selectedSticker?: string
  onSelectSticker: (stickerId: string) => void
}

// Add Meeting Import Dialog interface
interface MeetingImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onImport: (meeting: TimezoneBuddyMeeting, dateKey: string) => void
  availableMeetings: TimezoneBuddyMeeting[]
  currentWeekDates: Date[]
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
const TaskDialog = ({ isOpen, onClose, onSave, task = "", dialogTitle = "Add New Task", isMeeting = false, meetingTime = "" }: TaskDialogProps) => {
  const [taskInput, setTaskInput] = useState(task)
  const [isMeetingInput, setIsMeetingInput] = useState(isMeeting)
  const [meetingTimeInput, setMeetingTimeInput] = useState(meetingTime)

  useEffect(() => {
    setTaskInput(task)
    setIsMeetingInput(isMeeting)
    setMeetingTimeInput(meetingTime)
  }, [task, isMeeting, meetingTime])

  const handleSave = () => {
    if (taskInput.trim()) {
      onSave(taskInput, isMeetingInput, meetingTimeInput)
      setTaskInput("")
      setIsMeetingInput(false)
      setMeetingTimeInput("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Input
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="Enter your task..."
            className="w-full"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isMeetingInput}
              onChange={(e) => setIsMeetingInput(e.target.checked)}
            />
            <span>Is this a meeting?</span>
          </div>
          {isMeetingInput && (
            <Input
              value={meetingTimeInput}
              onChange={(e) => setMeetingTimeInput(e.target.value)}
              placeholder="Enter meeting time..."
              className="w-full"
            />
          )}
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

// Meeting Import Dialog Component
const MeetingImportDialog = ({ isOpen, onClose, onImport, availableMeetings, currentWeekDates }: MeetingImportDialogProps) => {
  const [selectedMeeting, setSelectedMeeting] = useState<TimezoneBuddyMeeting | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")

  const handleImport = () => {
    if (selectedMeeting && selectedDate) {
      onImport(selectedMeeting, selectedDate)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Meetings from Timezone Buddy</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {availableMeetings.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No meetings available from Timezone Buddy
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select a Meeting</label>
                <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-md p-2">
                  {availableMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className={`p-3 border rounded-md cursor-pointer ${
                        selectedMeeting?.id === meeting.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedMeeting(meeting)}
                    >
                      <div className="font-medium">Meeting on {new Date(meeting.date).toLocaleDateString()}</div>
                      <div className="text-sm text-muted-foreground">Time: {meeting.time}</div>
                      <div className="text-sm">
                        {meeting.cities.map((city) => city.name).join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Add to Calendar Date</label>
                <select 
                  className="w-full border rounded-md p-2"
                  onChange={(e) => setSelectedDate(e.target.value)}
                  value={selectedDate}
                >
                  <option value="">Select a date</option>
                  {currentWeekDates.map((date) => (
                    <option key={formatDate(date)} value={formatDate(date)}>
                      {getReadableDateFormat(formatDate(date))}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!selectedMeeting || !selectedDate}>
            Import Meeting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RetroCalendarPage() {
  const [currentWeek, setCurrentWeek] = useState<WeekData>({
    startDate: formatDate(getMonday(new Date())),
    days: {},
  })
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [currentDay, setCurrentDay] = useState<string>("")
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [meetingImportDialogOpen, setMeetingImportDialogOpen] = useState(false)
  const [timezoneBuddyMeetings, setTimezoneBuddyMeetings] = useState<TimezoneBuddyMeeting[]>([])

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

    // Load meetings from Timezone Buddy
    loadTimezoneBuddyMeetings()
  }, [])

  // Load meetings from Timezone Buddy
  const loadTimezoneBuddyMeetings = () => {
    try {
      const meetingsData = localStorage.getItem(SHARED_MEETING_STORAGE_KEY)
      if (meetingsData) {
        const meetings = JSON.parse(meetingsData)
        setTimezoneBuddyMeetings(meetings)
      }
    } catch (error) {
      console.error("Failed to load Timezone Buddy meetings:", error)
    }
  }

  // Check for new meetings from Timezone Buddy periodically
  useEffect(() => {
    const checkForNewMeetings = () => {
      loadTimezoneBuddyMeetings()
    }

    // Check for new meetings every 30 seconds
    const intervalId = setInterval(checkForNewMeetings, 30000)
    
    return () => clearInterval(intervalId)
  }, [])

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

  // Open meeting import dialog
  const openMeetingImportDialog = () => {
    setMeetingImportDialogOpen(true)
  }

  // Add or update task
  const handleSaveTask = (taskContent: string, isMeeting?: boolean, meetingTime?: string) => {
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
        task.id === editingTask.id ? { ...task, content: taskContent, isMeeting, meetingTime } : task
      )
    } else {
      // Add new task
      updatedWeek.days[currentDay].tasks.push({
        id: generateId(),
        content: taskContent,
        completed: false,
        isMeeting,
        meetingTime,
      })
    }

    setCurrentWeek(updatedWeek)
  }

  // Import meeting from Timezone Buddy
  const importMeeting = (meeting: TimezoneBuddyMeeting, dateKey: string) => {
    const updatedWeek = { ...currentWeek }
    
    if (!updatedWeek.days[dateKey]) {
      updatedWeek.days[dateKey] = {
        date: dateKey,
        tasks: [],
      }
    }
    
    // Format meeting details for task
    const mainCity = meeting.cities[0]
    const otherCities = meeting.cities.slice(1)
    
    let meetingContent = `Meeting: ${meeting.title || 'Timezone Buddy Meeting'}`
    const meetingTime = meeting.time
    
    // Create detailed meeting information for the task
    let meetingDetails = `Meeting time: ${mainCity.name} ${meeting.time}\n`
    if (otherCities.length > 0) {
      meetingDetails += "Other locations:\n"
      otherCities.forEach(city => {
        meetingDetails += `- ${city.name}: ${city.localTime.split(', ')[2] || city.localTime}\n`
      })
    }
    
    // Add the meeting as a task
    updatedWeek.days[dateKey].tasks.push({
      id: generateId(),
      content: meetingContent,
      completed: false,
      isMeeting: true,
      meetingTime: meetingTime,
      meetingDetails: meetingDetails.trim()
    })
    
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

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("retro_calendar_data", JSON.stringify(currentWeek))
  }, [currentWeek])

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
          <Button 
            onClick={openMeetingImportDialog}
            variant="secondary"
            size="sm"
          >
            Import Meetings
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
          <div className="grid grid-cols-1 md:grid-cols-7 gap-6 p-6">
            {weekDates.map((date) => {
              const dateKey = formatDate(date)
              const dayData = currentWeek.days[dateKey] || { date: dateKey, tasks: [] }
              const isToday = dateKey === today
              const sticker = dayData.sticker ? STICKERS.find(s => s.id === dayData.sticker) : null
              const meetingCount = dayData.tasks.filter(t => t.isMeeting).length

              return (
                <div 
                  key={dateKey} 
                  className={`border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ${
                    isToday ? 'border-primary ring-1 ring-primary' : 'border-border'
                  }`}
                >
                  <div 
                    className={`text-center py-3 px-2 ${
                      isToday ? 'bg-primary/10 text-primary font-semibold' : 'bg-muted/50 text-foreground'
                    } rounded-t-md flex flex-col items-center`}
                  >
                    <div className="text-base font-medium">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className="text-2xl font-bold">{date.getDate()}</div>
                    <div className="text-xs opacity-80">{date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                    {sticker && (
                      <div className="text-3xl mt-1">{sticker.emoji}</div>
                    )}
                    {meetingCount > 0 && (
                      <div className="mt-1 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                        {meetingCount} {meetingCount === 1 ? 'Meeting' : 'Meetings'}
                      </div>
                    )}
                  </div>

                  <Tabs defaultValue="tasks" className="w-full px-3 py-3">
                    <TabsList className="w-full grid grid-cols-3 mb-3">
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
                            className="space-y-3 min-h-[220px] max-h-[300px] overflow-y-auto pr-1 styled-scrollbar"
                          >
                            {dayData.tasks.length === 0 ? (
                              <div className="text-center text-muted-foreground py-8 text-sm flex flex-col items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-20 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span>No tasks yet</span>
                                <span className="text-xs mt-1 opacity-60">Click Add Task to begin</span>
                              </div>
                            ) : (
                              dayData.tasks.map((task, index) => (
                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`p-3 rounded-md bg-card border shadow-sm hover:border-primary/30 transition-colors
                                        ${task.completed ? 'bg-muted/30' : task.isMeeting ? 'bg-blue-50 dark:bg-blue-950/30' : ''}
                                        ${task.completed ? 'line-through opacity-70' : ''}`}
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <input
                                          type="checkbox"
                                          checked={task.completed}
                                          onChange={() => toggleTaskCompletion(dateKey, task.id)}
                                          className="w-4 h-4 rounded-sm"
                                        />
                                        <span className={`truncate text-sm font-medium ${task.isMeeting ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                                          {task.content}
                                        </span>
                                      </div>
                                      
                                      {task.isMeeting && task.meetingTime && (
                                        <div className="ml-6 text-xs space-y-1 mt-1">
                                          <div className="flex items-center text-muted-foreground">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {task.meetingTime}
                                          </div>
                                          {task.meetingDetails && (
                                            <div className="text-xs text-muted-foreground whitespace-pre-line ml-4">
                                              {task.meetingDetails}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      
                                      <div className="flex gap-1 justify-end mt-2">
                                        <Button
                                          onClick={() => openEditTaskDialog(dateKey, task)}
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 rounded-full hover:bg-muted"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                        </Button>
                                        <Button
                                          onClick={() => deleteTask(dateKey, task.id)}
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 rounded-full hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
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
                        className="w-full mt-3 text-xs flex items-center justify-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
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
                        className="w-full h-[220px] p-3 text-sm border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-primary"
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
        isMeeting={editingTask ? editingTask.isMeeting : false}
        meetingTime={editingTask ? editingTask.meetingTime : ""}
      />

      <MeetingImportDialog
        isOpen={meetingImportDialogOpen}
        onClose={() => setMeetingImportDialogOpen(false)}
        onImport={importMeeting}
        availableMeetings={timezoneBuddyMeetings}
        currentWeekDates={weekDates}
      />
    </div>
  )
}