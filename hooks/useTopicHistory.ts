import { useState, useEffect, useCallback } from 'react';

const TOPIC_HISTORY_KEY = 'socialSparkTopicHistory';

export const useTopicHistory = () => {
  const [topicHistory, setTopicHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(TOPIC_HISTORY_KEY);
      if (savedHistory) {
        setTopicHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to parse topic history from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(TOPIC_HISTORY_KEY, JSON.stringify(topicHistory));
    } catch (e) {
      console.error("Failed to save topic history to localStorage", e);
    }
  }, [topicHistory]);

  const addTopicToHistory = useCallback((topic: string) => {
    if (!topicHistory.includes(topic)) {
      setTopicHistory(prev => [topic, ...prev].slice(0, 10));
    }
  }, [topicHistory]);

  return { topicHistory, addTopicToHistory };
};
