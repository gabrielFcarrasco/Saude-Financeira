import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc } from 'firebase/firestore'; 
import { db } from '../../services/firebase';

export const OrcamentoModalEdicaoCategorias = ({
  modalCategorias, setModalCategorias, categoriasUnicas, casalId
}: any) => {

  const [itensEdicao, setItensEdicao] = useState<any[]>([]);
  const [isProcessando, setIsProcessando] = useState(false);

  useEffect(() => {
    if (modalCategorias && modalCategorias.itens) {
      setItensEdicao(JSON.parse(JSON.stringify(modalCategorias.itens)));
    }
  }, [modalCategorias]);

  if (!modalCategorias) return null;

  const atualizarCategoria = (idItem: string, novaCategoria: string) => {
    setItensEdicao(itensEdicao.map(item => 
      item.id === idItem ? { ...item, categoria: novaCategoria } : item
    ));
  };

  const handleSalvarCategorias = async () => {
    if (!casalId) return;
    setIsProcessando(true);
    try {
      await updateDoc(doc(db, 'casais', casalId, 'saidas', modalCategorias.id), {
        itens: itensEdicao
      });
      setModalCategorias(null);
    } catch (error) {
      console.error("Erro ao salvar categorias", error);
    } finally {
      setIsProcessando(false);
    }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '500px', padding: '32px 24px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px' }}></div>
        <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)', fontSize: '1.3rem' }}>Ajustar Categorias</h3>
        <p style={{ margin: '0 0 24px 0', color: 'var(--text)', fontSize: '0.9rem' }}>Modifique as categorias dos itens do passeio <strong>{modalCategorias.titulo}</strong>.</p>

        <datalist id="lista-categorias-edicao">
          {categoriasUnicas?.map((cat: string, index: number) => (
            <option key={index} value={cat} />
          ))}
        </datalist>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {itensEdicao.map((item, index) => (
            <div key={item.id} style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-h)' }}>{item.nome || `Item ${index + 1}`}</span>
                <span style={{ fontWeight: 'bold', color: 'var(--text-h)' }}>R$ {Number(item.valor || 0).toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Categoria:</span>
                <input 
                  type="text" 
                  list="lista-categorias-edicao"
                  value={item.categoria || ''} 
                  onChange={e => atualizarCategoria(item.id, e.target.value)} 
                  placeholder="Ex: Comida"
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.9rem' }} 
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setModalCategorias(null)} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleSalvarCategorias} disabled={isProcessando} style={{ flex: 2, padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: isProcessando ? 0.5 : 1 }}>
            {isProcessando ? 'Salvando...' : 'Salvar Categorias'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};