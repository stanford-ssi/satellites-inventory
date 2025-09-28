'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/database'

type InventoryItem = Database['public']['Tables']['inventory']['Row']

interface EditPartDialogProps {
  part: InventoryItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditPartDialog({ part, open, onOpenChange }: EditPartDialogProps) {
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

  useEffect(() => {
    if (part) {
      setFormData({
        part_id: part.part_id,
        description: part.description,
        bin_id: part.bin_id,
        location_within_bin: part.location_within_bin,
        quantity: part.quantity,
        part_link: part.part_link || '',
      })
    }
  }, [part])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!part) return

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          ...formData,
          part_link: formData.part_link || null,
        })
        .eq('id', part.id)

      if (error) throw error

      toast.success('Part updated successfully!')
      onOpenChange(false)
      router.refresh() // Refresh to show updated data
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!part) return

    if (!confirm('Are you sure you want to delete this part? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', part.id)

      if (error) throw error

      toast.success('Part deleted successfully!')
      onOpenChange(false)
      router.refresh() // Refresh to show updated data
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

  if (!part) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Part</DialogTitle>
          <DialogDescription>
            Update the part information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_part_id">Part ID *</Label>
              <Input
                id="edit_part_id"
                value={formData.part_id}
                onChange={(e) => handleInputChange('part_id', e.target.value)}
                placeholder="e.g., RES-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_bin_id">Bin ID *</Label>
              <Input
                id="edit_bin_id"
                value={formData.bin_id}
                onChange={(e) => handleInputChange('bin_id', e.target.value)}
                placeholder="e.g., A1"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_description">Description *</Label>
            <Input
              id="edit_description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="e.g., 10kΩ Resistor"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_location_within_bin">Location in Bin *</Label>
              <Input
                id="edit_location_within_bin"
                value={formData.location_within_bin}
                onChange={(e) => handleInputChange('location_within_bin', e.target.value)}
                placeholder="e.g., Shelf 2, Drawer A"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_quantity">Quantity *</Label>
              <Input
                id="edit_quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_part_link">Part Link (Optional)</Label>
            <Input
              id="edit_part_link"
              type="url"
              value={formData.part_link}
              onChange={(e) => handleInputChange('part_link', e.target.value)}
              placeholder="https://example.com/part-link"
            />
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Delete
            </Button>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Part'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}