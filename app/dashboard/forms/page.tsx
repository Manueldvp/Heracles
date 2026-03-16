'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus, FileText, Trash2, Edit2, ChevronDown,
  AlignLeft, List, Hash, Star, X, GripVertical, Check, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ─────────────────────────────────────────────────────────────────────
export type FieldType = 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'rating'

export interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

interface Form {
  id: string
  title: string
  description?: string
  fields: FormField[]
  created_at: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const FIELD_TYPES: { type: FieldType; label: string; icon: any }[] = [
  { type: 'text',        label: 'Texto corto',  icon: AlignLeft   },
  { type: 'textarea',    label: 'Texto largo',  icon: FileText    },
  { type: 'select',      label: 'Selección',    icon: ChevronDown },
  { type: 'multiselect', label: 'Múltiple',     icon: List        },
  { type: 'number',      label: 'Número',       icon: Hash        },
  { type: 'rating',      label: 'Valoración',   icon: Star        },
]

const SUGGESTED_FIELDS: Omit<FormField, 'id'>[] = [
  { type: 'text',        label: 'Nombre completo',          placeholder: 'Tu nombre completo',   required: true  },
  { type: 'number',      label: 'Edad',                     placeholder: 'Años',                 required: true  },
  { type: 'number',      label: 'Peso actual (kg)',         placeholder: 'kg',                   required: false },
  { type: 'number',      label: 'Altura (cm)',              placeholder: 'cm',                   required: false },
  { type: 'select',      label: 'Objetivo principal',       required: true,
    options: ['Perder peso', 'Ganar músculo', 'Mejorar resistencia', 'Salud general', 'Rendimiento deportivo'] },
  { type: 'select',      label: 'Nivel de actividad',       required: true,
    options: ['Sedentario', 'Poco activo', 'Moderadamente activo', 'Muy activo'] },
  { type: 'multiselect', label: 'Días disponibles',         required: true,
    options: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] },
  { type: 'select',      label: 'Equipamiento disponible',  required: false,
    options: ['Gimnasio completo', 'Casa con mancuernas', 'Solo peso corporal', 'Bandas elásticas'] },
  { type: 'textarea',    label: 'Lesiones o limitaciones',  placeholder: 'Describe lesiones o limitaciones físicas', required: false },
  { type: 'textarea',    label: 'Historial deportivo',      placeholder: 'Deportes practicados, experiencia en gym...', required: false },
  { type: 'select',      label: 'Tipo de dieta',            required: false,
    options: ['Sin restricciones', 'Vegetariana', 'Vegana', 'Sin gluten', 'Sin lactosa'] },
  { type: 'textarea',    label: 'Alergias o intolerancias', placeholder: 'Especifica si tienes alguna', required: false },
]

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

// ─── Field Editor Card ─────────────────────────────────────────────────────────
function FieldEditor({ field, onChange, onDelete }: {
  field: FormField
  onChange: (f: FormField) => void
  onDelete: () => void
}) {
  const [optionInput, setOptionInput] = useState('')
  const TypeIcon = FIELD_TYPES.find(t => t.type === field.type)?.icon ?? AlignLeft
  const typeLabel = FIELD_TYPES.find(t => t.type === field.type)?.label ?? ''

  const addOption = () => {
    if (!optionInput.trim()) return
    onChange({ ...field, options: [...(field.options ?? []), optionInput.trim()] })
    setOptionInput('')
  }

  const removeOption = (i: number) => {
    onChange({ ...field, options: field.options?.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-4 flex flex-col gap-3">

      {/* Header row */}
      <div className="flex items-center gap-2">
        <GripVertical size={15} className="text-zinc-600 cursor-grab shrink-0" />
        <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
          <TypeIcon size={12} className="text-blue-400" />
        </div>
        <span className="text-zinc-500 text-xs">{typeLabel}</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => onChange({ ...field, required: !field.required })}
            className={`text-xs px-2.5 py-1 rounded-lg border transition ${
              field.required
                ? 'bg-orange-500/15 text-orange-400 border-orange-500/25'
                : 'bg-zinc-700/60 text-zinc-500 border-zinc-600/60 hover:text-zinc-300'
            }`}
          >
            {field.required ? 'Requerido' : 'Opcional'}
          </button>
          <button onClick={onDelete} className="text-zinc-600 hover:text-red-400 transition p-0.5">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Label */}
      <input
        value={field.label}
        onChange={e => onChange({ ...field, label: e.target.value })}
        placeholder="Etiqueta del campo"
        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
      />

      {/* Placeholder — only for text/textarea/number */}
      {(field.type === 'text' || field.type === 'textarea' || field.type === 'number') && (
        <input
          value={field.placeholder ?? ''}
          onChange={e => onChange({ ...field, placeholder: e.target.value })}
          placeholder="Texto de ayuda (opcional)"
          className="w-full bg-zinc-900 border border-zinc-700/60 rounded-xl px-3 py-2 text-zinc-400 text-sm focus:outline-none focus:border-blue-500/50"
        />
      )}

      {/* Options — for select/multiselect */}
      {(field.type === 'select' || field.type === 'multiselect') && (
        <div className="flex flex-col gap-2">
          {(field.options ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(field.options ?? []).map((opt, i) => (
                <span key={i} className="flex items-center gap-1 bg-zinc-700/60 text-zinc-300 text-xs rounded-lg px-2 py-1">
                  {opt}
                  <button onClick={() => removeOption(i)} className="text-zinc-500 hover:text-red-400 transition ml-0.5">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={optionInput}
              onChange={e => setOptionInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
              placeholder="Agregar opción..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
            />
            <button
              onClick={addOption}
              className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-xl transition text-sm"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Form Builder View ─────────────────────────────────────────────────────────
function FormBuilder({ form, onSave, onCancel }: {
  form?: Form
  onSave: (title: string, description: string, fields: FormField[]) => Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle] = useState(form?.title ?? 'Formulario de intake')
  const [description, setDescription] = useState(form?.description ?? '')
  const [fields, setFields] = useState<FormField[]>(form?.fields ?? [])
  const [saving, setSaving] = useState(false)
  const [showSuggested, setShowSuggested] = useState(true)

  const addField = (type: FieldType) => {
    setFields(prev => [...prev, {
      id: generateId(),
      type,
      label: FIELD_TYPES.find(t => t.type === type)?.label ?? 'Campo',
      required: false,
      options: (type === 'select' || type === 'multiselect') ? [] : undefined,
    }])
  }

  const addSuggested = (suggested: typeof SUGGESTED_FIELDS[0]) => {
    if (fields.some(f => f.label === suggested.label)) return
    setFields(prev => [...prev, { ...suggested, id: generateId() }])
  }

  const updateField = (id: string, updated: FormField) =>
    setFields(prev => prev.map(f => f.id === id ? updated : f))

  const deleteField = (id: string) =>
    setFields(prev => prev.filter(f => f.id !== id))

  const handleSave = async () => {
    if (!title.trim() || fields.length === 0) return
    setSaving(true)
    await onSave(title, description, fields)
    setSaving(false)
  }

  const canSave = title.trim().length > 0 && fields.length > 0

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300 transition p-1">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-white font-bold text-lg">{form ? 'Editar formulario' : 'Nuevo formulario'}</h2>
          <p className="text-zinc-500 text-xs">Los clientes lo llenarán al registrarse</p>
        </div>
      </div>

      {/* Title & description */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-500 text-xs">Título del formulario</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Formulario de intake inicial"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white font-medium text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-500 text-xs">Descripción (opcional)</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ej: Por favor completa este formulario para que pueda personalizar tu programa"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-300 text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suggested fields */}
      <div>
        <button
          onClick={() => setShowSuggested(!showSuggested)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition text-sm mb-3 w-full"
        >
          <List size={14} className="text-blue-400" />
          <span>Campos sugeridos</span>
          <span className="text-zinc-600 text-xs ml-1">— click para agregar</span>
          <ChevronDown size={13} className={`ml-auto transition-transform text-zinc-600 ${showSuggested ? 'rotate-180' : ''}`} />
        </button>

        {showSuggested && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_FIELDS.map((sf, i) => {
              const added = fields.some(f => f.label === sf.label)
              return (
                <button
                  key={i}
                  onClick={() => addSuggested(sf)}
                  disabled={added}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition ${
                    added
                      ? 'bg-green-500/10 text-green-400 border-green-500/20 cursor-default'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-blue-500/40 hover:text-white'
                  }`}
                >
                  {added ? <Check size={10} /> : <Plus size={10} />}
                  {sf.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Fields list */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-zinc-500 text-xs uppercase tracking-widest">
            Campos del formulario {fields.length > 0 && `(${fields.length})`}
          </p>
        </div>

        {fields.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-xl py-10 text-center">
            <FileText size={24} className="text-zinc-700 mx-auto mb-2" />
            <p className="text-zinc-600 text-sm">Agrega campos desde los sugeridos</p>
            <p className="text-zinc-700 text-xs mt-1">o crea uno personalizado abajo</p>
          </div>
        ) : (
          fields.map(field => (
            <FieldEditor
              key={field.id}
              field={field}
              onChange={updated => updateField(field.id, updated)}
              onDelete={() => deleteField(field.id)}
            />
          ))
        )}
      </div>

      {/* Add custom field */}
      <div>
        <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2">Agregar campo personalizado</p>
        <div className="flex flex-wrap gap-2">
          {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => addField(type)}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 hover:text-white hover:border-zinc-600 transition"
            >
              <Icon size={12} className="text-blue-400" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Save / Cancel */}
      <div className="flex gap-3 pb-6">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1 border-zinc-700 text-zinc-400 hover:text-white bg-transparent"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !canSave}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
        >
          {saving ? 'Guardando...' : form ? 'Guardar cambios' : 'Crear formulario'}
        </Button>
      </div>
    </div>
  )
}

// ─── Forms List View ───────────────────────────────────────────────────────────
function FormsList({ forms, onNew, onEdit, onDelete }: {
  forms: Form[]
  onNew: () => void
  onEdit: (form: Form) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-xl">Formularios de intake</h2>
          <p className="text-zinc-500 text-sm mt-0.5">El cliente lo llena al registrarse con tu invitación</p>
        </div>
        <Button onClick={onNew} className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5">
          <Plus size={15} /> Nuevo
        </Button>
      </div>

      {forms.length === 0 ? (
        <Card className="bg-zinc-900 border-dashed border-zinc-800">
          <CardContent className="py-16 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
              <FileText size={24} className="text-zinc-600" />
            </div>
            <div className="text-center">
              <p className="text-zinc-300 font-medium">Sin formularios aún</p>
              <p className="text-zinc-600 text-sm mt-1 max-w-[260px]">
                Crea un formulario para recopilar información de tus clientes cuando se registren
              </p>
            </div>
            <Button onClick={onNew} className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 mt-1">
              <Plus size={14} /> Crear primer formulario
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {forms.map(form => (
            <Card key={form.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText size={16} className="text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold truncate">{form.title}</p>
                      {form.description && (
                        <p className="text-zinc-500 text-xs mt-0.5 truncate">{form.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs">
                          {form.fields.length} campos
                        </Badge>
                        <span className="text-zinc-700 text-xs">
                          {new Date(form.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onEdit(form)}
                      className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-white transition"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(form.id)}
                      className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-red-500/15 flex items-center justify-center text-zinc-500 hover:text-red-400 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Fields preview */}
                {form.fields.length > 0 && (
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {form.fields.slice(0, 5).map((f, i) => (
                      <span key={i} className="text-xs bg-zinc-800 text-zinc-500 rounded-lg px-2 py-0.5 border border-zinc-700/50">
                        {f.label}
                      </span>
                    ))}
                    {form.fields.length > 5 && (
                      <span className="text-xs text-zinc-600 py-0.5">+{form.fields.length - 5} más</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4">
        <p className="text-blue-400 text-sm font-medium mb-1">¿Cómo se usa?</p>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Al invitar un cliente, podrás asociar uno de estos formularios. El cliente lo completará justo después de crear su cuenta.
        </p>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function FormsPage() {
  const supabase = createClient()
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list')
  const [editingForm, setEditingForm] = useState<Form | null>(null)

  useEffect(() => { loadForms() }, [])

  const loadForms = async () => {
    const { data } = await supabase.from('forms').select('*').order('created_at', { ascending: false })
    setForms(data ?? [])
    setLoading(false)
  }

  const handleSave = async (title: string, description: string, fields: FormField[]) => {
    if (editingForm) {
      await supabase.from('forms').update({ title, description, fields }).eq('id', editingForm.id)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('forms').insert({ trainer_id: user!.id, title, description, fields })
    }
    await loadForms()
    setView('list')
    setEditingForm(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este formulario? Esta acción no se puede deshacer.')) return
    await supabase.from('forms').delete().eq('id', id)
    setForms(prev => prev.filter(f => f.id !== id))
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3 max-w-2xl mx-auto">
        {[1,2].map(i => <div key={i} className="h-28 bg-zinc-900 rounded-xl animate-pulse border border-zinc-800" />)}
      </div>
    )
  }

  if (view === 'create' || view === 'edit') {
    return (
      <FormBuilder
        form={editingForm ?? undefined}
        onSave={handleSave}
        onCancel={() => { setView('list'); setEditingForm(null) }}
      />
    )
  }

  return (
    <FormsList
      forms={forms}
      onNew={() => { setEditingForm(null); setView('create') }}
      onEdit={(form) => { setEditingForm(form); setView('edit') }}
      onDelete={handleDelete}
    />
  )
}
