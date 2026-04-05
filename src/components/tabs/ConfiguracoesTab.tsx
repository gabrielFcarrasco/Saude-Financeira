import React, { useState, useRef, useEffect } from 'react';
import { auth, db } from '../../services/firebase';
import { updateProfile, onAuthStateChanged, deleteUser, type User } from 'firebase/auth';
import { addDoc, collection, serverTimestamp, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';

import { importarDoNotion } from '../../utils/NotionImporter';
import { extrairTextoBrutoDoPDF } from '../../utils/PDFExtractor';
import { gerarBackupCompleto, restaurarBackupJSON } from '../../utils/BackupService';

interface ImportStatus {
  isOpen: boolean;
  step: 'idle' | 'reading' | 'confirm' | 'saving' | 'success' | 'error';
  progress: number;
  items: any[];
  sourceName: string;
  errorMessage?: string;
}

export const ConfiguracoesTab: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  
  const [nome, setNome] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [fotoDisplay, setFotoDisplay] = useState<string | null>(null);
  const [isUploadingImg, setIsUploadingImg] = useState(false);

  const [importStatus, setImportStatus] = useState<ImportStatus>({
    isOpen: false, step: 'idle', progress: 0, items: [], sourceName: ''
  });

  const [darkMode, setDarkMode] = useState(true);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true);
  const [lembreteVencimento, setLembreteVencimento] = useState(true);
  const [moedaPadrao, setMoedaPadrao] = useState('BRL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteStep, setDeleteStep] = useState(0); 
  const [textoConfirmacao, setTextoConfirmacao] = useState('');
  const [backupRealizado, setBackupRealizado] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setNome(user.displayName || '');
        setFotoDisplay(user.photoURL || null);
      }
    });
    return () => unsubscribe();
  }, []);

  const inicial = nome.charAt(0).toUpperCase() || 'U';

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSaving(true);
    try {
      await updateProfile(currentUser, { displayName: nome });
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar o perfil.');
    }
    setIsSaving(false);
  };

  const handleTrocarFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) return alert('Erro: Variáveis do Cloudinary não configuradas.');

    setIsUploadingImg(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('cloud_name', cloudName);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.secure_url) {
        await updateProfile(currentUser, { photoURL: data.secure_url });
        setFotoDisplay(data.secure_url);
      }
    } catch (error) {
      alert('Erro no upload.');
    } finally {
      setIsUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const iniciarProcessamento = async (file: File, tipo: 'Notion' | 'PDF') => {
    if (!currentUser) return;
    
    setImportStatus({ isOpen: true, step: 'reading', progress: 0, items: [], sourceName: tipo });
    
    let progressoFalso = 0;
    const interval = setInterval(() => {
      progressoFalso += 10;
      if (progressoFalso <= 60) setImportStatus(prev => ({ ...prev, progress: progressoFalso }));
    }, 150);

    try {
      let dadosExtraidos: any[] = [];
      
      if (tipo === 'Notion') {
        dadosExtraidos = await importarDoNotion(file);
      } else {
        // Passo A: Lê o PDF localmente
        const textoBagunçado = await extrairTextoBrutoDoPDF(file);
        
        // ✨ NOVO: Limpeza de texto para evitar Timeout e estourar limite da IA
        const textoLimpo = textoBagunçado.replace(/\s+/g, ' ').trim().substring(0, 15000);
        
        clearInterval(interval);
        setImportStatus(prev => ({ ...prev, progress: 70 }));

        // Passo B: Chama a Função no Firebase
        const funcoesNuvem = getFunctions(auth.app, 'southamerica-east1');
        const funcIA = httpsCallable(funcoesNuvem, 'extrairDadosExtratoComIA');
        
        // Enviando o texto já limpo e reduzido
        const resultado: any = await funcIA({ texto: textoLimpo });

        if (resultado.data.status === 'success') {
          dadosExtraidos = resultado.data.data.map((item: any) => ({
            ...item,
            categoria: item.tipo === 'receita' ? 'Renda Extra' : 'Importado IA',
            conta: `Itaú IA (PDF)`,
            status: 'pago'
          }));
        } else {
          throw new Error("A IA não conseguiu ler o arquivo.");
        }
      }

      setImportStatus(prev => ({ ...prev, progress: 100 }));

      setTimeout(() => {
        if (dadosExtraidos.length === 0) {
          setImportStatus(prev => ({ ...prev, step: 'error', errorMessage: 'A IA analisou o arquivo mas não encontrou transações financeiras válidas.' }));
        } else {
          setImportStatus(prev => ({ ...prev, step: 'confirm', items: dadosExtraidos }));
        }
      }, 600);

    } catch (error: any) {
      clearInterval(interval);
      console.error(error);
      const msgErro = error.message.includes("unauthenticated") ? "Você precisa estar logado." : "Não conseguimos analisar este PDF. Verifique se ele não está com senha ou se é um extrato válido.";
      setImportStatus(prev => ({ ...prev, step: 'error', errorMessage: msgErro }));
    }
  };

  const handleUploadNotion = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) iniciarProcessamento(file, 'Notion');
    e.target.value = ''; 
  };

  const handleUploadPDF = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) iniciarProcessamento(file, 'PDF');
    e.target.value = ''; 
  };

  const confirmarSalvamento = async () => {
    if (!currentUser) return;
    setImportStatus(prev => ({ ...prev, step: 'saving', progress: 0 }));
    
    const total = importStatus.items.length;
    let salvos = 0;
    try {
      for (const item of importStatus.items) {
        await addDoc(collection(db, 'transacoes'), { ...item, userId: currentUser.uid, criadoEm: serverTimestamp() });
        salvos++;
        setImportStatus(prev => ({ ...prev, progress: Math.round((salvos / total) * 100) }));
      }
      setTimeout(() => setImportStatus(prev => ({ ...prev, step: 'success' })), 500);
    } catch (error) {
      setImportStatus(prev => ({ ...prev, step: 'error', errorMessage: 'Erro ao gravar no banco.' }));
    }
  };

  const fecharModal = () => {
    setImportStatus({ isOpen: false, step: 'idle', progress: 0, items: [], sourceName: '' });
    setDeleteStep(0);
    setTextoConfirmacao('');
  };

  const handleRestaurarBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setImportStatus({ isOpen: true, step: 'reading', progress: 50, items: [], sourceName: 'Backup' });
    try {
      await restaurarBackupJSON(file, currentUser.uid);
      setImportStatus({ isOpen: true, step: 'success', progress: 100, items: [], sourceName: 'Backup' });
    } catch (error) {
      setImportStatus({ isOpen: true, step: 'error', progress: 0, items: [], sourceName: 'Backup', errorMessage: "Erro ao ler arquivo de backup." });
    }
    e.target.value = '';
  };

  const handleResetarHistorico = async () => {
    if (!currentUser) return;
    const confirmacao = window.confirm("CUIDADO: Isso vai excluir TODAS as suas transações, dívidas e metas. Deseja continuar?");
    if (!confirmacao) return;

    setImportStatus({ isOpen: true, step: 'saving', progress: 0, items: [], sourceName: 'Reset' });

    try {
      const colecoes = ['transacoes', 'dividas', 'metas'];
      let apagarCount = 0;
      
      for (const col of colecoes) {
        const q = query(collection(db, col), where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        const promessasDeExclusao = querySnapshot.docs.map(documento => {
          apagarCount++;
          return deleteDoc(documento.ref);
        });
        await Promise.all(promessasDeExclusao);
      }

      setImportStatus(prev => ({ ...prev, progress: 100 }));
      setTimeout(() => {
        setImportStatus({ isOpen: true, step: 'error', progress: 100, items: [], sourceName: 'Reset', errorMessage: `${apagarCount} registros foram apagados com sucesso!` });
      }, 500);

    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
      alert("Erro ao limpar histórico.");
      fecharModal();
    }
  };

  const handleExcluirContaDefinitivamente = async () => {
    if (textoConfirmacao !== 'EXCLUIR') return alert('Digite EXCLUIR exatamente como escrito.');
    try {
      if (currentUser) {
        await deleteUser(currentUser);
        alert("Sua conta foi excluída para sempre. Sentiremos sua falta.");
      }
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') alert("Por segurança, saia da conta, faça login novamente e repita o processo.");
      else alert("Erro ao tentar excluir a conta.");
    }
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <div onClick={onChange} style={{ width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', background: checked ? 'var(--accent)' : 'var(--code-bg)', border: checked ? 'none' : '1px solid var(--border)', position: 'relative', transition: '0.3s ease', flexShrink: 0 }}>
      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: checked ? '23px' : '3px', transition: 'all 0.3s ease' }} />
    </div>
  );

  const isModalOpen = importStatus.isOpen || deleteStep > 0;

  if (isModalOpen) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '75vh', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '450px', background: 'var(--social-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '40px 24px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
          
          {importStatus.isOpen && (
            <>
              {(importStatus.step === 'reading' || importStatus.step === 'saving') && (
                <>
                  <div style={{ color: 'var(--accent)', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                     <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 2s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                  </div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>{importStatus.sourceName === 'Reset' ? 'Apagando Banco...' : importStatus.step === 'reading' ? `Analisando...` : 'Gravando...'}</h2>
                  <div style={{ width: '100%', height: '10px', background: 'var(--code-bg)', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--border)', marginTop: '32px' }}>
                    <div style={{ height: '100%', background: importStatus.sourceName === 'Reset' ? '#ef4444' : 'var(--accent)', width: `${importStatus.progress}%`, transition: 'width 0.3s ease-out' }} />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.9rem', color: 'var(--text-h)', marginTop: '8px', fontWeight: 'bold' }}>{importStatus.progress}%</div>
                </>
              )}

              {importStatus.step === 'confirm' && (
                <>
                  <div style={{ color: '#10b981', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <h2 style={{ margin: '0 0 16px 0', fontSize: '1.5rem' }}>Extrato Pronto!</h2>
                  <p style={{ color: 'var(--text)', fontSize: '1rem', marginBottom: '32px', lineHeight: '1.5' }}>
                    Encontramos <strong style={{ color: 'var(--text-h)', fontSize: '1.3rem' }}>{importStatus.items.length}</strong> transações válidas. Deseja importar?
                  </p>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button onClick={fecharModal} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                    <button onClick={confirmarSalvamento} style={{ flex: 1, padding: '14px', background: '#10b981', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Sim, Importar</button>
                  </div>
                </>
              )}

              {importStatus.step === 'success' && (
                <>
                  <div style={{ fontSize: '56px', marginBottom: '24px' }}>🎉</div>
                  <h2 style={{ margin: '0 0 12px 0', fontSize: '1.5rem' }}>Tudo Certo!</h2>
                  <p style={{ color: 'var(--text)', fontSize: '1rem', marginBottom: '32px' }}>Ação concluída com sucesso.</p>
                  <button onClick={fecharModal} className="primary" style={{ width: '100%', padding: '14px', borderRadius: '8px', fontWeight: 'bold' }}>Concluir</button>
                </>
              )}

              {importStatus.step === 'error' && (
                <>
                  <h2 style={{ margin: '0 0 12px 0', fontSize: '1.5rem', color: importStatus.sourceName === 'Reset' ? '#10b981' : '#ef4444' }}>{importStatus.sourceName === 'Reset' ? 'Histórico Limpo!' : 'Ops!'}</h2>
                  <p style={{ color: 'var(--text)', fontSize: '1rem', marginBottom: '32px' }}>{importStatus.errorMessage}</p>
                  <button onClick={fecharModal} style={{ width: '100%', padding: '14px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>OK, Voltar</button>
                </>
              )}
            </>
          )}

          {deleteStep > 0 && (
            <>
              {deleteStep === 1 && (
                <>
                  <div style={{ color: '#ef4444', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  </div>
                  <h2 style={{ color: 'var(--text-h)', margin: '0 0 16px 0', fontSize: '1.5rem' }}>Você tem certeza?</h2>
                  <p style={{ color: 'var(--text)', marginBottom: '32px', lineHeight: '1.5' }}>Esta ação é irreversível. O seu acesso será revogado imediatamente.</p>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button style={{ flex: 1, padding: '14px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} onClick={fecharModal}>Cancelar</button>
                    <button style={{ flex: 1, padding: '14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setDeleteStep(2)}>Prosseguir</button>
                  </div>
                </>
              )}

              {deleteStep === 2 && (
                <>
                  <h2 style={{ color: 'var(--text-h)', margin: '0 0 16px 0', fontSize: '1.5rem' }}>Salvar seus Dados</h2>
                  <p style={{ color: 'var(--text)', marginBottom: '32px', lineHeight: '1.5' }}>Baixe um backup completo da sua vida financeira. É obrigatório.</p>
                  <button style={{ width: '100%', padding: '16px', background: backupRealizado ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg)', color: backupRealizado ? '#10b981' : 'var(--text-h)', border: `1px solid ${backupRealizado ? '#10b981' : 'var(--border)'}`, borderRadius: '8px', cursor: 'pointer', marginBottom: '32px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={async () => { await gerarBackupCompleto(currentUser!.uid); setBackupRealizado(true); }}>
                    {backupRealizado ? '✓ Backup Concluído' : '⬇ Baixar Backup'}
                  </button>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button style={{ flex: 1, padding: '14px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} onClick={fecharModal}>Cancelar</button>
                    <button style={{ flex: 1, padding: '14px', background: backupRealizado ? '#ef4444' : 'var(--bg)', color: backupRealizado ? 'white' : 'var(--text)', border: 'none', borderRadius: '8px', cursor: backupRealizado ? 'pointer' : 'not-allowed', fontWeight: 'bold', opacity: backupRealizado ? 1 : 0.5 }} onClick={() => backupRealizado && setDeleteStep(3)}>Avançar</button>
                  </div>
                </>
              )}

              {deleteStep === 3 && (
                <>
                  <h2 style={{ color: '#ef4444', margin: '0 0 16px 0', fontSize: '1.5rem' }}>Último Passo</h2>
                  <p style={{ color: 'var(--text)', marginBottom: '24px', lineHeight: '1.5' }}>Digite <strong>EXCLUIR</strong> para deletar a conta permanentemente.</p>
                  <input type="text" placeholder="EXCLUIR" value={textoConfirmacao} onChange={e => setTextoConfirmacao(e.target.value)} style={{ width: '100%', padding: '16px', marginBottom: '32px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', letterSpacing: '2px', boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button style={{ flex: 1, padding: '14px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} onClick={fecharModal}>Cancelar</button>
                    <button style={{ flex: 1, padding: '14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} onClick={handleExcluirContaDefinitivamente}>ADEUS</button>
                  </div>
                </>
              )}
            </>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 10px 60px 10px' }}>
      
      <div className="page-header" style={{ marginBottom: '20px', padding: '0 10px' }}>
        <h1 style={{ fontSize: '1.8rem', margin: '0 0 8px 0' }}>Configurações</h1>
        <p style={{ color: 'var(--text)', margin: 0, fontSize: '1rem', lineHeight: '1.4' }}>Personalize sua experiência e gerencie seus dados.</p>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Identidade</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
          <div style={{ position: 'relative', cursor: 'pointer', width: '80px', height: '80px', flexShrink: 0 }} onClick={() => fileInputRef.current?.click()}>
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleTrocarFoto} />
            {fotoDisplay ? (
              <img src={fotoDisplay} alt="Perfil" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} referrerPolicy="no-referrer" />
            ) : (
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>{inicial}</div>
            )}
            {!isUploadingImg && (
              <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--accent)', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              </div>
            )}
            {isUploadingImg && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '50%' }}><div className="spinner" style={{ width: '20px', height: '20px', margin: 0 }}></div></div>}
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-h)', fontSize: '1.2rem' }}>{currentUser?.displayName || 'Usuário'}</p>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text)', fontSize: '0.85rem', wordBreak: 'break-all' }}>{currentUser?.email}</p>
          </div>
        </div>
        <form onSubmit={handleSalvarPerfil} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '100%' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text)', fontSize: '0.9rem', fontWeight: 600 }}>Nome de Exibição</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" className="primary" disabled={isSaving} style={{ width: '100%', padding: '14px', borderRadius: '8px', fontWeight: 600 }}>{isSaving ? 'A guardar...' : 'Atualizar Nome'}</button>
        </form>
      </div>

      <div className="form-grid-2">
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Sistema
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[ { label: 'Modo Escuro', state: darkMode, setState: setDarkMode }, { label: 'Análise por e-mail', state: notificacoesAtivas, setState: setNotificacoesAtivas }, { label: 'Alertas de Contas', state: lembreteVencimento, setState: setLembreteVencimento } ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--social-bg)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-h)' }}>{item.label}</span>
                <ToggleSwitch checked={item.state} onChange={() => item.setState(!item.state)} />
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            Regional
          </h3>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text)' }}>Moeda Principal</label>
          <select value={moedaPadrao} onChange={e => setMoedaPadrao(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)' }}>
            <option value="BRL">Real (R$)</option>
            <option value="USD">Dólar ($)</option>
            <option value="EUR">Euro (€)</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Dados</h3>
          <button style={{ background: '#10b981', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Exportar CSV</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ border: '1px dashed var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'center', background: 'var(--social-bg)' }}>
            <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '4px' }}>Notion (CSV/ZIP)</strong>
            <label htmlFor="notion-upload" className="primary" style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', display: 'inline-block' }}>Upload ZIP (Notion)</label>
            <input type="file" accept=".zip" style={{ display: 'none' }} id="notion-upload" onChange={handleUploadNotion} />
          </div>
          <div style={{ border: '1px dashed var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'center', background: 'var(--social-bg)' }}>
            <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '4px' }}>Banco (PDF)</strong>
            <label htmlFor="pdf-upload" style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', display: 'inline-block', background: '#10b981', color: 'white' }}>Analisar PDF</label>
            <input type="file" accept=".pdf" style={{ display: 'none' }} id="pdf-upload" onChange={handleUploadPDF} />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.02)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#ef4444', fontSize: '1rem' }}>Zona Crítica</h3>
        <p style={{ color: 'var(--text)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.5' }}>Ações permanentes. Uma vez executadas, os seus dados não podem ser recuperados.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <button onClick={handleResetarHistorico} style={{ width: '100%', padding: '14px', borderRadius: '8px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            Resetar Histórico (Testes)
          </button>

          <div style={{ border: '1px dashed var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'center', background: 'var(--social-bg)' }}>
            <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '4px' }}>Restaurar Backup (.json)</strong>
            <label htmlFor="backup-upload" className="primary" style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', display: 'inline-block' }}>Carregar Backup</label>
            <input type="file" accept=".json" style={{ display: 'none' }} id="backup-upload" onChange={handleRestaurarBackup} />
          </div>

          <button onClick={() => setDeleteStep(1)} style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
            Excluir Conta
          </button>
        </div>
      </div>

    </div>
  );
};