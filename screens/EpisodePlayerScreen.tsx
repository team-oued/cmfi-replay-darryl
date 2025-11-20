// screens/EpisodePlayerScreen.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MediaContent } from '../types';
import { EpisodeSerie, episodeSerieService, seasonSerieService, serieService, likeService, commentService, Comment, generateDefaultAvatar } from '../lib/firestore';
import {
    PlayIcon, PauseIcon, ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon,
    LikeIcon, ShareIcon, PlusIcon,
    VolumeHighIcon, VolumeMuteIcon, PipIcon, FullscreenEnterIcon, FullscreenExitIcon, PaperAirplaneIcon,
    BackwardIcon, ForwardPlaybackIcon, CheckIcon
} from '../components/icons';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-toastify';

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
const VideoPlayer: React.FC<{ src?: string, poster: string, onUnavailable: () => void }> = ({ src, poster, onUnavailable }) => {
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
    const [isSeeking, setIsSeeking] = useState(false);
    const [buffered, setBuffered] = useState(0); // percentage
    const [unavailable, setUnavailable] = useState(false);

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
            try {
                if (video.buffered && video.buffered.length > 0 && video.duration) {
                    const end = video.buffered.end(video.buffered.length - 1);
                    setBuffered(Math.min(100, (end / video.duration) * 100));
                }
            } catch { }
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

    useEffect(() => {
        if (!src || !src.trim()) {
            setUnavailable(true);
        } else {
            setUnavailable(false);
        }
    }, [src]);

    // Reload video when source changes and reset state
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        setIsPlaying(false);
        setProgress(0);
        setDuration(0);
        setCurrentTime(0);
        setBuffered(0);
        try {
            video.pause();
            video.load();
            // Autoplay new episode if allowed
            video.play().catch(() => { });
        } catch { }
    }, [src]);

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

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video || !video.duration) return;
        const pct = parseFloat(e.target.value);
        setProgress(pct);
        const t = (pct / 100) * video.duration;
        video.currentTime = t;
    };

    const handleSliderMouseDown = () => setIsSeeking(true);
    const handleSliderMouseUp = () => {
        setIsSeeking(false);
        if (videoRef.current && videoRef.current.paused && isPlaying) {
            videoRef.current.play().catch(() => { });
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const v = videoRef.current;
            if (!v) return;
            if (e.code === 'Space') {
                e.preventDefault();
                togglePlay();
            } else if (e.code === 'ArrowLeft') {
                v.currentTime = Math.max(0, v.currentTime - 5);
            } else if (e.code === 'ArrowRight') {
                v.currentTime = Math.min(v.duration || v.currentTime + 5, v.currentTime + 5);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const toggleMute = () => {
        if (videoRef.current) {
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

    if (unavailable) {
        return (
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                <div className="flex items-center space-x-4 text-white">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/10 border border-white/20">
                        <span className="text-3xl leading-none">!</span>
                    </div>
                    <div>
                        <div className="text-xl font-semibold">Video unavailable</div>
                        <button onClick={onUnavailable} className="mt-1 text-amber-400 font-semibold hover:text-amber-300">
                            Return to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full aspect-video bg-black group overflow-hidden">
            <video ref={videoRef} src={src} poster={poster} className="w-full h-full" onClick={togglePlay} onError={() => setUnavailable(true)} />
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
                        <div className="relative w-full h-3 bg-white/20 rounded-full cursor-pointer accent-amber-500" onClick={handleSeek}>
                            <div className="absolute inset-y-0 left-0 bg-white/30 rounded-full accent-amber-500" style={{ width: `${buffered}%` }} />
                            <div className="absolute inset-y-0 left-0 bg-amber-500 rounded-full accent-amber-500" style={{ width: `${progress}%` }} />
                            <input
                                type="range"
                                min={0}
                                max={100}
                                step={0.1}
                                value={progress}
                                onChange={handleSliderChange}
                                onMouseDown={handleSliderMouseDown}
                                onMouseUp={handleSliderMouseUp}
                                className="absolute -top-1 w-full h-5 appearance-none bg-transparent cursor-pointer"
                                aria-label="Seek"
                            />
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
const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => (
    <div className="flex items-start space-x-3">
        <img src={comment.user_photo_url || generateDefaultAvatar(comment.created_by)} alt={comment.created_by} className="w-10 h-10 rounded-full flex-shrink-0 mt-1" />
        <div className="flex-1">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <p className="font-semibold text-sm">{comment.created_by}</p>
                <p className="text-gray-700 dark:text-gray-300">{comment.comment}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">{comment.created_at}</p>
        </div>
    </div>
);

const CommentSection: React.FC<{ itemUid: string }> = ({ itemUid }) => {
    const { t, userProfile } = useAppContext();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [sortBy, setSortBy] = useState<'recent' | 'top'>('recent');
    const MAX_COMMENT_LENGTH = 280;

    useEffect(() => {
        const fetchComments = async () => {
            if (!itemUid) return;
            const fetchedComments = await commentService.getComments(itemUid);
            setComments(fetchedComments.reverse()); 
        };
        fetchComments();
    }, [itemUid]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || newComment.length > MAX_COMMENT_LENGTH) return;
        
        if (!userProfile) {
            toast.error('Vous devez être connecté pour commenter', {
                position: 'bottom-center',
                autoClose: 2000,
            });
            return;
        }

        try {
            const addedComment = await commentService.addComment(itemUid, newComment, userProfile);
            if (addedComment) {
                setComments([addedComment, ...comments]);
                setNewComment('');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            toast.error('Erreur lors de l\'ajout du commentaire', {
                position: 'bottom-center',
                autoClose: 2000,
            });
        }
    };


    const sortedComments = useMemo(() => {
        return comments;
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
                <img src={userProfile?.photo_url || generateDefaultAvatar(userProfile?.display_name)} alt="you" className="w-10 h-10 rounded-full flex-shrink-0 mt-1" />
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
                {sortedComments.map((c, idx) => <CommentItem key={`${c.uid}-${idx}-${c.created_at}`} comment={c} />)}
            </div>
        </div>
    )
}

// --- Main Screen Component ---
interface EpisodePlayerScreenProps {
    item: MediaContent;
    episode: EpisodeSerie;
    onBack: () => void;
    onNavigateEpisode: (direction: 'next' | 'prev') => void;
    onReturnHome: () => void;
}

const EpisodePlayerScreen: React.FC<EpisodePlayerScreenProps> = ({ item, episode, onBack, onNavigateEpisode, onReturnHome }) => {
    const { t, bookmarkedIds, toggleBookmark, userProfile } = useAppContext();
    const [episodesInSerie, setEpisodesInSerie] = useState<EpisodeSerie[]>([]);
    const [likeCount, setLikeCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);

    useEffect(() => {
        const fetchEpisodes = async () => {
            try {
                const serie = await serieService.getSerieById(item.id);
                if (!serie) { setEpisodesInSerie([]); return; }
                const seasons = await seasonSerieService.getSeasonsBySerie(serie.uid_serie);
                if (seasons.length === 0) { setEpisodesInSerie([]); return; }
                const episodesBySeason = await Promise.all(
                    seasons.map(async (s) => await episodeSerieService.getEpisodesBySeason(s.uid_season))
                );
                setEpisodesInSerie(episodesBySeason.flat());
            } catch (error) {
                console.error('Error fetching episodes list:', error);
                setEpisodesInSerie([]);
            }
        };
        fetchEpisodes();
    }, [item.id]);

    // Fetch like data
    useEffect(() => {
        const fetchLikeData = async () => {
            const itemUid = episode.uid_episode;
            try {
                const count = await likeService.getLikeCount(itemUid);
                setLikeCount(count);

                if (userProfile?.email) {
                    const liked = await likeService.hasUserLiked(itemUid, userProfile.email);
                    setHasLiked(liked);
                }
            } catch (error) {
                console.error('Error fetching like data:', error);
            }
        };

        fetchLikeData();
    }, [episode.uid_episode, userProfile]);

    // Utiliser les données EpisodeSerie passées en prop
    const displayEpisode = episode;

    const handleShare = async () => {
        const shareData = {
            title: displayEpisode.title,
            text: `Regardez "${displayEpisode.title}" sur CMFI Replay`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback pour les navigateurs qui ne supportent pas l'API Web Share
                await navigator.clipboard.writeText(window.location.href);
                toast.success('Lien copié dans le presse-papier !', {
                    position: 'bottom-center',
                    autoClose: 2000,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: 'colored',
                });
            }
        } catch (err) {
            console.error('Erreur lors du partage:', err);
            if (err.name !== 'AbortError') {
                toast.error('Erreur lors du partage', {
                    position: 'bottom-center',
                    autoClose: 2000,
                    hideProgressBar: true,
                });
            }
        }
    };

    const handleLike = async () => {
        if (!userProfile) {
            toast.error('Vous devez être connecté pour liker', {
                position: 'bottom-center',
                autoClose: 2000,
            });
            return;
        }

        const itemUid = episode.uid_episode;
        const itemTitle = episode.title;

        try {
            const isLiked = await likeService.toggleLike(itemUid, itemTitle, userProfile);
            setHasLiked(isLiked);
            setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
        } catch (error) {
            console.error('Error toggling like:', error);
            toast.error('Erreur lors du like', {
                position: 'bottom-center',
                autoClose: 2000,
            });
        }
    };

    const isBookmarked = bookmarkedIds.includes(item.id);

    const currentIndex = useMemo(() => {
        if (!episode || episodesInSerie.length === 0) return -1;
        let idx = episodesInSerie.findIndex(e => e.uid_episode === episode.uid_episode);
        if (idx === -1) {
            idx = episodesInSerie.findIndex(e => e.episode_numero === episode.episode_numero && e.title === episode.title);
        }
        return idx;
    }, [episodesInSerie, episode]);

    const hasPrevEpisode = currentIndex > 0;
    const hasNextEpisode = currentIndex !== -1 && currentIndex < episodesInSerie.length - 1;

    const ActionButton: React.FC<{ Icon: React.FC<any>, label: string, value?: string | number, onClick?: () => void }> = ({ Icon, label, value, onClick }) => (
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
                <VideoPlayer key={episode.uid_episode || episode.title} src={episode.video_path_hd?.trim() ? episode.video_path_hd : episode.video_path_sd} poster={episode.picture_path || item.imageUrl} onUnavailable={onReturnHome} />
            </div>

            <div className="p-4 space-y-6">
                <h1 className="text-3xl font-bold">{displayEpisode.title}</h1>
                <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>{item.author || item.theme}</span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <span>{formatNumber(0)} {t('views')}</span>
                </div>
                <div className="flex items-center justify-around py-2">
                    <ActionButton
                        Icon={LikeIcon}
                        label={hasLiked ? t('liked') : t('like')}
                        value={likeCount}
                        onClick={handleLike}
                    />
                    <ActionButton
                        Icon={isBookmarked ? CheckIcon : PlusIcon}
                        label={isBookmarked ? t('addedToList') : t('myList')}
                        onClick={() => toggleBookmark(item.id)}
                    />
                    <ActionButton
                        Icon={ShareIcon}
                        label={t('share')}
                        onClick={handleShare}
                    />
                </div>

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

                <div className="border-t border-gray-200 dark:border-gray-800" />

                <CommentSection itemUid={episode.uid_episode} />
            </div>
        </div>
    );
};

export default EpisodePlayerScreen;
