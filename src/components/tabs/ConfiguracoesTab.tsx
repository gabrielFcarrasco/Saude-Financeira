import React, { useState, useRef } from 'react';
import { auth } from '../../services/firebase';
import { updateProfile } from 'firebase/auth';

export const ConfiguracoesTab: React.FC = () => {
  const user = auth.currentUser;
  
  const [nome, setNome] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [fotoDisplay, setFotoDisplay] = useState(user?.photoURL || null);
  const [isUploadingImg, setIsUploadingImg] = useState(false);

  // Estados de Toggles
  const [darkMode, setDarkMode] = useState(true);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true);
  const [lembreteVencimento, setLembreteVencimento] = useState(true);
  const [moedaPadrao, setMoedaPadrao] = useState('BRL');

  const inicial = nome.charAt(0).toUpperCase() || 'U';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName: nome });
      alert('Perfil atualizado!');
    } catch (error) {
      alert('Erro ao atualizar.');
    }
    setIsSaving(false);
  };

  const handleTrocarFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    setIsUploadingImg(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.secure_url) {
        await updateProfile(user, { photoURL: data.secure_url });
        setFotoDisplay(data.secure_url);
      }
    } catch (error) {
      alert('Erro no upload.');
    } finally {
      setIsUploadingImg(false);
    }
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <div 
      onClick={onChange}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer',
        background: checked ? 'var(--accent)' : 'var(--code-bg)',
        border: checked ? 'none' : '1px solid var(--border)',
        position: 'relative', transition: '0.3s ease', flexShrink: 0
      }}
    >
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%', background: 'white',
        position: 'absolute', top: '3px', 
        left: checked ? '23px' : '3px', transition: 'all 0.3s ease',
      }} />
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px', 
      padding: '0 10px 60px 10px' // Padding lateral para não colar nos cantos do telemóvel
    }}>
      
      <div className="page-header" style={{ marginBottom: '20px', padding: '0 10px' }}>
        <h1 style={{ fontSize: '1.8rem', margin: '0 0 8px 0' }}>Configurações</h1>
        <p style={{ color: 'var(--text)', margin: 0, fontSize: '1rem', lineHeight: '1.4' }}>Personalize sua experiência e gerencie seus dados.</p>
      </div>

      {/* CARD IDENTIDADE */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Identidade</h3>
        
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', // Permite quebrar linha em telemóveis pequenos
          alignItems: 'center', 
          gap: '20px', 
          marginBottom: '32px' 
        }}>
          
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
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-h)', fontSize: '1.2rem' }}>{user?.displayName || 'Usuário'}</p>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text)', fontSize: '0.85rem', wordBreak: 'break-all' }}>{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSalvarPerfil} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '100%' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text)', fontSize: '0.9rem', fontWeight: 600 }}>Nome de Exibição</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" className="primary" disabled={isSaving} style={{ width: '100%', padding: '14px', borderRadius: '8px', fontWeight: 600 }}>
            {isSaving ? 'A guardar...' : 'Atualizar Nome'}
          </button>
        </form>
      </div>

      {/* GRID DE SISTEMA E REGIONAL */}
      <div className="form-grid-2">
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Sistema
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Modo Escuro', state: darkMode, setState: setDarkMode },
              { label: 'Análise por e-mail', state: notificacoesAtivas, setState: setNotificacoesAtivas },
              { label: 'Alertas de Contas', state: lembreteVencimento, setState: setLembreteVencimento }
            ].map((item, idx) => (
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

      {/* GESTÃO DE DADOS */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Dados</h3>
          <button style={{ background: 'var(--social-bg)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-h)', fontWeight: 600, cursor: 'pointer' }}>Exportar CSV</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ border: '1px dashed var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'center', background: 'var(--social-bg)' }}>
            <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '4px' }}>Notion (CSV)</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: '12px' }}>Migre o seu histórico completo.</p>
            <label htmlFor="notion-upload" className="primary" style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', display: 'inline-block' }}>Upload CSV</label>
            <input type="file" accept=".csv" style={{ display: 'none' }} id="notion-upload" />
          </div>

          <div style={{ border: '1px dashed var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'center', background: 'var(--social-bg)' }}>
            <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '4px' }}>Banco (PDF)</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: '12px' }}>Análise automática de extrato.</p>
            <label htmlFor="pdf-upload" style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', display: 'inline-block', background: '#10b981', color: 'white' }}>Analisar PDF</label>
            <input type="file" accept=".pdf" style={{ display: 'none' }} id="pdf-upload" />
          </div>
        </div>
      </div>

      {/* ZONA DE PERIGO */}
      <div className="card" style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.02)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#ef4444', fontSize: '1rem' }}>Zona Crítica</h3>
        <p style={{ color: 'var(--text)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.5' }}>Ações permanentes. Uma vez executadas, os seus dados não podem ser recuperados.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button className="secondary" style={{ width: '100%', borderColor: '#ef4444', color: '#ef4444' }}>Resetar Histórico</button>
          <button style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 600 }}>Excluir Conta</button>
        </div>
      </div>

    </div>
  );
};