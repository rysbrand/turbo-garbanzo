import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client.js';

function getPayPeriod(date = new Date()) {
  // Anchor date — first pay period start (a known Monday)
  const anchor = new Date('2026-01-05');
  const diff = Math.floor((date - anchor) / (1000 * 60 * 60 * 24 * 14));
  const periodStart = new Date(anchor);
  periodStart.setDate(anchor.getDate() + diff * 14);
  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodStart.getDate() + 13);
  periodEnd.setHours(23, 59, 59, 999);
  return { periodStart, periodEnd };
}

function getPreviousPayPeriod(date = new Date()) {
  const { periodStart } = getPayPeriod(date);
  const prevEnd = new Date(periodStart);
  prevEnd.setDate(prevEnd.getDate() - 1);
  prevEnd.setHours(23, 59, 59, 999);
  return getPayPeriod(prevEnd);
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function calcHours(clockIn, clockOut) {
  if (!clockIn || !clockOut) return 0;
  return (new Date(clockOut) - new Date(clockIn)) / (1000 * 60 * 60);
}

function formatHours(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

const Pay = () => {
  const [compensation, setCompensation] = useState(null);
  const [currentEntries, setCurrentEntries] = useState([]);
  const [previousEntries, setPreviousEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { periodStart, periodEnd } = getPayPeriod();
  const { periodStart: prevStart, periodEnd: prevEnd } = getPreviousPayPeriod();

  useEffect(() => {
    const fetchPayData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch compensation info
        const { data: compData, error: compError } = await supabase
          .from('employee_compensation')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (compError) throw compError;
        setCompensation(compData);

        // Fetch current pay period entries
        const { data: currentData, error: currentError } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', user.id)
          .gte('clock_in', periodStart.toISOString())
          .lte('clock_in', periodEnd.toISOString())
          .not('clock_out', 'is', null)
          .order('clock_in', { ascending: true });

        if (currentError) throw currentError;
        setCurrentEntries(currentData || []);

        // Fetch previous pay period entries
        const { data: prevData, error: prevError } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', user.id)
          .gte('clock_in', prevStart.toISOString())
          .lte('clock_in', prevEnd.toISOString())
          .not('clock_out', 'is', null)
          .order('clock_in', { ascending: true });

        if (prevError) throw prevError;
        setPreviousEntries(prevData || []);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayData();
  }, []);

  const totalHours = currentEntries.reduce((sum, e) => sum + calcHours(e.clock_in, e.clock_out), 0);
  const prevTotalHours = previousEntries.reduce((sum, e) => sum + calcHours(e.clock_in, e.clock_out), 0);

  const regularHours = Math.min(totalHours, 80);
  const overtimeHours = Math.max(0, totalHours - 80);

  const estimatedPay = () => {
    if (!compensation || !compensation.pay_rate) return null;
    if (compensation.pay_type === 'salary') {
      return compensation.pay_rate / 26;
    }
    const regular = regularHours * compensation.pay_rate;
    const overtime = overtimeHours * compensation.pay_rate * 1.5;
    return regular + overtime;
  };

  const prevEstimatedPay = () => {
    if (!compensation || !compensation.pay_rate) return null;
    if (compensation.pay_type === 'salary') {
      return compensation.pay_rate / 26;
    }
    const prevRegular = Math.min(prevTotalHours, 80);
    const prevOvertime = Math.max(0, prevTotalHours - 80);
    return (prevRegular * compensation.pay_rate) + (prevOvertime * compensation.pay_rate * 1.5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Pay</h2>
        <p className="text-slate-400 text-sm mt-1">Your pay summary and history</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Pay Type Badge */}
      {compensation && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-xs px-3 py-1 rounded-full border font-medium
            ${compensation.pay_type === 'salary'
              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-600/30'
              : 'bg-green-600/20 text-green-300 border-green-600/30'}`}>
            {compensation.pay_type === 'salary' ? 'Salaried' : 'Hourly'}
          </span>
          {compensation.benefits_eligible && (
            <span className="text-xs px-3 py-1 rounded-full border font-medium bg-blue-600/20 text-blue-300 border-blue-600/30">
              Benefits Eligible
            </span>
          )}
          {compensation.hire_date && (
            <span className="text-xs text-slate-400">
              Hired {formatDate(new Date(compensation.hire_date + 'T00:00:00'))}
            </span>
          )}
        </div>
      )}

      {/* Current Pay Period */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-white">Current Pay Period</h3>
          <span className="text-slate-400 text-sm">
            {formatDate(periodStart)} — {formatDate(periodEnd)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-slate-400 text-xs mb-1">Hours Worked</p>
            <p className="text-white text-2xl font-bold">{formatHours(totalHours)}</p>
            {overtimeHours > 0 && (
              <p className="text-yellow-400 text-xs mt-1">{formatHours(overtimeHours)} overtime</p>
            )}
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-slate-400 text-xs mb-1">Estimated Gross Pay</p>
            {estimatedPay() !== null ? (
              <p className="text-white text-2xl font-bold">{formatCurrency(estimatedPay())}</p>
            ) : (
              <p className="text-slate-500 text-sm mt-1">Not set</p>
            )}
          </div>
        </div>

        {compensation?.pay_type === 'hourly' && compensation?.pay_rate > 0 && (
          <div className="text-xs text-slate-500 space-y-0.5">
            <p>Regular: {formatHours(regularHours)} × {formatCurrency(compensation.pay_rate)}/hr</p>
            {overtimeHours > 0 && (
              <p>Overtime: {formatHours(overtimeHours)} × {formatCurrency(compensation.pay_rate * 1.5)}/hr</p>
            )}
          </div>
        )}
      </div>

      {/* Previous Pay Period */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-white">Previous Pay Period</h3>
          <span className="text-slate-400 text-sm">
            {formatDate(prevStart)} — {formatDate(prevEnd)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-slate-400 text-xs mb-1">Hours Worked</p>
            <p className="text-white text-2xl font-bold">{formatHours(prevTotalHours)}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-slate-400 text-xs mb-1">Estimated Gross Pay</p>
            {prevEstimatedPay() !== null ? (
              <p className="text-white text-2xl font-bold">{formatCurrency(prevEstimatedPay())}</p>
            ) : (
              <p className="text-slate-500 text-sm mt-1">Not set</p>
            )}
          </div>
        </div>
      </div>

      {/* No compensation data notice */}
      {!compensation && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
          <p className="text-slate-400 text-sm">
            Pay rate not set. Contact your administrator to set up your compensation details.
          </p>
        </div>
      )}

    </div>
  );
};

export default Pay;
