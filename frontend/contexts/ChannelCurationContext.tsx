import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  VideoDiscoveryState,
  ChannelIdentity,
  ChannelVideo,
  AIAnalysisResult,
} from '../types';

interface ChannelCurationContextType {
  state: VideoDiscoveryState;
  importChannel: (channel: ChannelIdentity, channelName: string) => void;
  setVideos: (videos: ChannelVideo[]) => void;
  selectVideo: (videoId: string) => void;
  deselectVideo: (videoId: string) => void;
  selectAllVideos: () => void;
  deselectAllVideos: () => void;
  setAnalysisResults: (results: Map<string, AIAnalysisResult>) => void;
  setAnalysisResult: (videoId: string, result: AIAnalysisResult) => void;
  setPlaylistMapping: (videoId: string, playlistId: string) => void;
  setPlaylistMappings: (mappings: Map<string, string>) => void;
  setStatus: (
    status:
      | 'idle'
      | 'importing'
      | 'discovering'
      | 'analyzing'
      | 'mapping'
      | 'reviewing'
      | 'publishing'
  ) => void;
  setError: (error: string | null) => void;
  setMessage: (message: string | null) => void;
  reset: () => void;
}

const ChannelCurationContext = createContext<ChannelCurationContextType | undefined>(
  undefined
);

export const useChannelCuration = (): ChannelCurationContextType => {
  const context = useContext(ChannelCurationContext);
  if (!context) {
    throw new Error('useChannelCuration must be used within ChannelCurationProvider');
  }
  return context;
};

interface ChannelCurationProviderProps {
  children: React.ReactNode;
}

const initialState: VideoDiscoveryState = {
  channelId: null,
  channelName: undefined,
  status: 'idle',
  videos: [],
  selectedVideoIds: [],
  analysisResults: new Map(),
  playlistMappings: new Map(),
  error: null,
  message: null,
};

export const ChannelCurationProvider: React.FC<ChannelCurationProviderProps> = ({
  children,
}) => {
  const [state, setState] = useState<VideoDiscoveryState>(initialState);

  const importChannel = useCallback((channel: ChannelIdentity, channelName: string) => {
    setState((prev) => ({
      ...prev,
      channelId: channel.channelId,
      channelName: channelName || channel.username,
    }));
  }, []);

  const setVideos = useCallback((videos: ChannelVideo[]) => {
    setState((prev) => ({
      ...prev,
      videos,
      selectedVideoIds: [], // reset selection when new videos loaded
    }));
  }, []);

  const selectVideo = useCallback((videoId: string) => {
    setState((prev) => {
      const selected = new Set(prev.selectedVideoIds);
      selected.add(videoId);
      return {
        ...prev,
        selectedVideoIds: Array.from(selected),
      };
    });
  }, []);

  const deselectVideo = useCallback((videoId: string) => {
    setState((prev) => ({
      ...prev,
      selectedVideoIds: prev.selectedVideoIds.filter((id) => id !== videoId),
    }));
  }, []);

  const selectAllVideos = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedVideoIds: prev.videos.map((v) => v.videoId),
    }));
  }, []);

  const deselectAllVideos = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedVideoIds: [],
    }));
  }, []);

  const setAnalysisResults = useCallback((results: Map<string, AIAnalysisResult>) => {
    setState((prev) => ({
      ...prev,
      analysisResults: results,
    }));
  }, []);

  const setAnalysisResult = useCallback((videoId: string, result: AIAnalysisResult) => {
    setState((prev) => {
      const newResults = new Map(prev.analysisResults);
      newResults.set(videoId, result);
      return {
        ...prev,
        analysisResults: newResults,
      };
    });
  }, []);

  const setPlaylistMapping = useCallback((videoId: string, playlistId: string) => {
    setState((prev) => {
      const newMappings = new Map(prev.playlistMappings);
      if (playlistId) {
        newMappings.set(videoId, playlistId);
      } else {
        newMappings.delete(videoId);
      }
      return {
        ...prev,
        playlistMappings: newMappings,
      };
    });
  }, []);

  const setPlaylistMappings = useCallback((mappings: Map<string, string>) => {
    setState((prev) => ({
      ...prev,
      playlistMappings: mappings,
    }));
  }, []);

  const setStatus = useCallback(
    (
      status:
        | 'idle'
        | 'importing'
        | 'discovering'
        | 'analyzing'
        | 'mapping'
        | 'reviewing'
        | 'publishing'
    ) => {
      setState((prev) => ({
        ...prev,
        status,
      }));
    },
    []
  );

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      error,
    }));
  }, []);

  const setMessage = useCallback((message: string | null) => {
    setState((prev) => ({
      ...prev,
      message,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const value: ChannelCurationContextType = {
    state,
    importChannel,
    setVideos,
    selectVideo,
    deselectVideo,
    selectAllVideos,
    deselectAllVideos,
    setAnalysisResults,
    setAnalysisResult,
    setPlaylistMapping,
    setPlaylistMappings,
    setStatus,
    setError,
    setMessage,
    reset,
  };

  return (
    <ChannelCurationContext.Provider value={value}>
      {children}
    </ChannelCurationContext.Provider>
  );
};
