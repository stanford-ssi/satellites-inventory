'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface AddPartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddPartDialog({ open, onOpenChange }: AddPartDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    part_id: '',
    description: '',
    bin_id: '',
    location_within_bin: '',
    quantity: 0,
    part_link: '',
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('inventory')
        .insert([
          {
            ...formData,
            part_link: formData.part_link || null,
            qr_code: `QR-${formData.part_id}-${Date.now()}`, // Simple QR code placeholder
          },
        ])

      if (error) throw error

      toast.success('Part added successfully!')
      setFormData({
        part_id: '',
        description: '',
        bin_id: '',
        location_within_bin: '',
        quantity: 0,
        part_link: '',
      })
      onOpenChange(false)
      router.refresh() // Refresh to show new data
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Part</DialogTitle>
          <DialogDescription>
            Add a new part to the inventory system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="part_id">Part ID *</Label>
              <Input
                id="part_id"
                value={formData.part_id}
                onChange={(e) => handleInputChange('part_id', e.target.value)}
                placeholder="e.g., RES-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bin_id">Bin ID *</Label>
              <Input
                id="bin_id"
                value={formData.bin_id}
                onChange={(e) => handleInputChange('bin_id', e.target.value)}
                placeholder="e.g., A1"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="e.g., 10kΩ Resistor"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location_within_bin">Location in Bin *</Label>
              <Input
                id="location_within_bin"
                value={formData.location_within_bin}
                onChange={(e) => handleInputChange('location_within_bin', e.target.value)}
                placeholder="e.g., Shelf 2, Drawer A"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="part_link">Part Link (Optional)</Label>
            <Input
              id="part_link"
              type="url"
              value={formData.part_link}
              onChange={(e) => handleInputChange('part_link', e.target.value)}
              placeholder="https://example.com/part-link"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Part'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}