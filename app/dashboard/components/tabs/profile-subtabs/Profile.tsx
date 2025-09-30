'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSupabase } from '@/contexts/SupabaseContext'

interface ProfileProps {
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

export default function Profile({ userProfile }: ProfileProps) {
  const { updateProfile } = useSupabase()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: userProfile?.first_name || '',
    last_name: userProfile?.last_name || '',
    email: userProfile?.email || ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const { error } = await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name
      })
      
      if (error) {
        console.error('Error updating profile:', error)
        alert('Failed to update profile. Please try again.')
      } else {
        alert('Profile updated successfully!')
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      first_name: userProfile?.first_name || '',
      last_name: userProfile?.last_name || '',
      email: userProfile?.email || ''
    })
    setIsEditing(false)
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.div 
            className="bg-white rounded-lg border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black">Personal Information</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  ) : (
                    <p className="text-black">{userProfile?.first_name || 'Not provided'}</p>
                  )}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  ) : (
                    <p className="text-black">{userProfile?.last_name || 'Not provided'}</p>
                  )}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <p className="text-black">{userProfile?.email || 'Not provided'}</p>
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                  {userProfile?.role || 'user'}
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Confirmed
                </label>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    userProfile?.email_confirmed 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {userProfile?.email_confirmed ? 'Confirmed' : 'Pending'}
                  </span>
                  {!userProfile?.email_confirmed && (
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Resend confirmation
                    </button>
                  )}
                </div>
              </motion.div>

              {isEditing && (
                <motion.div 
                  className="flex space-x-3 pt-4 border-t border-gray-200"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Account Stats */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div 
            className="bg-white rounded-lg border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-black mb-4">Account Stats</h3>
            <div className="space-y-4">
              <motion.div 
                className="flex justify-between"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <span className="text-gray-600">Member since</span>
                <span className="font-medium text-black">
                  {userProfile?.created_at 
                    ? new Date(userProfile.created_at).toLocaleDateString()
                    : 'Unknown'
                  }
                </span>
              </motion.div>
              <motion.div 
                className="flex justify-between"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <span className="text-gray-600">Total Projects</span>
                <span className="font-medium text-black">12</span>
              </motion.div>
              <motion.div 
                className="flex justify-between"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <span className="text-gray-600">Completed Audits</span>
                <span className="font-medium text-black">8</span>
              </motion.div>
              <motion.div 
                className="flex justify-between"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                <span className="text-gray-600">Issues Found</span>
                <span className="font-medium text-black">24</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
