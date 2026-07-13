import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MessageSquare, Send, Users, Sparkles, Flame, RefreshCw, Trophy, Image, Video, X } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, limit, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface ChatMessage {
  id: string;
  room: string;
  senderName: string;
  senderTeam?: string;
  senderAvatar: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  timestamp: string;
  likes: number;
  userLiked?: boolean;
  isMe?: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

const compressImage = (base64Str: string, maxWidth = 600, maxHeight = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};


const INITIAL_SIMULATED_MESSAGES: ChatMessage[] = [
  // Geral Room
  {
    id: 'm1',
    room: 'geral',
    senderName: 'Carlos Macuácua',
    senderTeam: 'Costa do Sol',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    text: 'Sejam bem-vindos ao chat oficial do mSoccer! Quem é o favorito para o próximo jogo?',
    timestamp: '16:15',
    likes: 4,
  },
  {
    id: 'm2',
    room: 'geral',
    senderName: 'Amélia Nhaca',
    senderTeam: 'Black Bulls',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amelia',
    text: 'Os touros estão imparáveis este ano! Ninguém nos para! 🐂🔥',
    timestamp: '16:18',
    likes: 12,
  },
  // Moçambola Room
  {
    id: 'm3',
    room: 'mocambola',
    senderName: 'Sérgio Tembe',
    senderTeam: 'Ferroviário de Maputo',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sergio',
    text: 'O clássico de Maputo vai ser quente! O Ferroviário precisa de ganhar este jogo de qualquer maneira.',
    timestamp: '16:05',
    likes: 8,
  },
  {
    id: 'm4',
    room: 'mocambola',
    senderName: 'Filipe Songo',
    senderTeam: 'UD Songo',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Filipe',
    text: 'UD Songo está focado. As estatísticas do mSoccer não mentem, somos fortes em casa! 🇲🇿⭐',
    timestamp: '16:10',
    likes: 6,
  },
  // Transferencias Room
  {
    id: 'm5',
    room: 'transferencias',
    senderName: 'Telma Mondlane',
    senderTeam: 'Costa do Sol',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Telma',
    text: 'Ouvi dizer que o Costa do Sol está a negociar com um novo avançado brasileiro. Alguém sabe de algo?',
    timestamp: '15:50',
    likes: 3,
  },
  {
    id: 'm6',
    room: 'transferencias',
    senderName: 'Dércio_Bulls',
    senderTeam: 'Black Bulls',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dercio',
    text: 'Se for verdade, o Moçambola vai ficar ainda mais competitivo. O mercado está animado!',
    timestamp: '15:55',
    likes: 9,
  },
];

const SIMULATED_RESPONSES: Record<string, Omit<ChatMessage, 'id' | 'timestamp' | 'likes'>[]> = {
  geral: [
    {
      room: 'geral',
      senderName: 'Zacarias Chilengue',
      senderTeam: 'Ferroviário de Maputo',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zacarias',
      text: 'O simulador do mSoccer é fantástico! Dá para acompanhar tudo ao vivo!',
    },
    {
      room: 'geral',
      senderName: 'Neuza Langa',
      senderTeam: 'UD Songo',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Neuza',
      text: 'Espero que o jogo de hoje tenha muitos golos! ⚽⚽',
    },
    {
      room: 'geral',
      senderName: 'Mauro Chongo',
      senderTeam: 'Costa do Sol',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mauro',
      text: 'Grande comunidade aqui no mSoccer! Abraço a todos os adeptos!',
    },
  ],
  mocambola: [
    {
      room: 'mocambola',
      senderName: 'Edmilson Moçambique',
      senderTeam: 'Black Bulls',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Edmilson',
      text: 'Os touros jogam o melhor futebol do país atualmente, aceitem ou não! 🐂🇧🇷🇲🇿',
    },
    {
      room: 'mocambola',
      senderName: 'Gisela Machava',
      senderTeam: 'Costa do Sol',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gisela',
      text: 'Respeitem o decacampeão! Costa do Sol tem história e vai lutar até ao fim!',
    },
    {
      room: 'mocambola',
      senderName: 'Osvaldo Ferro',
      senderTeam: 'Ferroviário da Beira',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Osvaldo',
      text: 'O Chiveve vai ferver! Beira sempre forte!',
    },
  ],
  transferencias: [
    {
      room: 'transferencias',
      senderName: 'Mário Fan',
      senderTeam: 'UD Songo',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mario',
      text: 'Confirmado! O médio ofensivo assinou por 2 épocas. Que contratação de luxo!',
    },
    {
      room: 'transferencias',
      senderName: 'Júlia Novas',
      senderTeam: 'Costa do Sol',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julia',
      text: 'O mercado de transferências em Moçambique está a crescer muito. Excelente para o desporto nacional.',
    },
  ],
};

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // ignore
    }
  }
};

export const ChatSection: React.FC = () => {
  const { user, navigateTo, dbConfig, activeChatRoom, setActiveChatRoom, chatUnreadCounts, onlineUsers, setMyTypingState } = useApp();
  const activeRoom = activeChatRoom;
  const setActiveRoom = (room: 'geral' | 'mocambola' | 'transferencias') => {
    setActiveChatRoom(room);
  };
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachedMedia, setAttachedMedia] = useState<{ url: string; type: 'image' | 'video'; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!user) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      setMyTypingState(activeRoom);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      setMyTypingState(null);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (user) {
        setMyTypingState(null);
      }
    };
  }, [user]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('Apenas fotos e vídeos são permitidos no chat da comunidade.');
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Str = e.target?.result as string;
      if (!base64Str) {
        setIsUploading(false);
        return;
      }

      if (isImage) {
        try {
          const compressed = await compressImage(base64Str);
          setAttachedMedia({
            url: compressed,
            type: 'image',
            name: file.name
          });
        } catch (err) {
          console.error("Erro ao otimizar imagem:", err);
          if (file.size > 1000 * 1024) {
            alert('A imagem é muito grande! Escolha uma imagem menor que 1MB.');
          } else {
            setAttachedMedia({
              url: base64Str,
              type: 'image',
              name: file.name
            });
          }
        }
      } else {
        if (file.size > 1024 * 1024) {
          alert('O vídeo é muito grande! O limite de upload para o chat é de 1MB.');
        } else {
          setAttachedMedia({
            url: base64Str,
            type: 'video',
            name: file.name
          });
        }
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
      alert('Erro ao ler o ficheiro.');
    };
    reader.readAsDataURL(file);
  };


  // Real-time Firestore sync
  useEffect(() => {
    const q = query(
      collection(db, 'chat_messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        msgs.push({
          id: docSnapshot.id,
          room: data.room || 'geral',
          senderName: data.senderName,
          senderTeam: data.senderTeam,
          senderAvatar: data.senderAvatar,
          text: data.text,
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType,
          timestamp: data.timestamp || '',
          likes: data.likes || 0,
          userLiked: false,
          status: data.status || 'sent',
        });
      });
      
      // If the database has absolutely NO messages at all, seed with simulated ones only if DB is not cleared
      if (msgs.length === 0 && dbConfig && dbConfig.initialized === false && dbConfig.cleared !== true) {
        INITIAL_SIMULATED_MESSAGES.forEach(async (m) => {
          try {
            await setDoc(doc(db, 'chat_messages', m.id), {
              room: m.room,
              senderName: m.senderName,
              senderTeam: m.senderTeam,
              senderAvatar: m.senderAvatar,
              text: m.text,
              timestamp: m.timestamp,
              likes: m.likes,
              createdAt: serverTimestamp()
            });
          } catch (err) {
            console.error("Error seeding chat message:", err);
          }
        });
        setMessages(INITIAL_SIMULATED_MESSAGES);
      } else {
        const localLikes = JSON.parse(safeLocalStorage.getItem('msoccer_liked_messages') || '[]');
        const updatedMsgs = msgs.map(m => ({
          ...m,
          userLiked: localLikes.includes(m.id)
        }));
        setMessages(updatedMsgs);
      }
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
    });

    return () => unsubscribe();
  }, [dbConfig]);

  // Scroll to bottom when room or messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeRoom, messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedMedia) return;

    const myName = user?.name || 'Adepto Anónimo';
    const myAvatar = user?.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(myName)}`;
    const myTeam = user?.role === 'Admin' ? 'mSoccer Staff' : 'Adeptos';

    const text = inputText.trim();
    const mediaToSend = attachedMedia;
    
    setInputText('');
    setAttachedMedia(null);

    try {
      await addDoc(collection(db, 'chat_messages'), {
        room: activeRoom,
        senderName: myName,
        senderTeam: myTeam,
        senderAvatar: myAvatar,
        text: text,
        mediaUrl: mediaToSend ? mediaToSend.url : null,
        mediaType: mediaToSend ? mediaToSend.type : null,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        likes: 0,
        status: 'sent',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending message to Firestore:", err);
      const fallbackMsg: ChatMessage = {
        id: 'msg_fallback_' + Date.now(),
        room: activeRoom,
        senderName: myName,
        senderTeam: myTeam,
        senderAvatar: myAvatar,
        text: text,
        mediaUrl: mediaToSend ? mediaToSend.url : undefined,
        mediaType: mediaToSend ? mediaToSend.type : undefined,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        likes: 0,
        isMe: true
      };
      setMessages(prev => [...prev, fallbackMsg]);
    }
  };

  const toggleLikeMessage = async (id: string) => {
    const localLikes = JSON.parse(safeLocalStorage.getItem('msoccer_liked_messages') || '[]');
    const isAlreadyLiked = localLikes.includes(id);
    
    const m = messages.find(msg => msg.id === id);
    if (!m) return;

    const newLikesCount = isAlreadyLiked ? Math.max(0, m.likes - 1) : m.likes + 1;
    
    const updatedLikes = isAlreadyLiked 
      ? localLikes.filter((likedId: string) => likedId !== id)
      : [...localLikes, id];
    safeLocalStorage.setItem('msoccer_liked_messages', JSON.stringify(updatedLikes));

    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, likes: newLikesCount, userLiked: !isAlreadyLiked } : msg));

    try {
      const msgRef = doc(db, 'chat_messages', id);
      await updateDoc(msgRef, {
        likes: newLikesCount
      });
    } catch (e) {
      console.error("Error updating likes in Firestore:", e);
    }
  };

  const handleQuickEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const filteredMessages = messages.filter((m) => m.room === activeRoom);

  const rooms = [
    { id: 'geral', label: 'Geral 💬', icon: MessageSquare, description: 'Discussão geral de futebol' },
    { id: 'mocambola', label: 'Moçambola 🏆', icon: Trophy, description: 'Discussão sobre o campeonato nacional' },
    { id: 'transferencias', label: 'Transferências 🔄', icon: Flame, description: 'Rumores, contratações e saídas' },
  ];

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="max-w-6xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col bg-slate-50 dark:bg-[#0F172A] relative"
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#1E3A8A]/90 backdrop-blur-xs z-50 flex flex-col items-center justify-center text-white border-4 border-dashed border-white/40 m-2 rounded-2xl transition-all pointer-events-none">
          <div className="bg-white/10 p-5 rounded-full mb-3 animate-bounce">
            <Image className="w-10 h-10 text-white" />
          </div>
          <p className="text-xs font-black uppercase tracking-wider">Solte o seu arquivo aqui</p>
          <p className="text-[10px] text-white/75 mt-1">Carregar foto ou vídeo no chat (Limite 1MB)</p>
        </div>
      )}

      
      {/* Rooms selector tab bar */}
      <div className="bg-[#1E3A8A] p-2 flex space-x-2 overflow-x-auto shrink-0 select-none scrollbar-hide">
        {rooms.map((room) => {
          const isActive = activeRoom === room.id;
          const unreadCount = chatUnreadCounts?.[room.id] || 0;
          return (
            <button
              key={room.id}
              onClick={() => setActiveRoom(room.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-white text-[#1E3A8A] shadow-sm'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <span>{room.label}</span>
              {unreadCount > 0 && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce ${
                  isActive ? 'bg-rose-500 text-white' : 'bg-white text-rose-500'
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Room stats / online badge */}
      <div className="bg-white dark:bg-[#1E293B] border-b border-slate-100 dark:border-slate-800/80 px-4 py-2 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
            {rooms.find(r => r.id === activeRoom)?.label.split(' ')[0]} - {rooms.find(r => r.id === activeRoom)?.description}
          </h2>
        </div>
        <div className="flex items-center space-x-1.5 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
          <Users className="w-3 h-3" />
          <span>{onlineUsers.filter(u => u.status === 'online').length} online</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <MessageSquare className="w-12 h-12 mb-2 stroke-1 opacity-50" />
            <p className="text-xs font-medium">Nenhuma mensagem neste canal ainda.</p>
            <p className="text-[10px]">Seja o primeiro a enviar uma mensagem!</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMyMsg = msg.isMe || msg.senderName === user?.name;
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-2.5 max-w-[85%] ${
                  isMyMsg ? 'ml-auto flex-row-reverse space-x-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0 select-none">
                  <img
                    src={msg.senderAvatar}
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
                    referrerPolicy="no-referrer"
                  />
                  {onlineUsers.some((u) => u.name === msg.senderName && u.status === 'online') && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-white dark:border-[#0F172A] rounded-full animate-pulse" />
                  )}
                </div>

                {/* Bubble Container */}
                <div className="space-y-1">
                  {/* Sender Name & Badge info */}
                  <div className={`flex items-center gap-1.5 text-[10px] ${isMyMsg ? 'justify-end' : 'justify-start'}`}>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{msg.senderName}</span>
                    {msg.senderTeam && (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-zinc-400 font-extrabold px-1 rounded uppercase tracking-tighter text-[8px]">
                        {msg.senderTeam}
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-3 rounded-2xl relative shadow-sm text-xs leading-relaxed break-words ${
                      isMyMsg
                        ? 'bg-[#1E3A8A] text-white rounded-tr-none'
                        : 'bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-850'
                    }`}
                  >
                    {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                    {/* Image Anexo */}
                    {msg.mediaUrl && msg.mediaType === 'image' && (
                      <div className={`rounded-xl overflow-hidden border border-slate-200/10 bg-slate-950 flex items-center justify-center max-h-56 select-none ${msg.text ? 'mt-2' : ''}`}>
                        <img
                          src={msg.mediaUrl}
                          alt="Anexo de Imagem"
                          className="max-h-56 max-w-full object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                          referrerPolicy="no-referrer"
                          onClick={() => {
                            const win = window.open();
                            if (win) {
                              win.document.write(`<img src="${msg.mediaUrl}" style="max-width:100%; max-height:100vh; display:block; margin:auto; background:#0a0a0a;" />`);
                              win.document.body.style.background = '#0a0a0a';
                              win.document.body.style.margin = '0';
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Video Anexo */}
                    {msg.mediaUrl && msg.mediaType === 'video' && (
                      <div className={`rounded-xl overflow-hidden border border-slate-200/10 bg-slate-950 ${msg.text ? 'mt-2' : ''}`}>
                        <video
                          src={msg.mediaUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="max-h-56 w-full object-contain"
                        />
                      </div>
                    )}
                    
                    {/* Timestamp & Likes overlay */}
                    <div className="mt-1 flex items-center justify-between gap-4 text-[9px] opacity-75">
                      <div className="flex items-center space-x-1 select-none">
                        <span>{msg.timestamp}</span>
                        {isMyMsg && (
                          <span className="inline-flex items-center font-bold">
                            {msg.status === 'read' ? (
                              <span className="text-sky-300 ml-0.5" title="Lida">✓✓</span>
                            ) : msg.status === 'delivered' ? (
                              <span className="text-slate-300 ml-0.5" title="Entregue">✓✓</span>
                            ) : (
                              <span className="text-slate-400 ml-0.5" title="Enviada">✓</span>
                            )}
                          </span>
                        )}
                      </div>
                      
                      {/* Like button */}
                      <button
                        onClick={() => toggleLikeMessage(msg.id)}
                        className={`flex items-center space-x-0.5 cursor-pointer hover:scale-105 transition-transform ${
                          msg.userLiked
                            ? 'text-rose-500 font-black'
                            : isMyMsg
                            ? 'text-white/80'
                            : 'text-slate-400 dark:text-zinc-500'
                        }`}
                      >
                        <span>❤️</span>
                        <span>{msg.likes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emojis toolbar */}
      <div className="bg-slate-100 dark:bg-[#1E293B]/60 border-t border-slate-200/50 dark:border-slate-850 px-3 py-1.5 flex gap-1.5 overflow-x-auto shrink-0 select-none">
        {['⚽', '🔥', '👏', '🦁', '🐂', '🌟', '🤣', '😮', '❤️'].map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleQuickEmoji(emoji)}
            className="w-7 h-7 flex items-center justify-center bg-white dark:bg-[#0F172A] border border-slate-200/40 dark:border-slate-800/80 rounded-lg text-sm hover:scale-110 active:scale-95 transition-all cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Upload progress indicator */}
      {isUploading && (
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center space-x-2 text-[11px] text-slate-500 dark:text-zinc-400 shrink-0">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1E3A8A]" />
          <span>Otimizando e carregando seu anexo...</span>
        </div>
      )}

      {/* Attached Media Preview */}
      {attachedMedia && (
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between animate-in fade-in slide-in-from-bottom-1 shrink-0">
          <div className="flex items-center space-x-3">
            {attachedMedia.type === 'image' ? (
              <img 
                src={attachedMedia.url} 
                alt="Miniatura" 
                className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-850" 
              />
            ) : (
              <div className="w-10 h-10 flex items-center justify-center bg-[#1E3A8A] text-white rounded-lg border border-slate-200 dark:border-slate-750">
                <Video className="w-5 h-5" />
              </div>
            )}
            <div className="text-left">
              <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                {attachedMedia.name}
              </p>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider font-black">
                {attachedMedia.type === 'image' ? 'Imagem Pronta' : 'Vídeo Pronto'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAttachedMedia(null)}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Remover anexo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Typing Indicator Bar */}
      {(() => {
        const typingUsers = onlineUsers.filter(
          (u) => u.typingIn === activeRoom && u.uid !== user?.uid && u.status === 'online'
        );
        if (typingUsers.length === 0) return null;
        return (
          <div className="px-4 py-1.5 bg-emerald-500/5 dark:bg-emerald-500/10 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium italic shrink-0 select-none">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0].name} está digitando...`
                : typingUsers.length === 2
                ? `${typingUsers[0].name} e ${typingUsers[1].name} estão digitando...`
                : "Várias pessoas estão digitando..."}
            </span>
          </div>
        );
      })()}

      {/* Text input form */}
      {!user ? (
        <div className="p-4 bg-slate-50 dark:bg-[#0F172A] border-t border-slate-200 dark:border-slate-800/80 text-center space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            Você precisa estar logado para enviar mensagens no chat da comunidade.
          </p>
          <button
            type="button"
            onClick={() => navigateTo({ type: 'perfil' })}
            className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white text-[11px] font-bold rounded-xl cursor-pointer inline-flex items-center space-x-1"
          >
            <span>Fazer Login ou Criar Conta</span>
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-white dark:bg-[#1E293B] border-t border-slate-200 dark:border-slate-800/80 flex items-center space-x-2 shrink-0"
        >
          {/* File Input (Hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
              e.target.value = '';
            }}
            accept="image/*,video/*"
            className="hidden"
          />

          {/* Attach Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 bg-slate-50 dark:bg-[#0F172A] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-zinc-400 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
            title="Anexar Foto ou Vídeo"
          >
            <Image className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder={attachedMedia ? "Adicione uma legenda..." : "Digite sua mensagem de futebol..."}
            className="flex-1 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] focus:border-transparent placeholder:text-slate-400 font-medium"
          />
          <button
            type="submit"
            className="bg-[#1E3A8A] hover:bg-[#172554] text-white p-2.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Enviar"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};
