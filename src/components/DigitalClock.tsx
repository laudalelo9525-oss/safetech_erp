import React, { useState, useEffect } from 'react';

interface TimeZoneData {
  name: string;
  timezone: string;
  offset: number;
}

const DigitalClock: React.FC = () => {
  const [times, setTimes] = useState<{ [key: string]: string }>({});

  const timeZones: TimeZoneData[] = [
    { name: 'New York', timezone: 'America/New_York', offset: -5 },
    { name: 'London', timezone: 'Europe/London', offset: 0 },
    { name: 'Tokyo', timezone: 'Asia/Tokyo', offset: 9 },
    { name: 'Sydney', timezone: 'Australia/Sydney', offset: 10 },
    { name: 'Dubai', timezone: 'Asia/Dubai', offset: 4 },
    { name: 'Los Angeles', timezone: 'America/Los_Angeles', offset: -8 },
  ];

  useEffect(() => {
    const updateTime = () => {
      const newTimes: { [key: string]: string } = {};

      timeZones.forEach((tz) => {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz.timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });

        newTimes[tz.timezone] = formatter.format(now);
      });

      setTimes(newTimes);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="digital-clock-container">
      <style>{`
        .digital-clock-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          font-family: 'Courier New', monospace;
          padding: 20px;
        }

        .clock-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          max-width: 1200px;
          width: 100%;
        }

        .clock-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 15px;
          padding: 30px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: default;
        }

        .clock-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
        }

        .clock-city {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .clock-time {
          font-size: 48px;
          font-weight: bold;
          color: #00ff88;
          text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
          letter-spacing: 3px;
          font-variant-numeric: tabular-nums;
          margin-bottom: 10px;
        }

        .clock-timezone {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .header {
          width: 100%;
          text-align: center;
          margin-bottom: 40px;
          grid-column: 1 / -1;
        }

        .header h1 {
          font-size: 36px;
          color: #fff;
          margin: 0;
          text-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
          margin-bottom: 10px;
        }

        .header p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 16px;
          margin: 0;
        }

        @media (max-width: 768px) {
          .clock-grid {
            grid-template-columns: 1fr;
          }

          .clock-time {
            font-size: 36px;
          }

          .header h1 {
            font-size: 28px;
          }
        }
      `}</style>

      <div style={{ width: '100%' }}>
        <div className="header">
          <h1>⏰ World Clock</h1>
          <p>Current time across different time zones</p>
        </div>

        <div className="clock-grid">
          {timeZones.map((tz) => (
            <div key={tz.timezone} className="clock-card">
              <div className="clock-city">{tz.name}</div>
              <div className="clock-time">{times[tz.timezone] || '--:--:--'}</div>
              <div className="clock-timezone">{tz.timezone}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DigitalClock;
