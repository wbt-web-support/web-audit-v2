'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
interface AdminSupportProps {
  userProfile: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: 'user' | 'admin';
    email_confirmed: boolean;
    created_at: string;
  };
}
interface Ticket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  user_email?: string;
  user_name?: string;
}
interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_from_support: boolean;
  created_at: string;
  updated_at: string;
}
export default function AdminSupport({}: AdminSupportProps) {
  const {
    getTickets,
    getTicketMessages,
    createTicketMessage,
    updateTicket,
    testTicketSystemConnection
  } = useSupabase();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);
    setTicketsError(null);
    try {
      if (!getTickets) {
        console.error('getTickets function is not available');
        setTicketsError('getTickets function is not available');
        return;
      }

      // First test the database connection

      const connectionTest = await testTicketSystemConnection();
      if (!connectionTest.success) {
        console.error('Ticket system connection failed:', connectionTest.error);
        if (connectionTest.code === 'TABLE_NOT_EXISTS' || connectionTest.error?.includes('does not exist')) {
          setTicketsError('Ticket system not set up. Please run the database migration script first.');
        } else if (connectionTest.code === 'PERMISSION_DENIED' || connectionTest.error?.includes('permission denied')) {
          setTicketsError('Permission denied. Please check your Supabase RLS policies and run the database migration script.');
        } else {
          setTicketsError(`Database connection issue: ${connectionTest.error}`);
        }
        return;
      }

      // If connection test passes, try to fetch tickets
      const {
        data,
        error
      } = await getTickets();
      if (error) {
        console.error('Error loading tickets:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          hasMessage: !!error.message,
          hasCode: !!error.code
        });
        if (error.code === 'TABLE_NOT_EXISTS') {
          setTicketsError('Ticket system not set up. Please run the database migration script first.');
        } else if (!error.message || error.message === '') {
          setTicketsError('Database connection issue. Please check your Supabase configuration.');
        } else {
          setTicketsError(error.message || 'Failed to load tickets');
        }
      } else {
        setTickets(data || []);
      }
    } catch (error) {
      console.error('Unexpected error loading tickets:', error);
      setTicketsError('Failed to load tickets');
    } finally {
      setTicketsLoading(false);
    }
  }, [getTickets, testTicketSystemConnection]);

  // Load tickets on component mount
  useEffect(() => {
    loadTickets();
  }, [loadTickets]);
  const loadTicketMessages = async (ticketId: string) => {
    try {
      const {
        data,
        error
      } = await getTicketMessages(ticketId);
      if (error) {
        console.error('Error loading ticket messages:', error);
        setTicketMessages([]);
      } else {
        setTicketMessages(data || []);
      }
    } catch (error) {
      console.error('Unexpected error loading ticket messages:', error);
      setTicketMessages([]);
    }
  };
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket || isSubmittingMessage) return;
    setIsSubmittingMessage(true);
    try {
      const {
        data,
        error
      } = await createTicketMessage({
        ticket_id: selectedTicket.id,
        message: newMessage.trim(),
        is_from_support: true // Admin messages are from support
      });
      if (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
      } else {
        setNewMessage('');
        // Reload messages to show the new one
        await loadTicketMessages(selectedTicket.id);
      }
    } catch (error) {
      console.error('Unexpected error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmittingMessage(false);
    }
  };
  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const {
        data,
        error
      } = await updateTicket(ticketId, {
        status: newStatus as 'open' | 'in_progress' | 'resolved' | 'closed',
        ...(newStatus === 'resolved' && {
          resolved_at: new Date().toISOString()
        }),
        ...(newStatus === 'closed' && {
          closed_at: new Date().toISOString()
        })
      });
      if (error) {
        console.error('Error updating ticket:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          hasMessage: !!error.message,
          hasCode: !!error.code
        });

        // Handle specific error cases
        if (error.code === 'TABLE_NOT_EXISTS' || error.message?.includes('not set up')) {
          alert('Ticket system not set up. Please run the database migration script first.');
        } else if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission denied')) {
          alert('Permission denied. Please check your Supabase RLS policies and run the fix-ticket-update-rls-permissive.sql script.');
        } else if (error.code === 'RLS_POLICY_ISSUE' || error.message?.includes('RLS policy issue')) {
          alert('RLS policy issue detected. Please run the fix-ticket-update-rls-permissive.sql script in your Supabase SQL Editor.');
        } else if (!error.message || error.message === '') {
          alert('Database connection issue. Please check your Supabase configuration and run the fix-ticket-update-rls-permissive.sql script.');
        } else {
          alert(`Failed to update ticket status: ${error.message}`);
        }
      } else {
        // Reload tickets to show updated status
        await loadTickets();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({
            ...selectedTicket,
            status: newStatus as 'open' | 'in_progress' | 'resolved' | 'closed'
          });
        }
      }
    } catch (error) {
      console.error('Unexpected error updating ticket:', error);
      alert('Failed to update ticket status. Please try again.');
    }
  };
  const handleSelectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    await loadTicketMessages(ticket.id);
  };

  // Calculate stats from actual data
  const supportStats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
    resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
    closedTickets: tickets.filter(t => t.status === 'closed').length,
    highPriorityTickets: tickets.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
    averageResolutionTime: '4.2 hours',
    // This would need to be calculated from actual data
    customerSatisfaction: '4.8/5',
    // This would need to be calculated from actual data
    responseTime: '12 minutes' // This would need to be calculated from actual data
  };

  // Filter tickets based on selected filters
  const filteredTickets = tickets.filter(ticket => {
    const statusMatch = filterStatus === 'all' || ticket.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || ticket.priority === filterPriority;
    return statusMatch && priorityMatch;
  });
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return <motion.div className="space-y-6" initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5
  }}>
      {/* Header */}
      <motion.div className="bg-white rounded-lg border border-gray-200 p-6" initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5,
      delay: 0.1
    }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Support Management</h1>
            <p className="text-gray-600">Monitor support tickets and team performance</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={loadTickets} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Refresh
            </button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
              Export Data
            </button>
          </div>
        </div>
      </motion.div>

      {/* Support Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[{
        label: 'Total Tickets',
        value: supportStats.totalTickets,
        color: 'blue'
      }, {
        label: 'Open Tickets',
        value: supportStats.openTickets,
        color: 'red'
      }, {
        label: 'In Progress',
        value: supportStats.inProgressTickets,
        color: 'yellow'
      }, {
        label: 'Resolved',
        value: supportStats.resolvedTickets,
        color: 'green'
      }, {
        label: 'Closed',
        value: supportStats.closedTickets,
        color: 'gray'
      }, {
        label: 'High Priority',
        value: supportStats.highPriorityTickets,
        color: 'orange'
      }].map((stat, index) => <motion.div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-6" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5,
        delay: 0.2 + index * 0.1
      }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-black mt-1">{stat.value}</p>
              </div>
              <div className={`w-3 h-3 rounded-full bg-${stat.color}-500`}></div>
            </div>
          </motion.div>)}
      </div>

      {/* Ticket Analytics */}
      {/* <motion.div className="bg-white rounded-lg border border-gray-200 p-6" initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5,
      delay: 0.3
    }}>
        <h3 className="text-lg font-semibold text-black mb-4">Ticket Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {supportStats.totalTickets > 0 ? (supportStats.resolvedTickets / supportStats.totalTickets * 100).toFixed(1) : 0}%
            </div>
            <div className="text-sm text-gray-600">Resolution Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {supportStats.averageResolutionTime}
            </div>
            <div className="text-sm text-gray-600">Avg Resolution Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {supportStats.customerSatisfaction}
            </div>
            <div className="text-sm text-gray-600">Customer Satisfaction</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {supportStats.responseTime}
            </div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>
        </div>
      </motion.div> */}

      {/* Filters */}
      <motion.div className="bg-white rounded-lg border border-gray-200 p-6" initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5,
      delay: 0.3
    }}>
        <h3 className="text-lg font-semibold text-black mb-4">Filter Tickets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => {
            setFilterStatus('all');
            setFilterPriority('all');
          }} className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              Clear Filters
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tickets List */}
      {ticketsLoading ? <motion.div className="bg-white rounded-lg border border-gray-200 p-6" initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5,
      delay: 0.4
    }}>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading tickets...</span>
          </div>
        </motion.div> : ticketsError ? <motion.div className="bg-white rounded-lg border border-gray-200 p-6" initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5,
      delay: 0.4
    }}>
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{ticketsError}</p>
            <button onClick={loadTickets} className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              Try again
            </button>
          </div>
        </motion.div> : filteredTickets.length === 0 ? <motion.div className="bg-white rounded-lg border border-gray-200 p-6" initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5,
      delay: 0.4
    }}>
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-black">No tickets found</h3>
            <p className="mt-1 text-sm text-gray-500">No tickets match your current filters.</p>
          </div>
        </motion.div> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tickets List */}
          <motion.div className="bg-white rounded-lg border border-gray-200 p-6" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5,
        delay: 0.4
      }}>
            <h3 className="text-lg font-semibold text-black mb-4">Tickets ({filteredTickets.length})</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredTickets.map((ticket, index) => <motion.div key={ticket.id} className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedTicket?.id === ticket.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.3,
            delay: 0.5 + index * 0.1
          }} onClick={() => handleSelectTicket(ticket)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-black">#{ticket.id.slice(0, 8)}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-black mb-1">{ticket.title}</p>
                      <p className="text-xs text-gray-500">User: {ticket.user_id}</p>
                      <p className="text-xs text-gray-500">Created: {formatDate(ticket.created_at)}</p>
                    </div>
                  </div>
                </motion.div>)}
            </div>
          </motion.div>

          {/* Selected Ticket Details */}
          {selectedTicket && <motion.div className="bg-white rounded-lg border border-gray-200 p-6" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5,
        delay: 0.5
      }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black">Ticket #{selectedTicket.id.slice(0, 8)}</h3>
                <div className="flex space-x-2">
                  <select value={selectedTicket.status} onChange={e => handleUpdateTicketStatus(selectedTicket.id, e.target.value)} className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-black mb-2">{selectedTicket.title}</h4>
                  <p className="text-sm text-gray-600">{selectedTicket.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Priority:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 text-black">{formatDate(selectedTicket.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated:</span>
                    <span className="ml-2 text-black">{formatDate(selectedTicket.updated_at)}</span>
                  </div>
                </div>

                {/* Messages */}
                <div className="border-t border-gray-200 pt-4">
                  <h5 className="font-medium text-black mb-3">Conversation</h5>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {ticketMessages.map((message, index) => <motion.div key={message.id} className={`p-3 rounded-lg ${message.is_from_support ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50 border-l-4 border-gray-300'}`} initial={{
                opacity: 0,
                x: -20
              }} animate={{
                opacity: 1,
                x: 0
              }} transition={{
                duration: 0.3,
                delay: index * 0.1
              }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600">
                            {message.is_from_support ? 'Support' : 'User'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-black">{message.message}</p>
                      </motion.div>)}
                  </div>

                  {/* Send Message */}
                  <form onSubmit={handleSendMessage} className="mt-4">
                    <div className="flex space-x-2">
                      <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type your response..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={isSubmittingMessage} />
                      <button type="submit" disabled={!newMessage.trim() || isSubmittingMessage} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmittingMessage ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>}
        </div>}

    </motion.div>;
}