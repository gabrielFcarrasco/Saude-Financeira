import { useEffect, useRef, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { auth, db, messaging } from '../../services/firebase';

export const GlobalNotifier = () => {
  const user = auth.currentUser;
  const [casalId, setCasalId] = useState<string | null>(null);
  const qtdNotificacoesGlobal = useRef(-1);

  // 1. Descobre o Casal ID silenciosamente em segundo plano
  useEffect(() => {
    if (!user) return;
    const qCasal = query(collection(db, 'casais'), where('membros', 'array-contains', user.uid));
    const unsub = onSnapshot(qCasal, (snapshot) => {
      if (!snapshot.empty) {
        setCasalId(snapshot.docs[0].id);
      }
    });
    return () => unsub();
  }, [user]);

  // ✨ NOVO: 2. Gera o Token FCM e salva no banco (Para o Background Push funcionar!)
  useEffect(() => {
    if (!casalId || !user) return;

    const registrarToken = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Pega o token de notificação usando a VAPID Key
          const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FCM_VAPID_KEY
          });
          
          if (token) {
            const meuNome = user.displayName?.split(' ')[0] || '';
            if (meuNome) {
               // Salva o token no documento do casal (ex: token_Gabriel)
               await updateDoc(doc(db, 'casais', casalId), {
                 [`token_${meuNome}`]: token
               });
            }
          }
        }
      } catch (error) {
        console.error("Erro ao gerar ou salvar o token FCM:", error);
      }
    };

    registrarToken();
  }, [casalId, user]);

  // 3. O famoso Motor de Áudio (Plim!)
  const tocarSomNotificacao = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log("Áudio bloqueado", e);
    }
  };

  // 4. O Vigilante Global de Notificações (Apenas para Foreground)
  useEffect(() => {
    if (!casalId || !user) return;
    const meuNome = user.displayName?.split(' ')[0] || '';

    const unsubGlobalNotif = onSnapshot(doc(db, 'casais', casalId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.notificacoes) {
          const fetchNotifs = data.notificacoes;
          const ordenadas = fetchNotifs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          if (qtdNotificacoesGlobal.current !== -1 && fetchNotifs.length > qtdNotificacoesGlobal.current) {
            const novaNotificacao = ordenadas[0];

            if (!novaNotificacao.lida && !novaNotificacao.texto.includes(meuNome)) {
              tocarSomNotificacao();
              
              if ('Notification' in window && Notification.permission === 'granted') {
                try {
                  if (navigator.serviceWorker) {
                    navigator.serviceWorker.getRegistration().then((reg) => {
                      if (reg) {
                        reg.showNotification('Hub do Casal 💖', {
                          body: novaNotificacao.texto,
                          icon: '/logo.png',
                          vibrate: [200, 100, 200]
                        });
                      } else {
                        new Notification('Hub do Casal 💖', { body: novaNotificacao.texto });
                      }
                    });
                  } else {
                    new Notification('Hub do Casal 💖', { body: novaNotificacao.texto });
                  }
                } catch(e) {
                  console.error(e);
                }
              }
            }
          }
          qtdNotificacoesGlobal.current = fetchNotifs.length;
        }
      }
    });

    return () => unsubGlobalNotif();
  }, [casalId, user]);

  return null;
};