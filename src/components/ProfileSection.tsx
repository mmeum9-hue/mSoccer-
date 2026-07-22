import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, LogIn, LogOut, Sun, Moon, Shield, Award, Trash2, Heart, Lock, KeyRound, Check, Upload, Image } from 'lucide-react';
import { compressImage } from './imageCompressor';

export const ProfileSection: React.FC = () => {
  const {
    user,
    loginUser,
    registerUser,
    loginWithGoogle,
    sendPasswordReset,
    logoutUser,
    updateUser,
    updateUserRole,
    theme,
    setTheme,
    language,
    setLanguage,
    favorites,
    clubs,
    players,
    matches,
    navigateTo
  } = useApp();

  // Auth local states
  const [authTab, setAuthTab] = useState<'signin' | 'signup' | 'recover'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'User' | 'Admin'>('User'); // defaults to User now
  const [adminKey, setAdminKey] = useState('');
  const [profileAdminKey, setProfileAdminKey] = useState('');
  const [profileAdminError, setProfileAdminError] = useState<string | null>(null);
  const [profileAdminSuccess, setProfileAdminSuccess] = useState<boolean>(false);
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);

  // Profile edit local states
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.photoUrl || '');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, envie apenas arquivos de imagem.');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('A imagem deve ter no máximo 2MB.');
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        try {
          const compressed = await compressImage(event.target.result as string, 150, 150, 0.7);
          setSelectedAvatar(compressed);
        } catch (err) {
          console.error('Erro ao comprimir imagem:', err);
          setSelectedAvatar(event.target.result as string);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const avatars = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Simba',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo'
  ];

  const getFriendlyAuthError = (err: any): React.ReactNode => {
    const code = err?.code || '';
    const message = err?.message || '';
    
    if (code === 'auth/operation-not-allowed' || message.includes('operation-not-allowed')) {
      return (
        <div className="space-y-2 text-rose-700 dark:text-rose-400">
          <p className="font-bold flex items-center gap-1">⚠️ Método "E-mail/Senha" desativado no Firebase!</p>
          <p className="text-[11px] leading-relaxed">
            Para se cadastrar com e-mail e senha, você precisa ativar o provedor <strong>E-mail/Senha</strong> no Console do Firebase de sua aplicação.
          </p>
          <div className="bg-rose-100/50 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-[11px] space-y-1">
            <p className="font-semibold text-rose-800 dark:text-rose-300">Como resolver em 1 minuto:</p>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-rose-900 dark:text-rose-300">
              <li>Acesse o <a href="https://console.firebase.google.com/project/msoccer-djuma-13d00/authentication/providers" target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800">Console do Firebase</a>.</li>
              <li>Clique em <strong>Adicionar novo provedor</strong>.</li>
              <li>Selecione <strong>E-mail/Senha</strong>, ative a opção e clique em <strong>Salvar</strong>.</li>
            </ol>
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
            Dica: Alternativamente, você pode usar o botão <strong>"Entrar com Google"</strong> abaixo, que já está configurado e funcional!
          </p>
        </div>
      );
    }
    
    if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
      const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
      return (
        <div className="space-y-2 text-rose-700 dark:text-rose-400">
          <p className="font-bold flex items-center gap-1">⚠️ Domínio não autorizado no Firebase Auth!</p>
          <p className="text-[11px] leading-relaxed">
            O Firebase está bloqueando a autenticação porque o domínio atual não está na lista de domínios autorizados do seu projeto.
          </p>
          <div className="bg-rose-100/50 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-[11px] space-y-1">
            <p className="font-semibold text-rose-800 dark:text-rose-300">Como resolver em 1 minuto:</p>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-rose-900 dark:text-rose-300">
              <li>Acesse as <a href="https://console.firebase.google.com/project/msoccer-djuma-13d00/authentication/settings" target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800">Configurações de Autenticação</a>.</li>
              <li>Vá na aba <strong>Domínios autorizados</strong> (Authorized Domains).</li>
              <li>Clique em <strong>Adicionar domínio</strong>.</li>
              <li>Cole o seguinte domínio e salve: <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono font-bold text-rose-600 dark:text-rose-400 select-all">{currentDomain || 'ais-dev-...run.app'}</code></li>
            </ol>
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
            Após adicionar o domínio acima, recarregue a página do mSoccer e tente fazer o login ou cadastro novamente.
          </p>
        </div>
      );
    }

    if (code === 'auth/email-already-in-use' || message.includes('email-already-in-use')) {
      return "Este e-mail já está sendo utilizado por outra conta. Caso tenha esquecido sua senha, use a recuperação de senha.";
    }
    
    if (code === 'auth/weak-password' || message.includes('weak-password')) {
      return "A senha escolhida é muito fraca. Por favor, utilize uma senha com pelo menos 6 caracteres.";
    }
    
    if (code === 'auth/invalid-email' || message.includes('invalid-email')) {
      return "O formato do e-mail inserido é inválido. Por favor, tente novamente.";
    }
    
    if (
      code === 'auth/user-not-found' || 
      code === 'auth/wrong-password' || 
      code === 'auth/invalid-credential' ||
      message.includes('wrong-password') || 
      message.includes('user-not-found') || 
      message.includes('invalid-credential')
    ) {
      return "E-mail ou senha incorretos. Se você ainda não possui uma conta, mude para a aba 'Criar Conta' acima.";
    }

    return err?.message || 'Ocorreu um erro ao realizar esta ação.';
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      await loginUser(email, password, 'User');
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    setLoading(true);
    setError(null);
    try {
      const finalRole = adminKey === 'djuma94' ? 'Admin' : 'User';
      await registerUser(email, password, name, finalRole);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle('User');
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setResetSent(true);
      setTimeout(() => {
        setResetSent(false);
        setAuthTab('signin');
      }, 4000);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = () => {
    updateUser(editName, editEmail, selectedAvatar);
    setEditing(false);
  };

  // Find actual favorited items
  const favClubs = clubs.filter((c) => favorites.clubs.includes(c.id));
  const favPlayers = players.filter((p) => favorites.players.includes(p.id));
  const favMatches = matches.filter((m) => favorites.matches.includes(m.id));

  // Render NOT logged in view
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 pt-10 pb-20">
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/85 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl tracking-wider">
              mS
            </div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white">Conta mSoccer</h2>
            <p className="text-xs text-zinc-400">
              Entre para favoritar clubes, receber notificações de gols e gerenciar partidas.
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex border-b border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => {
                setAuthTab('signin');
                setResetSent(false);
              }}
              className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 cursor-pointer ${
                authTab === 'signin'
                  ? 'border-emerald-500 text-emerald-500'
                  : 'border-transparent text-zinc-400'
              }`}
            >
              Fazer Login
            </button>
            <button
              onClick={() => {
                setAuthTab('signup');
                setResetSent(false);
              }}
              className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 cursor-pointer ${
                authTab === 'signup'
                  ? 'border-emerald-500 text-emerald-500'
                  : 'border-transparent text-zinc-400'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs p-3 rounded-xl font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Form Content */}
          {authTab === 'signin' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">E-mail</label>
                <input
                  type="email"
                  required
                  disabled={loading}
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Senha</label>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setAuthTab('recover')}
                    className="text-[10px] text-emerald-500 hover:underline disabled:opacity-50"
                  >
                    Esqueceu?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-xl font-bold text-sm cursor-pointer transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>{loading ? 'Processando...' : 'Entrar no mSoccer'}</span>
              </button>
            </form>
          )}

          {authTab === 'signup' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Nome Completo</label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  placeholder="Seu Nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">E-mail</label>
                <input
                  type="email"
                  required
                  disabled={loading}
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Senha</label>
                <input
                  type="password"
                  required
                  disabled={loading}
                  placeholder="Escolha uma senha forte"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-50"
                />
              </div>

              {/* Chave Secreta de Admin (Opcional) */}
              <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Chave Secreta de Admin (Opcional)</label>
                <input
                  type="password"
                  disabled={loading}
                  placeholder="Deixe em branco se for Usuário Comum"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/60 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-xl font-bold text-sm cursor-pointer transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : null}
                <span>{loading ? 'Processando...' : 'Criar Minha Conta'}</span>
              </button>
            </form>
          )}

          {authTab === 'recover' && (
            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">E-mail de Cadastro</label>
                <input
                  type="email"
                  required
                  disabled={loading}
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-50"
                />
              </div>

              {resetSent ? (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl text-xs font-semibold leading-relaxed text-center">
                  📧 Link de redefinição enviado com sucesso! Verifique sua caixa de entrada.
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-xl font-bold text-sm cursor-pointer transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>Enviar E-mail de Recuperação</span>
                </button>
              )}
            </form>
          )}

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 hover:dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl font-semibold text-xs cursor-pointer transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-zinc-800 dark:border-zinc-200 border-t-transparent" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>Entrar com Google</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Logged In user details
  return (
    <div className="w-full mx-auto pb-20 divide-y divide-slate-200 dark:divide-slate-800">
      {/* 1. Profile Bio row */}
      <div className="w-full bg-white dark:bg-[#1E293B] p-3.5 sm:p-4 rounded-none shadow-none">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <img
              src={user.photoUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix'}
              alt={user.name}
              className="w-20 h-20 rounded-full border-2 border-[#1E3A8A] bg-zinc-50 p-1 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <h2 className="text-xl font-black text-zinc-900 dark:text-white leading-tight">
                  {user.name}
                </h2>
                <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-2 py-0.5 flex items-center space-x-1">
                  <Shield className="w-3 h-3" />
                  <span>{user.role}</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">{user.email}</p>
            </div>
          </div>

          <div className="flex space-x-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setEditing(!editing);
                setEditName(user.name);
                setEditEmail(user.email);
                setSelectedAvatar(user.photoUrl || '');
              }}
              className="flex-1 sm:flex-initial px-4 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 text-xs font-bold cursor-pointer border border-zinc-200 dark:border-zinc-700"
            >
              {editing ? 'Cancelar' : 'Editar Perfil'}
            </button>
            <button
              onClick={logoutUser}
              className="flex-1 sm:flex-initial px-4 py-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold cursor-pointer flex items-center justify-center space-x-1"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Editing drawer panel */}
        {editing && (
          <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-5 space-y-4">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Configurações do Perfil
            </h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400">Nome</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400">E-mail</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Select Avatar list */}
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Escolha um Avatar</span>
                <div className="flex space-x-3 overflow-x-auto pb-1">
                  {avatars.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`relative w-12 h-12 rounded-full border-2 transition-all p-0.5 shrink-0 ${
                        selectedAvatar === av ? 'border-[#1E3A8A] scale-105 shadow' : 'border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <img src={av} alt="" className="w-full h-full rounded-full object-cover" />
                      {selectedAvatar === av && (
                        <span className="absolute -bottom-1 -right-1 bg-[#1E3A8A] text-white rounded-full p-0.5">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Foto de Perfil Customizada / Upload */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Ou Envie uma Foto Personalizada</span>
                
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed p-4 transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                    dragActive 
                      ? 'border-[#1E3A8A] bg-blue-50/50 dark:bg-blue-950/20' 
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-[#1E3A8A] hover:bg-zinc-50 hover:dark:bg-zinc-800/40'
                  }`}
                  onClick={() => document.getElementById('profile-upload-input')?.click()}
                >
                  <input 
                    id="profile-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {selectedAvatar && !avatars.includes(selectedAvatar) ? (
                    <div className="flex flex-col items-center space-y-2">
                      <img 
                        src={selectedAvatar} 
                        alt="Preview" 
                        className="w-14 h-14 rounded-full border-2 border-[#1E3A8A] object-cover shadow bg-zinc-50"
                      />
                      <div className="text-center">
                        <p className="text-[11px] font-bold text-emerald-500 flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Foto Personalizada Carregada
                        </p>
                        <p className="text-[10px] text-zinc-400">Arraste outra imagem ou clique para alterar</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 py-1.5">
                      <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full flex items-center justify-center mx-auto border border-zinc-200/60 dark:border-zinc-700/60">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Clique para escolher ou arraste a foto aqui
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          Formatos aceitos: PNG, JPG, GIF (Máx. 2MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {uploadError && (
                  <p className="text-[10px] text-rose-500 font-bold text-center mt-1">{uploadError}</p>
                )}
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold cursor-pointer"
            >
              Salvar Alterações
            </button>
          </div>
        )}
      </div>

      {/* 2. Language & App Preferences */}
      <div className="w-full bg-white dark:bg-[#1E293B] p-3.5 sm:p-4 rounded-none shadow-none space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Preferências Gerais</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {/* Language selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">Idioma</label>
            <div className="flex space-x-2">
              {['pt', 'en', 'es'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang as any)}
                  className={`flex-1 py-1.5 text-xs font-bold cursor-pointer uppercase border transition-all ${
                    language === lang
                      ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white font-black'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {lang === 'pt' ? 'Português' : lang === 'en' ? 'English' : 'Español'}
                </button>
              ))}
            </div>
          </div>

          {/* Theme selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">Visual do App</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 py-1.5 text-xs font-bold cursor-pointer flex items-center justify-center space-x-1.5 border transition-all ${
                  theme === 'light'
                    ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white font-black'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                }`}
              >
                <Sun className="w-4.5 h-4.5" />
                <span>Claro</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 py-1.5 text-xs font-bold cursor-pointer flex items-center justify-center space-x-1.5 border transition-all ${
                  theme === 'dark'
                    ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white font-black'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                }`}
              >
                <Moon className="w-4.5 h-4.5" />
                <span>Escuro</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Favorites Dashboard */}
      <div className="w-full bg-white dark:bg-[#1E293B] p-3.5 sm:p-4 rounded-none shadow-none space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5">
          <Heart className="w-4 h-4 text-rose-500 fill-current" />
          <span>Meus Favoritos</span>
        </h3>

        {/* Clubs favorited */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Clubes Favoritos ({favClubs.length})
          </h4>
          {favClubs.length === 0 ? (
            <p className="text-[11px] text-zinc-500">Nenhum clube favoritado.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {favClubs.map((club) => (
                <div
                  key={club.id}
                  onClick={() => navigateTo({ type: 'club', id: club.id })}
                  className="flex items-center space-x-2 p-2 border-b border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
                >
                  <img src={club.logoUrl} alt="" className="w-6 h-6 rounded-full" />
                  <span className="text-xs font-bold truncate text-zinc-800 dark:text-zinc-200">
                    {club.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Players favorited */}
        <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Jogadores Favoritados ({favPlayers.length})
          </h4>
          {favPlayers.length === 0 ? (
            <p className="text-[11px] text-zinc-500">Nenhum jogador favoritado.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {favPlayers.map((player) => (
                <div
                  key={player.id}
                  onClick={() => navigateTo({ type: 'player', id: player.id })}
                  className="flex items-center space-x-2 p-2 border-b border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
                >
                  <img src={player.photoUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                  <span className="text-xs font-bold truncate text-zinc-800 dark:text-zinc-200">
                    {player.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Matches favorited */}
        <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Jogos Favoritos ({favMatches.length})
          </h4>
          {favMatches.length === 0 ? (
            <p className="text-[11px] text-zinc-500">Nenhum jogo favoritado.</p>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {favMatches.map((match) => (
                <div
                  key={match.id}
                  onClick={() => navigateTo({ type: 'match', id: match.id })}
                  className="py-2.5 px-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-[10px] text-blue-600">{match.championshipName}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{match.homeClubName}</span>
                    <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5">
                      {match.score.home}-{match.score.away}
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{match.awayClubName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
