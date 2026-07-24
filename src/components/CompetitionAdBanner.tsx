import React, { useState, useRef } from 'react';
import { Volume2, VolumeX, ExternalLink, X } from 'lucide-react';

interface CompetitionAdBannerProps {
  /** Optional custom video URL for the banner */
  videoUrl?: string;
  /** Optional custom headline for the ad */
  title?: string;
  /** Optional sponsor name */
  sponsor?: string;
  /** Destination link */
  linkUrl?: string;
}

const DEFAULT_VIDEO_ADS = [
  {
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-soccer-player-kicking-a-ball-on-a-field-40621-large.mp4',
    title: 'Equipamentos Oficiais de Futebol',
    sponsor: 'MamboSport Store',
    linkUrl: 'https://mSoccer.app'
  },
  {
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-football-on-the-grass-40618-large.mp4',
    title: 'Aposte com Responsabilidade nas Melhores Odds',
    sponsor: 'BetSoccer Partner',
    linkUrl: 'https://mSoccer.app'
  },
  {
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-playing-soccer-in-a-stadium-40623-large.mp4',
    title: 'Assista aos Melhores Momentos em HD',
    sponsor: 'Sports Pass HD',
    linkUrl: 'https://mSoccer.app'
  }
];

export const CompetitionAdBanner: React.FC<CompetitionAdBannerProps> = ({
  videoUrl,
  title,
  sponsor,
  linkUrl
}) => {
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isClosed, setIsClosed] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Randomize ad if not provided
  const [adConfig] = useState(() => {
    const randomAd = DEFAULT_VIDEO_ADS[Math.floor(Math.random() * DEFAULT_VIDEO_ADS.length)];
    return {
      videoUrl: videoUrl || randomAd.videoUrl,
      title: title || randomAd.title,
      sponsor: sponsor || randomAd.sponsor,
      linkUrl: linkUrl || randomAd.linkUrl
    };
  });

  // If ad failed to load or user closed it, do not render ANY container space
  if (hasError || isClosed) {
    return null;
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClosed(true);
  };

  return (
    <div className="w-full bg-zinc-950 dark:bg-black border-y border-zinc-200/80 dark:border-zinc-800 transition-all select-none relative overflow-hidden my-1">
      {/* Top Banner Control Bar */}
      <div className="w-full bg-zinc-900/90 px-3 py-1 flex items-center justify-between border-b border-zinc-800/60 text-zinc-400">
        <div className="flex items-center space-x-1.5">
          <span className="text-[7.5px] font-black tracking-widest text-zinc-400 uppercase bg-zinc-800 px-1.5 py-0.5 rounded-xs">
            PUBLICIDADE
          </span>
          <span className="text-[9px] font-bold text-zinc-300 truncate max-w-[180px]">
            {adConfig.sponsor}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="text-zinc-400 hover:text-white transition-colors p-0.5 cursor-pointer"
            title={isMuted ? "Ativar som" : "Desativar som"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-white transition-colors p-0.5 cursor-pointer"
            title="Fechar anúncio"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Video Banner Body - Inline & Seamless */}
      <a
        href={adConfig.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full relative group cursor-pointer"
      >
        <div className="w-full h-28 sm:h-36 bg-black relative overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            src={adConfig.videoUrl}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onLoadedData={() => setIsVideoLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isVideoLoaded ? 'opacity-90 group-hover:opacity-100' : 'opacity-0'
            }`}
          />

          {!isVideoLoaded && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
              <span className="text-[9px] text-zinc-500 font-medium animate-pulse">
                Carregando anúncio...
              </span>
            </div>
          )}

          {/* Video Gradient Overlay with Title */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-white tracking-tight leading-snug line-clamp-1 group-hover:text-emerald-400 transition-colors">
                {adConfig.title}
              </span>
              <span className="shrink-0 ml-2 bg-[#3C8C21] text-white text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-sm">
                <span>SABER MAIS</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};

