"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Play, Pause, RotateCcw, Timer, Flag, TrashIcon } from "lucide-react"

type LapTime = {
  id: number
  time: string
  elapsed: number
  difference: string
}

export default function ChronometerPage() {
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [laps, setLaps] = useState<LapTime[]>([])
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const lapStartRef = useRef<number>(0)
  
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const ms = Math.floor((milliseconds % 1000) / 10)
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }
  
  const formatTimeDifference = (milliseconds: number): string => {
    if (milliseconds === 0) return "+00:00.00"
    return `+${formatTime(milliseconds)}`
  }
  
  const startTimer = () => {
    if (isRunning) return
    
    setIsRunning(true)
    const now = Date.now()
    startTimeRef.current = now - elapsedTime
    
    if (laps.length === 0) {
      lapStartRef.current = now - elapsedTime
    }
    
    timerRef.current = setInterval(() => {
      const currentTime = Date.now()
      setElapsedTime(currentTime - startTimeRef.current)
    }, 10)
  }
  
  const pauseTimer = () => {
    if (!isRunning) return
    
    clearInterval(timerRef.current!)
    setIsRunning(false)
  }
  
  const resetTimer = () => {
    clearInterval(timerRef.current!)
    setIsRunning(false)
    setElapsedTime(0)
    setLaps([])
    startTimeRef.current = 0
    lapStartRef.current = 0
  }
  
  const recordLap = () => {
    if (!isRunning) return
    
    const now = Date.now()
    const lapTime = now - lapStartRef.current
    const previousLapTime = laps.length > 0 ? laps[0].elapsed : 0
    const difference = laps.length > 0 ? lapTime - previousLapTime : 0
    
    const newLap: LapTime = {
      id: laps.length + 1,
      time: formatTime(elapsedTime),
      elapsed: lapTime,
      difference: formatTimeDifference(difference)
    }
    
    setLaps([newLap, ...laps])
    lapStartRef.current = now
  }
  
  const clearLaps = () => {
    if (!isRunning) {
      setLaps([])
    }
  }
  
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chronometer</h1>
        <p className="text-muted-foreground">
          Precise timing with lap recording for sports, cooking, or any timed activity
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-8">
              {/* Timer Display */}
              <div className="flex flex-col items-center justify-center">
                <div className="text-6xl font-mono font-semibold tracking-tighter">
                  {formatTime(elapsedTime)}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {isRunning ? "Running" : elapsedTime > 0 ? "Paused" : "Ready"}
                </div>
              </div>
              
              {/* Controls */}
              <div className="flex gap-4 flex-wrap justify-center">
                {!isRunning ? (
                  <Button onClick={startTimer} className="w-28">
                    <Play className="h-4 w-4 mr-2" />
                    {elapsedTime > 0 ? "Resume" : "Start"}
                  </Button>
                ) : (
                  <Button onClick={pauseTimer} className="w-28" variant="outline">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                
                <Button 
                  onClick={recordLap} 
                  className="w-28"
                  variant="secondary"
                  disabled={!isRunning}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Lap
                </Button>
                
                <Button 
                  onClick={resetTimer} 
                  className="w-28"
                  variant={elapsedTime > 0 ? "destructive" : "ghost"}
                  disabled={elapsedTime === 0}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center">
                <Timer className="h-4 w-4 mr-2" />
                Lap Times
              </h3>
              {laps.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearLaps} disabled={isRunning}>
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {laps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No laps recorded yet
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto pr-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">Lap</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">+/-</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {laps.map(lap => (
                      <TableRow key={lap.id}>
                        <TableCell className="font-medium">{lap.id}</TableCell>
                        <TableCell>{lap.time}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {lap.difference}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Tips for Precise Timing</h3>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Use the lap feature to time segments of activities</li>
            <li>The lap difference shows how your pace changes between laps</li>
            <li>The chronometer keeps running even when you switch to other tabs</li>
            <li>For extended timing needs, keep the browser window open</li>
          </ul>
        </Card>
        
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Common Uses</h3>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Sports and fitness training</li>
            <li>Cooking and baking</li>
            <li>Presentations and speeches</li>
            <li>Time-based productivity techniques</li>
            <li>Science experiments</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}