'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StickyNote, Plus, Trash2, Pencil, Check, X, Loader2 } from 'lucide-react'

interface Note {
  id: string
  content: string
  created_at: string
  updated_at: string
}

export default function ClientNotes({ clientId }: { clientId: string }) {
  const supabase = createClient()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => { loadNotes() }, [clientId])

  const loadNotes = async () => {
    const { data } = await supabase
      .from('client_notes')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    setNotes(data ?? [])
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!newContent.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('client_notes').insert({
      client_id: clientId,
      trainer_id: user!.id,
      content: newContent.trim(),
    }).select().single()
    if (data) setNotes(prev => [data, ...prev])
    setNewContent('')
    setAdding(false)
    setSaving(false)
  }

  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return
    setSaving(true)
    const { data } = await supabase.from('client_notes')
      .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (data) setNotes(prev => prev.map(n => n.id === id ? data : n))
    setEditingId(null)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('client_notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const startEdit = (note: Note) => {
    setEditingId(note.id)
    setEditContent(note.content)
    setAdding(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
          <StickyNote size={14} className="text-yellow-400" />
          Notas privadas
          <span className="text-zinc-600 text-xs font-normal">— solo las ves tú</span>
        </CardTitle>
        {!adding && (
          <Button
            size="sm"
            onClick={() => { setAdding(true); setEditingId(null) }}
            className="bg-orange-500 hover:bg-orange-600 text-white h-7 text-xs gap-1"
          >
            <Plus size={12} /> Nueva
          </Button>
        )}
      </CardHeader>

      <CardContent className="px-3 pb-4 flex flex-col gap-2">

        {/* New note input */}
        {adding && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 flex flex-col gap-2">
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Escribe una nota sobre este cliente..."
              rows={3}
              autoFocus
              className="w-full bg-transparent text-white text-sm placeholder:text-zinc-600 focus:outline-none resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setAdding(false); setNewContent('') }}
                className="text-zinc-500 hover:text-zinc-300 transition p-1"
              >
                <X size={14} />
              </button>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={saving || !newContent.trim()}
                className="bg-yellow-500 hover:bg-yellow-600 text-black h-7 text-xs gap-1 font-semibold"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Guardar
              </Button>
            </div>
          </div>
        )}

        {/* Notes list */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={18} className="text-zinc-600 animate-spin" />
          </div>
        ) : notes.length === 0 && !adding ? (
          <div className="text-center py-6">
            <StickyNote size={24} className="text-zinc-700 mx-auto mb-2" />
            <p className="text-zinc-600 text-sm">Sin notas aún</p>
            <button
              onClick={() => setAdding(true)}
              className="text-yellow-400 text-xs mt-1 hover:text-yellow-300 transition"
            >
              Agregar primera nota →
            </button>
          </div>
        ) : (
          notes.map(note => (
            <div key={note.id} className="bg-zinc-800/60 border border-zinc-700/40 rounded-xl p-3">
              {editingId === note.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={3}
                    autoFocus
                    className="w-full bg-transparent text-white text-sm focus:outline-none resize-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={cancelEdit} className="text-zinc-500 hover:text-zinc-300 transition p-1">
                      <X size={14} />
                    </button>
                    <Button
                      size="sm"
                      onClick={() => handleEdit(note.id)}
                      disabled={saving || !editContent.trim()}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black h-7 text-xs gap-1 font-semibold"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Guardar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p className="text-zinc-300 text-sm flex-1 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => startEdit(note)}
                      className="text-zinc-600 hover:text-zinc-300 transition p-1"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-zinc-600 hover:text-red-400 transition p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
              <p className="text-zinc-700 text-xs mt-2">
                {new Date(note.updated_at ?? note.created_at).toLocaleDateString('es', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
