import React from 'react';
import { MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, SkipIcon, ReportIcon } from './icons';

interface ControlBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  onNext: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onReport: () => void;
}

const ControlButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string, 'aria-label': string }> = ({ onClick, children, className, ...props }) => (
    <button 
        onClick={onClick}
        className={`flex items-center justify-center w-14 h-14 rounded-full transition-all duration-200 focus:outline-none focus:ring-4 ${className}`}
        {...props}
    >
        {children}
    </button>
);


export const ControlBar: React.FC<ControlBarProps> = ({ isMuted, isVideoOff, onNext, onToggleMute, onToggleVideo, onReport }) => {
  return (
    <div className="bg-gray-900 bg-opacity-70 backdrop-blur-md p-4">
      <div className="max-w-md mx-auto flex justify-center items-center space-x-4">
        <ControlButton 
            onClick={onToggleMute} 
            className={isMuted ? "bg-red-600 hover:bg-red-700 text-white focus:ring-red-400" : "bg-gray-700 hover:bg-gray-600 text-gray-200 focus:ring-gray-500"}
            aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOffIcon className="w-7 h-7" /> : <MicIcon className="w-7 h-7" />}
        </ControlButton>
        
        <ControlButton 
            onClick={onToggleVideo}
            className={isVideoOff ? "bg-red-600 hover:bg-red-700 text-white focus:ring-red-400" : "bg-gray-700 hover:bg-gray-600 text-gray-200 focus:ring-gray-500"}
            aria-label={isVideoOff ? "Turn camera on" : "Turn camera off"}
        >
          {isVideoOff ? <VideoOffIcon className="w-7 h-7" /> : <VideoIcon className="w-7 h-7" />}
        </ControlButton>
        
        <button
          onClick={onNext}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-full transition-transform duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-300 flex items-center space-x-2 text-lg"
          aria-label="Next person"
        >
            <SkipIcon className="w-6 h-6"/>
            <span>Next</span>
        </button>
        
        <ControlButton 
            onClick={onReport}
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 focus:ring-gray-500"
            aria-label="Report user"
        >
          <ReportIcon className="w-7 h-7" />
        </ControlButton>
      </div>
    </div>
  );
};
