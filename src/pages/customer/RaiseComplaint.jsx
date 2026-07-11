import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlusCircle, Upload, X, Info, CheckCircle2, ChevronDown,
  Clock, FileText, MessageSquare, Phone, HelpCircle, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { faqs } from '@/constants/faqs'
import { supabase } from '@/services/supabaseClient'
import { complaintsApi } from '@/services/apiClient'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/utils'
import { validatePhoneInput, normalizeToE164 } from '@/utils/phone'

const PROCESS_STEPS = [
  { icon: PlusCircle, label: 'Submit', desc: 'Fill in complaint details', active: true },
  { icon: CheckCircle2, label: 'Review', desc: 'Team reviews your case', active: false },
  { icon: MessageSquare, label: 'Update', desc: 'SMS/WhatsApp notifications', active: false },
  { icon: Clock, label: 'Resolve', desc: 'Issue is resolved & closed', active: false },
]

const TIPS = [
  'Be specific about what happened and when',
  'Include any reference numbers or transaction IDs',
  'Attach screenshots or documents if available',
  'Check your phone for SMS & WhatsApp updates',
]

function FAQAccordion() {
  const [open, setOpen] = useState(null)
  const items = faqs.slice(0, 4)
  return (
    <div className="space-y-2">
      {items.map((faq, i) => (
        <div key={faq.id} className="border border-border-theme rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-alt transition-colors"
          >
            <span className="text-xs font-medium text-text-theme pr-2">{faq.question}</span>
            <ChevronDown className={cn('w-4 h-4 text-muted-theme shrink-0 transition-transform duration-200', open === i && 'rotate-180')} />
          </button>
          {open === i && (
            <div className="px-4 pb-3">
              <p className="text-xs text-muted-theme leading-relaxed">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function RaiseComplaint() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileRef = useRef(null)

  const [dbCategories, setDbCategories] = useState([])
  const [submittedNumber, setSubmittedNumber] = useState('')
  const [form, setForm] = useState({
    customerName: user?.full_name || '',
    phone: user?.phone_number || '',
    categoryId: '',
    title: '',
    description: '',
  })
  const [errors, setErrors] = useState({})
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })
      if (!error && data) {
        setDbCategories(data)
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        customerName: user.full_name || '',
        phone: user.phone_number || '',
      }))
    }
  }, [user])

  function validate() {
    const e = {}
    const phoneCheck = validatePhoneInput(form.phone)
    if (!phoneCheck.valid) e.phone = phoneCheck.error
    if (!form.categoryId) e.categoryId = 'Please select a category'
    if (!form.title.trim()) e.title = 'Complaint title is required'
    else if (form.title.trim().length < 10) e.title = 'Title must be at least 10 characters'
    if (!form.description.trim()) e.description = 'Description is required'
    else if (form.description.trim().length < 30) e.description = 'Please provide more detail (at least 30 characters)'
    return e
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  function handleFiles(newFiles) {
    const valid = Array.from(newFiles).filter(f => f.size <= 5 * 1024 * 1024)
    setFiles(prev => [...prev, ...valid].slice(0, 5))
  }

  function removeFile(idx) {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    setSubmitError('')
    try {
      if (!user?.id) throw new Error('You must be signed in to submit a complaint.')

      const phone = normalizeToE164(form.phone.trim())
      const { error: phoneError } = await supabase
        .from('profiles')
        .update({ phone_number: phone })
        .eq('id', user.id)
      if (phoneError) throw new Error(phoneError.message)

      const created = await complaintsApi.create({
        category_id: form.categoryId,
        title: form.title.trim(),
        description: form.description.trim(),
        priority: 'medium',
      })
      setSubmittedNumber(created.complaint_number)
      setSuccess(true)
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit complaint. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeUp">
        <div className="w-20 h-20 rounded-full bg-secondary-light border border-secondary/20 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-secondary" />
        </div>
        <h2 className="text-2xl font-bold text-text-theme mb-2">Complaint Submitted!</h2>
        <p className="text-muted-theme text-sm text-center max-w-sm mb-2">
          Your complaint has been registered successfully.
        </p>
        <div className="bg-primary-light border border-primary-mid/20 rounded-xl px-5 py-3 mb-8 text-center">
          <p className="text-xs text-muted-theme mb-1">Your Complaint Number</p>
          <p className="font-mono font-bold text-primary text-lg">{submittedNumber}</p>
          <p className="text-xs text-subtle-theme mt-1">Save this number to track your complaint</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => {
            setSuccess(false)
            setSubmittedNumber('')
            setForm({
              customerName: user?.full_name || '',
              phone: user?.phone_number || '',
              categoryId: '',
              title: '',
              description: '',
            })
            setFiles([])
          }}>
            Raise Another
          </Button>
          <Button onClick={() => navigate('/dashboard/track')}>Track This Complaint</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeUp">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-theme">Raise a Complaint</h1>
        <p className="text-muted-theme text-sm mt-1">Fill in the details below and we'll get back to you promptly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {submitError && (
                <div className="bg-danger-theme/10 border border-danger-theme/20 rounded-xl p-3 text-xs text-danger-theme">
                  ⚠ {submitError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  name="customerName"
                  label="Customer Name"
                  value={form.customerName}
                  onChange={handleChange}
                  disabled
                  hint="Your registered name"
                />
                <Input
                  type="tel"
                  name="phone"
                  label="Phone Number"
                  placeholder="+919876543210"
                  value={form.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  required
                  hint="Required — E.164 format for SMS & WhatsApp updates"
                />
              </div>

              <Select
                name="categoryId"
                label="Complaint Category"
                value={form.categoryId}
                onChange={handleChange}
                error={errors.categoryId}
                required
              >
                <option value="">-- Select a category --</option>
                {dbCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>

              <Input
                name="title"
                label="Complaint Title"
                placeholder="Brief summary of your issue (e.g. Double charge on invoice)"
                value={form.title}
                onChange={handleChange}
                error={errors.title}
                required
              />

              <div>
                <label className="block text-sm font-medium text-text-theme mb-1.5">
                  Description <span className="text-danger-theme">*</span>
                </label>
                <Textarea
                  name="description"
                  placeholder="Describe your complaint in detail. Include dates, amounts, reference numbers, and any steps already taken..."
                  value={form.description}
                  onChange={handleChange}
                  error={errors.description}
                  required
                  rows={5}
                  className={errors.description ? 'border-danger-theme/60' : ''}
                />
                <div className="flex items-center justify-between mt-1.5">
                  {errors.description
                    ? <p className="text-xs text-danger-theme">⚠ {errors.description}</p>
                    : <p className="text-xs text-muted-theme">Minimum 30 characters</p>
                  }
                  <p className="text-xs text-subtle-theme">{form.description.length} chars</p>
                </div>
              </div>

              {/* File upload */}
              <div>
                <label className="block text-sm font-medium text-text-theme mb-1.5">
                  Attach Files <span className="text-subtle-theme text-xs font-normal">(optional, max 5 files, 5MB each)</span>
                </label>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
                    dragOver ? 'border-primary bg-primary-light' : 'border-border-theme hover:border-primary/50 hover:bg-primary-light/30'
                  )}
                >
                  <Upload className="w-8 h-8 text-muted-theme mx-auto mb-2" />
                  <p className="text-sm text-muted-theme">
                    <span className="text-primary font-medium">Click to upload</span> or drag & drop
                  </p>
                  <p className="text-xs text-subtle-theme mt-1">PNG, JPG, PDF, DOC up to 5MB</p>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    onChange={e => handleFiles(e.target.files)}
                  />
                </div>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 bg-bg-alt rounded-lg px-3 py-2">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs text-text-theme flex-1 truncate">{f.name}</span>
                        <span className="text-xs text-subtle-theme">{(f.size / 1024).toFixed(0)} KB</span>
                        <button type="button" onClick={() => removeFile(i)} className="text-muted-theme hover:text-danger-theme transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" size="lg" className="flex-1" loading={loading} leftIcon={!loading ? PlusCircle : undefined}>
                  {loading ? 'Submitting Complaint…' : 'Submit Complaint'}
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right: Info panel */}
        <div className="space-y-4">
          {/* Process timeline */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-text-theme">How it works</h3>
            </div>
            <div className="space-y-4">
              {PROCESS_STEPS.map((step, i) => {
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                      step.active ? 'bg-primary text-white' : 'bg-bg-alt text-muted-theme border border-border-theme'
                    )}>
                      {i + 1}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-sm font-semibold text-text-theme">{step.label}</p>
                      <p className="text-xs text-muted-theme">{step.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Tips */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-secondary" />
              <h3 className="text-sm font-semibold text-text-theme">Helpful Tips</h3>
            </div>
            <ul className="space-y-2">
              {TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-theme">
                  <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </Card>

          {/* FAQ */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-warning-theme" />
              <h3 className="text-sm font-semibold text-text-theme">FAQs</h3>
            </div>
            <FAQAccordion />
          </Card>

          {/* Contact support */}
          <Card className="p-4 bg-primary-light border-primary-mid/30">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-primary">Need immediate help?</p>
            </div>
            <p className="text-xs text-muted-theme mb-3">Our support team is available 24/7 for urgent issues.</p>
            <a href="mailto:support@resolvex.com" className="text-xs text-primary font-medium hover:underline">support@resolvex.com</a>
          </Card>
        </div>
      </div>
    </div>
  )
}
