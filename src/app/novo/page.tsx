"use client";
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function NovoHospede() {
  const router = useRouter();
  
  // Estado único para o formulário para facilitar a gestão
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

  const [loading, setLoading] = useState(false);

  // Função para atualizar os campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('reservas').insert([
        {
          ...formData,
          qtd_adultos: parseInt(formData.qtd_adultos),
          qtd_criancas: parseInt(formData.qtd_criancas),
          valor_sinal: parseFloat(formData.valor_sinal) || 0,
          valor_restante: parseFloat(formData.valor_restante) || 0,
        },
      ]);

      if (error) throw error;

      alert('Reserva cadastrada com sucesso!');
      router.push('/'); // Volta para a tela principal
    } catch (error: any) {
      alert('Erro ao cadastrar: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => router.push('/')} className="text-2xl">←</button>
        <h1 className="text-xl font-bold">Novo Check-in</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-4 max-w-md mx-auto space-y-6">
        
        {/* SEÇÃO 1: Dados do Hóspede */}
        <section className="bg-white p-4 rounded-xl shadow-sm space-y-4 border border-gray-200">
          <h2 className="text-blue-600 font-bold border-b pb-2 mb-4 uppercase text-xs">Dados do Hóspede</h2>
          
          <div>
            <label className="block text-sm text-gray-600">Nome do Hóspede Principal *</label>
            <input required name="nome_hosp_princ" value={formData.nome_hosp_princ} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="Ex: João Silva" />
          </div>

          <div>
            <label className="block text-sm text-gray-600">Telefone com DDD</label>
            <input name="telefone" value={formData.telefone} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="(00) 00000-0000" />
          </div>

          <div>
            <label className="block text-sm text-gray-600">Número Reserva OTA</label>
            <input name="reserva_ota" value={formData.reserva_ota} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="Código da reserva" />
          </div>
        </section>

        {/* SEÇÃO 2: Datas e Ocupação */}
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

          <div>
            <label className="block text-sm text-gray-600">Idades das crianças</label>
            <input name="idades_criancas" value={formData.idades_criancas} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="Ex: 3 e 5 anos" />
          </div>
        </section>

        {/* SEÇÃO 3: Pagamento e Origem */}
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

          <div>
            <label className="block text-sm text-gray-600">Tipo de Pagamento</label>
            <select name="tipo_pagamento" value={formData.tipo_pagamento} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white">
              <option value="Pix">Pix</option>
              <option value="Via Booking">Via Booking</option>
              <option value="PagSeguro(Crédito)">PagSeguro(Crédito)</option>
              <option value="PagSeguro(Débito)">PagSeguro(Débito)</option>
              <option value="PagSeguro(Pix)">PagSeguro(Pix)</option>
              <option value="Dinheiro">Dinheiro</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="block text-sm text-gray-600">Valor Sinal (R$)</label>
              <input 
                type="number" 
                step="0.01" // <--- Isso permite centavos (ex: 100.50)
                name="valor_sinal" 
                value={formData.valor_sinal} 
                onChange={handleChange} 
                className="w-full p-2 border rounded-lg" 
                placeholder="0,00"
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-sm text-gray-600">Resta Pagar (R$)</label>
              <input 
                type="number" 
                step="0.01" // <--- Isso permite centavos
                name="valor_restante" 
                value={formData.valor_restante} 
                onChange={handleChange} 
                className="w-full p-2 border rounded-lg" 
                placeholder="0,00"
              />
            </div>
          </div>
        </section>

        {/* Observação */}
        <section className="bg-white p-4 rounded-xl shadow-sm space-y-4 border border-gray-200">
          <label className="block text-sm text-gray-600">Observação</label>
          <textarea name="observacao" value={formData.observacao} onChange={handleChange} className="w-full p-2 border rounded-lg" rows={3} />
        </section>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all"
        >
          {loading ? 'Salvando...' : 'CADASTRAR RESERVA'}
        </button>
      </form>
    </main>
  );
}