import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// IMPORTAÇÃO ALTERADA AQUI 👇
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithRedirect, updateProfile, getAdditionalUserInfo } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { enviarEmailBoasVindas, marcarConviteComoAceito } from '../services/email';
// import { addDoc, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import './Home.css';

export const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  // Login ou Cadastro com Email e Senha
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      if (isLogin) {
        // Logar
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/planner');
      } else {
        // Cadastrar
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Atualiza o perfil com o nome digitado
        await updateProfile(userCredential.user, { displayName: nome });

        // DISPARA O E-MAIL DE BOAS-VINDAS! 🚀
        await enviarEmailBoasVindas(email, nome);

        // A MÁGICA ACONTECE AQUI: Atualiza o status do convite no painel Admin!
        await marcarConviteComoAceito(email);

        // AGORA VAI DIRETO PARA O PAINEL!
        navigate('/planner');
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') setErro('Esse email já está cadastrado.');
      else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') setErro('Email ou senha incorretos.');
      else if (error.code === 'auth/weak-password') setErro('A senha deve ter pelo menos 6 caracteres.');
      else setErro('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Login com Google
  const handleGoogleSignIn = async () => {
    setErro('');
    setLoading(true);
    try {
      // FUNÇÃO DE LOGIN ALTERADA AQUI 👇
      await signInWithRedirect(auth, googleProvider);
      
      // NOTA IMPORTANTE SOBRE O REDIRECT:
      // O código abaixo (getAdditionalUserInfo, etc) não será executado aqui
      // pois o signInWithRedirect redireciona o usuário para fora da sua página.
      // O tratamento do retorno (se é conta nova) deve ser feito em outro lugar,
      // idealmente no seu App.tsx ou em um useEffect aqui no Login.
      // Por enquanto, o App.tsx já garante que o usuário logado vá para /planner.

    } catch (error: any) {
      setErro('Erro ao redirecionar para o Google.');
      setLoading(false);
    }
  };

  return (
    <main className="home-main animate-fade-in">
      <div className="home-glow" />

      <div className="home-content-wrapper" style={{ maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <h2 className="logo-text" style={{ fontSize: '2rem', margin: 0 }}>GC {'</>'}</h2>
          <p style={{ color: 'var(--text)' }}>Planner Inteligente</p>
        </div>

        <div className="card" style={{ width: '100%', padding: '40px 32px' }}>
          <h2 style={{ marginBottom: '8px', textAlign: 'center', color: 'var(--text-h)' }}>
            {isLogin ? 'Acesse sua conta' : 'Crie sua conta'}
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text)', marginBottom: '24px', fontSize: '0.9rem' }}>
            {isLogin ? 'Continue de onde parou' : 'Dê o primeiro passo para sua liberdade'}
          </p>

          {erro && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              {erro}
            </div>
          )}

          {/* Botão do Google */}
          <button type="button" onClick={handleGoogleSignIn} disabled={loading} style={{ width: '100%', padding: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 500, transition: 'all 0.2s' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            <span style={{ padding: '0 12px', color: 'var(--text)', fontSize: '0.85rem' }}>ou com email</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <div className="form-group animate-fade-in">
                <label>Como quer ser chamado?</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} required placeholder="Seu nome ou apelido" />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" />
            </div>
            <div className="form-group">
              <label>Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>

            <button type="submit" className="primary" disabled={loading} style={{ width: '100%', marginTop: '8px', padding: '14px', fontSize: '1rem' }}>
              {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text)' }}>
            {isLogin ? "Ainda não tem uma conta? " : "Já tem uma conta? "}
            <span onClick={() => { setIsLogin(!isLogin); setErro(''); }} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>
              {isLogin ? 'Cadastre-se' : 'Faça login'}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
};