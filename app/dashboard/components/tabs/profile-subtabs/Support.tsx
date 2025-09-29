'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface SupportProps {
  userProfile: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    full_name?: string
    avatar_url?: string
    role: 'user' | 'admin' | 'moderator'
    email_confirmed: boolean
    created_at: string
    updated_at?: string
  }
}

interface Ticket {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  updatedAt: string
  responses: Array<{
    id: string
    message: string
    isFromSupport: boolean
    createdAt: string
  }>
}

export default function Support({ userProfile }: SupportProps) {
  const [activeTab, setActiveTab] = useState<'tickets' | 'new'>('tickets')
  const [isCreatingTicket, setIsCreatingTicket] = useState(false)
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  })

  // Mock tickets data
  const [tickets] = useState<Ticket[]>([
    {
      id: '1',
      title: 'Website audit not working properly',
      description: 'When I try to run an audit on my website, it gets stuck at 50% and never completes.',
      status: 'in_progress',
      priority: 'high',
      createdAt: '2024-01-20T10:30:00Z',
      updatedAt: '2024-01-20T14:30:00Z',
      responses: [
        {
          id: '1',
          message: 'Thank you for reporting this issue. We are investigating the problem and will get back to you soon.',
          isFromSupport: true,
          createdAt: '2024-01-20T11:00:00Z'
        }
      ]
    },
    {
      id: '2',
      title: 'Feature request: Export audit results',
      description: 'It would be great to have the ability to export audit results to PDF or Excel format.',
      status: 'open',
      priority: 'medium',
      createdAt: '2024-01-18T09:15:00Z',
      updatedAt: '2024-01-18T09:15:00Z',
      responses: []
    },
    {
      id: '3',
      title: 'Account billing question',
      description: 'I have a question about my subscription and billing cycle.',
      status: 'resolved',
      priority: 'low',
      createdAt: '2024-01-15T16:45:00Z',
      updatedAt: '2024-01-16T10:30:00Z',
      responses: [
        {
          id: '2',
          message: 'Your billing cycle is monthly and renews on the 15th of each month. You can view your billing history in the Billing tab.',
          isFromSupport: true,
          createdAt: '2024-01-16T10:30:00Z'
        }
      ]
    }
  ])

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
    
    // Simulate ticket creation
    setTimeout(() => {
      setIsCreatingTicket(false)
      setNewTicket({ title: '', description: '', priority: 'medium' })
      alert('Ticket created successfully! Our support team will get back to you soon.')
    }, 1000)
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
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <nav className="-mb-px flex space-x-8">
          <motion.button
            onClick={() => setActiveTab('tickets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
              activeTab === 'tickets'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            My Tickets ({tickets.length})
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('new')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
              activeTab === 'new'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Create New Ticket
          </motion.button>
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
          {tickets.length === 0 ? (
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
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-black">{ticket.title}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{ticket.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                      <span>Responses: {ticket.responses.length}</span>
                    </div>
                  </div>
                  <motion.button 
                    className="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Details →
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {/* Create New Ticket */}
      {activeTab === 'new' && (
        <motion.div 
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ scale: 1.01 }}
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
              <motion.input
                type="text"
                name="title"
                value={newTicket.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                placeholder="Brief description of your issue"
                required
                whileFocus={{ scale: 1.02 }}
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
              <motion.select
                name="priority"
                value={newTicket.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                whileFocus={{ scale: 1.02 }}
              >
                <option value="low">Low - General question or minor issue</option>
                <option value="medium">Medium - Standard support request</option>
                <option value="high">High - Important issue affecting usage</option>
                <option value="urgent">Urgent - Critical issue blocking work</option>
              </motion.select>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <motion.textarea
                name="description"
                value={newTicket.description}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
                required
                whileFocus={{ scale: 1.02 }}
              />
            </motion.div>

            <motion.div 
              className="flex space-x-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <motion.button
                type="submit"
                disabled={isCreatingTicket}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCreatingTicket ? 'Creating Ticket...' : 'Create Ticket'}
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setNewTicket({ title: '', description: '', priority: 'medium' })}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Clear Form
              </motion.button>
            </motion.div>
          </motion.form>
        </motion.div>
      )}

      {/* Support Resources */}
      <motion.div 
        className="bg-gray-50 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        whileHover={{ scale: 1.01 }}
      >
        <h3 className="text-lg font-semibold text-black mb-4">Support Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            className="flex items-start space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
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
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
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
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
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
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
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
