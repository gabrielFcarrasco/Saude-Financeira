import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
  const [toastMsg, setToastMsg] = useState('');
  
  // ✨ Estados do Novo Modal Minimalista
  const [valorDeposito, setValorDeposito] = useState('');
  const [dataDeposito, setDataDeposito] = useState(new Date().toISOString().split('T')[0]); // Data de Hoje Padrão
  const [bancoSelecionado, setBancoSelecionado] = useState('Nubank');
  const [depMetaDestino, setDepMetaDestino] = useState('');

  const [abrindoSeletor, setAbrindoSeletor] = useState<'p1' | 'p2' | null>(null);
  const [isProcessando, setIsProcessando] = useState(false);

  const [versiculoDia] = useState(() => versiculos[Math.floor(Math.random() * versiculos.length)]);
  const [fraseDia] = useState(() => frases[Math.floor(Math.random() * frases.length)]);
  const [textoVersiculo, refVersiculo] = versiculoDia.split(' - ');

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

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const extratoUnificado = [
    ...contribuicoes.map((c: any) => {
      const vP1 = Number(c.p1Contr || 0);
      const vP2 = Number(c.p2Contr || 0);
      let detalheDepositantes = '';
      if (vP1 > 0 && vP2 === 0) detalheDepositantes = `Aporte de ${parceiro1}`;
      else if (vP2 > 0 && vP1 === 0) detalheDepositantes = `Aporte de ${parceiro2}`;
      else detalheDepositantes = `${parceiro1}: ${formatMoney(vP1)} | ${parceiro2}: ${formatMoney(vP2)}`;

      return {
        id: c.id,
        tipo: 'entrada',
        titulo: 'Depósito no Cofre',
        data: c.mesData || 'Mês Atual',
        valor: vP1 + vP2,
        detalhe: `${c.local ? `${c.local} • ` : ''}${detalheDepositantes}`,
        timestamp: c.createdAt?.toMillis() || 0
      };
    }),
    ...despesasRapidas.map((d: any) => ({
      id: d.id,
      tipo: 'saida',
      titulo: d.desc,
      data: d.data,
      valor: Number(d.valor || 0),
      detalhe: `Pago por ${d.pagoPor}`,
      timestamp: d.createdAt?.toMillis() || 0
    }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  const extratoExibido = mostrarExtratoCompleto ? extratoUnificado : extratoUnificado.slice(0, 3);

  // ✨ SALVAR DEPÓSITO DO USUÁRIO
  const handleSalvar = async () => {
    const valorNum = Number(valorDeposito || 0);

    if (valorNum <= 0) return showToast("Ei! Insira um valor maior que zero. 😉");
    if (!casalId) return showToast("Erro de conexão com o cofre.");
    
    try {
      setIsProcessando(true);
      
      const v1 = currentUserRole === 'p1' ? valorNum : 0;
      const v2 = currentUserRole === 'p2' ? valorNum : 0;
      
      const dataFormatada = dataDeposito ? new Date(dataDeposito + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Hoje';

      // 1. Salva no cofre
      await addDoc(collection(db, 'casais', casalId, 'contribuicoes'), {
        mesData: dataFormatada,
        local: bancoSelecionado,
        p1Contr: v1,
        p2Contr: v2,
        createdAt: serverTimestamp()
      });

      // 2. Joga para a Meta se escolheu uma
      if (depMetaDestino) {
        const metaEscolhida = metas.find((m: any) => m.id === depMetaDestino);
        if (metaEscolhida) {
          const metaRef = doc(db, 'casais', casalId, 'metas', depMetaDestino);
          const novoAporte = {
            id: Date.now().toString(),
            data: dataFormatada,
            valor: valorNum,
            descricao: `Depósito (${meuNome})`
          };
          await updateDoc(metaRef, {
            atual: metaEscolhida.atual + valorNum,
            historico: [novoAporte, ...(metaEscolhida.historico || [])]
          });
        }
      }

      setNovoDepositoAberto(false); 
      setValorDeposito('');
      setDataDeposito(new Date().toISOString().split('T')[0]);
      setDepMetaDestino('');
      showToast("Depósito salvo com sucesso! 🎉");
      
    } catch (error) {
      console.error("Erro ao salvar:", error);
      showToast("Houve um erro ao salvar seu depósito.");
    } finally {
      setIsProcessando(false);
    }
  };

  const alterarCor = async (cor: string) => {
    if (!casalId || !abrindoSeletor) return;
    try {
      const campoCor = abrindoSeletor === 'p1' ? 'corP1' : 'corP2';
      await updateDoc(doc(db, 'casais', casalId), { [campoCor]: cor });
      setAbrindoSeletor(null);
    } catch (error) { console.error(error); }
  };

  const abrirSeletorSeguro = (perfil: 'p1' | 'p2', nomePerfil: string) => {
    if (meuNome === nomePerfil) setAbrindoSeletor(perfil);
    else showToast(`Você só pode trocar a sua própria cor! Deixa a do(a) ${nomePerfil} em paz! 😂`);
  };

  const renderAvatar = (nome: string, fotoUrl: string | null, corFundo: string) => {
    if (fotoUrl) return <img src={fotoUrl} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
    return <div style={{ width: '100%', height: '100%', background: corFundo, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>{nome ? nome.charAt(0).toUpperCase() : '?'}</div>;
  };

  return (
    <div className="hub-fintech-container animate-fade-in" style={{ position: 'relative' }}>
      
      {/* ✨ TOAST DE NOTIFICAÇÃO ANIMADO */}
      {toastMsg && (
        <div className="animate-slide-up" style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'var(--text-h)', color: 'var(--bg)', padding: '14px 24px', borderRadius: '30px', zIndex: 9999, fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 8px 16px rgba(0,0,0,0.3)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>ℹ️</span> {toastMsg}
        </div>
      )}

      {/* VERSÍCULO */}
      <div style={{ display: 'flex', gap: '16px', background: 'var(--bg)', padding: '20px', marginBottom: '24px', borderRadius: '12px', border: '1px solid var(--border)', alignItems: 'flex-start' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--border)" opacity="0.5" flexShrink="0"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontStyle: 'italic', color: 'var(--text-h)', fontSize: '0.95rem', lineHeight: '1.5' }}>"{textoVersiculo}"</span>
          {refVersiculo && <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>— {refVersiculo}</span>}
        </div>
      </div>

      {/* SALDO CENTRAL */}
      <div className="hub-balance-card" style={{ position: 'relative', paddingTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'absolute', top: '-28px', left: '0', right: '0' }}>
          <div onClick={() => abrirSeletorSeguro('p1', parceiro1)} style={{ zIndex: 2, width: '60px', height: '60px', borderRadius: '50%', border: `3px solid ${corP1}`, overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', background: 'var(--bg)', cursor: 'pointer', transition: 'transform 0.2s' }}>
            {renderAvatar(parceiro1, fotoP1, corP1)}
          </div>
          <div onClick={() => abrirSeletorSeguro('p2', parceiro2)} style={{ zIndex: 1, marginLeft: '-16px', width: '60px', height: '60px', borderRadius: '50%', border: `3px solid ${corP2}`, overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', background: 'var(--bg)', cursor: 'pointer', transition: 'transform 0.2s' }}>
            {renderAvatar(parceiro2, fotoP2, corP2)}
          </div>
        </div>

        <div className="hub-balance-label">Cofre de {parceiro1} & {parceiro2}</div>
        <h1 className="hub-balance-value" style={{ marginTop: '4px' }}>{formatMoney(totalCofre)}</h1>
        
        <div className="split-bar-container" style={{ width: '100%', maxWidth: '350px', height: '10px', marginBottom: '20px' }}>
          <div className="split-p1" style={{ width: `${percP1}%`, background: corP1 }}></div>
          <div className="split-p2" style={{ width: `${percP2}%`, background: corP2 }}></div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '350px', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-h)', fontWeight: 600 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: corP1 }}></span> {parceiro1}</span>
            <span style={{ color: 'var(--text)' }}>{formatMoney(totalP1)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text)', opacity: 0.8 }}>{percP1.toFixed(1)}%</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-h)', fontWeight: 600 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: corP2 }}></span> {parceiro2}</span>
            <span style={{ color: 'var(--text)' }}>{formatMoney(totalP2)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text)', opacity: 0.8 }}>{percP2.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {abrindoSeletor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-fade-in" style={{ background: 'var(--code-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', maxWidth: '320px', width: '100%', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-h)' }}>Sua Cor de Perfil</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {PALETA_DE_CORES.map(cor => (
                <div key={cor} onClick={() => alterarCor(cor)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: cor, cursor: 'pointer', border: '2px solid var(--bg)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', margin: '0 auto' }} />
              ))}
            </div>
            <button onClick={() => setAbrindoSeletor(null)} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="hub-actions-wrapper">
        <div className="hub-actions-list">
          <div className="action-btn" onClick={() => setNovoDepositoAberto(!novoDepositoAberto)} style={{ borderColor: novoDepositoAberto ? minhaCor : 'var(--border)' }}>
            <div className="action-icon" style={{ color: novoDepositoAberto ? minhaCor : 'currentColor' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></div>
            <span className="action-label" style={{ color: novoDepositoAberto ? minhaCor : 'var(--text)' }}>Depositar</span>
          </div>
          <div className="action-btn" onClick={() => setActiveView('desafio200')}>
            <div className="action-icon" style={{ color: '#f59e0b' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-1 1.05l-3.91.52"></path><path d="M14 14.66V17c0 .55.47.98 1 1.05l3.91.52"></path><path d="M18 4v5c0 3.31-2.69 6-6 6s-6-2.69-6-6V4z"></path></svg></div>
            <span className="action-label">Acelerador</span>
          </div>
          <div className="action-btn" onClick={() => setActiveView('lazer')}>
            <div className="action-icon" style={{ color: '#ec4899' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg></div>
            <span className="action-label">Lazer</span>
          </div>
          <div className="action-btn" onClick={() => setActiveView('metas')}>
            <div className="action-icon" style={{ color: '#8b5cf6' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
            <span className="action-label">Metas</span>
          </div>
        </div>
      </div>

      {/* ✨ MODAL DE DEPÓSITO PENSADO PARA MOBILE (APENAS O USUÁRIO) */}
      {novoDepositoAberto && (
        <div className="simulator-box animate-fade-in" style={{ padding: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-h)' }}>Registrar Depósito</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600, textTransform: 'uppercase' }}>Seu Valor ({meuNome})</span>
            <input type="number" value={valorDeposito} onChange={e => setValorDeposito(e.target.value)} placeholder="R$ 0,00" style={{ width: '100%', background: 'var(--bg)', color: 'var(--text-h)', padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', outline: 'none', boxSizing: 'border-box', fontSize: '1.2rem', fontWeight: 'bold' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 600, textTransform: 'uppercase' }}>Data</span>
              <input type="date" value={dataDeposito} onChange={e => setDataDeposito(e.target.value)} style={{ width: '100%', background: 'var(--bg)', color: 'var(--text-h)', padding: '14px', border: '1px solid var(--border)', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 600, textTransform: 'uppercase' }}>Banco Original</span>
              <select value={bancoSelecionado} onChange={e => setBancoSelecionado(e.target.value)} style={{ width: '100%', background: 'var(--bg)', color: 'var(--text-h)', padding: '14px', border: '1px solid var(--border)', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }}>
                {BANCOS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px', background: 'var(--bg)', padding: '14px', borderRadius: '12px', border: '1px dashed var(--border)' }}>
            <span style={{ fontSize: '0.8rem', color: minhaCor, fontWeight: 600 }}>Destino do Dinheiro</span>
            <select value={depMetaDestino} onChange={e => setDepMetaDestino(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--code-bg)', color: 'var(--text-h)', border: 'none', borderBottom: '1px solid var(--border)', borderRadius: '0', outline: 'none', cursor: 'pointer' }}>
              <option value="">Deixar livre no Cofre</option>
              {metas.map((m: any) => <option key={m.id} value={m.id}>Direcionar para: {m.titulo}</option>)}
            </select>
          </div>

          <button className="primary" disabled={isProcessando} onClick={handleSalvar} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: minhaCor, color: '#fff', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
            {isProcessando ? 'Salvando...' : 'Confirmar Depósito'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: `3px solid ${minhaCor}`, background: 'rgba(139, 92, 246, 0.05)', padding: '16px', marginBottom: '24px', borderRadius: '0 8px 8px 0' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={minhaCor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" flexShrink="0"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M4 12H2"></path><path d="M22 12h-2"></path><path d="M19.07 4.93l-1.41 1.41"></path><path d="M6.34 17.66l-1.41 1.41"></path><path d="M19.07 19.07l-1.41-1.41"></path><path d="M6.34 6.34l-1.41 1.41"></path></svg>
        <p style={{ margin: 0, color: 'var(--text-h)', fontSize: '0.9rem', fontWeight: 500 }}>{fraseDia}</p>
      </div>

      <div className="extrato-container">
        <div className="extrato-header">
          <h3 style={{ margin: 0, color: 'var(--text-h)' }}>Últimas Movimentações</h3>
          <button onClick={() => setMostrarExtratoCompleto(!mostrarExtratoCompleto)} style={{ background: 'transparent', border: 'none', color: minhaCor, fontWeight: 'bold', cursor: 'pointer' }}>
            {mostrarExtratoCompleto ? 'Ocultar' : 'Ver tudo'}
          </button>
        </div>
        <div>
          {extratoExibido.map((item: any) => (
            <div key={`${item.tipo}-${item.id}`} className={`extrato-item ${item.tipo}`}>
              <div className="extrato-icon-box">
                {item.tipo === 'entrada' ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>}
              </div>
              <div className="extrato-info">
                <span className="extrato-titulo">{item.titulo}</span>
                <span className="extrato-data" style={{ fontSize: '0.8rem' }}>{item.data} • {item.detalhe}</span>
              </div>
              <div className="extrato-valor" style={{ color: item.tipo === 'entrada' ? '#10b981' : 'var(--text-h)' }}>
                {item.tipo === 'entrada' ? '+' : '-'}{formatMoney(item.valor)}
              </div>
            </div>
          ))}
          {extratoUnificado.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text)', padding: '16px 0' }}>Nenhuma movimentação registrada.</p>}
        </div>
      </div>
    </div>
  );
};