"use client"

import React, { useState, useEffect } from "react"
import { Calendar, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

interface RescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  currentTargetDate: string
  courseTitle: string
}

export function RescheduleModal({ isOpen, onClose, currentTargetDate, courseTitle }: RescheduleModalProps) {
  const [newDate, setNewDate] = useState("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [estimatedPace, setEstimatedPace] = useState(0)

  // Mock dynamic UI calculation based on selected date
  useEffect(() => {
    if (newDate) {
      // In a real app, calculate based on total lessons / days remaining
      const randomPace = Math.floor(Math.random() * 3) + 2
      setEstimatedPace(randomPace)
    } else {
      setEstimatedPace(0)
    }
  }, [newDate])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (reason.length < 10) return
    
    setIsLoading(true)
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dark Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl ring-1 ring-slate-200 m-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-slate-900">Adjust Pacing</h2>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 rounded-lg bg-slate-50 p-4 border border-slate-100">
          <p className="text-sm font-medium text-slate-900">{courseTitle}</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
            <Calendar className="w-4 h-4" />
            <span>Current Target: <strong className="text-slate-700">{new Date(currentTargetDate).toLocaleDateString()}</strong></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-900" htmlFor="new-date">
              New Target Date
            </label>
            <Input 
              id="new-date"
              type="date" 
              required
              min={new Date().toISOString().split('T')[0]}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full"
            />
            {estimatedPace > 0 && (
              <p className="text-xs text-primary-600 font-medium mt-1 animate-in slide-in-from-top-1">
                New estimated pace: {estimatedPace} lessons/week
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-900" htmlFor="reason">
              Reason for Rescheduling
            </label>
            <textarea
              id="reason"
              required
              minLength={10}
              placeholder="E.g., Unexpected work commitments..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
            />
            <p className="text-xs text-slate-500">Minimum 10 characters.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || reason.length < 10 || !newDate}
              className="min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm Schedule"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
