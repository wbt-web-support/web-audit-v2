'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase-client';

type FeedbackUser = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  notes: string | null;
  feedback_given: boolean | string | null;
  created_at: string;
};

function normalizeFeedbackGiven(value: boolean | string | null | undefined): boolean {
  if (value === true) return true;
  if (typeof value === 'string') return value.toUpperCase() === 'TRUE';
  return false;
}

function getDisplayName(user: Pick<FeedbackUser, 'first_name' | 'last_name' | 'email'>): string {
  if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
  if (user.first_name) return user.first_name;
  return user.email.split('@')[0];
}

export default function FeedbackShowcase() {
  const [feedbacks, setFeedbacks] = useState<FeedbackUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks
      .filter(u => normalizeFeedbackGiven(u.feedback_given) && !!u.notes && u.notes.trim().length > 0)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [feedbacks]);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id,email,first_name,last_name,notes,feedback_given,created_at')
        .eq('feedback_given', true)
        .order('created_at', { ascending: false })
        .limit(100);
      if (fetchError) {
        setError(fetchError.message || 'Failed to load feedbacks');
      } else {
        // Include string 'TRUE' records too (in case of non-boolean stored values)
        const { data: stringTrueData } = await supabase
          .from('users')
          .select('id,email,first_name,last_name,notes,feedback_given,created_at')
          .eq('feedback_given', 'TRUE')
          .order('created_at', { ascending: false })
          .limit(100);
        const merged = [...(data || []), ...((stringTrueData as FeedbackUser[]) || [])];
        // De-duplicate by id
        const uniqueById = Array.from(new Map(merged.map(u => [u.id, u])).values());
        setFeedbacks(uniqueById as FeedbackUser[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  useEffect(() => {
    // Determine items per view based on screen width (mobile-first)
    const compute = () => {
      const w = window.innerWidth;
      if (w < 640) return 1; // < sm
      if (w < 1024) return 2; // < lg
      if (w < 1280) return 3; // < xl
      return 4;
    };
    const initial = compute();
    setItemsPerView(initial);
    const onResize = () => {
      const val = compute();
      setItemsPerView(prev => (prev !== val ? val : prev));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredFeedbacks.length / Math.max(1, itemsPerView)));
  }, [filteredFeedbacks.length, itemsPerView]);

  useEffect(() => {
    if (showAll) return; // no auto-advance in grid mode
    if (filteredFeedbacks.length <= 1) return;
    const id = setInterval(() => {
      setActivePage(prev => (prev + 1) % totalPages);
    }, 4000);
    return () => clearInterval(id);
  }, [filteredFeedbacks.length, totalPages, showAll]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-black">User Feedback</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff4b01]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-black">User Feedback</h3>
          <button onClick={() => fetchFeedbacks()} className="text-sm px-3 py-1 rounded border border-gray-200 hover:bg-gray-50">Retry</button>
        </div>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  if (filteredFeedbacks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-black">User Feedback</h3>
        </div>
        <p className="text-gray-600 text-sm">No feedback yet.</p>
      </div>
    );
  }

  if (showAll) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-black">User Feedback</h3>
          <div className="flex gap-2">
            <button onClick={() => fetchFeedbacks()} className="text-sm px-3 py-1 rounded border border-gray-200 hover:bg-gray-50">Refresh</button>
            <button onClick={() => setShowAll(false)} className="text-sm px-3 py-1 rounded bg-[#ff4b01] text-white hover:bg-[#e64401]">Carousel</button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFeedbacks.map(item => (
            <div key={item.id} className="rounded-lg border border-gray-200 p-4 bg-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-semibold">
                  {getDisplayName(item).split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <div className="text-black font-medium">{getDisplayName(item)}</div>
                  <div className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{item.notes}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const start = activePage * itemsPerView;
  const pageItems = filteredFeedbacks.slice(start, start + itemsPerView);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-black">User Feedback</h3>
        <div className="flex gap-2">
          <button onClick={() => fetchFeedbacks()} className="text-sm px-3 py-1 rounded border border-gray-200 hover:bg-gray-50">Refresh</button>
          <button onClick={() => setShowAll(true)} className="text-sm px-3 py-1 rounded bg-[#ff4b01] text-white hover:bg-[#e64401]">Show all</button>
        </div>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activePage}-${itemsPerView}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`grid gap-4 grid-cols-${1} sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}>
              {pageItems.map(item => (
                <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-semibold">
                      {getDisplayName(item).split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div className="text-black font-medium">{getDisplayName(item)}</div>
                      <div className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{item.notes}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setActivePage(prev => (prev - 1 + totalPages) % totalPages)}
              className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 text-sm"
            >
              Prev
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <span key={i} className={`h-1.5 w-4 rounded-full ${i === activePage ? 'bg-[#ff4b01]' : 'bg-gray-300'}`}></span>
              ))}
            </div>
            <button
              onClick={() => setActivePage(prev => (prev + 1) % totalPages)}
              className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


