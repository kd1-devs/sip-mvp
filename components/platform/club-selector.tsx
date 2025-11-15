'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Club } from '@/types/db'

interface ClubSelectorProps {
  clubs: Club[]
  selectedClubId: number | null
  onClubChange: (clubId: string) => void
  placeholder?: string
  label?: string
}

export function ClubSelector({ 
  clubs, 
  selectedClubId, 
  onClubChange,
  placeholder = "Choose a club...",
  label = "Select Club"
}: ClubSelectorProps) {
  return (
    <div className="w-full max-w-xs">
      <label htmlFor="club-select" className="block text-sm font-medium mb-2">
        {label}
      </label>
      <Select value={selectedClubId?.toString() || undefined} onValueChange={onClubChange}>
        <SelectTrigger id="club-select">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {clubs.map((club) => (
            <SelectItem key={club.id} value={club.id.toString()}>
              {club.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}