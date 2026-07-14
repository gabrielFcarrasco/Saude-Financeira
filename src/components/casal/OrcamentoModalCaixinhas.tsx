import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const OrcamentoModalCaixinhas = ({
  editandoCaixinhas, setEditandoCaixinhas, casalId, caixinhasValidas, limiteMensalLazer, formatMoney
}: any) => {
  const [lista, setLista] = useState<any[]>([]);
  const [isProcessando, setIsProcessando] = useState(false);

  useEffect(() => {
    if (editandoCaixinhas) {
      setLista(JSON.parse(JSON.stringify(caixinhasValidas))); // Clona os dados para editar com segurança
    }
  }, [editandoCaixinhas, caixinhasValidas]);

  if (!editandoCaixinhas) return null;

  const totalAlocado = lista.reduce((acc, c) => acc + Number(c.valor || 0), 0);
  const disponivel = limiteMensalLazer - totalAlocado;

  const handleSalvar = async () => {
    setIsProcessando(true);
    try {
      await updateDoc(doc(db, 'casais', casalId), { caixinhas: lista });
      setEditandoCaixinhas(false);
    } catch (e) {} finally { setIsProcessando(false); }
  };

  const adicionarCaixinha = () => {
    const cores = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#f43f5e', '#14b8a6'];
    const cor = cores[lista.length % cores.length];
    setLista([...lista, { id: Date.now().toString(), nome: '', valor: 0, cor }]);
  };

  const atualizarCaixinha = (id: string, campo: string, valor: any) => {
    setLista(lista.map(c => c.id === id ? { ...c, [campo]: valor } : c));
  };

  const removerCaixinha = (id: string) => {
    if(window.confirm('Apagar esta caixinha? (Os gastos dela não serão apagados)')) {
      setLista(lista.filter(c => c.id !== id));
    }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', width: '100%', maxWidth: '500px', borderRadius: '32px 32px 0 0', padding: '32px 24px 60px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px' }}></div>
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', textAlign: 'center' }}>Nossas Caixinhas 📦</h3>
        
        <div style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '20px', marginBottom: '24px', border: '1px solid var(--border)', textAlign: 'center' }}>
           <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Disponível para distribuir</p>
           <h2 style={{ margin: 0, color: disponivel >= 0 ? '#10b981' : '#ef4444', fontSize: '2rem' }}>{formatMoney(disponivel)}</h2>
           <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: 'var(--text)' }}>De um teto de {formatMoney(limiteMensalLazer)}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
           {lista.map((c: any) => (
             <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--code-bg)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <input type="color" value={c.cor} onChange={e => atualizarCaixinha(c.id, 'cor', e.target.value)} style={{ width: '36px', height: '36px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                   <input type="text" value={c.nome} onChange={e => atualizarCaixinha(c.id, 'nome', e.target.value)} placeholder="Nome (Ex: Jantares)" style={{ border: 'none', background: 'transparent', color: 'var(--text-h)', fontWeight: 'bold', outline: 'none' }} />
                   <input type="number" value={c.valor} onChange={e => atualizarCaixinha(c.id, 'valor', Number(e.target.value))} placeholder="R$ 0,00" style={{ border: 'none', background: 'transparent', color: 'var(--text)', fontSize: '0.9rem', outline: 'none' }} />
                </div>
                <button onClick={() => removerCaixinha(c.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', width: '36px', height: '36px', borderRadius: '10px', fontWeight: 'bold' }}>✕</button>
             </div>
           ))}
           <button onClick={adicionarCaixinha} style={{ padding: '16px', background: 'transparent', border: '2px dashed var(--accent)', color: 'var(--accent)', borderRadius: '16px', fontWeight: 'bold' }}>+ Nova Caixinha</button>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setEditandoCaixinhas(false)} disabled={isProcessando} style={{ flex: 1, padding: '18px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold' }}>Cancelar</button>
          <button onClick={handleSalvar} disabled={isProcessando || disponivel < 0} style={{ flex: 2, padding: '18px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', opacity: disponivel < 0 ? 0.5 : 1 }}>Salvar Distribuição</button>
        </div>
      </div>
    </div>,
    document.body
  );
};