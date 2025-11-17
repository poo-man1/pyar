import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ControlBar } from './ControlBar';
import { ReportModal } from './ReportModal';
import { Chat, Message } from './Chat';
import { analyzeText } from '../lib/gemini';
import { CameraOffIcon, UserIcon } from './icons';

// IMPORTANT: Replace this with your actual signaling server URL
const SIGNALING_SERVER_URL = 'wss://your-pyar-signaling-server.com'; 

// Configuration for the RTCPeerConnection, including STUN and TURN servers
// for robust connectivity across different network types.
const PEER_CONNECTION_CONFIG: RTCConfiguration = {
  iceServers: [
    // Public STUN servers - helps peers find each other.
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    // A TURN server is a relay server used when a direct P2P connection fails.
    // You would need to host your own or use a paid service.
    // Replace the following with your actual TURN server configuration.
    /*
    {
      urls: 'turn:your-turn-server-address:3478',
      username: 'your-turn-username',
      credential: 'your-turn-password',
    },
    */
  ],
};

type ConnectionStatus = 'searching' | 'connecting' | 'connected' | 'disconnected' | 'error';


export const VideoChat: React.FC = () => {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('searching');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reportedMessage, setReportedMessage] = useState<Message | null>(null);
  const [showConnectedMessage, setShowConnectedMessage] = useState<boolean>(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const partnerIdRef = useRef<string | null>(null);

  const cleanupConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
    }
    setMessages([]);
    partnerIdRef.current = null;
  }, []);
  
  const setupMedia = useCallback(async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Error accessing media devices.", err);
      setPermissionError("Camera and Microphone access denied. Please enable permissions in your browser settings to use Pyar.");
      setConnectionStatus('error');
      return null;
    }
  }, []);

  const createPeerConnection = useCallback((stream: MediaStream) => {
    cleanupConnection();
    const pc = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && partnerIdRef.current) {
        socketRef.current.emit('webrtc-ice-candidate', {
          targetId: partnerIdRef.current,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnectionStatus('connected');
        setShowConnectedMessage(true);
        setTimeout(() => {
          setShowConnectedMessage(false);
        }, 2000);
      }
    };

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    peerConnectionRef.current = pc;
    return pc;
  }, [cleanupConnection]);

  useEffect(() => {
    setupMedia().then(stream => {
        if(!stream) return;

        const socket = io(SIGNALING_SERVER_URL, { transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to signaling server');
            socket.emit('ready-for-match');
            setConnectionStatus('searching');
        });

        socket.on('partner-found', async ({ partnerId, shouldCreateOffer }) => {
            partnerIdRef.current = partnerId;
            setConnectionStatus('connecting');
            const pc = createPeerConnection(stream);
            if (shouldCreateOffer) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('webrtc-offer', { targetId: partnerId, offer });
            }
        });

        socket.on('webrtc-offer', async ({ offer, senderId }) => {
            partnerIdRef.current = senderId;
            setConnectionStatus('connecting');
            const pc = createPeerConnection(stream);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc-answer', { targetId: senderId, answer });
        });
        
        socket.on('webrtc-answer', async ({ answer }) => {
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        socket.on('webrtc-ice-candidate', ({ candidate }) => {
            if (peerConnectionRef.current && candidate) {
                peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        socket.on('partner-disconnected', () => {
            setConnectionStatus('disconnected');
            cleanupConnection();
            setTimeout(() => {
                socket.emit('ready-for-match');
                setConnectionStatus('searching');
            }, 2000);
        });
        
        socket.on('chat-message', (message: Message) => {
            setMessages(prev => [...prev, {...message, sender: 'remote'}]);
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected from signaling server');
            setConnectionStatus('error');
            cleanupConnection();
        });

    });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      cleanupConnection();
    };
  }, [setupMedia, createPeerConnection, cleanupConnection]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(prev => !prev);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (socketRef.current) {
        socketRef.current.emit('find-new-partner');
        cleanupConnection();
        setConnectionStatus('searching');
    }
  }, [cleanupConnection]);
  
  const handleSendMessage = useCallback(async (text: string) => {
    const { isToxic } = await analyzeText(text);

    if (isToxic) {
        alert("Warning: Your message may violate our community guidelines. Continuous violations may result in a ban.");
    }
    
    const newMessage: Message = {
        id: Date.now(),
        text,
        sender: 'local',
        isToxic
    };
    setMessages(prev => [...prev, newMessage]);
    
    if (socketRef.current && partnerIdRef.current) {
        socketRef.current.emit('chat-message', { targetId: partnerIdRef.current, message: newMessage });
    }
  }, []);

  const handleReportMessage = useCallback((message: Message) => {
    setReportedMessage(message);
    setIsReportModalOpen(true);
  }, []);

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    setReportedMessage(null);
  }
  
  const renderConnectionStatus = () => {
    switch (connectionStatus) {
        case 'searching':
            return (
                <div className="flex flex-col items-center">
                    <div className="animate-pulse text-orange-500">
                        <UserIcon className="w-24 h-24" />
                    </div>
                    <p className="mt-4 text-lg">Searching for a partner...</p>
                </div>
            );
        case 'connecting':
            return (
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                    <p className="mt-4 text-lg">Connecting...</p>
                </div>
            );
        case 'disconnected':
             return (
                <div className="flex flex-col items-center">
                    <p className="text-lg text-gray-400">Partner has left.</p>
                    <p className="text-sm text-gray-500">Searching for another...</p>
                </div>
            );
        case 'error':
             return (
                <div className="flex flex-col items-center p-4 text-center">
                    <p className="text-lg text-red-400">Connection error.</p>
                    <p className="text-sm text-gray-500">Could not connect to the server. Please check your connection and refresh the page.</p>
                </div>
            );
        case 'connected':
        default:
            return null;
    }
  }


  if (permissionError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 p-4">
        <div className="bg-gray-800 border border-red-500 rounded-lg p-8 max-w-lg text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Permissions Required</h2>
            <p className="text-gray-300 mb-6">{permissionError}</p>
            <button 
                onClick={setupMedia}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
                Retry
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col md:flex-row overflow-hidden">
      <div className="flex-grow flex flex-col relative bg-black">
        {/* Ad Placeholder: Top Banner */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gray-800/50 flex items-center justify-center text-gray-400 z-20">
          Ad Banner (728x90)
        </div>

        {/* Remote Video */}
        <div className="relative w-full h-full flex items-center justify-center">
            <video ref={remoteVideoRef} autoPlay playsInline className={`w-full h-full object-cover ${connectionStatus !== 'connected' ? 'hidden' : ''}`} />
            {connectionStatus !== 'connected' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                    {renderConnectionStatus()}
                </div>
            )}
            {showConnectedMessage && connectionStatus === 'connected' && (
                <div className="absolute inset-0 flex items-center justify-center bg-transparent pointer-events-none">
                    <div className="bg-black bg-opacity-70 text-green-400 font-bold text-2xl px-6 py-3 rounded-lg shadow-lg animate-pulse">
                        Connected!
                    </div>
                </div>
            )}
        </div>


        {/* Local Video */}
        <div className="absolute bottom-20 md:bottom-28 right-5 w-36 h-24 md:w-60 md:h-40 rounded-xl overflow-hidden border-2 border-gray-700 shadow-lg z-10 bg-black">
          {isVideoOff ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
              <CameraOffIcon className="w-8 h-8 text-gray-400" />
              <p className="text-xs mt-1 text-gray-400">Camera Off</p>
            </div>
          ) : (
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100" />
          )}
        </div>

        {/* Control Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
            <ControlBar
              isMuted={isMuted}
              isVideoOff={isVideoOff}
              onNext={handleNext}
              onToggleMute={toggleMute}
              onToggleVideo={toggleVideo}
              onReport={() => setIsReportModalOpen(true)}
            />
        </div>
      </div>
      
      {/* Sidebar for Chat */}
      <div className="w-full md:w-96 bg-gray-800 flex-shrink-0 flex flex-col h-96 md:h-full">
         <div className="h-24 flex-shrink-0 bg-gray-700/50 flex items-center justify-center text-gray-400 border-b border-gray-700">
            Ad Rectangle (300x100)
         </div>
         <div className="flex-grow min-h-0">
            <Chat messages={messages} onSendMessage={handleSendMessage} onReportMessage={handleReportMessage} />
         </div>
         <div className="text-center text-xs text-gray-500 p-2 border-t border-gray-700 flex-shrink-0">
            <a href="#" className="hover:underline">Terms</a> | <a href="#" className="hover:underline">Privacy</a> | <a href="#" className="hover:underline">Guidelines</a>
         </div>
      </div>

      <ReportModal isOpen={isReportModalOpen} onClose={handleCloseReportModal} />
    </div>
  );
};
