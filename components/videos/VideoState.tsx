import React from 'react';

type VideoStateType = 'loading' | 'error' | 'empty';

type Props = {
  type: VideoStateType;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

const iconByState: Record<VideoStateType, string> = {
  loading: 'progress_activity',
  error: 'error',
  empty: 'subscriptions',
};

const VideoState: React.FC<Props> = ({ type, title, message, actionLabel, onAction }) => {
  return (
    <div className="stark-border bg-brand-muted p-20 text-center" data-testid={`video-state-${type}`}>
      <span className="material-symbols-outlined text-6xl mb-6 opacity-50">{iconByState[type]}</span>
      <p className="text-2xl font-black uppercase tracking-tight mb-4">{title}</p>
      {message && <p className="text-sm text-gray-500 max-w-2xl mx-auto mb-8">{message}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-white bg-black px-10 py-4 font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-black transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default VideoState;
