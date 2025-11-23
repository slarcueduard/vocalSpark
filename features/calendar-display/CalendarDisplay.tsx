import React from 'react';
import { CalendarIdea } from '../../types';
import { SparklesIcon } from '../../components/Icons';

interface CalendarDisplayProps {
  ideas: CalendarIdea[];
  onCreatePostFromIdea: (idea: string) => void;
}

const CalendarDisplay: React.FC<CalendarDisplayProps> = ({ ideas, onCreatePostFromIdea }) => {
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-center mb-6">Your Content Calendar</h2>
      <div className="space-y-4">
        {ideas.map(idea => (
          <div key={idea.day} className="bg-brand-bg-light p-4 rounded-lg border border-gray-700 flex items-start sm:items-center gap-4 flex-col sm:flex-row">
            <div className="flex items-center gap-3">
              <span className="bg-brand-primary/10 text-brand-primary font-bold rounded-full w-10 h-10 flex items-center justify-center text-sm flex-shrink-0">Day {idea.day}</span>
              <span className="text-xs font-semibold bg-brand-secondary/10 text-brand-secondary px-2 py-1 rounded-md">{idea.postType}</span>
            </div>
            <div className="flex-grow">
              <p className="text-brand-text">{idea.idea}</p>
              <p className="text-xs text-brand-text-secondary mt-1">{idea.hashtags}</p>
            </div>
            <button 
              onClick={() => onCreatePostFromIdea(idea.idea)}
              className="w-full sm:w-auto flex-shrink-0 bg-brand-primary text-brand-bg-dark font-semibold py-2 px-4 rounded-md hover:bg-opacity-90 transition text-sm flex items-center justify-center gap-2"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Create Post</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarDisplay;