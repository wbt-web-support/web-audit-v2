'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export default function TestDatabase() {
  const [testResult, setTestResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult('Testing connection...');

    try {
      // Test 1: Basic connection
      const { data, error } = await supabase
        .from('notify_me')
        .select('count')
        .limit(1);

      if (error) {
        setTestResult(`❌ Connection failed: ${error.message}\nError code: ${error.code}`);
        console.error('Database test error:', error);
        return;
      }

      setTestResult('✅ Database connection successful!\n\nNow testing table structure...');

      // Test 2: Try to insert a test record
      const testEmail = `test-${Date.now()}@example.com`;
      const { data: insertData, error: insertError } = await supabase
        .from('notify_me')
        .insert([
          {
            email: testEmail,
            source: 'test',
            is_active: true
          }
        ])
        .select()
        .single();

      if (insertError) {
        setTestResult(`❌ Insert test failed: ${insertError.message}\nError code: ${insertError.code}\n\nThis usually means:\n1. Table doesn't exist - run the SQL script\n2. RLS policies are blocking inserts\n3. Missing permissions`);
        console.error('Insert test error:', insertError);
        return;
      }

      // Test 3: Try to delete the test record
      const { error: deleteError } = await supabase
        .from('notify_me')
        .delete()
        .eq('id', insertData.id);

      if (deleteError) {
        setTestResult(`✅ Insert successful, but cleanup failed: ${deleteError.message}\n\nYour database is working! The test record was created successfully.`);
        return;
      }

      setTestResult('✅ All tests passed! Your database is properly configured.\n\n- Connection: ✅\n- Table exists: ✅\n- Insert permissions: ✅\n- Delete permissions: ✅');

    } catch (error) {
      setTestResult(`❌ Unexpected error: ${error}`);
      console.error('Unexpected test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Database Connection Test</h1>
        
        <div className="mb-6">
          <button
            onClick={testConnection}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? 'Testing...' : 'Test Database Connection'}
          </button>
        </div>

        {testResult && (
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Test Results:</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}

        <div className="mt-8 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">If tests fail, check:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Your <code>.env.local</code> file has correct Supabase credentials</li>
            <li>You've run the SQL script in your Supabase dashboard</li>
            <li>Your Supabase project is active and not paused</li>
            <li>RLS policies allow public inserts (as defined in the SQL script)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

