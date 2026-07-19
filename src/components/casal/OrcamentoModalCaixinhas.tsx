import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'; 
import { db } from '../../services/firebase';

const PALETA_DE_CORES = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e', '#84cc16', '#0ea5e9', '#eab308'];

const ICONS: Record<string, JSX.Element> = {
  star: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
  food: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>,
  heart: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>,
  shopping: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>,
  plane: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-.5-.5-2.5 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 4-4 4-3-1-2 2 5 5 2-2-1-3 4-4 4 6l1.2-.7c.4-.2.7-.6.6-1.1z"/></svg>,
  users: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  gamepad: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line><rect x="2" y="6" width="20" height="12" rx="2"></rect></svg>,
  music: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>,
  dollar: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  home: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
};
const ICON_KEYS = Object.keys(ICONS);

export const OrcamentoModalCaixinhas = ({
  editandoCaixinhas, setEditandoCaixinhas, casalId, caixinhasValidas, limiteMensalLazer, formatMoney, meuNome
}: any) => {
  const [lista, setLista] = useState<any[]>([]);
  const [isProcessando, setIsProcessando] = useState(false);
  
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null);

  useEffect(() => {
    if (editandoCaixinhas) {
      setLista(JSON.parse(JSON.stringify(caixinhasValidas))); 
    }
  }, [editandoCaixinhas, caixinhasValidas]);

  if (!editandoCaixinhas) return null;

  const totalAlocado = lista.reduce((acc, c) => acc + Number(c.valor || 0), 0);
  const disponivel = limiteMensalLazer - totalAlocado;
  const porcentagemAlocada = limiteMensalLazer > 0 ? Math.min((totalAlocado / limiteMensalLazer) * 100, 100) : 0;

  // ✨ MÁSCARA BANCÁRIA
  const handleValorCaixinha = (id: string, e: any) => {
    const numbers = e.target.value.replace(/\D/g, '');
    const val = numbers ? (parseInt(numbers, 10) / 100).toFixed(2) : 0;
    atualizarCaixinha(id, 'valor', Number(val));
  };

  const formatMask = (val: string | number) => {
    if (!val) return '';
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSalvar = async () => {
    setIsProcessando(true);
    try {
      await updateDoc(doc(db, 'casais', casalId), { 
        caixinhas: lista,
        notificacoes: arrayUnion({
          id: Date.now().toString(),
          texto: `${meuNome} atualizou as Categorias de Lazer!`,
          lida: false,
          createdAt: new Date().toISOString()
        })
      });
      setEditandoCaixinhas(false);
    } catch (e) {
      console.error("Erro ao salvar categorias:", e);
    } finally { 
      setIsProcessando(false); 
    }
  };

  const adicionarCaixinha = () => {
    const cor = PALETA_DE_CORES[lista.length % PALETA_DE_CORES.length];
    setLista([...lista, { id: Date.now().toString(), nome: '', valor: 0, cor: cor, icone: 'star' }]);
  };

  const atualizarCaixinha = (id: string, campo: string, valor: any) => {
    setLista(lista.map(c => c.id === id ? { ...c, [campo]: valor } : c));
  };

  const efetivarExclusao = () => {
    if (confirmarExclusao) {
      setLista(lista.filter(c => c.id !== confirmarExclusao));
      setConfirmarExclusao(null);
    }
  };

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div className="animate-slide-up" style={{ background: 'var(--bg)', width: '100%', maxWidth: '500px', borderRadius: '32px 32px 0 0', padding: '32px 24px 60px', maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px' }}></div>
          
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)', textAlign: 'center' }}>Categorias de Lazer</h3>
          <p style={{ margin: '0 0 24px 0', color: 'var(--text)', fontSize: '0.9rem', textAlign: 'center', lineHeight: '1.4' }}>
            Organize os seus gastos. Crie categorias, escolha as cores, ícones e distribua o seu orçamento mensal.
          </p>
          
          <div style={{ background: 'var(--code-bg)', padding: '24px', borderRadius: '24px', marginBottom: '24px', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.03)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Falta Distribuir</p>
                  <h2 style={{ margin: 0, color: disponivel >= 0 ? '#10b981' : '#ef4444', fontSize: '2rem', letterSpacing: '-1px' }}>{formatMoney(disponivel)}</h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Teto Mensal</p>
                  <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.2rem' }}>{formatMoney(limiteMensalLazer)}</h3>
                </div>
             </div>
             <div style={{ width: '100%', height: '8px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${porcentagemAlocada}%`, height: '100%', background: disponivel < 0 ? '#ef4444' : 'var(--accent)', transition: 'width 0.4s ease' }}></div>
             </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
             {lista.map((c: any) => (
               <div key={c.id} style={{ background: 'var(--code-bg)', padding: '24px', borderRadius: '28px', border: `2px solid ${c.cor}60`, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                     <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${c.cor}15`, color: c.cor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {ICONS[c.icone || 'star']}
                     </div>
                     <input 
                       type="text" 
                       value={c.nome} 
                       onChange={e => atualizarCaixinha(c.id, 'nome', e.target.value)} 
                       placeholder="Ex: Jantares..." 
                       style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--text-h)', fontWeight: 'bold', fontSize: '1.2rem', outline: 'none' }} 
                     />
                     
                     <button 
                        onClick={() => setConfirmarExclusao(c.id)} 
                        style={{ color: '#ef4444', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: '8px' }}
                        title="Excluir Categoria"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                     </button>
                  </div>

                  <div style={{ background: 'var(--bg)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', border: '1px solid var(--border)' }}>
                     <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text)' }}>Orçamento (R$):</span>
                     {/* ✨ INPUT COM MÁSCARA APLICADA */}
                     <input 
                       type="text" 
                       inputMode="numeric" 
                       value={formatMask(c.valor)} 
                       onChange={e => handleValorCaixinha(c.id, e)} 
                       placeholder="0,00" 
                       style={{ width: '120px', textAlign: 'right', border: 'none', background: 'transparent', color: 'var(--text-h)', fontSize: '1.3rem', fontWeight: 'bold', outline: 'none' }} 
                     />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                     <div>
                       <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Escolha a Cor</span>
                       <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {PALETA_DE_CORES.map(cor => (
                             <div 
                               key={cor} 
                               onClick={() => atualizarCaixinha(c.id, 'cor', cor)} 
                               style={{ width: '32px', height: '32px', borderRadius: '50%', background: cor, cursor: 'pointer', border: c.cor === cor ? '3px solid var(--text-h)' : '3px solid transparent', transform: c.cor === cor ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s' }} 
                             />
                          ))}
                       </div>
                     </div>

                     <div>
                       <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Escolha o Ícone</span>
                       <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {ICON_KEYS.map(key => (
                             <div 
                               key={key} 
                               onClick={() => atualizarCaixinha(c.id, 'icone', key)} 
                               style={{ width: '44px', height: '44px', flexShrink: 0, borderRadius: '14px', background: c.icone === key ? `${c.cor}30` : 'var(--bg)', color: c.icone === key ? c.cor : 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: c.icone === key ? `2px solid ${c.cor}` : '1px solid var(--border)', transition: 'all 0.2s' }}
                             >
                                {ICONS[key]}
                             </div>
                          ))}
                       </div>
                     </div>
                  </div>

               </div>
             ))}
             
             <button onClick={adicionarCaixinha} style={{ padding: '20px', background: 'transparent', border: '2px dashed var(--accent)', color: 'var(--accent)', borderRadius: '24px', fontWeight: 'bold', fontSize: '1.05rem', cursor: 'pointer' }}>
               + Adicionar Categoria
             </button>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setEditandoCaixinhas(false)} disabled={isProcessando} style={{ flex: 1, padding: '20px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', fontSize: '1.05rem' }}>Cancelar</button>
            <button onClick={handleSalvar} disabled={isProcessando || disponivel < 0} style={{ flex: 2, padding: '20px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1.05rem', opacity: disponivel < 0 ? 0.5 : 1 }}>
              {isProcessando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>

      {confirmarExclusao && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="animate-fade-in" style={{ background: 'var(--code-bg)', borderRadius: '28px', padding: '32px 24px', width: '100%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            
            <div style={{ marginBottom: '16px', color: '#ef4444', display: 'flex', justifyContent: 'center' }}>
               <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </div>
            
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-h)' }}>Excluir Categoria?</h3>
            <p style={{ color: 'var(--text)', marginBottom: '32px', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Tem certeza que deseja apagar? Os passeios que já registrou no passado não serão perdidos.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={efetivarExclusao} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
                Sim, quero excluir
              </button>
              <button onClick={() => setConfirmarExclusao(null)} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};