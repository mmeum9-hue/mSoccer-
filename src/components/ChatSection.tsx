import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MessageSquare, Send, Users, Sparkles, Flame, RefreshCw, Trophy, Image, Video, X, Plus, Search, Check, ChevronLeft, Info, UserPlus } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, where, orderBy, limit, doc, updateDoc, serverTimestamp, setDoc, getDocs, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
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
  createdAt?: any;
}

interface ChatRoom {
  id: string;
  name?: string;
  type: 'direct' | 'group';
  participants: string[];
  joinedAt: { [uid: string]: any };
  createdBy: string;
  createdAt: any;
  lastMessage?: string;
  lastMessageAt?: any;
}

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoUrl: string;
  role?: string;
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

  // Chats and Messages State
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Media Upload State
  const [attachedMedia, setAttachedMedia] = useState<{ url: string; type: 'image' | 'video'; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Responsive / Dialog states
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  
  // Chat Creator form states
  const [createType, setCreateType] = useState<'direct' | 'group'>('direct');
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Sync users
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.uid !== user.uid) {
          list.push({
            uid: data.uid,
            name: data.name || data.email?.split('@')[0] || 'Usuário',
            email: data.email || '',
            photoUrl: data.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(data.name || 'user')}`,
            role: data.role
          });
        }
      });
      setAllUsers(list);
    }, (error) => {
      console.error("Error listening to users list:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // Sync current user's chats
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ChatRoom[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ChatRoom);
      });
      setChats(list);

      // Auto-select first chat if none is active and there are conversations available
      if (list.length > 0 && !activeChatRoom) {
        setActiveChatRoom(list[0].id);
      }
    }, (error) => {
      console.error("Error listening to user chats:", error);
    });
    return () => unsubscribe();
  }, [user, activeChatRoom]);

  // Sync active chat's messages
  useEffect(() => {
    if (!user || !activeRoom) {
      setMessages([]);
      return;
    }

    // Secure query for messages matching activeChatId
    const q = query(
      collection(db, 'chat_messages'),
      where('chatId', '==', activeRoom)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        msgs.push({
          id: docSnapshot.id,
          chatId: data.chatId,
          senderId: data.senderId,
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
          createdAt: data.createdAt
        });
      });

      // Fetch the active chat info to verify the join timestamp of the current user
      const activeChat = chats.find(c => c.id === activeRoom);
      const myJoinTime = activeChat?.joinedAt?.[user.uid];
      let joinTimeMs = 0;
      if (myJoinTime) {
        joinTimeMs = myJoinTime.toMillis ? myJoinTime.toMillis() : (typeof myJoinTime === 'number' ? myJoinTime : new Date(myJoinTime).getTime());
      }

      // Sort and filter messages to only show those sent after the user's entrance timestamp
      const sortedMsgs = msgs
        .filter((m) => {
          if (!joinTimeMs) return true; // If join timestamp isn't loaded yet, default to safety
          const mTime = m.createdAt?.toMillis ? m.createdAt.toMillis() : (m.createdAt ? new Date(m.createdAt).getTime() : Date.now());
          return mTime >= joinTimeMs;
        })
        .sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return tA - tB;
        });

      const localLikes = JSON.parse(safeLocalStorage.getItem('msoccer_liked_messages') || '[]');
      const updatedMsgs = sortedMsgs.map(m => ({
        ...m,
        userLiked: localLikes.includes(m.id)
      }));

      setMessages(updatedMsgs);
    }, (error) => {
      console.error("Firestore messages subscription error:", error);
    });

    return () => unsubscribe();
  }, [user, activeRoom, chats]);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeRoom]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!user || !activeRoom) return;

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
      alert('Apenas fotos e vídeos são permitidos no chat privado.');
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedMedia) return;
    if (!activeRoom || !user) return;

    const myName = user.name || 'Adepto Anónimo';
    const myAvatar = user.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(myName)}`;
    const myTeam = user.role === 'Admin' ? 'mSoccer Staff' : 'Adeptos';

    const text = inputText.trim();
    const mediaToSend = attachedMedia;
    
    setInputText('');
    setAttachedMedia(null);

    try {
      // Add message to chat_messages collection
      const msgDoc = await addDoc(collection(db, 'chat_messages'), {
        chatId: activeRoom,
        senderId: user.uid,
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

      // Update the chat's last message snippet and lastMessageAt timestamp
      const chatRef = doc(db, 'chats', activeRoom);
      await updateDoc(chatRef, {
        lastMessage: text || 'Anexo multimédia',
        lastMessageAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Não foi possível enviar a mensagem. Verifique se tem acesso a esta conversa.");
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
      console.error("Error updating likes:", e);
    }
  };

  const handleQuickEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  // Chat creation triggers
  const handleCreateChat = async () => {
    if (!user) return;
    
    if (createType === 'direct') {
      if (selectedUserIds.length !== 1) {
        alert("Por favor, selecione um usuário para iniciar o chat privado.");
        return;
      }
      const targetUser = allUsers.find(u => u.uid === selectedUserIds[0]);
      if (!targetUser) return;

      // Check if a direct chat between these two users already exists to prevent duplicate rooms
      const existingDirect = chats.find(c => 
        c.type === 'direct' && 
        c.participants.includes(user.uid) && 
        c.participants.includes(targetUser.uid)
      );

      if (existingDirect) {
        setActiveChatRoom(existingDirect.id);
        setIsCreateModalOpen(false);
        setMobileView('chat');
        return;
      }

      try {
        const newChatData = {
          name: `Conversa com ${targetUser.name}`,
          type: 'direct',
          participants: [user.uid, targetUser.uid],
          joinedAt: {
            [user.uid]: serverTimestamp(),
            [targetUser.uid]: serverTimestamp()
          },
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          lastMessage: 'Conversa privada iniciada',
          lastMessageAt: serverTimestamp()
        };

        const chatDocRef = await addDoc(collection(db, 'chats'), newChatData);
        setActiveChatRoom(chatDocRef.id);
        setIsCreateModalOpen(false);
        setMobileView('chat');
      } catch (err) {
        console.error("Error creating direct chat:", err);
        alert("Erro ao criar chat privado.");
      }
    } else {
      // Group creation
      if (!groupName.trim()) {
        alert("Por favor, digite o nome do grupo.");
        return;
      }
      if (selectedUserIds.length < 1) {
        alert("Por favor, selecione pelo menos um membro para adicionar ao grupo.");
        return;
      }

      try {
        const participantList = [user.uid, ...selectedUserIds];
        
        // Setup joinedAt maps
        const joinedAtMap: { [uid: string]: any } = {
          [user.uid]: serverTimestamp()
        };
        selectedUserIds.forEach((uid) => {
          joinedAtMap[uid] = serverTimestamp();
        });

        const newGroupData = {
          name: groupName.trim(),
          type: 'group',
          participants: participantList,
          joinedAt: joinedAtMap,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          lastMessage: `Grupo "${groupName.trim()}" criado`,
          lastMessageAt: serverTimestamp()
        };

        const chatDocRef = await addDoc(collection(db, 'chats'), newGroupData);
        setActiveChatRoom(chatDocRef.id);
        
        // Reset states
        setGroupName('');
        setSelectedUserIds([]);
        setIsCreateModalOpen(false);
        setMobileView('chat');
      } catch (err) {
        console.error("Error creating group chat:", err);
        alert("Erro ao criar grupo.");
      }
    }
  };

  const toggleUserSelection = (uid: string) => {
    if (createType === 'direct') {
      setSelectedUserIds([uid]);
    } else {
      setSelectedUserIds(prev => 
        prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
      );
    }
  };

  const handleAddMember = async (targetUid: string) => {
    if (!activeRoom || !user) return;
    const activeChat = chats.find(c => c.id === activeRoom);
    if (!activeChat || activeChat.type !== 'group') return;

    try {
      const chatRef = doc(db, 'chats', activeRoom);
      
      // Update participants array and set joinedAt timestamp
      await updateDoc(chatRef, {
        participants: arrayUnion(targetUid),
        [`joinedAt.${targetUid}`]: serverTimestamp(),
        lastMessage: `Um novo membro foi adicionado ao grupo`,
        lastMessageAt: serverTimestamp()
      });

      setIsAddMemberModalOpen(false);
      alert("Membro adicionado com sucesso! Ele só visualizará as mensagens enviadas a partir deste momento.");
    } catch (err) {
      console.error("Error adding member:", err);
      alert("Erro ao adicionar membro ao grupo.");
    }
  };

  // Active chat details
  const activeChat = chats.find(c => c.id === activeRoom);
  let activeChatDisplayName = 'Carregando chat...';
  let activeChatAvatar: string | undefined = undefined;
  let activeChatParticipantsCount = 0;

  if (activeChat) {
    if (activeChat.type === 'direct') {
      const otherUid = activeChat.participants.find(p => p !== user?.uid);
      const otherUser = allUsers.find(u => u.uid === otherUid);
      activeChatDisplayName = otherUser ? otherUser.name : 'Outro Usuário';
      activeChatAvatar = otherUser ? otherUser.photoUrl : `https://api.dicebear.com/7.x/adventurer/svg?seed=other`;
      activeChatParticipantsCount = 2;
    } else {
      activeChatDisplayName = activeChat.name || 'Grupo Sem Nome';
      activeChatAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(activeChatDisplayName)}`;
      activeChatParticipantsCount = activeChat.participants.length;
    }
  }

  // Filters
  const filteredUsersForNewChat = allUsers.filter(u => 
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Non-members filter
  const nonMembersOfActiveChat = allUsers.filter(u => 
    activeChat && 
    !activeChat.participants.includes(u.uid) &&
    (u.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) || 
     u.email.toLowerCase().includes(memberSearchQuery.toLowerCase()))
  );

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="w-full h-[calc(100vh-8.5rem)] flex bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-none rounded-none"
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#1E3A8A]/90 backdrop-blur-xs z-50 flex flex-col items-center justify-center text-white border-4 border-dashed border-white/40 transition-all pointer-events-none">
          <div className="bg-white/10 p-5 rounded-full mb-3 animate-bounce">
            <Image className="w-10 h-10 text-white" />
          </div>
          <p className="text-xs font-black uppercase tracking-wider">Solte o seu arquivo aqui</p>
          <p className="text-[10px] text-white/75 mt-1">Carregar foto ou vídeo no chat (Limite 1MB)</p>
        </div>
      )}

      {/* 1. SIDEBAR: Conversations List */}
      <div 
        className={`${
          mobileView === 'chat' && activeRoom ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 border-r border-slate-100 dark:border-slate-800/80 flex-col shrink-0 bg-slate-50 dark:bg-[#0F172A]`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
              Minhas Conversas
            </h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Isoladas e Privadas</p>
          </div>
          {user && (
            <button
              onClick={() => {
                setSelectedUserIds([]);
                setUserSearchQuery('');
                setIsCreateModalOpen(true);
              }}
              className="p-1.5 bg-[#1E3A8A] text-white hover:bg-[#172554] rounded-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center"
              title="Novo Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {!user ? (
            <div className="p-4 text-center space-y-2 mt-10">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-400 opacity-55 stroke-1" />
              <p className="text-[11px] font-bold text-slate-500">Inicie Sessão para Conversar</p>
              <p className="text-[10px] text-slate-400">Entre na sua conta para acessar seu histórico isolado de mensagens.</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="p-6 text-center space-y-4 mt-8">
              <MessageSquare className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Lista de Conversas Vazia</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">Você não possui nenhum chat ativo. Crie uma nova conversa privada!</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full py-2 bg-[#1E3A8A] text-white text-[11px] font-bold rounded-xl hover:bg-[#172554] transition-colors"
              >
                Nova Conversa
              </button>
            </div>
          ) : (
            [...chats].sort((a, b) => {
              const timeA = a.lastMessageAt?.toMillis ? a.lastMessageAt.toMillis() : (a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0);
              const timeB = b.lastMessageAt?.toMillis ? b.lastMessageAt.toMillis() : (b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0);
              return timeB - timeA;
            }).map((c) => {
              const isActive = activeRoom === c.id;
              const unreadCount = chatUnreadCounts?.[c.id] || 0;
              
              // Resolve display name & avatar
              let displayName = c.name || 'Chat';
              let avatarUrl: string | undefined = undefined;
              let isOnline = false;

              if (c.type === 'direct') {
                const otherUid = c.participants.find(p => p !== user.uid);
                const otherUser = allUsers.find(u => u.uid === otherUid);
                displayName = otherUser ? otherUser.name : 'Carregando...';
                avatarUrl = otherUser ? otherUser.photoUrl : `https://api.dicebear.com/7.x/adventurer/svg?seed=other`;
                isOnline = onlineUsers.some(u => u.name === displayName && u.status === 'online');
              } else {
                avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(displayName)}`;
              }

              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveChatRoom(c.id);
                    setMobileView('chat');
                  }}
                  className={`w-full p-3 rounded-xl flex items-center space-x-3 transition-all text-left ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img 
                      src={avatarUrl || undefined} 
                      alt={displayName} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800 bg-white"
                      referrerPolicy="no-referrer"
                    />
                    {c.type === 'direct' && isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#0F172A] rounded-full animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-black truncate uppercase tracking-tight ${
                        isActive ? 'text-[#1E3A8A] dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {displayName}
                      </p>
                      {unreadCount > 0 && (
                        <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-medium">
                      {c.lastMessage || 'Sem mensagens recentes'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. MAIN WINDOW: Active Chat Area */}
      <div 
        className={`${
          mobileView === 'list' && activeRoom ? 'hidden md:flex' : 'flex'
        } flex-1 flex-col h-full bg-slate-50 dark:bg-[#0F172A]`}
      >
        {!activeRoom ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <MessageSquare className="w-16 h-16 mb-4 stroke-1 opacity-40 text-[#1E3A8A]" />
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-1">Nenhuma Conversa Ativa</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Escolha uma conversa existente na barra lateral ou inicie um chat privado com outros usuários registrados.
            </p>
            {user && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 px-4 py-2 bg-[#1E3A8A] text-white font-bold text-xs rounded-xl hover:bg-[#172554] shadow-sm transition-all"
              >
                Começar a Conversar
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Active Chat Header */}
            <div className="bg-white dark:bg-[#1E293B] border-b border-slate-100 dark:border-slate-800/80 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3 min-w-0">
                <button
                  onClick={() => setMobileView('list')}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg md:hidden shrink-0 text-slate-500"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <img
                  src={activeChatAvatar || undefined}
                  alt={activeChatDisplayName}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-800 bg-slate-100"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider truncate">
                    {activeChatDisplayName}
                  </h2>
                  <div className="flex items-center space-x-1 mt-0.5 text-[9px] text-slate-400 font-bold uppercase">
                    {activeChat?.type === 'group' ? (
                      <>
                        <Users className="w-3 h-3" />
                        <span>{activeChatParticipantsCount} participantes</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <span>Chat Privado Isolado</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Online Users Status */}
              <div className="flex items-center space-x-2">
                {activeChat?.type === 'group' && (
                  <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="flex items-center space-x-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wide hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Adicionar</span>
                  </button>
                )}
                <div className="flex items-center space-x-1 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wide">
                  <Users className="w-3 h-3" />
                  <span>{onlineUsers.filter(u => u.status === 'online').length} online</span>
                </div>
              </div>
            </div>

             {/* Privacy Alert banner */}
             <div className="bg-slate-100/70 dark:bg-slate-900/40 px-4 py-2 border-b border-slate-100 dark:border-slate-800/50 flex items-center space-x-2 text-[9px] text-slate-400 dark:text-slate-500 select-none">
               <Info className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
               <span>Esta conversa e histórico de mensagens são restritos e isolados para participantes autorizados.</span>
             </div>
 
             {/* Messages Scroll Area */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {messages.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                   <MessageSquare className="w-12 h-12 mb-2 stroke-1 opacity-50 text-[#1E3A8A]" />
                   <p className="text-xs font-semibold uppercase tracking-tight text-slate-700 dark:text-slate-300">Sem histórico prévio</p>
                   <p className="text-[10px] max-w-xs mt-1">Este chat é 100% privado. Escreva uma mensagem abaixo para iniciar a conversa.</p>
                 </div>
              ) : (
                messages.map((msg) => {
                  const isMyMsg = msg.senderId === user?.uid || msg.senderName === user?.name;
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
                          src={msg.senderAvatar || undefined}
                          alt={msg.senderName}
                          className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Bubble Container */}
                      <div className="space-y-1">
                        {/* Sender Name & Badge */}
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

                          {/* Image Attachment */}
                          {msg.mediaUrl && msg.mediaType === 'image' && (
                            <div className={`rounded-xl overflow-hidden border border-slate-200/10 bg-slate-950 flex items-center justify-center max-h-56 select-none ${msg.text ? 'mt-2' : ''}`}>
                              <img
                                src={msg.mediaUrl || undefined}
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

                          {/* Video Attachment */}
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

            {/* Quick Emojis Toolbar */}
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

            {/* Uploading indicator */}
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
                      src={attachedMedia.url || undefined} 
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

            {/* Text Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white dark:bg-[#1E293B] border-t border-slate-200 dark:border-slate-800/80 flex items-center space-x-2 shrink-0"
            >
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
                placeholder={attachedMedia ? "Adicione uma legenda..." : "Digite sua mensagem privada..."}
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
          </>
        )}
      </div>

      {/* 3. DIALOG MODAL: Create New Conversation / Group */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 bg-[#1E3A8A] text-white flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider">Nova Conversa</h3>
                <p className="text-[9px] text-white/80 font-bold uppercase mt-0.5">Crie chat privado ou em grupo</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Selector Type */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-[#0F172A] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setCreateType('direct');
                    setSelectedUserIds([]);
                  }}
                  className={`py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                    createType === 'direct'
                      ? 'bg-[#1E3A8A] text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Chat Privado
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateType('group');
                    setSelectedUserIds([]);
                  }}
                  className={`py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                    createType === 'group'
                      ? 'bg-[#1E3A8A] text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Grupo
                </button>
              </div>

              {/* Group Name input */}
              {createType === 'group' && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400">Nome do Grupo</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Torcida, Diretoria, etc."
                    className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  />
                </div>
              )}

              {/* Contacts Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Pesquisar usuários por nome..."
                  className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                />
              </div>

              {/* User selection list */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {filteredUsersForNewChat.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-4">Nenhum outro usuário registrado encontrado.</p>
                ) : (
                  filteredUsersForNewChat.map((u) => {
                    const isSelected = selectedUserIds.includes(u.uid);
                    return (
                      <button
                        key={u.uid}
                        onClick={() => toggleUserSelection(u.uid)}
                        className={`w-full p-2.5 rounded-xl flex items-center justify-between border transition-all text-left ${
                          isSelected
                            ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40'
                            : 'bg-white dark:bg-[#1E293B] border-slate-100 dark:border-slate-800 hover:bg-slate-100/50'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <img
                            src={u.photoUrl}
                            alt={u.name}
                            className="w-8 h-8 rounded-full border bg-white"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 truncate tracking-tight">{u.name}</p>
                            <p className="text-[9px] text-slate-400 truncate font-medium">{u.email}</p>
                          </div>
                        </div>
                        {isSelected ? (
                          <div className="p-1 bg-[#1E3A8A] text-white rounded-full">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 rounded-full" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B] flex space-x-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl text-xs font-black uppercase hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateChat}
                className="flex-1 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-xl text-xs font-black uppercase shadow-md transition-transform active:scale-95"
              >
                Iniciar Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DIALOG MODAL: Add member to active group */}
      {isAddMemberModalOpen && activeChat && activeChat.type === 'group' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider">Adicionar Membros</h3>
                <p className="text-[9px] text-emerald-100 font-bold uppercase mt-0.5">Grupo: {activeChat.name}</p>
              </div>
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="text-white hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Pesquisar usuários por nome..."
                  className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {nonMembersOfActiveChat.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-4">Nenhum outro usuário elegível encontrado.</p>
                ) : (
                  nonMembersOfActiveChat.map((u) => (
                    <div 
                      key={u.uid}
                      className="p-2.5 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-850 bg-white dark:bg-[#1E293B]"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <img
                          src={u.photoUrl}
                          alt={u.name}
                          className="w-8 h-8 rounded-full border bg-white"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 truncate tracking-tight">{u.name}</p>
                          <p className="text-[9px] text-slate-400 truncate font-medium">{u.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddMember(u.uid)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wide cursor-pointer transition-transform active:scale-95 shadow-xs"
                      >
                        Adicionar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B]">
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="w-full py-2 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl text-xs font-black uppercase hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Voltar ao Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
