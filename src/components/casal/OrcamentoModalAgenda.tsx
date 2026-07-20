import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'; 
import { db } from '../../services/firebase';

export const OrcamentoModalAgenda = ({
  agendaAberto, setAgendaAberto, casalId,
  agendaP1, agendaP2, currentUserRole,
  parceiro1, parceiro2, corP1, corP2, meuNome, 
  abrirNovoPlanoComData, saidasMesAtual, alfabetoConfig 
}: any) => {

  const [abaAtiva, setAbaAtiva] = useState<'calendario' | 'alfabeto'>('calendario');
  const [mesInicioConfig, setMesInicioConfig] = useState('2026-07');
  const [quemComecouConfig, setQuemComecouConfig] = useState('p2'); 

  const [dataVisualizada, setDataVisualizada] = useState(new Date());
  const [feriados, setFeriados] = useState<any[]>([]);

  useEffect(() => {
    const buscarFeriados = async () => {
      try {
        const anoBusca = dataVisualizada.getFullYear();
                const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${anoBusca}`);
        if (response.ok) {
          const data = await response.json();
          
          // 1. Criamos o feriado estadual usando a variável anoBusca
          const feriadoSP = {
            date: `${anoBusca}-07-09`,
            name: 'Revolução Constitucionalista (SP)',
            type: 'state'
          };

          // 2. Juntamos a lista nacional com o feriado de SP
          const todosOsFeriados = [...data, feriadoSP];

          // 3. Ordenamos a lista pela data para o 9 de Julho ficar na posição certa
          todosOsFeriados.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          // 4. Salvamos a lista completa no estado
          setFeriados(todosOsFeriados);
        }
      } catch (error) {
        console.error("Erro ao buscar feriados:", error);
      }
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
  
  // ✨ MÁGICA AQUI: Só mostra na lista de "Marcar" os dias que AINDA NÃO TÊM passeio!
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

  const gerarListaAlfabeto = () => {
    if (!alfabetoConfig) return [];
    const hojeReal = new Date();
    const [anoI, mesI] = alfabetoConfig.mesInicio.split('-').map(Number);
    const diffTotal = (hojeReal.getFullYear() - anoI) * 12 + (hojeReal.getMonth() - (mesI - 1));

    const lista = [];
    for(let i = 0; i < 4; i++) {
      const diffRelativo = diffTotal + i;
      const dataMes = new Date(anoI, mesI - 1 + diffRelativo, 1);
      const nomeMesStr = dataMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      const letraIndex = diffRelativo % 26; 
      const letra = String.fromCharCode(65 + (letraIndex >= 0 ? letraIndex : 26 + letraIndex)); 
      
      const ePar = Math.abs(diffRelativo % 2) === 0;
      const vezDe = ePar ? alfabetoConfig.quemComecou : (alfabetoConfig.quemComecou === 'p1' ? 'p2' : 'p1');
      const nomeResponsavel = vezDe === 'p1' ? parceiro1 : parceiro2;
      const corResponsavel = vezDe === 'p1' ? corP1 : corP2;

      lista.push({ mesStr: nomeMesStr, letra, responsavel: nomeResponsavel, cor: corResponsavel });
    }
    return lista;
  };

  const listaAlfabeto = gerarListaAlfabeto();
  const feriadosDoMes = feriados.filter(f => f.date.startsWith(prefixoMesAtual));

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '500px', padding: '32px 24px 60px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px' }}></div>
        
        {/* ABAS DE NAVEGAÇÃO */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--code-bg)', padding: '6px', borderRadius: '16px' }}>
          <button onClick={() => setAbaAtiva('calendario')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '0.9rem', transition: '0.2s', background: abaAtiva === 'calendario' ? 'var(--bg)' : 'transparent', color: abaAtiva === 'calendario' ? 'var(--text-h)' : 'var(--text)', boxShadow: abaAtiva === 'calendario' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
            📅 Calendário
          </button>
          <button onClick={() => setAbaAtiva('alfabeto')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '0.9rem', transition: '0.2s', background: abaAtiva === 'alfabeto' ? 'var(--bg)' : 'transparent', color: abaAtiva === 'alfabeto' ? 'var(--accent)' : 'var(--text)', boxShadow: abaAtiva === 'alfabeto' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
            🔤 Encontros A a Z
          </button>
        </div>

        {/* ABA: CALENDÁRIO COM FERIADOS */}
        {abaAtiva === 'calendario' && (
          <div className="animate-fade-in">
            
            {/* CONTROLES DO MÊS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'var(--code-bg)', padding: '12px 16px', borderRadius: '20px', border: '1px solid var(--border)' }}>
              <button onClick={mesAnterior} style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '1.2rem', cursor: 'pointer', padding: '4px 12px' }}>{'<'}</button>
              
              <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={voltarParaHoje}>
                <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.1rem' }}>{mesNomeFormatado} {ano}</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Voltar para hoje</span>
              </div>
              
              <button onClick={proximoMes} style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '1.2rem', cursor: 'pointer', padding: '4px 12px' }}>{'>'}</button>
            </div>

            {/* ✨ LEGENDA ATUALIZADA E REORGANIZADA */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px', fontSize: '0.75rem', fontWeight: 'bold', background: 'var(--code-bg)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <span style={{ color: corP1, display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:10, height:10, borderRadius:'50%', background: corP1}}></div> Livre {parceiro1}</span>
              <span style={{ color: corP2, display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:10, height:10, borderRadius:'50%', background: corP2}}></div> Livre {parceiro2}</span>
              
              <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:12, height:12, borderRadius:'50%', background: '#f59e0b'}}></div> Deu Match!</span>
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:12, height:12, borderRadius:'50%', background: '#10b981'}}></div> Já Marcado</span>
              
              <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', gridColumn: 'span 2', justifyContent: 'center' }}><div style={{width:10, height:10, borderRadius:'50%', background: '#ef4444'}}></div> Feriado Nacional</span>
            </div>

            {/* GRID DO CALENDÁRIO */}
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
                
                let bgColor = 'var(--code-bg)'; let textColor = 'var(--text)'; let border = '1px solid var(--border)'; let transform = 'none';

                // ✨ HIERARQUIA VISUAL (Passeio > Match > Feriado > Livre)
                if (temPasseio) { 
                  bgColor = '#10b981'; // Verde Sólido 
                  textColor = '#fff'; 
                  border = 'none'; 
                  transform = 'scale(1.05)'; 
                } 
                else if (isMatch) { 
                  bgColor = '#f59e0b'; // Laranja Sólido
                  textColor = '#fff'; 
                  border = 'none'; 
                  transform = 'scale(1.05)'; 
                } 
                else if (feriadoAqui) {
                  bgColor = 'rgba(239, 68, 68, 0.15)'; 
                  textColor = '#ef4444';
                  border = '1px solid #ef4444';
                }
                else if (isP1) { 
                  bgColor = `${corP1}20`; textColor = corP1; border = `1px solid ${corP1}`; 
                } 
                else if (isP2) { 
                  bgColor = `${corP2}20`; textColor = corP2; border = `1px solid ${corP2}`; 
                }

                return (
                  <div key={dia} style={{ position: 'relative' }}>
                    <button 
                      onClick={() => toggleDia(dia)} 
                      style={{ width: '100%', aspectRatio: '1', borderRadius: '10px', background: bgColor, color: textColor, border: border, fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: transform, padding: 0 }}
                    >
                      {dia}
                    </button>
                    {/* Bolinha vermelha de feriado se tiver passeio ou match no mesmo dia */}
                    {feriadoAqui && (isMatch || temPasseio) && (
                      <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid var(--bg)' }}></div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* LISTA DE FERIADOS DO MÊS */}
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

            {/* ✨ LISTA DE MATCHES (Apenas os que não foram agendados) */}
            {matchesDoMes.length > 0 ? (
              <div className="animate-fade-in" style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '20px', borderRadius: '20px', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px' }}>✨ Dias Livres Juntos ({mesNomeFormatado})</h4>
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

        {/* ABA: ENCONTROS DE A a Z */}
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
                 <p style={{ color: 'var(--text)', marginBottom: '24px', fontSize: '0.9rem', textAlign: 'center', lineHeight: '1.4' }}>
                   A cada mês, a missão é criar um rolê inesquecível com a letra da vez. O de quem será melhor? 🏆
                 </p>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                   {listaAlfabeto.map((item, index) => (
                     <div key={index} style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '20px', border: `1px solid ${index === 0 ? item.cor : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: index === 0 ? `0 4px 12px ${item.cor}20` : 'none' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `${item.cor}20`, color: item.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '900' }}>
                            {item.letra}
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase', marginBottom: '4px' }}>
                              {item.mesStr}
                            </span>
                            <span style={{ display: 'block', fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-h)' }}>
                              Vez de {item.responsavel}
                            </span>
                          </div>
                        </div>

                        {index === 0 && (
                          <button 
                            onClick={() => {
                              setAgendaAberto(false);
                              abrirNovoPlanoComData('', `Encontro Letra ${item.letra}`);
                            }} 
                            style={{ background: item.cor, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                          >
                            Agendar
                          </button>
                        )}
                     </div>
                   ))}
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