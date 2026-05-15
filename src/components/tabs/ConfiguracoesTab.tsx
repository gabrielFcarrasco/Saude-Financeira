import React, { useState, useRef, useEffect } from 'react';
import { auth, db } from '../../services/firebase';
import { updateProfile, onAuthStateChanged, deleteUser, type User } from 'firebase/auth';
import { addDoc, collection, serverTimestamp, getDocs, query, where, deleteDoc } from 'firebase/firestore';

import { importarDoNotion } from '../../utils/NotionImporter';
import { extrairTextoBrutoDoPDF } from '../../utils/PDFExtractor';
import { gerarBackupCompleto, restaurarBackupJSON } from '../../utils/BackupService';
import { enviarMensagemParaGemini } from '../../services/gemini'; // ✨ NOVO IMPORT DO GEMINI

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
        const textoBaguncado = await extrairTextoBrutoDoPDF(file);
        const textoLimpo = textoBaguncado.replace(/\s+/g, ' ').trim().substring(0, 15000);
        
        clearInterval(interval);
        setImportStatus(prev => ({ ...prev, progress: 70 }));

        // ✨ NOVA LÓGICA DE IA COM GEMINI SDK DIRETAMENTE
        const pergunta = `Analise o texto deste extrato bancário e encontre todas as transações financeiras. 
        Você DEVE retornar EXATAMENTE UM ARRAY JSON VÁLIDO e nada mais. Não inclua blocos de formatação markdown (\`\`\`json) e não escreva nenhum texto antes ou depois do Array.
        
        Formato obrigatório para cada item do array:
        [
          {
            "descricao": "Nome do local",
            "valor": 150.50, // número sempre positivo, independente de ser entrada ou saída
            "data": "2026-05-15", // formato YYYY-MM-DD
            "tipo": "despesa" // ou "receita"
          }
        ]`;

        const respostaBruta = await enviarMensagemParaGemini(pergunta, `Texto do extrato: ${textoLimpo}`);

        try {
          // Limpa possíveis bloqueios markdown que a IA possa tentar colocar
          const jsonLimpo = respostaBruta.replace(/```json/gi, '').replace(/```/g, '').trim();
          const transacoes = JSON.parse(jsonLimpo);

          dadosExtraidos = transacoes.map((item: any) => ({
            ...item,
            categoria: item.tipo === 'receita' ? 'Renda Extra' : 'Importado IA',
            conta: `Extrato (IA)`,
            status: 'pago'
          }));
        } catch (err) {
          console.error("Erro no Parse do JSON:", err, "Resposta da IA:", respostaBruta);
          throw new Error("A IA leu o arquivo, mas não conseguiu formatar os dados. Tente novamente.");
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
      const msgErro = error.message.includes("unauthenticated") ? "Você precisa estar logado." : "Não conseguimos analisar este arquivo. " + (error.message || "");
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
      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: checked ? '22px' : '2px', transition: 'all 0.3s ease' }} />
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
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: 'var(--text-h)' }}>{importStatus.sourceName === 'Reset' ? 'Apagando Banco...' : importStatus.step === 'reading' ? `Analisando...` : 'Gravando...'}</h2>
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
                  <h2 style={{ margin: '0 0 16px 0', fontSize: '1.5rem', color: 'var(--text-h)' }}>Extrato Pronto!</h2>
                  <p style={{ color: 'var(--text)', fontSize: '1rem', marginBottom: '32px', lineHeight: '1.5' }}>
                    Encontramos <strong style={{ color: 'var(--text-h)', fontSize: '1.3rem' }}>{importStatus.items.length}</strong> transações válidas. Deseja importar?
                  </p>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button onClick={fecharModal} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                    <button onClick={confirmarSalvamento} style={{ flex: 1, padding: '14px', background: '#10b981', border: 'none', color: '#fff', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Sim, Importar</button>
                  </div>
                </>
              )}

              {importStatus.step === 'success' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', color: '#10b981' }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <h2 style={{ margin: '0 0 12px 0', fontSize: '1.5rem', color: 'var(--text-h)' }}>Tudo Certo!</h2>
                  <p style={{ color: 'var(--text)', fontSize: '1rem', marginBottom: '32px' }}>Ação concluída com sucesso.</p>
                  <button onClick={fecharModal} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--accent)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Concluir</button>
                </>
              )}

              {importStatus.step === 'error' && (
                <>
                  <h2 style={{ margin: '0 0 12px 0', fontSize: '1.5rem', color: importStatus.sourceName === 'Reset' ? '#10b981' : '#ef4444' }}>{importStatus.sourceName === 'Reset' ? 'Histórico Limpo!' : 'Ops!'}</h2>
                  <p style={{ color: 'var(--text)', fontSize: '1rem', marginBottom: '32px' }}>{importStatus.errorMessage}</p>
                  <button onClick={fecharModal} style={{ width: '100%', padding: '16px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>OK, Voltar</button>
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
                    <button style={{ flex: 1, padding: '14px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }} onClick={fecharModal}>Cancelar</button>
                    <button style={{ flex: 1, padding: '14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setDeleteStep(2)}>Prosseguir</button>
                  </div>
                </>
              )}

              {deleteStep === 2 && (
                <>
                  <h2 style={{ color: 'var(--text-h)', margin: '0 0 16px 0', fontSize: '1.5rem' }}>Salvar seus Dados</h2>
                  <p style={{ color: 'var(--text)', marginBottom: '32px', lineHeight: '1.5' }}>Baixe um backup completo da sua vida financeira. É obrigatório.</p>
                  <button style={{ width: '100%', padding: '16px', background: backupRealizado ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg)', color: backupRealizado ? '#10b981' : 'var(--text-h)', border: `1px solid ${backupRealizado ? '#10b981' : 'var(--border)'}`, borderRadius: '12px', cursor: 'pointer', marginBottom: '32px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={async () => { await gerarBackupCompleto(currentUser!.uid); setBackupRealizado(true); }}>
                    {backupRealizado ? '✓ Backup Concluído' : '⬇ Baixar Backup'}
                  </button>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button style={{ flex: 1, padding: '14px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }} onClick={fecharModal}>Cancelar</button>
                    <button style={{ flex: 1, padding: '14px', background: backupRealizado ? '#ef4444' : 'var(--bg)', color: backupRealizado ? 'white' : 'var(--text)', border: 'none', borderRadius: '12px', cursor: backupRealizado ? 'pointer' : 'not-allowed', fontWeight: 'bold', opacity: backupRealizado ? 1 : 0.5 }} onClick={() => backupRealizado && setDeleteStep(3)}>Avançar</button>
                  </div>
                </>
              )}

              {deleteStep === 3 && (
                <>
                  <h2 style={{ color: '#ef4444', margin: '0 0 16px 0', fontSize: '1.5rem' }}>Último Passo</h2>
                  <p style={{ color: 'var(--text)', marginBottom: '24px', lineHeight: '1.5' }}>Digite <strong>EXCLUIR</strong> para deletar a conta permanentemente.</p>
                  <input type="text" placeholder="EXCLUIR" value={textoConfirmacao} onChange={e => setTextoConfirmacao(e.target.value)} style={{ width: '100%', padding: '16px', marginBottom: '32px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', letterSpacing: '2px', boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button style={{ flex: 1, padding: '14px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }} onClick={fecharModal}>Cancelar</button>
                    <button style={{ flex: 1, padding: '14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }} onClick={handleExcluirContaDefinitivamente}>ADEUS</button>
                  </div>
                </>
              )}
            </>
          )}

        </div>
      </div>
    );
  }

  // ✨ UI QUE ESTAVA FALTANDO NO CÓDIGO CORTADO
  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 10px 60px 10px' }}>
      
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: 'var(--text-h)', margin: '0 0 8px 0' }}>Configurações</h2>
        <p style={{ color: 'var(--text)', fontSize: '0.95rem', margin: 0 }}>Gerencie seu perfil, preferências e dados do sistema.</p>
      </div>

      <div className="card" style={{ padding: '24px', borderRadius: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-h)', fontSize: '1.1rem' }}>Seu Perfil</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
            {fotoDisplay ? <img src={fotoDisplay} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : inicial}
            <label style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.6rem', textAlign: 'center', padding: '4px 0', cursor: 'pointer' }}>
              {isUploadingImg ? '...' : 'Mudar'}
              <input type="file" hidden accept="image/*" onChange={handleTrocarFoto} ref={fileInputRef} disabled={isUploadingImg} />
            </label>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>NOME DE EXIBIÇÃO</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '1rem' }} />
              <button onClick={handleSalvarPerfil} disabled={isSaving} style={{ padding: '0 24px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>{isSaving ? '...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', borderRadius: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-h)', fontSize: '1.1rem' }}>Preferências</h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight: 'bold', color: 'var(--text-h)', marginBottom: '2px' }}>Modo Escuro</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>Aparência do aplicativo</div>
          </div>
          <ToggleSwitch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight: 'bold', color: 'var(--text-h)', marginBottom: '2px' }}>Notificações</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>Avisos e resumos</div>
          </div>
          <ToggleSwitch checked={notificacoesAtivas} onChange={() => setNotificacoesAtivas(!notificacoesAtivas)} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
          <div>
            <div style={{ fontWeight: 'bold', color: 'var(--text-h)', marginBottom: '2px' }}>Moeda Padrão</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>Símbolo nos valores</div>
          </div>
          <select value={moedaPadrao} onChange={e => setMoedaPadrao(e.target.value)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', fontWeight: 'bold', outline: 'none' }}>
            <option value="BRL">R$ (Real)</option>
            <option value="USD">$ (Dólar)</option>
            <option value="EUR">€ (Euro)</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', borderRadius: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-h)', fontSize: '1.1rem' }}>Dados e Integrações</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '16px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 'bold', color: 'var(--text-h)', marginBottom: '4px' }}>Importar de PDF (IA)</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>Extratos bancários Itaú, Nubank, etc.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.9rem' }}>
              Upload <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            <input type="file" hidden accept=".pdf" onChange={handleUploadPDF} />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '16px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 'bold', color: 'var(--text-h)', marginBottom: '4px' }}>Importar do Notion</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>Arquivo .csv do banco de dados antigo</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.9rem' }}>
              Upload <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            <input type="file" hidden accept=".csv" onChange={handleUploadNotion} />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '16px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 'bold', color: 'var(--text-h)', marginBottom: '4px' }}>Restaurar Backup</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>Carregar arquivo .json do GC Planner</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.9rem' }}>
              Upload <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            <input type="file" hidden accept=".json" onChange={handleRestaurarBackup} />
          </label>

          <button onClick={() => { gerarBackupCompleto(currentUser!.uid); alert('A preparar o seu arquivo... o download vai iniciar em breve.'); }} style={{ textAlign: 'left', padding: '18px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 'bold', color: 'var(--text-h)', marginBottom: '4px' }}>Baixar Backup</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>Salvar todos os seus dados com segurança</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>
              Baixar <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </div>
          </button>

        </div>
      </div>

      <div className="card" style={{ padding: '24px', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#ef4444', fontSize: '1.1rem' }}>Zona de Perigo</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button onClick={handleResetarHistorico} style={{ padding: '18px', background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            Limpar Todo o Histórico
          </button>
          <button onClick={() => setDeleteStep(1)} style={{ padding: '18px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Excluir Conta Definitivamente
          </button>
        </div>
      </div>

    </div>
  );
};
