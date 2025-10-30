'use client'

import React, { useState } from 'react'

interface FeedbackModalProps {
	open: boolean
	onConfirm: (text: string) => void
	onLater: () => void
}

export default function FeedbackModal({ open, onConfirm, onLater }: FeedbackModalProps) {
	const [text, setText] = useState('')
	const [submitting, setSubmitting] = useState(false)
  const trimmed = text.trim()
  const isValid = trimmed.length > 0

	if (!open) return null

	const handleSubmit = async () => {
		if (submitting) return
		if (!isValid) return
		setSubmitting(true)
		try {
			onConfirm(trimmed)
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
			<div className="w-full sm:max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
				<div className="p-5 sm:p-6">
					<h3 className="text-base sm:text-lg font-semibold text-slate-900">Help us shape upcoming features</h3>
					<p className="mt-2 text-sm text-slate-600">We’re improving crawl accuracy, performance insights, SEO checks, and the dashboard UX. What’s missing or rough for you right now?</p>

					<div className="mt-4">
						<label htmlFor="feedback" className="sr-only">Your feedback</label>
						<textarea
							id="feedback"
							value={text}
							onChange={(e) => setText(e.target.value)}
							rows={4}
							placeholder="Write a short feedback..."
							className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
							aria-invalid={!isValid}
						/>
						
					</div>

					<div className="mt-5 grid grid-cols-2 gap-3">
						<button
							type="button"
							className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none"
							onClick={onLater}
						>
							Later
						</button>
						<button
							type="button"
							disabled={submitting || !isValid}
							className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-3 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-60 focus:outline-none"
							onClick={handleSubmit}
						>
							Submit
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}


