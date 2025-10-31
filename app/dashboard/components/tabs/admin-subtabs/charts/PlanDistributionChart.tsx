'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface PlanDistributionChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function PlanDistributionChart({ data }: PlanDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(props: { name?: string; percent?: number }) => `${props.name ?? ''} ${props.percent !== undefined ? (props.percent * 100).toFixed(0) : '0'}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [value, 'Users']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
