import { useState, useEffect } from 'react';
import { VideoItem } from '../types';
import { listPlaylistVideos } from '../services/videoSource';

interface UsePlaylistVideosResult {
  videos: VideoItem[];
  isLoading: boolean;
  error: Error | null;
  selectedVideoIndex: number;
  setSelectedVideoIndex: (index: number) => void;
}

export function usePlaylistVideos(playlistId: string | null): UsePlaylistVideosResult {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  useEffect(() => {
    if (!playlistId) {
      setVideos([]);
      setError(null);
      setSelectedVideoIndex(0);
      return;
    }

    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listPlaylistVideos(playlistId);
        setVideos(data);
        setSelectedVideoIndex(0);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Falha ao carregar vídeos'));
        setVideos([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [playlistId]);

  return {
    videos,
    isLoading,
    error,
    selectedVideoIndex,
    setSelectedVideoIndex,
  };
}
