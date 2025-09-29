import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Calls.css';

function Calls() {
  const [transcriptions, setTranscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });

  useEffect(() => {
    fetchTranscriptions();

    const subscription = supabase
      .channel('public:transcriptions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transcriptions' }, payload => {
        console.log('Change received!', payload);
        fetchTranscriptions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchTranscriptions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transcriptions:', error);
    } else {
      setTranscriptions(data);
    }
    setLoading(false);
  };

  const sortedTranscriptions = React.useMemo(() => {
    let sortableItems = [...transcriptions];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [transcriptions, sortConfig]);

  const filteredTranscriptions = sortedTranscriptions.filter(call =>
    Object.values(call).some(
      value =>
        value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    }
    return '';
  };

  if (loading) {
    return <div className="calls-container">Chargement des appels...</div>;
  }

  return (
    <div className="calls-container">
      <div className="calls-header">
        <h1>Appels</h1>
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="calls-table-wrapper">
        <table className="calls-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('call_id')}>Call ID{getSortIndicator('call_id')}</th>
              <th onClick={() => requestSort('duration')}>Durée (min){getSortIndicator('duration')}</th>
              <th onClick={() => requestSort('cost')}>Coût (€){getSortIndicator('cost')}</th>
              <th onClick={() => requestSort('assistant_name')}>Assistant{getSortIndicator('assistant_name')}</th>
              <th onClick={() => requestSort('script_id')}>Script ID{getSortIndicator('script_id')}</th>
              <th onClick={() => requestSort('result')}>Résultat{getSortIndicator('result')}</th>
              <th onClick={() => requestSort('created_at')}>Date{getSortIndicator('created_at')}</th>
              <th>Lien Vapi.ai</th>
            </tr>
          </thead>
          <tbody>
            {filteredTranscriptions.length > 0 ? (
              filteredTranscriptions.map(call => (
                <tr key={call.call_id}>
                  <td>{call.call_id}</td>
                  <td>{call.duration ? call.duration.toFixed(2) : 'N/A'}</td>
                  <td>{call.cost ? call.cost.toFixed(2) : 'N/A'}</td>
                  <td>{call.assistant_name || 'N/A'}</td>
                  <td>{call.script_id || 'N/A'}</td>
                  <td>{call.result || 'N/A'}</td>
                  <td>{new Date(call.created_at).toLocaleString()}</td>
                  <td>
                    {call.call_id && (
                      <a
                        href={`https://dashboard.vapi.ai/calls/${call.call_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vapi-link"
                      >
                        Voir l'appel
                      </a>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8">Aucun appel trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Calls;
