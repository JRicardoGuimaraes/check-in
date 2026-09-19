"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter, useParams } from 'next/navigation';

export default function VisualizarReserva() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  
  const [reserva, setReserva] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  
  useEffect(() => {
    async function loadReserva() {
      try {
        const { data, error } = await supabase
          .from('reservas')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setReserva(data);
      } catch (error: any) {
        alert('Erro ao carregar reserva: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadReserva();
  }, [id]);

  async function handleSyncFNRH() {
    if (!reserva) return;
    setSyncing(true);
    try {
      const response = await fetch('/api/fnrh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', data: reserva })
      });
      const result = await response.json();
      if (response.ok && result.reserva) {
        const { reserva_id, link_precheckin } = result.reserva;
        const { error: updateError } = await supabase
          .from('reservas')
          .update({ fnrh_id: reserva_id, fnrh_link: link_precheckin })
          .eq('id', id);
        if (updateError) throw updateError;
        alert('Sincronizado com sucesso!');
        const { data } = await supabase.from('reservas').select('*').eq('id', id).single();
        setReserva(data);
      } else {
        throw new Error(result.error || 'Falha na sincronização com FNRH');
      }
    } catch (error: any) {
      alert('Erro ao sincronizar: ' + error.message);
    } finally {
      setSyncing(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-600 animate-pulse">Carregando...</p></div>;
  if (!reserva) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p>Reserva não encontrada.</p></div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-blue-600 text-white p-4 shadow-md flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => router.push('/')} className="text-2xl">←</button>
        <h1 className="text-xl font-bold">Detalhes da Reserva</h1>
      </header>

      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Status de Sincronização */}
        {!reserva.fnrh_id && (
          <div className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded-lg flex justify-between items-center shadow-sm">
            <div>
              <p className="text-amber-800 font-bold text-sm">⚠️ Não sincronizado</p>
              <p className="text-amber-700 text-xs">Esta reserva não possui ID na FNRH.</p>
            </div>
            <button onClick={handleSyncFNRH} disabled={syncing} className="bg-amber-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-amber-700 disabled:bg-gray-400 transition-all">
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          </div>
        )}

        {/* QR Code / Link FNRH */}
        {reserva.fnrh_link && (
          <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded-lg shadow-sm text-center">
            <p className="text-green-800 font-bold text-sm mb-2">✅ Sincronizado com FNRH</p>
            <a href={reserva.fnrh_link} target="_blank" className="inline-block bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-green-700 transition-all">
              Abrir QR Code / Pre-Checkin
            </a>
          </div>
        )}

        {/* Seção 1: Dados do Hóspede */}
        <section className="bg-white p-4 rounded-xl shadow-sm space-y-4 border border-gray-200">
          <h2 className="text-blue-600 font-bold border-b pb-2 mb-4 uppercase text-xs">Dados do Hóspede</h2>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs text-gray-500 uppercase">Nome Principal</label>
              <p className="text-gray-900 font-medium">{reserva.nome_hosp_princ}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase">Telefone</label>
              <p className="text-gray-900 font-medium">{reserva.telefone}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase">Acomodação</label>
              <p className="text-gray-900 font-medium">🏠 {reserva.acomodacao}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase">Reserva OTA</label>
              <p className="text-gray-900 font-medium">{reserva.reserva_ota || 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* Seção 2: Datas e Ocupação (ADICIONADO AQUI) */}
        <section className="bg-white p-4 rounded-xl shadow-sm space-y-4 border border-gray-200">
          <h2 className="text-blue-600 font-bold border-b pb-2 mb-4 uppercase text-xs">Datas e Ocupação</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase">Check-in</label>
              <p className="text-gray-900 font-medium">{reserva.data_checkin}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase">Check-out</label>
              <p className="text-gray-900 font-medium">{reserva.data_checkout}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase">Adultos</label>
              <p className="text-gray-900 font-medium">{reserva.qtd_adultos}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase">Crianças</label>
              <p className="text-gray-900 font-medium">{reserva.qtd_criancas}</p>
            </div>
          </div>
          <div className="mt-2">
            <label className="block text-xs text-gray-500 uppercase">Idades das Crianças</label>
            <p className="text-gray-900 font-medium">{reserva.idades_criancas || 'Nenhuma'}</p>
          </div>
        </section>

        {/* Seção 3: Financeiro e Origem */}
        <section className="bg-white p-4 rounded-xl shadow-sm space-y-4 border border-gray-200">
          <h2 className="text-blue-600 font-bold border-b pb-2 mb-4 uppercase text-xs">Financeiro e Origem</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase">Origem</label>
              <p className="text-gray-900 font-medium">{reserva.origem}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase">Status</label>
              <p className="text-gray-900 font-medium">{reserva.status}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase">Sinal</label>
              <p className="text-gray-900 font-medium">R$ {reserva.valor_sinal}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase">Resta Pagar</label>
              <p className="text-gray-900 font-medium">R$ {reserva.valor_restante}</p>
            </div>
          </div>
        </section>

        {/* Seção 4: Observações */}
        <section className="bg-white p-4 rounded-xl shadow-sm space-y-4 border border-gray-200">
          <h2 className="text-blue-600 font-bold border-b pb-2 mb-4 uppercase text-xs">Observações</h2>
          <p className="text-gray-700 text-sm italic">{reserva.observacao || 'Nenhuma observação.'}</p>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => router.push(`/editar/${id}`)}
            className="bg-gray-200 text-gray-800 font-bold py-3 rounded-xl hover:bg-gray-300 transition-all"
          >
            Editar Reserva
          </button>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all"
          >
            Voltar Home
          </button>
        </div>
      </div>
    </main>
  );
}