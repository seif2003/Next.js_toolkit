"use client"

import { useState, useEffect } from "react"
import { Plus, Trash, Calendar, Moon, Sun } from "lucide-react"
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

// List of common cities with their timezones
const CITIES = [
  { name: "New York", timezone: "America/New_York" },
  { name: "Los Angeles", timezone: "America/Los_Angeles" },
  { name: "London", timezone: "Europe/London" },
  { name: "Paris", timezone: "Europe/Paris" },
  { name: "Tokyo", timezone: "Asia/Tokyo" },
  { name: "Sydney", timezone: "Australia/Sydney" },
  { name: "Shanghai", timezone: "Asia/Shanghai" },
  { name: "Dubai", timezone: "Asia/Dubai" },
  { name: "Moscow", timezone: "Europe/Moscow" },
  { name: "São Paulo", timezone: "America/Sao_Paulo" },
  { name: "Mumbai", timezone: "Asia/Kolkata" },
  { name: "Singapore", timezone: "Asia/Singapore" },
  { name: "Berlin", timezone: "Europe/Berlin" },
  { name: "Cairo", timezone: "Africa/Cairo" },
  { name: "Toronto", timezone: "America/Toronto" },
  { name: "Tunisia", timezone: "Africa/Tunis" },
  { name: "Mexico City", timezone: "America/Mexico_City" },
  { name: "Amsterdam", timezone: "Europe/Amsterdam" },
  { name: "Stockholm", timezone: "Europe/Stockholm" },
  { name: "Istanbul", timezone: "Europe/Istanbul" },
  { name: "Bangkok", timezone: "Asia/Bangkok" }
]

interface City {
  id: string
  name: string
  timezone: string
}

interface MeetingTime {
  date: string
  time: string
}

export default function TimeZoneBuddy() {
  const [selectedCities, setSelectedCities] = useState<City[]>([
    { id: "1", name: "New York", timezone: "America/New_York" },
    { id: "2", name: "London", timezone: "Europe/London" },
    { id: "3", name: "Tokyo", timezone: "Asia/Tokyo" }
  ])
  
  const [citySearchTerm, setCitySearchTerm] = useState("")
  const [showCitySelector, setShowCitySelector] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [meetingTime, setMeetingTime] = useState<MeetingTime>({
    date: new Date().toISOString().split('T')[0],
    time: "09:00"
  })
  const [showMeetingPlanner, setShowMeetingPlanner] = useState(false)

  // Update the current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  // Format time for a specific timezone
  const formatTimeInTimezone = (date: Date, timezone: string) => {
    try {
      return date.toLocaleTimeString("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })
    } catch (error) {
      console.error(`Error formatting time for ${timezone}:`, error)
      return "Invalid timezone"
    }
  }
  
  // Get day of week for a specific timezone
  const getDayInTimezone = (date: Date, timezone: string) => {
    try {
      return date.toLocaleDateString("en-US", {
        timeZone: timezone,
        weekday: "long",
        day: "numeric",
        month: "short"
      })
    } catch (error) {
      console.error(`Error getting day for ${timezone}:`, error)
      return "Invalid timezone"
    }
  }
  
  // Check if it's night time (between 6 PM and 6 AM)
  const isNightTime = (date: Date, timezone: string) => {
    try {
      const hours = new Date(date.toLocaleString("en-US", { timeZone: timezone })).getHours()
      return hours < 6 || hours >= 18
    } catch (error) {
      console.error(`Error checking night time for ${timezone}:`, error)
      return false
    }
  }
  
  // Add a new city to the list
  const addCity = (city: { name: string, timezone: string }) => {
    const newCity = {
      id: Math.random().toString(36).substring(2, 9),
      name: city.name,
      timezone: city.timezone
    }
    setSelectedCities(prev => [...prev, newCity])
    setShowCitySelector(false)
  }
  
  // Remove a city from the list
  const removeCity = (id: string) => {
    setSelectedCities(prev => prev.filter(city => city.id !== id))
  }
  
  // Filter cities based on search term
  const filteredCities = CITIES.filter(city => 
    city.name.toLowerCase().includes(citySearchTerm.toLowerCase())
  )
  
  // Get meeting time in different timezones
  const getMeetingTimeInTimezone = (timezone: string) => {
    if (!meetingTime.date || !meetingTime.time) return "Invalid time"
    
    try {
      const [year, month, day] = meetingTime.date.split('-').map(Number)
      const [hours, minutes] = meetingTime.time.split(':').map(Number)
      
      // Create date object in UTC
      const date = new Date(Date.UTC(year, month - 1, day, hours, minutes))
      
      // Get reference timezone offset
      const referenceTimezone = selectedCities[0].timezone
      const referenceOffset = new Date(date.toLocaleString("en-US", { timeZone: referenceTimezone })).getTimezoneOffset()
      
      // Get target timezone offset
      const targetOffset = new Date(date.toLocaleString("en-US", { timeZone: timezone })).getTimezoneOffset()
      
      // Calculate the difference
      const offsetDiff = targetOffset - referenceOffset
      
      // Adjust time
      const adjustedDate = new Date(date.getTime() - offsetDiff * 60000)
      
      return adjustedDate.toLocaleString("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        weekday: "long",
        day: "numeric",
        month: "short"
      })
    } catch (error) {
      console.error(`Error getting meeting time for ${timezone}:`, error)
      return "Invalid timezone"
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">TimeZone Buddy</h1>
          <p className="text-muted-foreground">
            Compare times across different cities and schedule meetings with ease.
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="world-clock">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="world-clock">World Clock</TabsTrigger>
          <TabsTrigger value="meeting-planner">Meeting Planner</TabsTrigger>
        </TabsList>
        
        {/* World Clock Tab */}
        <TabsContent value="world-clock" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Current Times</h2>
            <Button onClick={() => setShowCitySelector(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add City
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {selectedCities.map(city => {
              const isNight = isNightTime(currentTime, city.timezone)
              return (
                <Card 
                  key={city.id} 
                  className={`overflow-hidden ${isNight ? 'bg-slate-900 text-slate-100' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          {city.name}
                          {isNight ? 
                            <Moon className="h-4 w-4 text-blue-300" /> : 
                            <Sun className="h-4 w-4 text-yellow-400" />
                          }
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {getDayInTimezone(currentTime, city.timezone)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 -mt-1"
                        onClick={() => removeCity(city.id)}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Remove {city.name}</span>
                      </Button>
                    </div>
                    <div className="mt-4">
                      <p className={`text-3xl font-mono ${isNight ? 'text-white' : ''}`}>
                        {formatTimeInTimezone(currentTime, city.timezone)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
        
        {/* Meeting Planner Tab */}
        <TabsContent value="meeting-planner" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Plan a Meeting</h2>
            <Button onClick={() => setShowCitySelector(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add City
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-end">
                <div>
                  <Label htmlFor="meeting-date">Meeting Date</Label>
                  <Input
                    id="meeting-date"
                    type="date"
                    value={meetingTime.date}
                    onChange={(e) => setMeetingTime(prev => ({ ...prev, date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="meeting-time">Meeting Time ({selectedCities[0]?.name || "Local Time"})</Label>
                  <Input
                    id="meeting-time"
                    type="time"
                    value={meetingTime.time}
                    onChange={(e) => setMeetingTime(prev => ({ ...prev, time: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <Button 
                  className="md:self-end"
                  onClick={() => setShowMeetingPlanner(true)}
                >
                  <Calendar className="h-4 w-4 mr-2" /> Schedule Meeting
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {selectedCities.map(city => {
              const meetingTimeStr = getMeetingTimeInTimezone(city.timezone)
              const meetingTimeParts = meetingTimeStr.split(', ')
              const dayPart = meetingTimeParts.slice(0, 2).join(', ')
              const timePart = meetingTimeParts.length > 2 ? meetingTimeParts[2] : ''
              
              // Check if meeting is during night time
              const [hourStr, period] = timePart.split(' ')
              const [hour] = hourStr.split(':')
              const hourNum = parseInt(hour)
              const isNight = (period === 'PM' && hourNum >= 6) || (period === 'AM' && hourNum < 6)
              
              return (
                <Card 
                  key={city.id} 
                  className={`overflow-hidden ${isNight ? 'bg-slate-900 text-slate-100' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          {city.name}
                          {isNight ? 
                            <Moon className="h-4 w-4 text-blue-300" /> : 
                            <Sun className="h-4 w-4 text-yellow-400" />
                          }
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {dayPart}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 -mt-1"
                        onClick={() => removeCity(city.id)}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Remove {city.name}</span>
                      </Button>
                    </div>
                    <div className="mt-4">
                      <p className={`text-3xl font-mono ${isNight ? 'text-white' : ''}`}>
                        {timePart}
                      </p>
                    </div>
                    <div className="mt-2">
                      {isNight && (
                        <p className="text-xs text-red-300">
                          Night time (outside business hours)
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* City Selector Dialog */}
      <Dialog open={showCitySelector} onOpenChange={setShowCitySelector}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add a City</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <Input
                placeholder="Search for a city..."
                value={citySearchTerm}
                onChange={(e) => setCitySearchTerm(e.target.value)}
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredCities.length > 0 ? (
                filteredCities.map(city => (
                  <button
                    key={city.name}
                    className="flex w-full items-center justify-between rounded-md border p-3 hover:bg-accent"
                    onClick={() => addCity(city)}
                  >
                    <span>{city.name}</span>
                    <Plus className="h-4 w-4" />
                  </button>
                ))
              ) : (
                <p className="text-center text-muted-foreground">No cities found</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCitySelector(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Meeting Planner Dialog */}
      <Dialog open={showMeetingPlanner} onOpenChange={setShowMeetingPlanner}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Meeting Schedule</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Meeting Details</h3>
                <p>
                  <span className="text-muted-foreground">Date: </span>
                  {new Date(meetingTime.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                <p>
                  <span className="text-muted-foreground">Base Time ({selectedCities[0]?.name}): </span>
                  {meetingTime.time}
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Time Across Locations</h3>
                <div className="grid gap-2">
                  {selectedCities.map(city => {
                    const meetingTimeStr = getMeetingTimeInTimezone(city.timezone)
                    const [dayPart, timePart] = [
                      meetingTimeStr.split(', ').slice(0, 2).join(', '),
                      meetingTimeStr.split(', ')[2]
                    ]
                    
                    // Check if meeting is during night time
                    const [hourStr, period] = timePart.split(' ')
                    const [hour] = hourStr.split(':')
                    const hourNum = parseInt(hour)
                    const isNight = (period === 'PM' && hourNum >= 6) || (period === 'AM' && hourNum < 6)
                    
                    // Check if meeting is outside business hours (before 9 AM or after 5 PM)
                    const outsideBusinessHours = (period === 'PM' && hourNum >= 5) || 
                                               (period === 'AM' && hourNum < 9) ||
                                               period === 'AM' && hourNum === 12
                    
                    return (
                      <div 
                        key={city.id} 
                        className={`p-3 border rounded-md flex justify-between items-center
                                   ${isNight ? 'bg-slate-900 text-white' : ''}`}
                      >
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {city.name}
                            {isNight ? 
                              <Moon className="h-4 w-4 text-blue-300" /> : 
                              <Sun className="h-4 w-4 text-yellow-400" />
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {dayPart}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono">{timePart}</div>
                          {outsideBusinessHours && (
                            <div className="text-xs text-red-400">Outside business hours</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div>
                <Button 
                  className="w-full"
                  onClick={() => {
                    // Here you would typically integrate with calendar apps
                    // For now, just close the dialog
                    setShowMeetingPlanner(false)
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" /> Add to Calendar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}