
import React, { useState, useCallback } from 'react';
import { CalendarIcon } from '../../components/Icons';
import { Loader } from '../../components/Loader';

interface ContentCalendarProps {
  isLoading: boolean;
  onGenerate: (topic: string, audience: string, duration: '1 Week' | '2 Weeks' | '1 Month') => void;
}

const ContentCalendar: React.FC<ContentCalendarProps> = ({ isLoading, onGenerate }) => {
  const [calendarTopic, setCalendarTopic] = useState('Keto Diet for Beginners');
  const [calendarAudience, setCalendarAudience] = useState('People in their 30s looking to lose weight');
  const [calendarDuration, setCalendarDuration] = useState<'1 Week' | '2 Weeks' | '1 Month'>('1 Month');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarTopic.trim() || !calendarAudience.trim()) {
      setError('Please fill in both the topic and target audience.');
      return;
    }
    setError(null);
    onGenerate(calendarTopic, calendarAudience, calendarDuration);
  }, [calendarTopic, calendarAudience, calendarDuration, onGenerate]);

  return (
    <>
      <h2 className="text-xl font-semibold mb-1 text-center">Plan your content with the AI Strategist</h2>
      <p className="text-brand-text-secondary mb-6 text-center">Get a month of post ideas to keep your audience engaged.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
              <label htmlFor="calendar-topic" className="block text-sm font-medium mb-2">Main Topic</label>
              <input
                  id="calendar-topic"
                  type="text"
                  value={calendarTopic}
                  onChange={(e) => setCalendarTopic(e.target.value)}
                  placeholder="e.g., Keto Diet for Beginners"
                  className="w-full bg-brand-bg-dark border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
              />
          </div>
          <div>
              <label htmlFor="calendar-audience" className="block text-sm font-medium mb-2">Target Audience</label>
              <input
                  id="calendar-audience"
                  type="text"
                  value={calendarAudience}
                  onChange={(e) => setCalendarAudience(e.target.value)}
                  placeholder="e.g., People in their 30s looking to lose weight"
                  className="w-full bg-brand-bg-dark border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
              />
          </div>
          <div>
              <label htmlFor="calendar-duration" className="block text-sm font-medium mb-2">Duration</label>
              <select
                  id="calendar-duration"
                  value={calendarDuration}
                  onChange={(e) => setCalendarDuration(e.target.value as any)}
                  className="w-full bg-brand-bg-dark border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition appearance-none"
              >
                  <option>1 Week</option>
                  <option>2 Weeks</option>
                  <option>1 Month</option>
              </select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-secondary text-white font-bold py-3 px-4 rounded-md hover:bg-opacity-90 transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100 flex items-center justify-center gap-2 mt-2"
          >
              {isLoading ? <Loader size="sm" /> : <CalendarIcon className="w-5 h-5" />}
              <span>{isLoading ? 'Generating...' : 'Generate Calendar'}</span>
          </button>
      </form>
    </>
  );
};

export default ContentCalendar;
