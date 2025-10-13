'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface RevenueChartProps {
  data: Array<{
    month: string
    revenue: number
    users: number
  }>
  type?: 'line' | 'area'
}

export default function RevenueChart({ data, type = 'area' }: RevenueChartProps) {
  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={formatCurrency} />
          <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={formatCurrency} />
        <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
        <Area 
          type="monotone" 
          dataKey="revenue" 
          stroke="#3b82f6" 
          fill="#3b82f6"
          fillOpacity={0.2}
          strokeWidth={3}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
