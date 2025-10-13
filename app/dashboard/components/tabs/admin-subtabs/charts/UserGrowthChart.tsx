'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface UserGrowthChartProps {
  data: Array<{
    month: string
    newUsers: number
    totalUsers: number
  }>
}

export default function UserGrowthChart({ data }: UserGrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip 
          formatter={(value: number, name: string) => [
            value, 
            name === 'newUsers' ? 'New Users' : 'Total Users'
          ]}
        />
        <Bar dataKey="newUsers" fill="#10b981" name="newUsers" />
        <Bar dataKey="totalUsers" fill="#3b82f6" name="totalUsers" />
      </BarChart>
    </ResponsiveContainer>
  )
}
