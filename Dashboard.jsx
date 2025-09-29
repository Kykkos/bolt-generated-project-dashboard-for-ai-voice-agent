import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const COST_PER_MINUTE = 0.16; // €/min

function Dashboard() {
  const [transcriptions, setTranscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
  }, [startDate, endDate]);

  const fetchTranscriptions = async () => {
    setLoading(true);
    let query = supabase.from('transcriptions').select('*');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate + 'T23:59:59'); // Include end of day
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching transcriptions:', error);
    } else {
      setTranscriptions(data);
    }
    setLoading(false);
  };

  // --- Calculations ---
  const totalCalls = transcriptions.length;
  const totalDuration = transcriptions.reduce((sum, call) => sum + (call.duration || 0), 0);
  const totalCost = transcriptions.reduce((sum, call) => sum + (call.cost || 0), 0);
  const successfulCalls = transcriptions.filter(call => call.result === 'success').length;
  const appointmentsTaken = transcriptions.filter(call => call.result === 'appointment_booked').length;

  const averageCostPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;
  const averageCostPerMinute = totalDuration > 0 ? totalCost / totalDuration : 0;
  const averageDurationPerCall = totalCalls > 0 ? totalDuration / totalCalls : 0;
  const costPerAppointment = appointmentsTaken > 0 ? totalCost / appointmentsTaken : 0;
  const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;

  // Data for Cost Tracking Chart
  const costTrackingData = transcriptions.reduce((acc, call) => {
    const date = call.created_at.split('T')[0];
    if (!acc[date]) {
      acc[date] = { date, cost: 0 };
    }
    acc[date].cost += call.cost || 0;
    return acc;
  }, {});
  const formattedCostTrackingData = Object.values(costTrackingData).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Data for Success Rate by Date Chart
  const successRateByDateData = transcriptions.reduce((acc, call) => {
    const date = call.created_at.split('T')[0];
    if (!acc[date]) {
      acc[date] = { date, total: 0, success: 0 };
    }
    acc[date].total += 1;
    if (call.result === 'success' || call.result === 'appointment_booked') {
      acc[date].success += 1;
    }
    return acc;
  }, {});
  const formattedSuccessRateByDateData = Object.values(successRateByDateData)
    .map(item => ({
      date: item.date,
      'Taux de réussite': (item.success / item.total) * 100,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Data for Success Rate by Script
  const successRateByScriptData = transcriptions.reduce((acc, call) => {
    const scriptName = call.script_id || 'N/A';
    if (!acc[scriptName]) {
      acc[scriptName] = { script: scriptName, total: 0, success: 0 };
    }
    acc[scriptName].total += 1;
    if (call.result === 'success' || call.result === 'appointment_booked') {
      acc[scriptName].success += 1;
    }
    return acc;
  }, {});
  const formattedSuccessRateByScriptData = Object.values(successRateByScriptData).map(item => ({
    script: item.script,
    'Taux de réussite': (item.success / item.total) * 100,
  }));

  if (loading) {
    return <div className="dashboard-container">Chargement du tableau de bord...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Tableau de bord</h1>
        <div className="date-filter">
          <label htmlFor="startDate">Du:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          <label htmlFor="endDate">Au:</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
          <button onClick={fetchTranscriptions}>Appliquer</button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Appels en cours (Live)</h3>
          <p className="metric-value">0</p> {/* Placeholder for live calls */}
        </div>
        <div className="metric-card">
          <h3>Coût Total</h3>
          <p className="metric-value">{totalCost.toFixed(2)} €</p>
        </div>
        <div className="metric-card">
          <h3>Coût Moyen par Appel</h3>
          <p className="metric-value">{averageCostPerCall.toFixed(2)} €</p>
        </div>
        <div className="metric-card">
          <h3>Coût Moyen par Minute</h3>
          <p className="metric-value">{averageCostPerMinute.toFixed(2)} €</p>
        </div>
        <div className="metric-card">
          <h3>Durée Moyenne par Appel</h3>
          <p className="metric-value">{averageDurationPerCall.toFixed(2)} min</p>
        </div>
        <div className="metric-card">
          <h3>Durée Totale des Appels</h3>
          <p className="metric-value">{totalDuration.toFixed(2)} min</p>
        </div>
        <div className="metric-card">
          <h3>Nombre d'Appels</h3>
          <p className="metric-value">{totalCalls}</p>
        </div>
        <div className="metric-card">
          <h3>Rendez-vous Pris</h3>
          <p className="metric-value">{appointmentsTaken}</p>
        </div>
        <div className="metric-card">
          <h3>Coût par Rendez-vous</h3>
          <p className="metric-value">{costPerAppointment.toFixed(2)} €</p>
        </div>
        <div className="metric-card">
          <h3>Taux de Réussite Global</h3>
          <p className="metric-value">{successRate.toFixed(2)}%</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Suivi des Coûts par Date</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formattedCostTrackingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip formatter={(value) => [`${value.toFixed(2)} €`, 'Coût']} />
              <Legend />
              <Line type="monotone" dataKey="cost" stroke="#8884d8" activeDot={{ r: 8 }} name="Coût (€)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Taux de Réussite par Date</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formattedSuccessRateByDateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, 'Taux de réussite']} />
              <Legend />
              <Line type="monotone" dataKey="Taux de réussite" stroke="#82ca9d" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Taux de Réussite par Script</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formattedSuccessRateByScriptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="script" stroke="#888" />
              <YAxis stroke="#888" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, 'Taux de réussite']} />
              <Legend />
              <Line type="monotone" dataKey="Taux de réussite" stroke="#ffc658" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
