// screens/VideoPlayerScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import { MediaContent, Episode, Comment as CommentType, MediaType, User } from '../types';
import { 
    PlayIcon, PauseIcon, ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon,
    LikeIcon, CommentIcon, ShareIcon, DownloadIcon, PlusIcon,
    VolumeHighIcon, VolumeMuteIcon, PipIcon, FullscreenEnterIcon, FullscreenExitIcon, PaperAirplaneIcon,
    BackwardIcon, ForwardPlaybackIcon, Cog6ToothIcon
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
    const speedMenuRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);

    const togglePlay = () => videoRef.current?.paused ? videoRef.current?.play() : videoRef.current?.pause();
    
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            setProgress((video.currentTime / video.duration) * 100);
        };
        const handleLoadedMetadata = () => setDuration(video.duration);

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        
        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, []);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (speedMenuRef.current && !speedMenuRef.current.contains(event.target as Node)) {
                setIsSpeedMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRewind = () => {
        if (videoRef.current) videoRef.current.currentTime -= 10;
    };
    const handleFastForward = () => {
        if (videoRef.current) videoRef.current.currentTime += 10;
    };
    const handleSetPlaybackRate = (rate: number) => {
        if (videoRef.current) videoRef.current.playbackRate = rate;
        setPlaybackRate(rate);
        setIsSpeedMenuOpen(false);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current;
        if (!video) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        video.currentTime = pos * video.duration;
    };
    
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        if(videoRef.current) videoRef.current.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };
    
    const toggleMute = () => {
        if(videoRef.current) videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
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


    return (
        <div ref={containerRef} className="relative w-full aspect-video bg-black group overflow-hidden">
            <video ref={videoRef} src={src} poster={poster} className="w-full h-full" onClick={togglePlay} />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between">
                <div>{/* Top controls if any */}</div>
                
                <div className="flex-1 flex items-center justify-center space-x-8">
                    <button onClick={handleRewind} className="text-white p-4 bg-black/50 rounded-full transition-transform hover:scale-110">
                        <BackwardIcon className="w-10 h-10" />
                    </button>
                    <button onClick={togglePlay} className="text-white p-4 bg-black/50 rounded-full transition-transform hover:scale-110">
                        {isPlaying ? <PauseIcon className="w-14 h-14" /> : <PlayIcon className="w-14 h-14" />}
                    </button>
                    <button onClick={handleFastForward} className="text-white p-4 bg-black/50 rounded-full transition-transform hover:scale-110">
                        <ForwardPlaybackIcon className="w-10 h-10" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="space-y-2">
                        <div className="w-full h-1.5 bg-white/30 cursor-pointer rounded-full" onClick={handleSeek}>
                            <div className="h-full bg-amber-500 rounded-full" style={{width: `${progress}%`}} />
                        </div>
                        <div className="flex items-center justify-between text-white text-sm font-medium">
                            <div className="flex items-center space-x-4">
                                <button onClick={togglePlay}>
                                    {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                                </button>
                                <div className="flex items-center space-x-2 group/volume">
                                    <button onClick={toggleMute}>
                                        {isMuted || volume === 0 ? <VolumeMuteIcon className="w-6 h-6" /> : <VolumeHighIcon className="w-6 h-6" />}
                                    </button>
                                    <input 
                                        type="range" 
                                        min="0" max="1" step="0.05"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        className="w-24 h-1 accent-amber-500 opacity-0 group-hover/volume:opacity-100 transition-opacity"
                                    />
                                </div>
                                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="relative" ref={speedMenuRef}>
                                    <button onClick={() => setIsSpeedMenuOpen(p => !p)}>
                                        <Cog6ToothIcon className="w-6 h-6" />
                                    </button>
                                    {isSpeedMenuOpen && (
                                        <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 w-32 bg-black/80 backdrop-blur-sm rounded-lg py-2 text-center text-white shadow-lg">
                                            <h4 className="font-semibold text-sm mb-2 px-2 border-b border-white/20 pb-1">{t('playbackSpeed')}</h4>
                                            <div className="text-left">
                                                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                                                    <button 
                                                        key={rate} 
                                                        onClick={() => handleSetPlaybackRate(rate)}
                                                        className={`w-full text-sm rounded py-1 px-4 text-left transition-colors ${playbackRate === rate ? 'bg-amber-500 font-bold' : 'hover:bg-white/20'}`}
                                                    >
                                                        {rate === 1 ? 'Normal' : `${rate}x`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
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
    const currentUser = { name: "Christian User", avatarUrl: "https://picsum.photos/seed/mainuser/200/200" };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newComment.trim()) return;
        const newCommentObj: CommentType = {
            id: `c${Date.now()}`,
            user: currentUser,
            text: newComment,
            timestamp: 'Just now'
        };
        setComments([newCommentObj, ...comments]);
        setNewComment('');
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold">{t('comments')} ({comments.length})</h3>
            <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                <img src={currentUser.avatarUrl} alt="you" className="w-10 h-10 rounded-full" />
                <div className="relative flex-1">
                     <input 
                        type="text" 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t('addAComment')}
                        className="w-full bg-gray-100 dark:bg-gray-800 border-transparent rounded-full py-2.5 pl-4 pr-12 focus:ring-amber-500 focus:border-amber-500"
                    />
                    <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 disabled:bg-gray-400" disabled={!newComment.trim()}>
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </div>
            </form>
            <div className="space-y-4">
                {comments.map(c => <CommentItem key={c.id} comment={c} />)}
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
    const { t } = useAppContext();
    const playingContent = episode || item;
    const isSeries = item.type === MediaType.Series && episode;

    const ActionButton: React.FC<{Icon: React.FC<any>, label: string, value?: string | number}> = ({ Icon, label, value }) => (
        <button className="flex flex-col items-center space-y-1 text-gray-600 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400">
            <Icon className="w-7 h-7" />
            <span className="text-xs font-semibold">{value ? formatNumber(Number(value)) : label}</span>
        </button>
    );

    return (
        <div className="bg-[#FBF9F3] dark:bg-black min-h-screen animate-fadeIn">
            <header className="flex items-center p-2">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
            </header>

            {/* FIX: Use episode thumbnail if available, otherwise fallback to item image */}
            <VideoPlayer src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" poster={episode?.thumbnailUrl || item.imageUrl} />
            
            <div className="p-4 space-y-6">
                <h1 className="text-3xl font-bold">{playingContent.title}</h1>
                <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>{item.author || item.theme}</span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <span>{formatNumber(playingContent.views || 0)} {t('views')}</span>
                </div>
                
                <div className="flex items-center justify-around py-2">
                    <ActionButton Icon={LikeIcon} label={t('like')} value={playingContent.likes} />
                    <ActionButton Icon={PlusIcon} label={t('myList')} />
                    <ActionButton Icon={ShareIcon} label={t('share')} />
                    <ActionButton Icon={DownloadIcon} label={t('download')} />
                </div>
                
                {isSeries && (
                    <div className="flex items-center justify-between">
                        <button onClick={() => onNavigateEpisode('prev')} className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700">
                            <ChevronLeftIcon className="w-5 h-5" />
                            <span>{t('prevEpisode')}</span>
                        </button>
                        <button onClick={() => onNavigateEpisode('next')} className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700">
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
