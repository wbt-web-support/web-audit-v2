'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { AdminAlert } from '@/types/audit';
import { supabase } from '@/lib/supabase-client';
interface UserAlertsProps {
  userPlan?: string;
}
export default function UserAlerts({
  userPlan = 'free'
}: UserAlertsProps) {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  useEffect(() => {
    fetchAlerts();

    // Load dismissed alerts from localStorage
    const dismissed = localStorage.getItem('dismissed-alerts');
    if (dismissed) {
      setDismissedAlerts(new Set(JSON.parse(dismissed)));
    }
  }, [userPlan]);
  const fetchAlerts = async () => {
    try {
      setLoading(true);

      // Get active alerts that are global or match user's plan
      const { data: alerts, error } = await supabase
        .from('admin_alerts')
        .select('*')
        .eq('status', 'active')
        .or(`target_audience.eq.all,target_audience.eq.${userPlan}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching alerts:', error);
        setAlerts([]);
      } else {

        setAlerts(alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };
  const handleDismissAlert = (alertId: string) => {
    const newDismissed = new Set(dismissedAlerts);
    newDismissed.add(alertId);
    setDismissedAlerts(newDismissed);
    localStorage.setItem('dismissed-alerts', JSON.stringify([...newDismissed]));
  };
  const handleAlertClick = async (alert: AdminAlert) => {
    if (alert.action_url) {
      // Track click
      try {
        await supabase.from('admin_alerts').update({
          click_count: 'click_count + 1'
        }).eq('id', alert.id);
      } catch (error) {
        console.error('Error tracking click:', error);
      }

      // Open URL
      window.open(alert.action_url, '_blank');
    }
  };
  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return 'fas fa-info-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'error':
        return 'fas fa-times-circle';
      case 'success':
        return 'fas fa-check-circle';
      case 'maintenance':
        return 'fas fa-tools';
      case 'announcement':
        return 'fas fa-bullhorn';
      case 'offer':
        return 'fas fa-gift';
      default:
        return 'fas fa-bell';
    }
  };

  // Filter out dismissed alerts and only show active ones, then deduplicate by ID
  const filteredAlerts = alerts.filter(alert => alert.status === 'active' && !dismissedAlerts.has(alert.id) && new Date(alert.start_date) <= new Date() && (!alert.end_date || new Date(alert.end_date) >= new Date()));

  // Deduplicate alerts by ID to prevent showing duplicates
  const uniqueAlerts = filteredAlerts.reduce((acc, alert) => {
    if (!acc.find(a => a.id === alert.id)) {
      acc.push(alert);
    }
    return acc;
  }, [] as AdminAlert[]);

  const visibleAlerts = uniqueAlerts;
  if (loading) {
    return null;
  }

  // Debug logging

  if (visibleAlerts.length === 0) {
    return null;
  }
  return <div className="space-y-3 mb-6">
      <AnimatePresence>
        {visibleAlerts.map((alert, index) => <motion.div key={`${alert.id}-${index}`} initial={{
        opacity: 0,
        y: -20,
        scale: 0.95
      }} animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }} exit={{
        opacity: 0,
        y: -20,
        scale: 0.95
      }} transition={{
        duration: 0.3,
        delay: index * 0.1
      }} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="text-gray-600 mt-1">
                  <i className={`${getAlertTypeIcon(alert.alert_type)} text-lg`}></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {alert.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {alert.message}
                  </p>
                  {alert.action_url && alert.action_text && <button onClick={() => handleAlertClick(alert)} className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                      {alert.action_text}
                      <i className="fas fa-external-link-alt ml-1 text-xs"></i>
                    </button>}
                </div>
              </div>

              {alert.dismissible && <button onClick={() => handleDismissAlert(alert.id)} className="ml-3 text-gray-400 hover:text-gray-600 transition-colors" title="Dismiss alert">
                  <i className="fas fa-times"></i>
                </button>}
            </div>

            {/* Priority indicator for high priority alerts */}
            {alert.priority >= 8 && <div className="absolute top-2 right-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <i className="fas fa-star mr-1"></i>
                  High Priority
                </span>
              </div>}
          </motion.div>)}
      </AnimatePresence>
    </div>;
}