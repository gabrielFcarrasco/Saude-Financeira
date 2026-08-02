import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'; 
import { db } from '../../services/firebase';

export const OrcamentoModalAgenda = ({
  agendaAberto, setAgendaAberto, casalId,
  agendaP1, agendaP2, currentUserRole,
  parceiro1, parceiro2, corP1, corP2, meuNome, 
  abrirNovoPlanoComData, saidasMesAtual, alfabetoConfig,
  saidasTodas // ✨ Recebendo o banco de dados completo!
}: any) => {

  const [abaAtiva, setAbaAtiva] = useState<'calendario' | 'alfabeto'>('calendario');
  
  const [mesInicioConfig, setMesInicioConfig] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });
  const [quemComecouConfig, setQuemComecouConfig] = useState('p1'); 

  const [dataVisualizada, setDataVisualizada] = useState(new Date());
  const [feriados, setFeriados] = useState<any[]>([]);

  const dataHojeReal = new Date();
  const diaHoje = dataHojeReal.getDate();
  const mesHoje = dataHojeReal.getMonth();
  const anoHoje = dataHojeReal.getFullYear();

  useEffect(() => {
    const buscarFeriados = async () => {
      try {
        const anoBusca = dataVisualizada.getFullYear();
        const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${anoBusca}`);
        if (response.ok) {
          const data = await response.json();
          const feriadoSP = { date: `${anoBusca}-07-09`, name: 'Revolução Constitucionalista (SP)', type: 'state' };
          const todosOsFeriados = [...data, feriadoSP];
          todosOsFeriados.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setFeriados(todosOsFeriados);
        }
      } catch (error) { console.error("Erro ao buscar feriados:", error); }
    };
    if (agendaAberto) buscarFeriados();
  }, [dataVisualizada.getFullYear(), agendaAberto]);

  if (!agendaAberto) return null;

  const ano = dataVisualizada.getFullYear();
  const mes = dataVisualizada.getMonth();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const dias = Array.from({length: diasNoMes}, (_, i) => i + 1);
  const mesNome = dataVisualizada.toLocaleDateString('pt-BR', { month: 'long' });
  const mesNomeFormatado = mesNome.charAt(0).toUpperCase() + mesNome.slice(1);
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); 

  const mesAnterior = () => setDataVisualizada(new Date(ano, mes - 1, 1));
  const proximoMes = () => setDataVisualizada(new Date(ano, mes + 1, 1));
  const voltarParaHoje = () => setDataVisualizada(new Date());

  const minhaAgenda = currentUserRole === 'p1' ? agendaP1 : agendaP2;
  const campoAtualizacao = currentUserRole === 'p1' ? 'agendaP1' : 'agendaP2';

  const toggleDia = async (dia: number) => {
    const diaStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    let novaAgenda = [...minhaAgenda];
    const isAdicionando = !novaAgenda.includes(diaStr);

    if (novaAgenda.includes(diaStr)) novaAgenda = novaAgenda.filter((d: string) => d !== diaStr);
    else novaAgenda.push(diaStr);

    const dataFormatada = diaStr.split('-').reverse().join('/');
    const updateData: any = { [campoAtualizacao]: novaAgenda };
    
    if (isAdicionando) {
      updateData.notificacoes = arrayUnion({
        id: Date.now().toString(),
        texto: `${meuNome} marcou o dia ${dataFormatada} como livre na agenda!`,
        lida: false,
        createdAt: new Date().toISOString()
      });
    }
    await updateDoc(doc(db, 'casais', casalId), updateData);
  };

  const prefixoMesAtual = `${ano}-${String(mes + 1).padStart(2, '0')}`;
  const matchesDoMes = agendaP1
    .filter((d: string) => agendaP2.includes(d) && d.startsWith(prefixoMesAtual))
    .filter((d: string) => !saidasMesAtual?.some((s: any) => s.dataRaw === d))
    .sort();

  const handleAgendarMatch = (dataStr: string) => {
    setAgendaAberto(false);
    abrirNovoPlanoComData(dataStr); 
  };

  const salvarConfigAlfabeto = async () => {
    await updateDoc(doc(db, 'casais', casalId), {
      alfabetoConfig: { mesInicio: mesInicioConfig, quemComecou: quemComecouConfig }
    });
  };

  // ✨ VERIFICADOR INTELIGENTE (Buscando em TODAS as saídas)
  const checarStatusLetra = (letraDoMes: string) => {
    const saidaEncontrada = saidasTodas?.find((saida: any) => {
      if (!saida.titulo) return false;
      const tituloUpper = saida.titulo.toUpperCase();
      const letraUpper = letraDoMes.toUpperCase();
      // Checa se está entre aspas simples ou duplas
      return tituloUpper.includes(`"${letraUpper}"`) || tituloUpper.includes(`'${letraUpper}'`);
    });

    if (!saidaEncontrada) return 'pendente';
    if (saidaEncontrada.status === 'concluido') return 'concluido';
    return 'marcado'; // Existe, mas ainda está como 'planejado'
  };

  const gerarListaAlfabeto = () => {
    if (!alfabetoConfig) return [];
    
    const [anoI, mesI] = alfabetoConfig.mesInicio.split('-').map(Number);
    
    const lista = [];
    // ✨ MOSTRANDO AS 26 LETRAS DO ALFABETO!
    for(let i = 0; i < 26; i++) {
      const dataMes = new Date(anoI, mesI - 1 + i, 1);
      const nomeMesStr = dataMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      const letra = String.fromCharCode(65 + i); 
      
      const ePar = Math.abs(i % 2) === 0;
      const vezDe = ePar ? alfabetoConfig.quemComecou : (alfabetoConfig.quemComecou === 'p1' ? 'p2' : 'p1');
      const nomeResponsavel = vezDe === 'p1' ? parceiro1 : parceiro2;
      const corResponsavel = vezDe === 'p1' ? corP1 : corP2;

      const statusDaLetra = checarStatusLetra(letra);

      lista.push({ mesStr: nomeMesStr, letra, responsavel: nomeResponsavel, cor: corResponsavel, status: statusDaLetra });
    }
    return lista;
  };

  const listaAlfabeto = gerarListaAlfabeto();
  const feriadosDoMes = feriados.filter(f => f.date.startsWith(prefixoMesAtual));

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '500px', padding: '32px 24px 60px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px' }}></div>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--code-bg)', padding: '6px', borderRadius: '16px' }}>
          <button onClick={() => setAbaAtiva('calendario')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '0.9rem', transition: '0.2s', background: abaAtiva === 'calendario' ? 'var(--bg)' : 'transparent', color: abaAtiva === 'calendario' ? 'var(--text-h)' : 'var(--text)', boxShadow: abaAtiva === 'calendario' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Calendário
          </button>
          <button onClick={() => setAbaAtiva('alfabeto')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '0.9rem', transition: '0.2s', background: abaAtiva === 'alfabeto' ? 'var(--bg)' : 'transparent', color: abaAtiva === 'alfabeto' ? 'var(--accent)' : 'var(--text)', boxShadow: abaAtiva === 'alfabeto' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>
            Encontros A a Z
          </button>
        </div>

        {abaAtiva === 'calendario' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'var(--code-bg)', padding: '12px 16px', borderRadius: '20px', border: '1px solid var(--border)' }}>
              <button onClick={mesAnterior} style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '1.2rem', cursor: 'pointer', padding: '4px 12px' }}>{'<'}</button>
              
              <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={voltarParaHoje}>
                <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.1rem' }}>{mesNomeFormatado} {ano}</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 'bold', textTransform: 'uppercase' }}>Voltar para hoje</span>
              </div>
              
              <button onClick={proximoMes} style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '1.2rem', cursor: 'pointer', padding: '4px 12px' }}>{'>'}</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px', fontSize: '0.75rem', fontWeight: 'bold', background: 'var(--code-bg)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <span style={{ color: corP1, display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:10, height:10, borderRadius:'50%', background: corP1}}></div> Livre {parceiro1}</span>
              <span style={{ color: corP2, display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:10, height:10, borderRadius:'50%', background: corP2}}></div> Livre {parceiro2}</span>
              <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:12, height:12, borderRadius:'50%', background: '#f59e0b'}}></div> Deu Match!</span>
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:12, height:12, borderRadius:'50%', background: '#10b981'}}></div> Já Marcado</span>
              <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', gridColumn: 'span 2', justifyContent: 'center' }}><div style={{width:10, height:10, borderRadius:'50%', background: '#ef4444'}}></div> Feriado Nacional</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '16px' }}>
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>{d}</div>
              ))}
              
              {Array.from({ length: primeiroDiaSemana }).map((_, i) => <div key={`empty-${i}`} />)}

              {dias.map(dia => {
                const diaStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                const temPasseio = saidasMesAtual?.some((s: any) => s.dataRaw === diaStr);
                const feriadoAqui = feriados.find(f => f.date === diaStr);

                const isP1 = agendaP1.includes(diaStr);
                const isP2 = agendaP2.includes(diaStr);
                const isMatch = isP1 && isP2;
                const isHoje = dia === diaHoje && mes === mesHoje && ano === anoHoje;
                
                let bgColor = 'var(--code-bg)'; let textColor = 'var(--text)'; let border = '1px solid var(--border)'; let transform = 'none';

                if (temPasseio) { bgColor = '#10b981'; textColor = '#fff'; border = 'none'; transform = 'scale(1.05)'; } 
                else if (isMatch) { bgColor = '#f59e0b'; textColor = '#fff'; border = 'none'; transform = 'scale(1.05)'; } 
                else if (feriadoAqui) { bgColor = 'rgba(239, 68, 68, 0.15)'; textColor = '#ef4444'; border = '1px solid #ef4444'; }
                else if (isP1) { bgColor = `${corP1}20`; textColor = corP1; border = `1px solid ${corP1}`; } 
                else if (isP2) { bgColor = `${corP2}20`; textColor = corP2; border = `1px solid ${corP2}`; }

                if (isHoje && bgColor === 'var(--code-bg)') {
                  border = '2px solid var(--accent)'; textColor = 'var(--text-h)'; bgColor = 'var(--bg)';
                }

                return (
                  <div key={dia} style={{ position: 'relative' }}>
                    <button onClick={() => toggleDia(dia)} style={{ width: '100%', aspectRatio: '1', borderRadius: '10px', background: bgColor, color: textColor, border: border, fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: transform, padding: 0 }}>
                      {dia}
                    </button>
                    {feriadoAqui && (isMatch || temPasseio) && (
                      <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid var(--bg)' }}></div>
                    )}
                    {isHoje && (
                      <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', background: textColor === '#fff' ? '#fff' : 'var(--accent)', borderRadius: '50%' }}></div>
                    )}
                  </div>
                );
              })}
            </div>

            {feriadosDoMes.length > 0 && (
              <div className="animate-fade-in" style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--text)', textTransform: 'uppercase' }}>Feriados neste mês:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {feriadosDoMes.map((f, i) => {
                    const diaFeriado = f.date.split('-')[2];
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '12px' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 'bold', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem' }}>Dia {diaFeriado}</div>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-h)', fontWeight: '500' }}>{f.name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {matchesDoMes.length > 0 ? (
              <div className="animate-fade-in" style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '20px', borderRadius: '20px', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  Dias Livres Juntos ({mesNomeFormatado})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {matchesDoMes.map(m => {
                    const dataFormatada = m.split('-').reverse().join('/');
                    return (
                      <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--code-bg)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-h)' }}>{dataFormatada}</span>
                        <button onClick={() => handleAgendarMatch(m)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                          Marcar
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {abaAtiva === 'alfabeto' && (
          <div className="animate-fade-in">
            {!alfabetoConfig ? (
               <div style={{ background: 'var(--code-bg)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                 <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-h)', textAlign: 'center' }}>Ativar Encontros de A a Z</h3>
                 <p style={{ color: 'var(--text)', marginBottom: '20px', fontSize: '0.85rem', textAlign: 'center', lineHeight: '1.4' }}>
                   A cada mês, um de vocês prepara um passeio criativo começando com uma letra do alfabeto! Quem deu o pontapé inicial?
                 </p>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                   <div>
                     <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold' }}>MÊS E ANO DO INÍCIO (LETRA A)</label>
                     <input type="month" value={mesInicioConfig} onChange={e => setMesInicioConfig(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', marginTop: '6px' }} />
                   </div>
                   <div>
                     <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold' }}>QUEM FOI RESPONSÁVEL?</label>
                     <select value={quemComecouConfig} onChange={e => setQuemComecouConfig(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', marginTop: '6px' }}>
                       <option value="p1">{parceiro1}</option>
                       <option value="p2">{parceiro2}</option>
                     </select>
                   </div>
                 </div>

                 <button onClick={salvarConfigAlfabeto} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem' }}>
                   Salvar Configuração
                 </button>
               </div>
            ) : (
               <div>
                 <p style={{ color: 'var(--text)', marginBottom: '8px', fontSize: '0.9rem', textAlign: 'center', lineHeight: '1.4', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                   A cada mês, a missão é criar um rolê inesquecível.
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v6a5 5 0 0 1-10 0V4z"/><path d="M7 4H5a2 2 0 0 0-2 2v2a6 6 0 0 0 6 6h1"/></svg>
                 </p>
                 
                 <div style={{ background: 'rgba(138, 43, 226, 0.1)', padding: '10px 14px', borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(138, 43, 226, 0.2)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                   <div style={{ color: 'var(--accent)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a5 5 0 0 0-5 5c0 2.5 1.5 4 3 5.5s1 2.5 1 3.5h2c0-1 .5-2 1-3.5s3-3 3-5.5a5 5 0 0 0-5-5z"/></svg>
                   </div>
                   <p style={{ color: 'var(--text-h)', margin: 0, fontSize: '0.75rem', lineHeight: '1.4' }}>
                     <strong>Dica:</strong> Para o app dar o Check, o título do passeio precisa ter a letra entre aspas. Ex: <strong>Encontro "A"</strong>.
                   </p>
                 </div>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                   {listaAlfabeto.map((item, index) => {
                     const isConcluido = item.status === 'concluido';
                     const isMarcado = item.status === 'marcado';

                     return (
                       <div key={index} style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '20px', border: `1px solid ${isConcluido ? '#10b981' : isMarcado ? '#f59e0b' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: isConcluido ? 0.6 : 1, transition: '0.2s' }}>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {isConcluido ? (
                              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              </div>
                            ) : (
                              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `${item.cor}20`, color: item.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '900' }}>
                                {item.letra}
                              </div>
                            )}

                            <div>
                              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                {item.mesStr}
                              </span>
                              <span style={{ display: 'block', fontSize: '1.05rem', fontWeight: 'bold', color: isConcluido ? '#10b981' : 'var(--text-h)', textDecoration: isConcluido ? 'line-through' : 'none' }}>
                                Vez de {item.responsavel}
                              </span>
                            </div>
                          </div>

                          {isConcluido ? (
                            <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.85rem', padding: '10px 12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
                              Cumprida!
                            </span>
                          ) : isMarcado ? (
                            <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.85rem', padding: '10px 12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                              Agendado
                            </span>
                          ) : (
                            <button 
                              onClick={() => {
                                setAgendaAberto(false);
                                abrirNovoPlanoComData('', `Encontro "${item.letra}"`);
                              }} 
                              style={{ background: item.cor, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                              Agendar
                            </button>
                          )}
                       </div>
                     );
                   })}
                 </div>
               </div>
            )}
          </div>
        )}

        <button onClick={() => setAgendaAberto(false)} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', fontSize: '1rem' }}>
          Fechar Agenda
        </button>
      </div>
    </div>,
    document.body
  );
};