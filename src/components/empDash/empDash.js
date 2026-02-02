import React, { useState, useEffect } from 'react';
import './EmployeeDashboard.css';

export default function EmployeeDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [todayHours, setTodayHours] = useState(0);
  const [weekHours, setWeekHours] = useState(0);

  // Mock user data - replace with actual Supabase data
  const user = {
    name: 'Alex Johnson',
    role: 'Employee',
    employeeId: 'EMP-001',
    avatar: null
  };

  // Mock schedule data
  const upcomingShifts = [
    { id: 1, date: '2025-01-30', day: 'Thursday', start: '09:00', end: '17:00', hours: 8 },
    { id: 2, date: '2025-01-31', day: 'Friday', start: '09:00', end: '17:00', hours: 8 },
    { id: 3, date: '2025-02-01', day: 'Saturday', start: '10:00', end: '14:00', hours: 4 },
  ];

  // Mock time off requests
  const timeOffRequests = [
    { id: 1, dates: 'Feb 10-12', status: 'pending', type: 'Vacation' },
    { id: 2, dates: 'Feb 25', status: 'approved', type: 'Personal' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleClockToggle = () => {
    // TODO: Integrate with Supabase to record clock in/out
    // Include GPS location if needed
    setIsClockedIn(!isClockedIn);
    
    if (!isClockedIn) {
      console.log('Clocking in at:', new Date());
    } else {
      console.log('Clocking out at:', new Date());
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit' 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="employee-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <div className="user-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <div className="avatar-placeholder">{user.name.charAt(0)}</div>
              )}
            </div>
            <div>
              <h1>Welcome back, {user.name.split(' ')[0]}</h1>
              <p className="user-role">{user.role} • {user.employeeId}</p>
            </div>
          </div>
          <button className="logout-button">Sign Out</button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-grid">
          {/* Clock In/Out Section */}
          <section className="clock-section card-primary">
            <div className="current-time">
              <div className="time-display">{formatTime(currentTime)}</div>
              <div className="date-display">{formatDate(currentTime)}</div>
            </div>

            <div className="clock-status">
              <div className={`status-indicator ${isClockedIn ? 'active' : ''}`}>
                <span className="status-dot"></span>
                <span>{isClockedIn ? 'Currently Working' : 'Not Clocked In'}</span>
              </div>
            </div>

            <button 
              className={`clock-button ${isClockedIn ? 'clock-out' : 'clock-in'}`}
              onClick={handleClockToggle}
            >
              <span className="clock-icon">{isClockedIn ? '⏹' : '▶'}</span>
              {isClockedIn ? 'Clock Out' : 'Clock In'}
            </button>

            <div className="hours-summary">
              <div className="hours-item">
                <span className="hours-label">Today</span>
                <span className="hours-value">{todayHours.toFixed(1)}h</span>
              </div>
              <div className="hours-divider"></div>
              <div className="hours-item">
                <span className="hours-label">This Week</span>
                <span className="hours-value">{weekHours.toFixed(1)}h</span>
              </div>
            </div>
          </section>

          {/* Upcoming Shifts */}
          <section className="card">
            <h2 className="card-title">Upcoming Shifts</h2>
            <div className="shifts-list">
              {upcomingShifts.map(shift => (
                <div key={shift.id} className="shift-item">
                  <div className="shift-date">
                    <div className="shift-day">{shift.day}</div>
                    <div className="shift-date-num">{new Date(shift.date).getDate()}</div>
                  </div>
                  <div className="shift-details">
                    <div className="shift-time">{shift.start} - {shift.end}</div>
                    <div className="shift-duration">{shift.hours} hours</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="view-all-button">View Full Schedule</button>
          </section>

          {/* Time Off Requests */}
          <section className="card">
            <h2 className="card-title">Time Off Requests</h2>
            <div className="requests-list">
              {timeOffRequests.map(request => (
                <div key={request.id} className="request-item">
                  <div className="request-info">
                    <div className="request-type">{request.type}</div>
                    <div className="request-dates">{request.dates}</div>
                  </div>
                  <span className={`request-status status-${request.status}`}>
                    {request.status}
                  </span>
                </div>
              ))}
            </div>
            <button className="request-button">Request Time Off</button>
          </section>

          {/* Quick Actions */}
          <section className="card quick-actions">
            <h2 className="card-title">Quick Actions</h2>
            <div className="actions-grid">
              <button className="action-button">
                <span className="action-icon">📅</span>
                <span>View Schedule</span>
              </button>
              <button className="action-button">
                <span className="action-icon">🕐</span>
                <span>Time History</span>
              </button>
              <button className="action-button">
                <span className="action-icon">📊</span>
                <span>My Reports</span>
              </button>
              <button className="action-button">
                <span className="action-icon">⚙️</span>
                <span>Settings</span>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}