'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSupabase } from '@/contexts/SupabaseContext'
import TicketCard from '../../TicketCard'

interface SupportProps {
  userProfile: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    full_name?: string
    avatar_url?: string
    role: 'user' | 'admin'
    email_confirmed: boolean
    created_at: string
    updated_at?: string
  }
}

interface Ticket {
  id: string
  user_id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  updated_at: string
  assigned_to: string | null
  resolved_at: string | null
  closed_at: string | null
}

export default function Support({ userProfile }: SupportProps) {
  const { createTicket, getTickets, testTicketSystemConnection } = useSupabase()
  const [activeTab, setActiveTab] = useState<'tickets' | 'new'>('tickets')
  const [isCreatingTicket, setIsCreatingTicket] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [ticketsError, setTicketsError] = useState<string | null>(null)
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  })

  // Load tickets on component mount
  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    setTicketsLoading(true)
    setTicketsError(null)
    try {
      if (!getTickets) {
        console.error('getTickets function is not available')
        setTicketsError('getTickets function is not available')
        return
      }
      
      // First test the database connection
      console.log('Testing ticket system connection...')
      const connectionTest = await testTicketSystemConnection()
      console.log('Connection test result:', connectionTest)
      
      if (!connectionTest.success) {
        console.error('Ticket system connection failed:', connectionTest.error)
        if (connectionTest.code === 'TABLE_NOT_EXISTS' || connectionTest.error?.includes('does not exist')) {
          setTicketsError('Ticket system not set up. Please run the database migration script first.')
        } else if (connectionTest.code === 'PERMISSION_DENIED' || connectionTest.error?.includes('permission denied')) {
          setTicketsError('Permission denied. Please check your Supabase RLS policies and run the database migration script.')
        } else {
          setTicketsError(`Database connection issue: ${connectionTest.error}`)
        }
        return
      }
      
      // If connection test passes, try to fetch tickets
      const { data, error } = await getTickets()
      if (error) {
        console.error('Error loading tickets:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          hasMessage: !!error.message,
          hasCode: !!error.code
        })
        
        if (error.code === 'TABLE_NOT_EXISTS') {
          setTicketsError('Ticket system not set up. Please run the database migration script first.')
        } else if (!error.message || error.message === '') {
          setTicketsError('Database connection issue. Please check your Supabase configuration.')
        } else {
          setTicketsError(error.message || 'Failed to load tickets')
        }
      } else {
        setTickets(data || [])
      }
    } catch (error) {
      console.error('Unexpected error loading tickets:', error)
      setTicketsError('Failed to load tickets')
    } finally {
      setTicketsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewTicket(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingTicket(true)
    
    try {
      const { data, error } = await createTicket({
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        status: 'open'
      })

      if (error) {
        console.error('Error creating ticket:', error)
        if (error.code === 'TABLE_NOT_EXISTS') {
          alert('Ticket system not set up. Please run the database migration script first.')
        } else {
          alert('Failed to create ticket. Please try again.')
        }
      } else {
      setNewTicket({ title: '', description: '', priority: 'medium' })
      alert('Ticket created successfully! Our support team will get back to you soon.')
        // Add the new ticket to the local state instead of reloading
        if (data) {
          setTickets(prev => [data, ...prev])
        }
        // Switch to tickets tab to show the new ticket
        setActiveTab('tickets')
      }
    } catch (error) {
      console.error('Unexpected error creating ticket:', error)
      alert('Failed to create ticket. Please try again.')
    } finally {
      setIsCreatingTicket(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Support Tabs */}
      <motion.div 
        className="border-b border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-300 ${
              activeTab === 'tickets'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
            }`}
          >
            My Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-300 ${
              activeTab === 'new'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
            }`}
          >
            Create New Ticket
          </button>
        </nav>
      </motion.div>

      {/* Tickets List */}
      {activeTab === 'tickets' && (
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {ticketsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : ticketsError ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">{ticketsError}</p>
              {ticketsError.includes('not set up') || ticketsError.includes('does not exist') ? (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>🚨 Setup Required:</strong> The ticket system database tables haven&apos;t been created yet.
                  </p>
                  <p className="text-xs text-yellow-700 mb-2">
                    <strong>Quick Fix:</strong> Go to your Supabase dashboard → SQL Editor → Run the <code className="bg-yellow-100 px-1 rounded">create-tickets-table-fixed.sql</code> script.
                  </p>
                  <p className="text-xs text-yellow-600">
                    This will create the necessary tables and enable the full ticket system functionality.
                  </p>
                </div>
              ) : ticketsError.includes('permission denied') ? (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-red-800 mb-2">
                    <strong>🔒 Permission Issue:</strong> Database access is restricted by Row Level Security policies.
                  </p>
                  <p className="text-xs text-red-700 mb-2">
                    <strong>Solution:</strong> Run the <code className="bg-red-100 px-1 rounded">create-tickets-table-fixed.sql</code> script to set up proper RLS policies.
                  </p>
                  <p className="text-xs text-red-600">
                    This will create the tables and configure the necessary permissions.
                  </p>
                </div>
              ) : (
                <button 
                  onClick={loadTickets}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Try again
                </button>
              )}
            </div>
          ) : tickets.length === 0 ? (
            <motion.div 
              className="text-center py-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </motion.svg>
              <h3 className="mt-2 text-sm font-medium text-black">No tickets yet</h3>
              <p className="mt-1 text-sm text-gray-500">Create your first support ticket to get help.</p>
            </motion.div>
          ) : (
            tickets.map((ticket, index) => (
              <motion.div 
                key={ticket.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <TicketCard 
                  ticket={ticket} 
                  onTicketUpdate={loadTickets}
                />
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {/* Create New Ticket */}
      {activeTab === 'new' && (
        <motion.div 
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-black mb-6">Create New Support Ticket</h2>
          <motion.form 
            onSubmit={handleCreateTicket} 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ticket Title
              </label>
              <input
                type="text"
                name="title"
                value={newTicket.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                placeholder="Brief description of your issue"
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={newTicket.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              >
                <option value="low">Low - General question or minor issue</option>
                <option value="medium">Medium - Standard support request</option>
                <option value="high">High - Important issue affecting usage</option>
                <option value="urgent">Urgent - Critical issue blocking work</option>
              </select>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={newTicket.description}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
                required
              />
            </motion.div>

            <motion.div 
              className="flex space-x-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <button
                type="submit"
                disabled={isCreatingTicket}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingTicket ? 'Creating Ticket...' : 'Create Ticket'}
              </button>
              <button
                type="button"
                onClick={() => setNewTicket({ title: '', description: '', priority: 'medium' })}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Clear Form
              </button>
            </motion.div>
          </motion.form>
        </motion.div>
      )}

      {/* Support Resources */}
      <motion.div 
        className="bg-gray-50 rounded p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-black mb-4">Support Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            className="flex items-start space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <span className="text-blue-600 text-sm">📚</span>
            </div>
            <div>
              <h4 className="font-medium text-black">Documentation</h4>
              <p className="text-sm text-gray-600">Browse our comprehensive guides and tutorials</p>
            </div>
          </motion.div>
          <motion.div 
            className="flex items-start space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <span className="text-blue-600 text-sm">💬</span>
            </div>
            <div>
              <h4 className="font-medium text-black">Live Chat</h4>
              <p className="text-sm text-gray-600">Get instant help from our support team</p>
            </div>
          </motion.div>
          <motion.div 
            className="flex items-start space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <span className="text-blue-600 text-sm">🎥</span>
            </div>
            <div>
              <h4 className="font-medium text-black">Video Tutorials</h4>
              <p className="text-sm text-gray-600">Watch step-by-step video guides</p>
            </div>
          </motion.div>
          <motion.div 
            className="flex items-start space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <span className="text-blue-600 text-sm">❓</span>
            </div>
            <div>
              <h4 className="font-medium text-black">FAQ</h4>
              <p className="text-sm text-gray-600">Find answers to common questions</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
