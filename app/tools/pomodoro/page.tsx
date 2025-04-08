"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, RotateCcw, Coffee, Brain, Settings } from "lucide-react"

type PomodoroState = "work" | "break" | "longBreak"
type TimerStatus = "idle" | "running" | "paused"

export default function PomodoroPage() {
  // Timer settings (in minutes)
  const [workDuration, setWorkDuration] = useState<number>(25)
  const [breakDuration, setBreakDuration] = useState<number>(5)
  const [longBreakDuration, setLongBreakDuration] = useState<number>(15)
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState<number>(4)
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(workDuration * 60)
  const [status, setStatus] = useState<TimerStatus>("idle")
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>("work")
  const [completedSessions, setCompletedSessions] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<string>("timer")
  const [volume, setVolume] = useState<number>(80)
  
  // Calculate progress percentage
  const getCurrentDuration = (): number => {
    switch (pomodoroState) {
      case "work":
        return workDuration * 60
      case "break":
        return breakDuration * 60
      case "longBreak":
        return longBreakDuration * 60
    }
  }
  
  const progress = Math.floor((1 - timeLeft / getCurrentDuration()) * 100)
  
  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (status === "running") {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Play notification sound
            const audio = new Audio("/notification.mp3")
            audio.volume = volume / 100
            audio.play().catch(err => console.error("Failed to play sound:", err))
            
            // Handle timer completion
            if (pomodoroState === "work") {
              const newCompletedSessions = completedSessions + 1
              setCompletedSessions(newCompletedSessions)
              
              if (newCompletedSessions % sessionsBeforeLongBreak === 0) {
                // Time for a long break
                setPomodoroState("longBreak")
                return longBreakDuration * 60
              } else {
                // Time for a regular break
                setPomodoroState("break")
                return breakDuration * 60
              }
            } else {
              // Break is over, back to work
              setPomodoroState("work")
              return workDuration * 60
            }
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [status, pomodoroState, workDuration, breakDuration, longBreakDuration, completedSessions, sessionsBeforeLongBreak, volume])

  // Start, pause and reset functions
  const startTimer = () => setStatus("running")
  const pauseTimer = () => setStatus("paused")
  const resetTimer = () => {
    setStatus("idle")
    setPomodoroState("work")
    setTimeLeft(workDuration * 60)
    setCompletedSessions(0)
  }
  
  // Handle settings changes
  useEffect(() => {
    if (status === "idle") {
      if (pomodoroState === "work") {
        setTimeLeft(workDuration * 60)
      } else if (pomodoroState === "break") {
        setTimeLeft(breakDuration * 60)
      } else {
        setTimeLeft(longBreakDuration * 60)
      }
    }
  }, [workDuration, breakDuration, longBreakDuration, status, pomodoroState])
  
  // Skip to next phase
  const skipToNext = () => {
    if (pomodoroState === "work") {
      const newCompletedSessions = completedSessions + 1
      setCompletedSessions(newCompletedSessions)
      
      if (newCompletedSessions % sessionsBeforeLongBreak === 0) {
        setPomodoroState("longBreak")
        setTimeLeft(longBreakDuration * 60)
      } else {
        setPomodoroState("break")
        setTimeLeft(breakDuration * 60)
      }
    } else {
      setPomodoroState("work")
      setTimeLeft(workDuration * 60)
    }
    
    if (status === "running") {
      setStatus("running") // Keep the timer running
    } else {
      setStatus("idle") // Keep the timer idle
    }
  }
  
  // Get the color and label based on current pomodoro state
  const getStateInfo = () => {
    switch (pomodoroState) {
      case "work":
        return {
          color: "bg-red-500",
          lightColor: "bg-red-100 dark:bg-red-950/30",
          textColor: "text-red-500",
          label: "Focus Time",
          icon: <Brain className="h-5 w-5 mr-2" />
        }
      case "break":
        return {
          color: "bg-green-500",
          lightColor: "bg-green-100 dark:bg-green-950/30",
          textColor: "text-green-500",
          label: "Short Break",
          icon: <Coffee className="h-5 w-5 mr-2" />
        }
      case "longBreak":
        return {
          color: "bg-blue-500",
          lightColor: "bg-blue-100 dark:bg-blue-950/30",
          textColor: "text-blue-500",
          label: "Long Break",
          icon: <Coffee className="h-5 w-5 mr-2" />
        }
    }
  }
  
  const stateInfo = getStateInfo()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pomodoro Timer</h1>
        <p className="text-muted-foreground">
          Boost productivity with the Pomodoro Technique - work in focused intervals with strategic breaks
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timer">Timer</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timer" className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-8">
                {/* Timer State Indicator */}
                <div className={`px-4 py-2 rounded-full flex items-center ${stateInfo.lightColor} ${stateInfo.textColor}`}>
                  {stateInfo.icon}
                  <span className="font-medium">{stateInfo.label}</span>
                </div>
                
                {/* Timer Display */}
                <div className="relative w-64 h-64">
                  {/* Progress Circle */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted/20"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray="283"
                      strokeDashoffset={283 - (283 * progress) / 100}
                      className={stateInfo.textColor}
                      strokeLinecap="round"
                    />
                  </svg>
                  
                  {/* Timer Text */}
                  <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                    <span className="text-5xl font-semibold">{formatTime(timeLeft)}</span>
                    <span className="text-sm text-muted-foreground mt-2">
                      Session {completedSessions + 1} {pomodoroState !== "work" ? "- Break" : ""}
                    </span>
                  </div>
                </div>
                
                {/* Timer Controls */}
                <div className="flex gap-3">
                  {status === "running" ? (
                    <Button onClick={pauseTimer} className="w-36" variant="outline">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  ) : (
                    <Button onClick={startTimer} className="w-36">
                      <Play className="h-4 w-4 mr-2" />
                      {status === "paused" ? "Resume" : "Start"}
                    </Button>
                  )}
                  
                  <Button onClick={resetTimer} variant="ghost">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  
                  <Button onClick={skipToNext} variant="ghost">
                    {pomodoroState === "work" ? (
                      <Coffee className="h-4 w-4" />
                    ) : (
                      <Brain className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Session Progress */}
              <div className="mt-6">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Sessions</span>
                  <span>{completedSessions}/{sessionsBeforeLongBreak}</span>
                </div>
                <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary"
                    style={{ width: `${(completedSessions / sessionsBeforeLongBreak) * 100}%` }}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Focus Duration: {workDuration} minutes</Label>
                  </div>
                  <Slider 
                    value={[workDuration]} 
                    min={1} 
                    max={60} 
                    step={1} 
                    onValueChange={(value) => setWorkDuration(value[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Short Break: {breakDuration} minutes</Label>
                  </div>
                  <Slider 
                    value={[breakDuration]} 
                    min={1} 
                    max={30} 
                    step={1} 
                    onValueChange={(value) => setBreakDuration(value[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Long Break: {longBreakDuration} minutes</Label>
                  </div>
                  <Slider 
                    value={[longBreakDuration]} 
                    min={1} 
                    max={60} 
                    step={1} 
                    onValueChange={(value) => setLongBreakDuration(value[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Sessions before long break: {sessionsBeforeLongBreak}</Label>
                  </div>
                  <Slider 
                    value={[sessionsBeforeLongBreak]} 
                    min={1} 
                    max={10} 
                    step={1} 
                    onValueChange={(value) => setSessionsBeforeLongBreak(value[0])} 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Notification Volume: {volume}%</Label>
                  </div>
                  <Slider 
                    value={[volume]} 
                    min={0} 
                    max={100} 
                    step={5} 
                    onValueChange={(value) => setVolume(value[0])} 
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-semibold mb-3">What is the Pomodoro Technique?</h3>
          <p className="text-sm text-muted-foreground">
            The Pomodoro Technique is a time management method that uses a timer to break work into intervals, 
            traditionally 25 minutes in length, separated by short breaks. These intervals are called "pomodoros".
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Work for 25 minutes with full focus</li>
            <li>Take a 5-minute break</li>
            <li>After 4 pomodoros, take a longer break (15-30 minutes)</li>
            <li>Repeat the cycle</li>
          </ul>
        </Card>
        
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Benefits</h3>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Improves focus and concentration</li>
            <li>Reduces mental fatigue</li>
            <li>Increases awareness of time</li>
            <li>Enhances productivity and work quality</li>
            <li>Creates a sense of accomplishment</li>
            <li>Helps manage distractions and interruptions</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}