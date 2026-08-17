import React, { useEffect, useState } from 'react';

interface NHI {
  id: number;
  name: string;
  owner: string;
  purpose: string;
  scopes: string[];
  credential_type: string;
  expires_at: string;
  created_at: string;
}

interface AuditLog {
  id: number;
  nhi_id: number;
  nhi_name: string;
  action: string;
  resource: string;
  allowed: boolean;
  reason: string;
  timestamp: string;
}

function App() {
  const [nhis, setNhis] = useState<NHI[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const fetchNhis = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/nhis`);
      if (res.ok) {
        setNhis(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/audit`);
      if (res.ok) {
        setAuditLogs(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNhis();
    fetchAuditLogs();
    const interval = setInterval(() => {
      fetchNhis();
      fetchAuditLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Non-Human Identity Governance</h1>
          <p className="text-gray-600 mt-2">Manage and monitor AI agents, bots, and service accounts.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* NHI Registry */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Active NHIs</h2>
            <div className="space-y-4">
              {nhis.length === 0 ? <p className="text-sm text-gray-500">No NHIs found.</p> : nhis.map(nhi => (
                <div key={nhi.id} className="border rounded-md p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-indigo-700">{nhi.name}</h3>
                      <p className="text-sm text-gray-600">Owner: {nhi.owner}</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {nhi.credential_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{nhi.purpose}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {nhi.scopes.map((scope, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded">
                        {scope}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400 mt-4 text-right">
                    Expires: {new Date(nhi.expires_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Real-time Audit Log</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {auditLogs.length === 0 ? <p className="text-sm text-gray-500">No audit logs found.</p> : auditLogs.map(log => (
                <div key={log.id} className={`border-l-4 p-3 rounded bg-gray-50 shadow-sm ${log.allowed ? 'border-green-500' : 'border-red-500'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-gray-800">{log.nhi_name || 'Unknown'}</span>
                    <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Action:</span> <code className="bg-gray-200 px-1 rounded">{log.action}</code>
                    <span className="ml-2 text-gray-600">Resource:</span> <code className="bg-gray-200 px-1 rounded">{log.resource}</code>
                  </div>
                  <div className="mt-2 text-sm flex items-center justify-between">
                    <span className={log.allowed ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {log.allowed ? 'ALLOWED' : 'DENIED'}
                    </span>
                    <span className="text-gray-500 text-xs italic">{log.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
