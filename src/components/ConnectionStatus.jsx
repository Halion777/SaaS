import React, { useState, useEffect } from 'react';
import { testConnection } from '../services/supabaseClient';

const ConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const result = await testConnection();
      setConnectionStatus(result.success ? 'connected' : 'failed');
      setLastChecked(new Date());
    } catch (error) {
      setConnectionStatus('failed');
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    // Only check connection once on mount, not repeatedly
    checkConnection();
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'checking':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected to Supabase';
      case 'failed':
        return 'Connection failed';
      case 'checking':
        return 'Checking connection...';
      default:
        return 'Unknown status';
    }
  };

  if (connectionStatus === 'connected') {
    return null; // Don't show anything when connected
  }

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${getStatusColor()}`}>
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-500' :
          connectionStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
        }`}></div>
        <span className="text-sm font-medium">{getStatusText()}</span>
        <button
          onClick={checkConnection}
          className="text-xs underline hover:no-underline"
        >
          Retry
        </button>
      </div>
      {lastChecked && (
        <div className="text-xs mt-1 opacity-75">
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus; 