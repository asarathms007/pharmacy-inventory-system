import { useState, useEffect } from 'react';
import { getAuditLogs } from '../services/api';
import { format } from 'date-fns';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await getAuditLogs();
      setLogs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getBadgeColor = (action) => {
    switch(action) {
      case 'Create': return 'badge-teal';
      case 'Update': return 'badge-blue';
      case 'Delete': return 'badge-rose';
      case 'Sale': return 'badge-purple';
      case 'Purchase': return 'badge-orange';
      default: return 'badge-muted';
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">📋 Audit Logs</h2>
          <p className="page-subtitle">Track system activity and user actions</p>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td>{format(new Date(log.createdAt), 'dd MMM yyyy, hh:mm a')}</td>
                    <td className="td-primary">{log.user?.name || 'System'}</td>
                    <td><span className={`badge ${getBadgeColor(log.action)}`}>{log.action}</span></td>
                    <td>{log.module}</td>
                    <td>{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default AuditLogs;
