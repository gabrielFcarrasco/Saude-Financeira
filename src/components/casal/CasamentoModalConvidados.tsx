import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const CasamentoModalConvidados = ({
  convidadosAberto, setConvidadosAberto, casalId, convidados
}: any) => {

  const [formAberto, setFormAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  
  // Campos do Formulário
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [grupo, setGrupo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('pendente'); 
  const [tipo, setTipo] = useState('adulto'); 
  const [acompanhantesPermitidos, setAcompanhantesPermitidos] = useState(0);
  const [restricaoAlimentar, setRestricaoAlimentar] = useState('');
  const [mesa, setMesa] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [isProcessando, setIsProcessando] = useState(false);
  
  // Estados da Lista
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [busca, setBusca] = useState('');

  if (!convidadosAberto) return null;

  // Métricas
  const totalConvitesGerados = convidados.reduce((acc: number, c: any) => acc + 1 + (c.acompanhantesPermitidos || 0), 0);
  const confirmados = convidados.filter((c: any) => c.status === 'confirmado').length;
  const pendentes = convidados.filter((c: any) => c.status === 'pendente').length;
  const recusados = convidados.filter((c: any) => c.status === 'recusado').length;

  const convidadosFiltrados = convidados.filter((c: any) => {
    const atendeFiltro = filtroStatus === 'todos' || c.status === filtroStatus;
    const atendeBusca = c.nome.toLowerCase().includes(busca.toLowerCase()) || 
                        (c.sobrenome && c.sobrenome.toLowerCase().includes(busca.toLowerCase())) ||
                        (c.grupo && c.grupo.toLowerCase().includes(busca.toLowerCase()));
    return atendeFiltro && atendeBusca;
  });

  const abrirFormNovo = () => {
    setIdEdicao(null); setNome(''); setSobrenome(''); setGrupo(''); setTelefone(''); setEmail('');
    setStatus('pendente'); setTipo('adulto'); setAcompanhantesPermitidos(0); setRestricaoAlimentar('');
    setMesa(''); setObservacoes('');
    setFormAberto(true);
  };

  const abrirFormEdicao = (c: any) => {
    setIdEdicao(c.id); setNome(c.nome); setSobrenome(c.sobrenome || ''); setGrupo(c.grupo || '');
    setTelefone(c.telefone || ''); setEmail(c.email || ''); setStatus(c.status); setTipo(c.tipo || 'adulto');
    setAcompanhantesPermitidos(c.acompanhantesPermitidos || 0); setRestricaoAlimentar(c.restricaoAlimentar || '');
    setMesa(c.mesa || ''); setObservacoes(c.observacoes || '');
    setFormAberto(true);
  };

  const handleSalvar = async () => {
    if (!casalId || !nome) return;
    setIsProcessando(true);
    try {
      const payload = {
        nome, sobrenome, grupo, telefone, email, status, tipo,
        acompanhantesPermitidos: Number(acompanhantesPermitidos),
        restricaoAlimentar, mesa, observacoes,
        updatedAt: serverTimestamp()
      };

      if (idEdicao) {
        await updateDoc(doc(db, 'casais', casalId, 'convidados', idEdicao), payload);
      } else {
        await addDoc(collection(db, 'casais', casalId, 'convidados'), { ...payload, createdAt: serverTimestamp() });
      }
      setFormAberto(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessando(false);
    }
  };

  const handleExcluir = async () => {
    if (!idEdicao || !window.confirm("Remover este convidado da lista?")) return;
    setIsProcessando(true);
    try {
      await deleteDoc(doc(db, 'casais', casalId, 'convidados', idEdicao));
      setFormAberto(false);
    } catch (e) {} finally { setIsProcessando(false); }
  };

  const getStatusConfig = (stat: string) => {
    if (stat === 'confirmado') return { cor: '#10b981', label: 'Confirmado', bg: 'rgba(16, 185, 129, 0.1)' };
    if (stat === 'recusado') return { cor: '#ef4444', label: 'Não Irá', bg: 'rgba(239, 68, 68, 0.1)' };
    return { cor: '#f59e0b', label: 'Pendente', bg: 'rgba(245, 158, 11, 0.1)' };
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '600px', padding: '32px 24px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        {!formAberto ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Lista de Convidados</h3>
              <button onClick={() => setConvidadosAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            {/* MÓDULO DIDÁTICO */}
            <div style={{ background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.2)', padding: '16px', borderRadius: '20px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 4px 0', color: '#0ea5e9', fontSize: '0.85rem' }}>Importante: Gestão do Buffet</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text)' }}>
                Seu custo real é baseado no número de <strong>Pessoas Previstas</strong> (Convidados Cadastrados + Acompanhantes). Utilize o filtro de <em>Pendentes</em> para Pedir Confirmação 30 dias antes da festa.
              </p>
            </div>

            {/* MÉTRICAS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--code-bg)', padding: '12px 8px', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border)' }}>
                <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-h)' }}>{totalConvitesGerados}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Previstas</span>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px 8px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '900', color: '#10b981' }}>{confirmados}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#10b981', textTransform: 'uppercase' }}>Confirm.</span>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px 8px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '900', color: '#f59e0b' }}>{pendentes}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#f59e0b', textTransform: 'uppercase' }}>Pendent.</span>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px 8px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '900', color: '#ef4444' }}>{recusados}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#ef4444', textTransform: 'uppercase' }}>Recusas</span>
              </div>
            </div>

            {/* BUSCA E FILTROS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--code-bg)', borderRadius: '16px', padding: '0 16px', border: '1px solid var(--border)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input 
                  type="text" placeholder="Buscar por nome ou família..." value={busca} onChange={(e) => setBusca(e.target.value)}
                  style={{ flex: 1, padding: '14px', border: 'none', background: 'transparent', color: 'var(--text-h)', outline: 'none', fontSize: '0.9rem' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {['todos', 'confirmado', 'pendente', 'recusado'].map(f => (
                  <button key={f} onClick={() => setFiltroStatus(f)} style={{ padding: '6px 12px', borderRadius: '10px', whiteSpace: 'nowrap', border: filtroStatus === f ? 'none' : '1px solid var(--border)', background: filtroStatus === f ? 'var(--text-h)' : 'transparent', color: filtroStatus === f ? 'var(--bg)' : 'var(--text)', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* LISTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
              {convidadosFiltrados.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text)', marginTop: '24px', fontSize: '0.9rem' }}>Nenhum convidado encontrado.</p>
              ) : (
                convidadosFiltrados.map((c: any) => {
                  const conf = getStatusConfig(c.status);
                  return (
                    <div key={c.id} onClick={() => abrirFormEdicao(c)} style={{ background: 'var(--bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '1rem' }}>{c.nome} {c.sobrenome}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold' }}>
                            {c.grupo || 'Sem Grupo'}
                          </span>
                          {c.tipo === 'crianca' && (
                            <>
                              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border)' }}></span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 'bold' }}>Criança</span>
                            </>
                          )}
                          {c.acompanhantesPermitidos > 0 && (
                            <>
                              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border)' }}></span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text)' }}>+{c.acompanhantesPermitidos} convite(s) extra(s)</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div style={{ background: conf.bg, color: conf.cor, padding: '6px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {conf.label}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button onClick={abrirFormNovo} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', marginTop: '20px', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)' }}>
              + Adicionar Convidado ou Família
            </button>
          </>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.2rem' }}>{idEdicao ? 'Editar Convidado' : 'Novo Convidado'}</h3>
              <button onClick={() => setFormAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', paddingBottom: '24px' }}>
              
              {/* DICA DE ACOMPANHANTES */}
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text)', lineHeight: '1.4', display: 'block' }}>
                  <strong>Como agrupar:</strong> Se você vai convidar um casal (ex: Tio João e Tia Maria), crie o contato como "Tio João" e coloque "1" no campo de Acompanhantes. Evite criar cadastros soltos para a mesma família.
                </span>
              </div>

              {/* DADOS BÁSICOS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Nome Principal</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Tio João" style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Sobrenome / Família</label>
                  <input type="text" value={sobrenome} onChange={e => setSobrenome(e.target.value)} placeholder="Ex: Silva" style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Grupo</label>
                  <input type="text" value={grupo} onChange={e => setGrupo(e.target.value)} placeholder="Ex: Trabalho, Padrinhos..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Telefone</label>
                  <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 9..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                </div>
              </div>

              {/* STATUS E RSVP */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Status RSVP</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }}>
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="recusado">Não Irá</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Idade</label>
                  <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }}>
                    <option value="adulto">Adulto (+12)</option>
                    <option value="crianca">Criança (Não paga buffet)</option>
                  </select>
                </div>
              </div>

              {/* DETALHES DO EVENTO */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Acompanhantes Extra</label>
                  <input type="number" min="0" value={acompanhantesPermitidos} onChange={e => setAcompanhantesPermitidos(Number(e.target.value))} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Mesa (Opcional)</label>
                  <input type="text" value={mesa} onChange={e => setMesa(e.target.value)} placeholder="Ex: Mesa 05" style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Restrição Alimentar</label>
                <input type="text" value={restricaoAlimentar} onChange={e => setRestricaoAlimentar(e.target.value)} placeholder="Ex: Vegano, Alergia a amendoim..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Observações Internas</label>
                <input type="text" value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Anotações só para vocês..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
              {idEdicao && (
                <button onClick={handleExcluir} disabled={isProcessando} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              )}
              <button onClick={() => setFormAberto(false)} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}>
                Voltar
              </button>
              <button onClick={handleSalvar} disabled={isProcessando || !nome} style={{ flex: 2, padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (!nome || isProcessando) ? 0.5 : 1 }}>
                {isProcessando ? 'Salvando...' : 'Salvar Dados'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};