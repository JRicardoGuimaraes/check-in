"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

interface Reserva {
  id: string;
  data_checkin: string;
  data_checkout: string;
  qtd_adultos: number;
  qtd_criancas: number;
  idades_criancas: string;
  tipo_pagamento: string;
  valor_sinal: number | string;    // <--- ADICIONE ESTA LINHA
  valor_restante: number | string; // <--- ADICIONE ESTA LINHA
  nome_hosp_princ: string;
  reserva_ota: string;
  telefone: string;
  fnrh_link: string;
  acomodacao: string;
  status: string;                  // Garanta que status também esteja aqui
  origem: string;
}

interface Stats {
  ocupacaoHoje: number;
  totalSinais: number;
  totalAReceber: number;
  totalBruto: number;
}

export default function Home() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    ocupacaoHoje: 0,
    totalSinais: 0,
    totalAReceber: 0,
    totalBruto: 0
  });
  const router = useRouter();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPeriodoModal, setShowPeriodoModal] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  useEffect(() => {
    fetchReservas();
  }, [filtroStatus, filtroDataInicio, filtroDataFim]);

  // Função para calcular estatísticas do Dashboard
    function calculateStats(resList: Reserva[]) {
    const hoje = new Date().toISOString().split('T')[0];
    let ocupacao = 0;
    let sinais = 0;
    let restante = 0;

    resList.forEach(res => {
      // Não conta reservas canceladas no financeiro
      if (res.status === 'Cancelado') return;

      // Ocupação: Check-in já passou (ou é hoje) e Check-out ainda não passou (ou é hoje)
      if (res.data_checkin <= hoje && res.data_checkout >= hoje) {
        ocupacao++;
      }

      // CORREÇÃO AQUI: Convertendo string para número antes de somar
      sinais += parseFloat(res.valor_sinal?.toString() || '0');
      restante += parseFloat(res.valor_restante?.toString() || '0');
    });

    setStats({
      ocupacaoHoje: ocupacao,
      totalSinais: sinais,
      totalAReceber: restante,
      totalBruto: sinais + restante
    });
  }

  async function fetchReservas() {
    setLoading(true);
    try {
      let query = supabase.from('reservas').select('*');

      if (filtroStatus) query = query.eq('status', filtroStatus);
      if (filtroDataInicio) query = query.gte('data_checkin', filtroDataInicio);
      if (filtroDataFim) query = query.lte('data_checkin', filtroDataFim);

      const { data, error } = await query.order('data_checkin', { ascending: true });

      if (error) {
        console.error('Erro ao buscar reservas:', error);
      } else {
        const dataTyped = data as any || [];
        setReservas(dataTyped);
        calculateStats(dataTyped); // Atualiza o dashboard sempre que a lista muda
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteReserva(id: string) {
    if (confirm('Tem certeza que deseja excluir esta reserva? Esta ação não pode ser desfeita.')) {
      try {
        const { error } = await supabase.from('reservas').delete().eq('id', id);
        if (error) throw error;
        const filtered = reservas.filter(res => res.id !== id);
        setReservas(filtered);
        calculateStats(filtered);
        alert('Reserva excluída com sucesso!');
      } catch (error: any) {
        alert('Erro ao excluir: ' + error.message);
      }
    }
  }

  const limparFiltros = () => {
    setFiltroStatus('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <main className="min-h-screen bg-gray-100 pb-20">
      <header className="bg-blue-600 text-white p-6 shadow-md sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-center">Controle de Hóspedes</h1>
      </header>

      <div className="p-4 max-w-md mx-auto">
        
        {/* --- DASHBOARD SECTION --- */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border-b-4 border-blue-500">
            <p className="text-xs text-gray-500 font-medium uppercase">🏠 Ocupação Hoje</p>
            <p className="text-2xl font-black text-gray-800">{stats.ocupacaoHoje}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border-b-4 border-green-500">
            <p className="text-xs text-gray-500 font-medium uppercase">💵 Em Caixa (Sinais)</p>
            <p className="text-xl font-black text-green-600">{formatCurrency(stats.totalSinais)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border-b-4 border-orange-500 col-span-2">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">💰 Total a Receber</p>
                <p className="text-2xl font-black text-orange-600">{formatCurrency(stats.totalAReceber)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase">Valor Bruto Total</p>
                <p className="text-sm font-bold text-gray-600">{formatCurrency(stats.totalBruto)}</p>
              </div>
            </div>
          </div>
        </div>
        {/* --- END DASHBOARD --- */}

        <div className="mb-6 flex gap-2">
          <button 
            onClick={() => setShowPeriodoModal(true)}
            className={`border px-3 py-2 rounded-lg text-sm flex-1 shadow-sm transition-colors ${filtroDataInicio || filtroDataFim ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-gray-300'}`}
          >
            📅 Filtrar Período
          </button>
          <button 
            onClick={() => setShowStatusModal(true)}
            className={`border px-3 py-2 rounded-lg text-sm flex-1 shadow-sm transition-colors ${filtroStatus ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-gray-300'}`}
          >
            🔍 Filtrar Status
          </button>
        </div>

        {(filtroStatus || filtroDataInicio || filtroDataFim) && (
          <div className="mb-4 flex justify-between items-center bg-blue-50 p-2 rounded-lg border border-blue-200 text-xs text-blue-700">
            <span className="font-medium">Filtros ativos</span>
            <button onClick={limparFiltros} className="underline font-bold hover:text-blue-900">Limpar tudo</button>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-500">Carregando reservas...</p>
        ) : reservas.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Nenhuma reserva encontrada.</p>
            {(filtroStatus || filtroDataInicio || filtroDataFim) && (
              <button onClick={limparFiltros} className="text-blue-600 text-sm underline mt-2">Limpar filtros para ver todos</button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {reservas.map((reserva) => (
              <div key={reserva.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold uppercase text-gray-400">
                    {reserva.origem} {reserva.reserva_ota ? `| OTA: ${reserva.reserva_ota}` : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      reserva.status === 'Check-in Feito' ? 'bg-green-100 text-green-700' : 
                      reserva.status === 'Cancelado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {reserva.status}
                    </span>
                    {/* BOTÃO COPIAR QRCODE */}
                    {reserva.fnrh_link && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(reserva.fnrh_link);
                          alert('Link do QRCode copiado para a área de transferência!');
                        }}
                        className="bg-green-500 text-white p-2 rounded text-xs font-bold px-3 hover:bg-green-600 transition-colors"
                        title="Copiar link do QRCode"
                      >
                        🔗 QRCode
                      </button>
                    )}
                    <button 
                      onClick={() => router.push(`/editar/${reserva.id}`)}
                      className="bg-yellow-500 text-white p-2 rounded text-xs font-bold px-3"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => deleteReserva(reserva.id)} 
                      className="text-red-400 hover:text-red-600 p-1 transition-colors"
                      title="Excluir Reserva"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div 
                    className="text-left cursor-pointer hover:opacity-80 transition-all" 
                    onClick={() => router.push(`/visualizar/${reserva.id}`)}
                  >
                    <p className="text-gray-900 font-bold text-lg">
                      {reserva.nome_hosp_princ || 'Hóspede não informado'}
                    </p>
                    <p className="text-blue-600 text-sm font-medium">🏠 {reserva.acomodacao || 'Sem acomodação'}</p>
                    <p className="text-gray-600 text-sm">📞 {reserva.telefone || 'Sem telefone'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">A pagar</p>
                    <p className="text-blue-600 font-bold">
                      {formatCurrency(reserva.valor_restante || 0)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE STATUS */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Filtrar por Status</h3>
            <div className="space-y-2">
              {['Criado', 'Atendido', 'Check-in Feito', 'Cancelado'].map((status) => (
                <button 
                  key={status}
                  onClick={() => {
                    setFiltroStatus(status);
                    setShowStatusModal(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all ${filtroStatus === status ? 'bg-blue-600 text-white font-bold' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  {status}
                </button>
              ))}
              <button 
                onClick={() => {
                  setFiltroStatus('');
                  setShowStatusModal(false);
                }}
                className="w-full p-3 text-center text-sm text-gray-500 underline"
              >
                Limpar filtro de status
              </button>
            </div>
            <button 
              onClick={() => setShowStatusModal(false)} 
              className="mt-6 w-full py-2 bg-gray-200 rounded-lg font-medium text-gray-600"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE PERÍODO */}
      {showPeriodoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Filtrar por Período</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data Início (Check-in)</label>
                <input 
                  type="date" 
                  value={filtroDataInicio} 
                  onChange={(e) => setFiltroDataInicio(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data Fim (Check-in)</label>
                <input 
                  type="date" 
                  value={filtroDataFim} 
                  onChange={(e) => setFiltroDataFim(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-gray-50"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => {
                  setFiltroDataInicio('');
                  setFiltroDataFim('');
                }}
                className="flex-1 py-2 text-sm text-gray-500 underline"
              >
                Limpar
              </button>
              <button 
                onClick={() => setShowPeriodoModal(false)}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      <button 
        className="fixed bottom-6 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg text-3xl font-bold hover:bg-blue-700 transition-colors"
        onClick={() => router.push('/novo')}
      >
        +
      </button>
    </main>
  );
}