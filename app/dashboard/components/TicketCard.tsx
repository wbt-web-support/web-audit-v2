'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSupabase } from '@/contexts/SupabaseContext'

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

interface TicketMessage {
  id: string
  ticket_id: string
  user_id: string
  message: string
  is_from_support: boolean
  created_at: string
  updated_at: string
}

interface TicketCardProps {
  ticket: Ticket
  onTicketUpdate: () => void
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const { createTicketMessage, getTicketMessages } = useSupabase()
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasDatabaseError, setHasDatabaseError] = useState(false)

  const loadMessages = useCallback(async () => {
    setIsLoading(true)
    try {
      console.log('Loading messages for ticket:', ticket.id)
      const { data, error } = await getTicketMessages(ticket.id)
      
      console.log('Messages response:', { 
        hasData: !!data, 
        hasError: !!error, 
        dataLength: data?.length || 0,
        errorObject: error 
      })
      
      if (error) {
        console.error('Error loading messages:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          hasMessage: !!error.message,
          hasCode: !!error.code,
          errorKeys: Object.keys(error),
          errorStringified: JSON.stringify(error)
        })
        
        // Handle specific error cases
        if (error.code === 'TABLE_NOT_EXISTS' || error.message?.includes('not set up')) {
          console.warn('Ticket messages table not set up. Please run the database migration script.')
        } else if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission denied')) {
          console.warn('Permission denied for ticket messages. Please check RLS policies.')
        } else if (error.code === 'RLS_POLICY_ISSUE' || error.message?.includes('RLS policy issue')) {
          console.warn('RLS policy issue detected. Please run the fix-ticket-messages-rls-permissive.sql script.')
          setHasDatabaseError(true)
        } else if (!error.message || error.message === '' || Object.keys(error).length === 0) {
          console.warn('Empty error object - likely RLS policy issue or database tables not created.')
          // Set a default empty state for messages
          setMessages([])
          setHasDatabaseError(true)
        }
      } else {
        console.log('Successfully loaded messages:', data?.length || 0, 'messages')
        setMessages(data || [])
      }
    } catch (error) {
      console.error('Unexpected error loading messages:', error)
      // Set empty messages array on error to prevent UI issues
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }, [getTicketMessages, ticket.id])

  // Load messages when ticket is expanded
  useEffect(() => {
    if (isExpanded) {
      loadMessages()
    }
  }, [isExpanded, ticket.id, loadMessages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const { data, error } = await createTicketMessage({
        ticket_id: ticket.id,
        message: newMessage.trim(),
        is_from_support: false // User messages are not from support
      })

      if (error) {
        console.error('Error sending message:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          hasMessage: !!error.message,
          hasCode: !!error.code
        })
        
        // Handle specific error cases
        if (error.code === 'TABLE_NOT_EXISTS' || error.message?.includes('not set up')) {
          alert('Ticket system not set up. Please run the database migration script first.')
        } else if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission denied')) {
          alert('Permission denied. Please check your Supabase RLS policies.')
        } else if (!error.message || error.message === '') {
          alert('Database connection issue. Please check your Supabase configuration.')
        } else {
          alert('Failed to send message. Please try again.')
        }
      } else {
        setNewMessage('')
        // Add the new message to the local state instead of reloading
        if (data) {
          setMessages(prev => [...prev, data])
        }
      }
    } catch (error) {
      console.error('Unexpected error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Ticket Header */}
      <div 
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>
            <p className="text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Created: {formatDate(ticket.created_at)}</span>
              <span>Updated: {formatDate(ticket.updated_at)}</span>
              <span>Messages: {messages.length}</span>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-4"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Chat Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200"
          >
            <div className="p-6">
              {/* Messages */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Conversation</h4>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No messages yet. Start the conversation!</p>
                    {hasDatabaseError && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center mb-2">
                          <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <p className="text-sm font-medium text-red-800">Database Setup Required</p>
                        </div>
                        <p className="text-xs text-red-700">
                          The ticket system database tables haven&apos;t been created yet or RLS policies are too restrictive. 
                          Please run the <code className="bg-red-100 px-1 rounded">fix-ticket-messages-rls-permissive.sql</code> script 
                          in your Supabase SQL Editor to fix the RLS policies and enable the chat functionality.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.1 }}
                        className={`flex ${message.is_from_support ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.is_from_support 
                            ? 'bg-gray-100 text-gray-900' 
                            : 'bg-blue-600 text-white'
                        }`}>
                          <p className="text-sm">{message.message}</p>
                          <p className={`text-xs mt-1 ${
                            message.is_from_support ? 'text-gray-500' : 'text-blue-100'
                          }`}>
                            {formatDate(message.created_at)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  disabled={isSubmitting}
                />
                <motion.button
                  type="submit"
                  disabled={!newMessage.trim() || isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? 'Sending...' : 'Send'}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
