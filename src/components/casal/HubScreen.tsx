import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, doc, updateDoc, serverTimestamp, onSnapshot, arrayUnion } from 'firebase/firestore'; // ✨ Importados novos métodos
import { db } from '../../services/firebase'; 
import { frases, versiculos } from './mensagens'; 

const PALETA_DE_CORES = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e', '#84cc16'];
const BANCOS = ['Nubank', 'Itaú', 'Inter', 'Bradesco', 'Santander', 'C6 Bank', 'Caixa', 'Banco do Brasil', 'Sicoob', 'BTG Pactual', 'Dinheiro Físico', 'Outro'];

export const HubScreen = ({ 
  setActiveView, parceiro1, parceiro2, fotoP1, fotoP2, corP1, corP2, formatMoney,
  casalId, metas, currentUserRole, meuNome,
  contribuicoes, despesasRapidas, desafioP1, desafioP2, 
  novoDepositoAberto, setNovoDepositoAberto,
}: any) => {

  const [mostrarExtratoCompleto, setMostrarExtratoCompleto] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [valorDeposito, setValorDeposito] = useState('');
  const [dataDeposito, setDataDeposito] = useState(new Date().toISOString().split('T')[0]); 
  const [bancoSelecionado, setBancoSelecionado] = useState('Nubank');
  const [depMetaDestino, setDepMetaDestino] = useState('');
  
  const [abrindoSeletor, setAbrindoSeletor] = useState<'p1' | 'p2' | null>(null);
  const [isProcessando, setIsProcessando] = useState(false);
  const [fraseDia] = useState(() => frases[Math.floor(Math.random() * frases.length)]);
  const [versiculoDia] = useState(() => versiculos[Math.floor(Math.random() * versiculos.length)]);
  const [textoVersiculo, refVersiculo] = versiculoDia.split(' - ');

  // ✨ ESTADOS DE NOTIFICAÇÕES
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);

  // ✨ ESCUTAR AS NOTIFICAÇÕES EM TEMPO REAL
  useEffect(() => {
    if (!casalId) return;
    const unsub = onSnapshot(doc(db, 'casais', casalId), (docSnap) => {
      if (docSnap.exists() && docSnap.data().notificacoes) {
        setNotificacoes(docSnap.data().notificacoes.sort((a:any, b:any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    });
    return () => unsub();
  }, [casalId]);

  const temNotificacaoNaoLida = notificacoes.some((n: any) => !n.lida);

  const limparNotificacoes = async () => {
    if(!casalId) return;
    const lidas = notificacoes.map(n => ({...n, lida: true}));
    await updateDoc(doc(db, 'casais', casalId), { notificacoes: lidas });
    setNotificacoesAbertas(false);
  };

  const totalDesafioP1 = desafioP1.reduce((a: number, b: number) => a + b, 0);
  const totalDesafioP2 = desafioP2.reduce((a: number, b: number) => a + b, 0);
  const totalDepositosP1 = contribuicoes.reduce((acc: number, curr: any) => acc + (Number(curr.p1Contr) || 0), 0);
  const totalDepositosP2 = contribuicoes.reduce((acc: number, curr: any) => acc + (Number(curr.p2Contr) || 0), 0);
  
  const totalP1 = totalDepositosP1 + totalDesafioP1;
  const totalP2 = totalDepositosP2 + totalDesafioP2;
  const totalCofre = totalP1 + totalP2;

  const percP1 = totalCofre > 0 ? (totalP1 / totalCofre) * 100 : 50;
  const percP2 = totalCofre > 0 ? (totalP2 / totalCofre) * 100 : 50;
  const minhaCor = currentUserRole === 'p1' ? corP1 : corP2;

  const extratoUnificado = [
    ...contribuicoes.map((c: any) => {
      const vP1 = Number(c.p1Contr || 0);
      const vP2 = Number(c.p2Contr || 0);
      let detalheDepositantes = '';
      if (vP1 > 0 && vP2 === 0) detalheDepositantes = `Aporte de ${parceiro1}`;
      else if (vP2 > 0 && vP1 === 0) detalheDepositantes = `Aporte de ${parceiro2}`;
      else detalheDepositantes = `${parceiro1}: ${formatMoney(vP1)} | ${parceiro2}: ${formatMoney(vP2)}`;

      return {
        id: c.id, tipo: 'entrada', titulo: 'Depósito no Cofre', data: c.mesData || 'Mês Atual', valor: vP1 + vP2, detalhe: `${c.local ? `${c.local} • ` : ''}${detalheDepositantes}`, timestamp: c.createdAt?.toMillis() || 0
      };
    }),
    ...despesasRapidas.map((d: any) => ({
      id: d.id, tipo: 'saida', titulo: d.desc, data: d.data, valor: Number(d.valor || 0), detalhe: `Pago por ${d.pagoPor}`, timestamp: d.createdAt?.toMillis() || 0
    }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  const extratoExibido = mostrarExtratoCompleto ? extratoUnificado : extratoUnificado.slice(0, 4);

  const handleSalvar = async () => {
    const valorNum = Number(valorDeposito || 0);
    if (valorNum <= 0) return setAlertMsg("Ei! Insira um valor maior que zero para depositar. 😉");
    if (!casalId) return setAlertMsg("Erro de conexão com o cofre.");
    
    try {
      setIsProcessando(true);
      const v1 = currentUserRole === 'p1' ? valorNum : 0;
      const v2 = currentUserRole === 'p2' ? valorNum : 0;
      const dataFormatada = dataDeposito ? new Date(dataDeposito + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Hoje';

      await addDoc(collection(db, 'casais', casalId, 'contribuicoes'), {
        mesData: dataFormatada, local: bancoSelecionado, p1Contr: v1, p2Contr: v2, createdAt: serverTimestamp()
      });

      let metaNome = '';
      if (depMetaDestino) {
        const metaEscolhida = metas.find((m: any) => m.id === depMetaDestino);
        if (metaEscolhida) {
          metaNome = metaEscolhida.titulo;
          const metaRef = doc(db, 'casais', casalId, 'metas', depMetaDestino);
          await updateDoc(metaRef, {
            atual: metaEscolhida.atual + valorNum,
            historico: [{ id: Date.now().toString(), data: dataFormatada, valor: valorNum, descricao: `Depósito (${meuNome})` }, ...(metaEscolhida.historico || [])]
          });
        }
      }

      // ✨ GERA A NOTIFICAÇÃO DO DEPÓSITO
      await updateDoc(doc(db, 'casais', casalId), {
        notificacoes: arrayUnion({
          id: Date.now().toString(),
          texto: `${meuNome} depositou ${formatMoney(valorNum)} no cofre${metaNome ? ` para a meta "${metaNome}"` : ''}! 💰`,
          lida: false,
          createdAt: new Date().toISOString()
        })
      });

      setNovoDepositoAberto(false); setValorDeposito(''); setDepMetaDestino('');
      setAlertMsg("Depósito salvo com sucesso! 🎉");
    } catch (error) { setAlertMsg("Houve um erro ao salvar seu depósito."); } 
    finally { setIsProcessando(false); }
  };

  const alterarCor = async (cor: string) => {
    if (!casalId || !abrindoSeletor) return;
    try { await updateDoc(doc(db, 'casais', casalId), { [abrindoSeletor === 'p1' ? 'corP1' : 'corP2']: cor }); setAbrindoSeletor(null); } catch (error) {}
  };

  const abrirSeletorSeguro = (perfil: 'p1' | 'p2', nomePerfil: string) => {
    if (meuNome === nomePerfil) setAbrindoSeletor(perfil);
    else setAlertMsg(`Você só pode trocar a sua própria cor! Deixa a do(a) ${nomePerfil} em paz! 😂`);
  };

  const renderAvatar = (nome: string, fotoUrl: string | null, corFundo: string) => {
    if (fotoUrl) return <img src={fotoUrl} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
    return <div style={{ width: '100%', height: '100%', background: corFundo, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>{nome ? nome.charAt(0).toUpperCase() : '?'}</div>;
  };

  return (
    <div className="hub-fintech-container animate-fade-in">
      
      {/* ALERTA E MODAIS GERAIS (Omitidos p/brevidade, idênticos aos de cima) */}
      {alertMsg && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="animate-fade-in" style={{ background: 'var(--code-bg)', borderRadius: '28px', padding: '32px 24px', maxWidth: '320px', width: '100%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>{alertMsg.includes('sucesso') ? '✅' : '⚠️'}</div>
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-h)' }}>{alertMsg.includes('sucesso') ? 'Tudo certo!' : 'Aviso'}</h3>
            <p style={{ color: 'var(--text)', marginBottom: '24px', fontSize: '0.95rem' }}>{alertMsg}</p>
            <button onClick={() => setAlertMsg('')} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: minhaCor, color: '#fff', border: 'none', fontWeight: 'bold' }}>Entendi</button>
          </div>
        </div>, document.body
      )}

      {abrindoSeletor && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="animate-fade-in" style={{ background: 'var(--code-bg)', padding: '32px 24px', borderRadius: '28px', width: '100%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-h)' }}>Sua Cor de Perfil</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
              {PALETA_DE_CORES.map(cor => (
                <div key={cor} onClick={() => alterarCor(cor)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: cor, cursor: 'pointer', margin: '0 auto' }} />
              ))}
            </div>
            <button onClick={() => setAbrindoSeletor(null)} style={{ width: '100%', padding: '16px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '16px', fontWeight: 'bold' }}>Cancelar</button>
          </div>
        </div>, document.body
      )}

      {novoDepositoAberto && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div className="animate-slide-up" style={{ background: 'var(--bg)', padding: '24px', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)' }}>Novo Depósito</h3>
              <button onClick={() => setNovoDepositoAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text)', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600 }}>SEU VALOR ({meuNome})</label>
                <input type="number" value={valorDeposito} onChange={e => setValorDeposito(e.target.value)} placeholder="R$ 0,00" style={{ width: '100%', background: 'var(--code-bg)', color: 'var(--text-h)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', fontSize: '1.2rem', fontWeight: 'bold', marginTop: '8px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600 }}>DATA</label>
                  <input type="date" value={dataDeposito} onChange={e => setDataDeposito(e.target.value)} style={{ width: '100%', background: 'var(--code-bg)', color: 'var(--text-h)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', marginTop: '8px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600 }}>ORIGEM</label>
                  <select value={bancoSelecionado} onChange={e => setBancoSelecionado(e.target.value)} style={{ width: '100%', background: 'var(--code-bg)', color: 'var(--text-h)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', marginTop: '8px' }}>
                    {BANCOS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: minhaCor, fontWeight: 600 }}>DESTINO (Opcional)</label>
                <select value={depMetaDestino} onChange={e => setDepMetaDestino(e.target.value)} style={{ width: '100%', background: 'var(--code-bg)', color: 'var(--text-h)', padding: '14px', borderRadius: '12px', border: `1px dashed ${minhaCor}`, marginTop: '8px' }}>
                  <option value="">Deixar livre no Cofre</option>
                  {metas.map((m: any) => <option key={m.id} value={m.id}>Meta: {m.titulo}</option>)}
                </select>
              </div>
            </div>

            <button disabled={isProcessando} onClick={handleSalvar} style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: minhaCor, color: '#fff', fontWeight: 'bold', fontSize: '1.05rem', cursor: 'pointer' }}>
              {isProcessando ? 'Salvando...' : 'Confirmar Depósito'}
            </button>
          </div>
        </div>, document.body
      )}

      {/* ✨ MODAL DE NOTIFICAÇÕES */}
      {notificacoesAbertas && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div className="animate-slide-up" style={{ background: 'var(--bg)', padding: '24px', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)' }}>Atualizações 🔔</h3>
              <button onClick={limparNotificacoes} style={{ background: 'var(--code-bg)', border: 'none', padding: '8px 12px', borderRadius: '12px', color: 'var(--text)', fontWeight: 'bold', cursor: 'pointer' }}>Marcar como Lidas</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notificacoes.length > 0 ? notificacoes.map((n: any) => (
                <div key={n.id} style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '16px', border: `1px solid ${n.lida ? 'var(--border)' : minhaCor}`, opacity: n.lida ? 0.6 : 1 }}>
                  <p style={{ margin: 0, color: 'var(--text-h)', fontSize: '0.9rem', lineHeight: '1.4' }}>{n.texto}</p>
                </div>
              )) : (
                <p style={{ textAlign: 'center', color: 'var(--text)', padding: '20px' }}>Nenhuma novidade por agora.</p>
              )}
            </div>
          </div>
        </div>, document.body
      )}

      {/* ✨ HEADER DO APP COM O SININHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.9rem', fontWeight: 600 }}>Olá, {meuNome}</p>
          <h2 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Resumo Conjunto</h2>
        </div>
        
        {/* BOTÃO DO SININHO DE NOTIFICAÇÃO */}
        <button onClick={() => setNotificacoesAbertas(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          {temNotificacaoNaoLida && (
            <span style={{ position: 'absolute', top: '8px', right: '10px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid var(--code-bg)' }}></span>
          )}
        </button>
      </div>

      {/* CARTÃO DE SALDO CENTRAL */}
      <div className="hub-balance-card" style={{ padding: '40px 24px 32px', background: 'var(--code-bg)', borderRadius: '28px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', marginBottom: '24px', position: 'relative' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'absolute', top: '-28px', left: '0', right: '0' }}>
          <div onClick={() => abrirSeletorSeguro('p1', parceiro1)} style={{ width: '56px', height: '56px', borderRadius: '50%', border: `3px solid ${corP1}`, overflow: 'hidden', zIndex: 2, background: 'var(--bg)', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            {renderAvatar(parceiro1, fotoP1, corP1)}
          </div>
          <div onClick={() => abrirSeletorSeguro('p2', parceiro2)} style={{ width: '56px', height: '56px', borderRadius: '50%', border: `3px solid ${corP2}`, overflow: 'hidden', zIndex: 1, marginLeft: '-12px', background: 'var(--bg)', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            {renderAvatar(parceiro2, fotoP2, corP2)}
          </div>
        </div>

        <span style={{ color: 'var(--text)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}>Cofre do Casal</span>
        <h1 style={{ fontSize: '3rem', margin: '8px 0 24px 0', color: 'var(--text-h)', letterSpacing: '-1px' }}>{formatMoney(totalCofre)}</h1>
        
        <div style={{ width: '100%', height: '8px', background: 'var(--bg)', borderRadius: '10px', display: 'flex', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ width: `${percP1}%`, background: corP1 }}></div>
          <div style={{ width: `${percP2}%`, background: corP2 }}></div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
             <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-h)', fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: corP1 }}></span> {parceiro1}</span>
             <span style={{ color: 'var(--text)' }}>{formatMoney(totalP1)} <b style={{fontSize: '0.75rem', opacity: 0.7}}>({percP1.toFixed(1)}%)</b></span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
             <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-h)', fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: corP2 }}></span> {parceiro2}</span>
             <span style={{ color: 'var(--text)' }}>{formatMoney(totalP2)} <b style={{fontSize: '0.75rem', opacity: 0.7}}>({percP2.toFixed(1)}%)</b></span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <button onClick={() => setNovoDepositoAberto(true)} style={{ padding: '16px', background: 'var(--code-bg)', border: 'none', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', color: 'var(--text-h)', fontWeight: 'bold' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></div>
          Depositar
        </button>
        <button onClick={() => setActiveView('lazer')} style={{ padding: '16px', background: 'var(--code-bg)', border: 'none', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', color: 'var(--text-h)', fontWeight: 'bold' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path></svg></div>
          Ver Lazer
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
         <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'var(--code-bg)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--text)', opacity: 0.5 }}>📖</div>
            <div>
               <p style={{ margin: '0 0 8px 0', color: 'var(--text-h)', fontSize: '0.9rem', fontStyle: 'italic', lineHeight: '1.4' }}>"{textoVersiculo}"</p>
               {refVersiculo && <span style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>— {refVersiculo}</span>}
            </div>
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(138, 43, 226, 0.05)', padding: '16px 20px', borderRadius: '20px', border: '1px solid rgba(138, 43, 226, 0.1)' }}>
            <div style={{ color: 'var(--accent)' }}>✨</div>
            <p style={{ margin: 0, color: 'var(--text-h)', fontSize: '0.85rem', fontWeight: 500 }}>{fraseDia}</p>
         </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.1rem' }}>Movimentações</h3>
          <button onClick={() => setMostrarExtratoCompleto(!mostrarExtratoCompleto)} style={{ background: 'none', border: 'none', color: minhaCor, fontWeight: 'bold', fontSize: '0.9rem' }}>{mostrarExtratoCompleto ? 'Ocultar' : 'Ver tudo'}</button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {extratoExibido.map((item: any) => (
            <div key={`${item.tipo}-${item.id}`} style={{ display: 'flex', alignItems: 'center', padding: '16px', background: 'var(--code-bg)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', background: item.tipo === 'entrada' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: item.tipo === 'entrada' ? '#10b981' : '#ef4444' }}>
                {item.tipo === 'entrada' ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-h)', fontWeight: 600, fontSize: '0.95rem' }}>{item.titulo}</div>
                <div style={{ color: 'var(--text)', fontSize: '0.75rem', marginTop: '2px' }}>{item.data} • {item.detalhe}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: item.tipo === 'entrada' ? '#10b981' : 'var(--text-h)' }}>
                {item.tipo === 'entrada' ? '+' : '-'}{formatMoney(item.valor)}
              </div>
            </div>
          ))}
          {extratoUnificado.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text)', padding: '20px', fontSize: '0.9rem' }}>O cofre está limpo por enquanto.</p>}
        </div>
      </div>
      
      <div className="scroll-spacer"></div>
    </div>
  );
};