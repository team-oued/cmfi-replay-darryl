// screens/VideoPlayerScreen.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MediaContent, Episode, Comment as CommentType, MediaType, User } from '../types';
import { 
    PlayIcon, PauseIcon, ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon,
    LikeIcon, CommentIcon, ShareIcon, DownloadIcon, PlusIcon,
    VolumeHighIcon, VolumeMuteIcon, PipIcon, FullscreenEnterIcon, FullscreenExitIcon, PaperAirplaneIcon,
    BackwardIcon, ForwardPlaybackIcon, CheckIcon
} from '../components/icons';
import { useAppContext } from '../context/AppContext';
import { activeUsers } from '../data/mockData';

// --- Reusable formatter ---
const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes().toString().padStart(2, '0');
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
        return `${hh}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
};

// --- Video Player Component ---
const VideoPlayer: React.FC<{ src: string, poster: string }> = ({ src, poster }) => {
    const { t } = useAppContext();
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);

    const togglePlay = () => videoRef.current?.paused ? videoRef.current?.play() : videoRef.current?.pause();
    
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleTimeUpdate = () => {
            if (video.duration) {
                setCurrentTime(video.currentTime);
                setProgress((video.currentTime / video.duration) * 100);
            }
        };
        const handleLoadedMetadata = () => setDuration(video.duration);
        const handleVolumeChange = () => {
            setVolume(video.volume);
            setIsMuted(video.muted);
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('volumechange', handleVolumeChange);
        
        handleVolumeChange(); // Initialize state
        
        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('volumechange', handleVolumeChange);
        };
    }, []);
    
    const handleRewind = () => {
        if (videoRef.current) videoRef.current.currentTime -= 10;
    };
    const handleFastForward = () => {
        if (videoRef.current) videoRef.current.currentTime += 10;
    };
    const handlePlaybackRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRate = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.playbackRate = newRate;
        }
        setPlaybackRate(newRate);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current;
        if (!video) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        video.currentTime = pos * video.duration;
    };
    
    const toggleMute = () => {
        if(videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
        }
    }
    
    const togglePip = async () => {
        if (!videoRef.current) return;
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else if (document.pictureInPictureEnabled) {
            await videoRef.current.requestPictureInPicture();
        }
    };
    
    const toggleFullscreen = () => {
        const container = containerRef.current;
        if (!container) return;
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    };
    
    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const playbackControlSize = "w-10 h-10 sm:w-12 sm:h-12";
    const seekControlSize = "w-6 h-6 sm:w-8 sm:h-8";

    return (
        <div ref={containerRef} className="relative w-full aspect-video bg-black group overflow-hidden">
            <video ref={videoRef} src={src} poster={poster} className="w-full h-full" onClick={togglePlay} />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between">
                <div className="flex justify-end p-2 sm:p-4">
                  <div className="flex items-center space-x-2 bg-black/60 p-2 rounded-lg backdrop-blur-sm">
                    <span className="text-white font-semibold text-sm w-12 text-center">{playbackRate.toFixed(2)}x</span>
                    <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.25"
                        value={playbackRate}
                        onChange={handlePlaybackRateChange}
                        className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-amber-500"
                        aria-label={t('playbackSpeed')}
                    />
                  </div>
                </div>
                
                <div className="flex-1 flex items-center justify-center space-x-4">
                    <button onClick={handleRewind} className="text-white p-2 bg-black/50 rounded-full transition-transform hover:scale-110">
                        <BackwardIcon className={seekControlSize} />
                    </button>
                    <button onClick={togglePlay} className="text-white p-2 bg-black/50 rounded-full transition-transform hover:scale-110">
                        {isPlaying ? <PauseIcon className={playbackControlSize} /> : <PlayIcon className={playbackControlSize} />}
                    </button>
                    <button onClick={handleFastForward} className="text-white p-2 bg-black/50 rounded-full transition-transform hover:scale-110">
                        <ForwardPlaybackIcon className={seekControlSize} />
                    </button>
                </div>

                <div className="p-2 sm:p-4">
                    <div className="space-y-2">
                        <div className="w-full h-1.5 bg-white/30 cursor-pointer rounded-full" onClick={handleSeek}>
                            <div className="h-full bg-amber-500 rounded-full" style={{width: `${progress}%`}} />
                        </div>
                        <div className="flex items-center justify-between text-white text-sm font-medium">
                            <div className="flex items-center space-x-2 sm:space-x-4">
                                <button onClick={togglePlay}>
                                    {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                                </button>
                                <button onClick={toggleMute}>
                                    {isMuted ? <VolumeMuteIcon className="w-6 h-6" /> : <VolumeHighIcon className="w-6 h-6" />}
                                </button>
                                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-4">
                                <button onClick={togglePip}><PipIcon className="w-6 h-6" /></button>
                                <button onClick={toggleFullscreen}>
                                    {isFullscreen ? <FullscreenExitIcon className="w-6 h-6" /> : <FullscreenEnterIcon className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Comments Section ---
const CommentItem: React.FC<{ comment: CommentType }> = ({ comment }) => (
    <div className="flex items-start space-x-3">
        <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-10 h-10 rounded-full flex-shrink-0 mt-1" />
        <div className="flex-1">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <p className="font-semibold text-sm">{comment.user.name}</p>
                <p className="text-gray-700 dark:text-gray-300">{comment.text}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">{comment.timestamp}</p>
        </div>
    </div>
);

const CommentSection: React.FC<{ comments: CommentType[] }> = ({ comments: initialComments }) => {
    const { t } = useAppContext();
    const [comments, setComments] = useState(initialComments);
    const [newComment, setNewComment] = useState('');
    const [sortBy, setSortBy] = useState<'recent' | 'top'>('recent');
    const currentUser = { name: "Christian User", avatarUrl: "https://picsum.photos/seed/mainuser/200/200" };

    const MAX_COMMENT_LENGTH = 280;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || newComment.length > MAX_COMMENT_LENGTH) return;
        const newCommentObj: CommentType = {
            id: `c${Date.now()}`,
            user: currentUser,
            text: newComment,
            timestamp: 'Just now',
            likes: 0,
        };
        setComments([newCommentObj, ...comments]);
        setNewComment('');
    };

    const sortedComments = useMemo(() => {
        const sorted = [...comments];
        if (sortBy === 'top') {
            sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        }
        // 'recent' is the default because new comments are prepended
        return sorted;
    }, [comments, sortBy]);
    
    const charCountColor = newComment.length > MAX_COMMENT_LENGTH 
        ? 'text-red-500' 
        : newComment.length > MAX_COMMENT_LENGTH - 20 
        ? 'text-yellow-500' 
        : 'text-gray-500 dark:text-gray-400';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{t('comments')} ({comments.length})</h3>
                <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-800 p-1 rounded-full">
                    <button 
                        onClick={() => setSortBy('recent')}
                        className={`text-sm font-semibold px-3 py-1 rounded-full transition-colors ${sortBy === 'recent' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        {t('mostRecent')}
                    </button>
                    <button 
                        onClick={() => setSortBy('top')}
                        className={`text-sm font-semibold px-3 py-1 rounded-full transition-colors ${sortBy === 'top' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        {t('topComments')}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex items-start space-x-3">
                <img src={currentUser.avatarUrl} alt="you" className="w-10 h-10 rounded-full flex-shrink-0 mt-1" />
                <div className="flex-1">
                    <div className="relative">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={t('addAComment')}
                            className="w-full bg-gray-100 dark:bg-gray-800 border-transparent rounded-xl p-3 pr-12 focus:ring-amber-500 focus:border-amber-500 resize-none transition-shadow"
                            rows={2}
                            maxLength={MAX_COMMENT_LENGTH + 1} // Allow one extra char to show red color
                        />
                        <button type="submit" className="absolute right-2 top-2 p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={!newComment.trim() || newComment.length > MAX_COMMENT_LENGTH}>
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <p className={`text-xs text-right mt-1 pr-2 font-medium ${charCountColor}`}>
                        {newComment.length}/{MAX_COMMENT_LENGTH}
                    </p>
                </div>
            </form>
            <div className="space-y-4">
                {sortedComments.map(c => <CommentItem key={c.id} comment={c} />)}
            </div>
        </div>
    )
}

// --- Main Screen Component ---
interface VideoPlayerScreenProps {
    item: MediaContent;
    episode?: Episode;
    onBack: () => void;
    onNavigateEpisode: (direction: 'next' | 'prev') => void;
}

const VideoPlayerScreen: React.FC<VideoPlayerScreenProps> = ({ item, episode, onBack, onNavigateEpisode }) => {
    const { t, bookmarkedIds, toggleBookmark } = useAppContext();
    const playingContent = episode || item;
    const isSeries = item.type === MediaType.Series && episode;
    const isBookmarked = bookmarkedIds.includes(item.id);

    const allEpisodes = useMemo(() => item.seasons?.flatMap(s => s.episodes) || [], [item.seasons]);
    
    const currentIndex = useMemo(() => {
        if (!episode || allEpisodes.length === 0) return -1;
        // Using title and episode number for a more robust match
        return allEpisodes.findIndex(e => e.episodeNumber === episode.episodeNumber && e.title === episode.title);
    }, [allEpisodes, episode]);

    const hasPrevEpisode = currentIndex > 0;
    const hasNextEpisode = currentIndex !== -1 && currentIndex < allEpisodes.length - 1;

    const ActionButton: React.FC<{Icon: React.FC<any>, label: string, value?: string | number, onClick?: () => void}> = ({ Icon, label, value, onClick }) => (
        <button onClick={onClick} className="flex flex-col items-center space-y-1 text-gray-600 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400">
            <Icon className="w-7 h-7" />
            <span className="text-xs font-semibold">{value ? formatNumber(Number(value)) : label}</span>
        </button>
    );

    return (
        <div className="bg-[#FBF9F3] dark:bg-black min-h-screen animate-fadeIn">
            <div className="relative">
                <header className="absolute top-0 left-0 z-10 p-2 sm:p-4">
                    <button 
                        onClick={onBack} 
                        className="p-2 rounded-full text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                </header>
                <VideoPlayer src="https://player.vimeo.com/progressive_redirect/playback/377183709/rendition/240p/file.mp4?loc=external&signature=a92b7697da94bae4f9129096723604236fb1b5d04f57e46b69e503d22d7a273f" poster={episode?.thumbnailUrl || item.imageUrl} />
            </div>
            
            <div className="p-4 space-y-6">
                <h1 className="text-3xl font-bold">{playingContent.title}</h1>
                <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>{item.author || item.theme}</span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <span>{formatNumber(playingContent.views || 0)} {t('views')}</span>
                </div>
                
                <div className="flex items-center justify-around py-2">
                    <ActionButton Icon={LikeIcon} label={t('like')} value={playingContent.likes} />
                    <ActionButton 
                        Icon={isBookmarked ? CheckIcon : PlusIcon} 
                        label={isBookmarked ? t('addedToList') : t('myList')}
                        onClick={() => toggleBookmark(item.id)}
                    />
                    <ActionButton Icon={ShareIcon} label={t('share')} />
                    <ActionButton Icon={DownloadIcon} label={t('download')} />
                </div>
                
                {isSeries && (
                    <div className="flex items-center justify-between">
                        <button 
                            onClick={() => onNavigateEpisode('prev')}
                            disabled={!hasPrevEpisode}
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                            <span>{t('prevEpisode')}</span>
                        </button>
                        <button 
                            onClick={() => onNavigateEpisode('next')} 
                            disabled={!hasNextEpisode}
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                             <span>{t('nextEpisode')}</span>
                            <ChevronRightIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
                
                <div className="border-t border-gray-200 dark:border-gray-800" />
                
                <CommentSection comments={playingContent.comments || []} />
            </div>
        </div>
    );
};

export default VideoPlayerScreen;