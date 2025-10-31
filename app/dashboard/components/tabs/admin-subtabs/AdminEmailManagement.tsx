'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useSupabase } from '@/contexts/SupabaseContext'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  html_content: string
  text_content: string
  variables: string[]
  template_type: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: 'user' | 'admin'
  email_confirmed: boolean
  created_at: string
  plan_type?: string | null
  plan_name?: string | null
  plan_limit?: number | null
  project_count?: number
}

interface Plan {
  id: string
  name: string
  plan_type: string
  max_projects: number
  features: string[]
  price: number
  is_active: boolean
}


interface AdminEmailManagementProps {
  userProfile: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    role: 'user' | 'admin'
    email_confirmed: boolean
    created_at: string
  }
}

// All template types will now be loaded from the database

export default function AdminEmailManagement({}: AdminEmailManagementProps) {
  const { getUsers } = useSupabase()
  const [activeTab, setActiveTab] = useState<'templates' | 'send'>('templates')
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Template management
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    html_content: '',
    text_content: '',
    template_type: '',
    variables: [] as string[]
  })
  
  // All template types management (system + custom)
  const [allTemplateTypes, setAllTemplateTypes] = useState<Array<{id: string, value: string, label: string, description: string, is_system?: boolean}>>([])
  const [showAddTypeForm, setShowAddTypeForm] = useState(false)
  const [newTypeForm, setNewTypeForm] = useState({
    value: '',
    label: '',
    description: ''
  })
  const [templateTypeError, setTemplateTypeError] = useState<string | null>(null)
  
  // For tracking cursor position in textareas
  const [activeTextarea, setActiveTextarea] = useState<'html' | 'text' | null>(null)
  
  // Send email
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [sending, setSending] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPlan, setFilterPlan] = useState('all')

  


  

  // Get custom template types (all types are considered custom since is_system field doesn't exist)
  const getCustomTemplateTypes = () => {
    return allTemplateTypes
  }

  // Check if template type already exists
  const isTemplateTypeExists = (typeValue: string) => {
    return allTemplateTypes.some(type => type.value === typeValue)
  }

  // Validate template type uniqueness
  const validateTemplateType = (typeValue: string, excludeCurrent?: string) => {
    if (typeValue === excludeCurrent) return true
    return !isTemplateTypeExists(typeValue)
  }

  const getUserDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    if (user.first_name) {
      return user.first_name
    }
    return user.email.split('@')[0]
  }

  const filteredUsers = users.filter(user => {
    const displayName = getUserDisplayName(user)
    const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'verified' && user.email_confirmed) ||
                         (filterStatus === 'unverified' && !user.email_confirmed)
    const matchesPlan = filterPlan === 'all' || 
                       (user.plan_type === filterPlan) ||
                       (filterPlan === 'no-plan' && !user.plan_type)
    
    return matchesSearch && matchesRole && matchesStatus && matchesPlan
  })

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id))
    }
  }

  const insertVariable = (variable: string) => {
    if (!activeTextarea) return

    const field = activeTextarea === 'html' ? 'html_content' : 'text_content'
    const currentValue = templateForm[field]
    
    // For simplicity, we'll append the variable at the end
    // In a real implementation, you'd track cursor position
    setTemplateForm(prev => ({
      ...prev,
      [field]: currentValue + `{{${variable}}}`
    }))
  }

  const calculateUserProjectCounts = useCallback(async (usersData: User[], plansData: Plan[]) => {
    try {
      const usersWithCounts = await Promise.all(
        usersData.map(async (user) => {
          // Get project count from scraped_pages table
          const { count, error } = await supabase
            .from('scraped_pages')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
          
          if (error) {
            console.error(`Error counting projects for user ${user.id}:`, error)
            return { ...user, project_count: 0 }
          }

          // Find the plan details by searching in plans table using plan_type field
          let userPlan = null
          
          if (user.plan_type) {
            // Match by plan_type field (not name field)
            userPlan = plansData.find(plan => plan.plan_type === user.plan_type)
            
            // If no exact match, try case-insensitive match
            if (!userPlan) {
              userPlan = plansData.find(plan => 
                plan.plan_type.toLowerCase() === user.plan_type?.toLowerCase()
              )
            }
          }
          
          const planLimit = userPlan?.max_projects || 0
          const planName = userPlan?.name || (user.plan_type || 'No Plan')

          return {
            ...user,
            project_count: count || 0,
            plan_limit: planLimit,
            plan_name: planName
          }
        })
      )
      return usersWithCounts
    } catch (error) {
      console.error('Error calculating project counts:', error)
      return usersData
    }
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // First load plans
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })
      
      if (plansError) {
        console.error('Error loading plans:', plansError)
      } else {
        setPlans(plansData || [])
      }
      
      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (templatesError) {
        console.error('Error fetching templates:', templatesError)
        setError(`Failed to load templates: ${templatesError.message}`)
        setTemplates([])
      } else {
        setTemplates(templatesData || [])
      }
      
      // Fetch template types from custom_template_types table
      try {
        const { data: templateTypesData, error: templateTypesError } = await supabase
          .from('custom_template_types')
          .select('id, value, label, description')
        
        if (templateTypesError) {
          console.error('Error fetching template types:', templateTypesError)
          console.error('Error details:', JSON.stringify(templateTypesError, null, 2))
          
          // Check for specific error types
          if (templateTypesError.code === 'PGRST116' || templateTypesError.message?.includes('relation "custom_template_types" does not exist')) {
            setError('Template types table does not exist. Please run the database setup script first.')
            setAllTemplateTypes([])
            
            // Show setup instructions
            console.log('Table does not exist. Please run this SQL in your Supabase SQL Editor:')
            console.log(`
CREATE TABLE public.custom_template_types (
  id uuid not null default gen_random_uuid (),
  value character varying(50) not null,
  label character varying(100) not null,
  description text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint custom_template_types_pkey primary key (id),
  constraint custom_template_types_value_key unique (value)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_custom_template_types_value ON public.custom_template_types USING btree (value) TABLESPACE pg_default;
            `)
          } else if (templateTypesError.code === '42703' || templateTypesError.message?.includes('does not exist')) {
            setError('Column does not exist in table. The table structure may be different than expected.')
            setAllTemplateTypes([])
          } else if (templateTypesError.code === '42501' || templateTypesError.message?.includes('permission denied')) {
            setError('Permission denied. You may not have access to the template types table.')
            setAllTemplateTypes([])
          } else if (templateTypesError.code === 'PGRST301' || templateTypesError.message?.includes('JWT')) {
            setError('Authentication error. Please refresh the page and try again.')
            setAllTemplateTypes([])
          } else {
            setError(`Failed to load template types: ${templateTypesError.message || 'Unknown error'}`)
            setAllTemplateTypes([])
          }
        } else {
          if (templateTypesData && templateTypesData.length > 0) {
            // Map the data and add missing is_system field (default to false since field doesn't exist)
            const mappedData = templateTypesData.map(item => ({
              ...item,
              is_system: false // Default to false since is_system field doesn't exist in this table
            }))
            setAllTemplateTypes(mappedData)
            
            // Set default template type if form is empty and we have types
            setTemplateForm(prev => (
              prev.template_type ? prev : { ...prev, template_type: templateTypesData[0].value }
            ))
          } else {
            setAllTemplateTypes([])
            setError('No template types found in database. Please add some template types first.')
          }
        }
      } catch (networkError) {
        console.error('Network error fetching template types:', networkError)
        setError('Network error. Please check your connection and try again.')
        setAllTemplateTypes([])
      }
      
      // Fetch users using the same logic as AdminUsers
      const { data: usersData, error: usersError } = await getUsers()
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        setError(usersError.message || 'Failed to load users')
      } else {
        // Calculate project counts for each user using the same logic as AdminUsers
        const usersWithCounts = await calculateUserProjectCounts(usersData || [], plansData || [])
        setUsers(usersWithCounts)
      }
      
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [getUsers, calculateUserProjectCounts])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: templateForm.name,
            subject: templateForm.subject,
            html_content: templateForm.html_content,
            text_content: templateForm.text_content,
            template_type: templateForm.template_type,
            variables: templateForm.variables
          })
          .eq('id', editingTemplate.id)
        
        if (error) {
          console.error('Error updating template:', error)
          return
        }
      } else {
        // Create new template
        const { error } = await supabase
          .from('email_templates')
          .insert({
            name: templateForm.name,
            subject: templateForm.subject,
            html_content: templateForm.html_content,
            text_content: templateForm.text_content,
            template_type: templateForm.template_type,
            variables: templateForm.variables
          })
        
        if (error) {
          console.error('Error creating template:', error)
          return
        }
      }
      
      setShowTemplateForm(false)
      setEditingTemplate(null)
      setTemplateForm({ name: '', subject: '', html_content: '', text_content: '', template_type: '', variables: [] })
      fetchData()
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content || '',
      template_type: template.template_type || '',
      variables: template.variables
    })
    setShowTemplateForm(true)
  }

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        const { error } = await supabase
          .from('email_templates')
          .delete()
          .eq('id', id)
        
        if (error) {
          console.error('Error deleting template:', error)
        } else {
          fetchData()
        }
      } catch (error) {
        console.error('Error deleting template:', error)
      }
    }
  }

  // Handle adding new custom template type
  const handleAddCustomType = async () => {
    if (!newTypeForm.value.trim() || !newTypeForm.label.trim()) {
      setTemplateTypeError('Value and label are required')
      return
    }

    if (!validateTemplateType(newTypeForm.value)) {
      setTemplateTypeError('Template type already exists')
      return
    }

    try {
      const { error } = await supabase
        .from('custom_template_types')
        .insert({
          value: newTypeForm.value.toLowerCase().replace(/\s+/g, '-'),
          label: newTypeForm.label,
          description: newTypeForm.description
        })
        .select()

      if (error) {
        console.error('Error creating custom template type:', error)
        setTemplateTypeError('Failed to create template type')
        return
      }

      setNewTypeForm({ value: '', label: '', description: '' })
      setShowAddTypeForm(false)
      setTemplateTypeError(null)
      fetchData() // Refresh data to show the new type
    } catch (error) {
      console.error('Error creating custom template type:', error)
      setTemplateTypeError('Failed to create template type')
    }
  }

  // Handle deleting template type (only custom types can be deleted)
  const handleDeleteTemplateType = async (typeValue: string) => {
    const typeToDelete = allTemplateTypes.find(t => t.value === typeValue)
    
    // All types can be deleted since is_system field doesn't exist in this table
    
    // Check if any templates are using this type
    const templatesUsingType = templates.filter(t => t.template_type === typeValue)
    
    if (templatesUsingType.length > 0) {
      const templateNames = templatesUsingType.map(t => t.name).join(', ')
      alert(`Cannot delete this template type. The following template(s) are using it:\n\n${templateNames}\n\nPlease change their type first, then try deleting again.`)
      return
    }

    if (confirm(`Are you sure you want to delete the template type "${typeToDelete?.label}"?\n\nThis action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('custom_template_types')
          .delete()
          .eq('value', typeValue)

        if (error) {
          console.error('Error deleting template type:', error)
          alert('Failed to delete template type')
          return
        }

        // If the deleted type was selected in the form, reset to empty
        if (templateForm.template_type === typeValue) {
          setTemplateForm(prev => ({ ...prev, template_type: '' }))
        }

        fetchData() // Refresh data to remove the deleted type
      } catch (error) {
        console.error('Error deleting template type:', error)
        alert('Failed to delete template type')
      }
    }
  }

  const handleSendBulkEmail = async () => {
    if (selectedUsers.length === 0 || !selectedTemplate) {
      alert('Please select users and a template')
      return
    }

    try {
      setSending(true)
      
      const selectedTemplateData = templates.find(t => t.id === selectedTemplate)
      if (!selectedTemplateData) return

      const selectedUsersData = users.filter(u => selectedUsers.includes(u.id))
      
      for (const user of selectedUsersData) {
        const variables = {
          firstName: user.first_name || 'User',
          lastName: user.last_name || '',
          email: user.email,
          dashboardUrl: `${window.location.origin}/dashboard`,
          planName: user.plan_name || 'No Plan',
          projectCount: user.project_count || 0,
          companyName: 'Web Audit Pro',
          currentDate: new Date().toLocaleDateString()
        }

        // Replace variables in content
        let htmlContent = selectedTemplateData.html_content
        let textContent = selectedTemplateData.text_content || ''
        let subject = selectedTemplateData.subject

        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g')
          htmlContent = htmlContent.replace(regex, String(value))
          textContent = textContent.replace(regex, String(value))
          subject = subject.replace(regex, String(value))
        })

        // Send email with custom template content
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: user.email,
            subject: subject,
            html: htmlContent,
            text: textContent
          })
        })

        if (!response.ok) {
          console.error(`Failed to send email to ${user.email}`)
        }
      }
      
      alert(`Email sent to ${selectedUsersData.length} users successfully!`)
      setSelectedUsers([])
      setSelectedTemplate('')
      
    } catch (error) {
      console.error('Error sending bulk email:', error)
      alert('Error sending emails')
    } finally {
      setSending(false)
    }
  }

  const tabs = [
    { id: 'templates', label: 'Email Templates' },
    { id: 'send', label: 'Send Email' }
  ] as const

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-black mb-2">Loading Email Management</h2>
        <p className="text-gray-600">Fetching templates and user data...</p>
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-black mb-2">Email Management</h1>
        <p className="text-gray-600">Manage email templates and send bulk emails to users</p>
        
        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Template Types</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  {error.includes('table does not exist') && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="font-medium text-yellow-800">Setup Required:</p>
                      <p className="text-yellow-700 text-xs mt-1">
                        Run this SQL in your Supabase SQL Editor to create the table:
                      </p>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{`CREATE TABLE public.custom_template_types (
  id uuid not null default gen_random_uuid (),
  value character varying(50) not null,
  label character varying(100) not null,
  description text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint custom_template_types_pkey primary key (id),
  constraint custom_template_types_value_key unique (value)
);`}
                      </pre>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setError(null)
                      fetchData()
                    }}
                    className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex space-x-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-black">Email Templates</h3>
              <button
                onClick={() => setShowTemplateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + New Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-black">{template.name}</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex flex-col">
                      <span>{template.variables.length} variables</span>
                      <span className="text-blue-600 font-medium">
                        {allTemplateTypes.find(t => t.value === template.template_type)?.label || template.template_type}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded ${
                      template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* All Template Types Management */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-black">All Template Types</h4>
                <button
                  onClick={() => setShowAddTypeForm(true)}
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  + Add Custom Type
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allTemplateTypes.map((type) => (
                  <div key={type.value} className={`rounded-lg p-4 border ${
                    type.is_system 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h5 className="font-medium text-black">{type.label}</h5>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          type.is_system 
                            ? 'bg-gray-200 text-gray-700' 
                            : 'bg-blue-200 text-blue-700'
                        }`}>
                          {type.is_system ? 'System' : 'Custom'}
                        </span>
                        {!type.is_system && (
                          <button
                            onClick={() => handleDeleteTemplateType(type.value)}
                            className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors text-sm font-medium"
                            title="Delete custom type"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={`text-xs font-mono px-2 py-1 rounded ${
                      type.is_system 
                        ? 'text-gray-600 bg-gray-100' 
                        : 'text-blue-600 bg-blue-100'
                    }`}>
                      {type.value}
                    </div>
                  </div>
                ))}
              </div>
              
              {getCustomTemplateTypes().length === 0 && (
                <div className="text-center py-4 bg-blue-50 rounded-lg border border-blue-200 mt-4">
                  <p className="text-blue-600 text-sm">No custom template types yet. Click &quot;Add Custom Type&quot; to create your first one.</p>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Send Email Tab */}
        {activeTab === 'send' && (
          <div className="space-y-6">
           
            
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a template...</option>
                {templates.filter(t => t.is_active).map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-black mb-4">Filter Users</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search users..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
                  <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Plans</option>
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.plan_type}>
                        {plan.name} ({plan.plan_type})
                      </option>
                    ))}
                    <option value="no-plan">No Plan</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  Showing {filteredUsers.length} of {users.length} users
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterRole('all')
                    setFilterStatus('all')
                    setFilterPlan('all')
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* User Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Users ({selectedUsers.length} selected)
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Select
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Projects
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id])
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                              }
                            }}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-medium text-xs">
                                {`${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-black">
                                {user.first_name && user.last_name 
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.first_name || 'User'
                                }
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-black">
                              {user.plan_name || 'No Plan'}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {user.plan_limit === -1 
                                ? 'Unlimited' 
                                : user.plan_limit !== undefined && user.plan_limit !== null
                                  ? `${user.plan_limit} projects`
                                  : user.plan_type 
                                    ? 'No limit set'
                                    : 'No plan assigned'
                              }
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-black">
                              {user.project_count || 0}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {user.plan_limit === -1
                                ? 'unlimited'
                                : user.plan_limit !== undefined && user.plan_limit !== null
                                  ? `of ${user.plan_limit}`
                                  : user.plan_type 
                                    ? 'no limit set'
                                    : 'no plan'
                              }
                            </div>
                            {user.plan_limit && user.project_count && user.project_count > user.plan_limit && (
                              <div className="text-red-500 text-xs font-medium">
                                Exceeded!
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.email_confirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.email_confirmed ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Send Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSendBulkEmail}
                disabled={sending || selectedUsers.length === 0 || !selectedTemplate}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? 'Sending...' : `Send to ${selectedUsers.length} users`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Template Form Modal */}
      {showTemplateForm && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-black mb-4">
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Type</label>
                <div className="flex gap-2">
                  <select
                    value={templateForm.template_type}
                    onChange={(e) => {
                      setTemplateForm({...templateForm, template_type: e.target.value})
                      setTemplateTypeError(null)
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={allTemplateTypes.length === 0}
                  >
                    {allTemplateTypes.length === 0 ? (
                      <option value="">No template types available</option>
                    ) : (
                      allTemplateTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label} - {type.description}
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddTypeForm(true)}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                    title="Add new template type"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {allTemplateTypes.length === 0 
                    ? "No template types found in database. Click + to add the first template type."
                    : "Choose a type to avoid naming conflicts. Click + to add custom types."
                  }
                </p>
                {templateTypeError && (
                  <p className="text-xs text-red-600 mt-1">{templateTypeError}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">HTML Content</label>
                <textarea
                  value={templateForm.html_content}
                  onChange={(e) => setTemplateForm({...templateForm, html_content: e.target.value})}
                  onFocus={() => setActiveTextarea('html')}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text Content</label>
                <textarea
                  value={templateForm.text_content}
                  onChange={(e) => setTemplateForm({...templateForm, text_content: e.target.value})}
                  onFocus={() => setActiveTextarea('text')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              </div>

              {/* Available Variables - Right Side */}
              <div className="lg:col-span-1">
                <div className="sticky top-4">
                  <h4 className="text-md font-medium text-black mb-4">Available Variables</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-3">Click to insert variables:</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => insertVariable('firstName')}
                        className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                      >
                        <code className="text-blue-800 font-mono text-sm">{'{{firstName}}'}</code>
                        <div className="text-xs text-gray-600 mt-1">User&apos;s first name</div>
                      </button>
                      <button
                        onClick={() => insertVariable('lastName')}
                        className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                      >
                        <code className="text-blue-800 font-mono text-sm">{'{{lastName}}'}</code>
                        <div className="text-xs text-gray-600 mt-1">User&apos;s last name</div>
                      </button>
                      <button
                        onClick={() => insertVariable('email')}
                        className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                      >
                        <code className="text-blue-800 font-mono text-sm">{'{{email}}'}</code>
                        <div className="text-xs text-gray-600 mt-1">User&apos;s email address</div>
                      </button>
                      <button
                        onClick={() => insertVariable('dashboardUrl')}
                        className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                      >
                        <code className="text-blue-800 font-mono text-sm">{'{{dashboardUrl}}'}</code>
                        <div className="text-xs text-gray-600 mt-1">Link to user dashboard</div>
                      </button>
                      <button
                        onClick={() => insertVariable('planName')}
                        className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                      >
                        <code className="text-blue-800 font-mono text-sm">{'{{planName}}'}</code>
                        <div className="text-xs text-gray-600 mt-1">User&apos;s current plan</div>
                      </button>
                      <button
                        onClick={() => insertVariable('projectCount')}
                        className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                      >
                        <code className="text-blue-800 font-mono text-sm">{'{{projectCount}}'}</code>
                        <div className="text-xs text-gray-600 mt-1">Number of user&apos;s projects</div>
                      </button>
                      <button
                        onClick={() => insertVariable('companyName')}
                        className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                      >
                        <code className="text-blue-800 font-mono text-sm">{'{{companyName}}'}</code>
                        <div className="text-xs text-gray-600 mt-1">Your company name</div>
                      </button>
                      <button
                        onClick={() => insertVariable('currentDate')}
                        className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                      >
                        <code className="text-blue-800 font-mono text-sm">{'{{currentDate}}'}</code>
                        <div className="text-xs text-gray-600 mt-1">Current date</div>
                      </button>
                    </div>
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800">
                        <strong>Tip:</strong> Click on a textarea first, then click variables to insert them.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowTemplateForm(false)
                  setEditingTemplate(null)
                  setTemplateForm({ name: '', subject: '', html_content: '', text_content: '', template_type: '', variables: [] })
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingTemplate ? 'Update' : 'Create'} Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Template Type Modal */}
      {showAddTypeForm && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-black mb-4">Add Custom Template Type</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value (unique identifier)</label>
                <input
                  type="text"
                  value={newTypeForm.value}
                  onChange={(e) => {
                    setNewTypeForm({...newTypeForm, value: e.target.value})
                    setTemplateTypeError(null)
                  }}
                  placeholder="e.g., newsletter, promotion"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Lowercase, no spaces (will be auto-formatted)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label (display name)</label>
                <input
                  type="text"
                  value={newTypeForm.label}
                  onChange={(e) => setNewTypeForm({...newTypeForm, label: e.target.value})}
                  placeholder="e.g., Newsletter, Promotion"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newTypeForm.description}
                  onChange={(e) => setNewTypeForm({...newTypeForm, description: e.target.value})}
                  placeholder="Brief description of this template type"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {templateTypeError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{templateTypeError}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowAddTypeForm(false)
                  setNewTypeForm({ value: '', label: '', description: '' })
                  setTemplateTypeError(null)
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomType}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Type
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
