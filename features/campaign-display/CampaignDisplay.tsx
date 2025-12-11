
import React from 'react';
import { Post, Platform, RefinementType } from '../../types';
import { PostCard } from '../../components/PostCard';
import { TrashIcon } from '../../components/Icons';

interface CampaignDisplayProps {
  posts: Post[];
  refiningPostId: string | null;
  onReset: () => void;
  onGenerateImage: (postId: string, postContent: string) => void;
  onAdaptPost: (postId: string, platform: Platform, originalContent: string) => Promise<void>;
  onRefinePost: (postId: string, type: RefinementType, content: string) => Promise<void>;
  onDeletePost: (postId: string) => void;
  onToggleLock: (postId: string) => void;
  onSchedule: (postId: string, date: Date) => Promise<void>;
}

const CampaignDisplay: React.FC<CampaignDisplayProps> = ({
  posts,
  refiningPostId,
  onReset,
  onGenerateImage,
  onAdaptPost,
  onRefinePost,
  onDeletePost,
  onToggleLock,
  onSchedule,
}) => {
  return (
    <>
      <div className="flex justify-center items-center gap-4 mb-6 mt-12">
        <h2 className="text-2xl font-bold text-center">Your Generated Campaign</h2>
        <button
          onClick={onReset}
          className="flex items-center gap-2 bg-red-500/10 text-red-400 font-semibold py-1.5 px-3 rounded-lg hover:bg-red-500/20 hover:text-red-300 transition-colors"
          title="Delete all posts and start over"
        >
          <TrashIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            isRefining={refiningPostId === post.id}
            onGenerateImage={onGenerateImage}
            onAdaptPost={onAdaptPost}
            onRefinePost={onRefinePost}
            onDelete={onDeletePost}
            onToggleLock={onToggleLock}
            onSchedule={onSchedule}
          />
        ))}
      </div>
    </>
  );
};

export default CampaignDisplay;
