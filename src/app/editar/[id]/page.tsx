"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter, useParams } from 'next/navigation';

export default function EditarHospede() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  
  const [formData, setFormData] = useState({
    nome_hosp_princ: '',
    reserva_ota: '',
    telefone: '',
    data_checkin: '',
    data_checkout: '',
    qtd_adultos: 1,
    qtd_criancas: 0,
    idades_criancas: '',
    tipo_pagamento: 'Pix',
    valor_sinal: '0',
    valor_restante: '0',
    origem: 'Zap',
    status: 'Criado',
    observacao: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fnrhId, setFnrhId] = useState<string | null>(null);

  useEffect(() => {
    async function loadReserva() {
      try {
        const { data, error } = await supabase
          .from('reservas')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          setFnrhId(data.fnrh_id);
          setFormData({
            ...data,
            qtd_adultos: data.qtd_adultos?.toString() || '1',
            qtd_criancas: data.qtd_criancas?.toString() || '0',
            valor_sinal: data.valor_sinal?.toString() || '0',
            valor_restante: data.valor_restante?.toString() || '0',
          });
        }
      } catch (error: any) {
        alert('Erro ao carregar reserva: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadReserva();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      // 1. ATUALIZAR NO SUPABASE
      const { error: supabaseError } = await supabase.from('reservas').update({
        ...formData,
        qtd_adultos: parseInt(formData.qtd_adultos),
        qtd_criancas: parseInt(formData.qtd_criancas),
        valor_sinal: parseFloat(formData.valor_sinal) || 0,
        valor_restante: parseFloat(formData.valor_restante) || 0,
      }).eq('id', id);

      if (supabaseError) throw supabaseError;

      // 2. SINCRONIZAR COM FNRH (Se tivermos o ID da FNRH)
      if (fnrhId) {
        let action = 'update';
        if (formData.status === 'Cancelado') {
          action = 'cancel';
        }

        try {
          await fetch('/api/fnrh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action,
              fnrh_id: fnrhId,
              data: formData
            })
          });
        } catch (fnrhError) {
          console.error('Erro ao sincronizar com FNRH:', fnrhError);
          // Não travamos o app se a FNRH falhar, mas avisamos
          alert('Reserva atualizada localmente, mas houve erro ao sincronizar com a FNRH.');
        }
      }

      alert('Reserva atualizada com sucesso!');
      router.push('/'); 
    } catch (error: any) {
      alert('Erro ao atualizar: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-600 animate-pulse">Carregando...</p></div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-blue-600 text-white p-4 shadow-md flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => router.push('/')} className="text-2xl">←</button>
        <h1 className="text-xl font-bold">Editar Reserva</h1>
      </header>
      <form onSubmit={handleSubmit} className="p-4 max-w-md mx-auto space-y-6">
        {/* SEÇÕES DO FORMULÁRIO - Mantivemos as mesmas do cadastro */}
        <section className="bg-white p-4 rounded-xl shadow-sm space-y-4 border border-gray-200">
          <h2 className="text-blue-600 font-bold border-b pb-2 mb-4 uppercase text-xs">Dados do Hóspede</h2>
          <div>
            <label className="block text-sm text-gray-600">Nome do Hóspede Principal *</label>
            <input required name="nome_hosp_princ" value={formData.nome_hosp_princ} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Telefone com DDD</label>
            <input name="telefone" value={formData.telefone} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Número Reserva OTA</label>
            <input name="reserva_ota" value={formData.reserva_ota} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>
        </section>

        <section className="bg-white p-4 rounded-xl shadow-sm space-y-4 border border-gray-200">
          <h2 className="text-blue-600 font-bold border-b pb-2 mb-4 uppercase text-xs">Datas e Ocupação</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Check-in *</label>
              <input required type="date" name="data_checkin" value={formData.data_checkin} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Check-out *</label>
              <input required type="date" name="data_checkout" value={formData.data_checkout} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Adultos</label>
              <input type="number" name="qtd_adultos" value={formData.qtd_adultos} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Crianças</label>
              <input type="number" name="qtd_criancas" value={formData.qtd_criancas} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
          </div>
        </section>

        <section className="bg-white p-4 rounded-xl shadow-sm space-y-4 border border-gray-200">
          <h2 className="text-blue-600 font-bold border-b pb-2 mb-4 uppercase text-xs">Pagamento e Origem</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Origem</label>
              <select name="origem" value={formData.origem} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white">
                <option value="Booking">Booking</option>
                <option value="Zap">Zap</option>
                <option value="FreeToBooking">FreeToBooking</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white">
                <option value="Criado">Criado</option>
                <option value="Atendido">Atendido</option>
                <option value="Check-in Feito">Check-in Feito</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Sinal (R$)</label>
              <input type="number" step="0.01" name="valor_sinal" value={formData.valor_sinal} onChange={handleChange} className="w-//full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Resta (R$)</label>
              <input type="number" step="0.01" name="valor_restante" value={formData.valor_restante} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
          </div>
        </section>

        <button 
          type="submit" 
          disabled={saving}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all"
        >
          {saving ? 'Sincronizando...' : 'SALVAR ALTERAÇÕES'}
        </button>
      </form>
    </main>
  );
}