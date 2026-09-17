import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data, fnrh_id } = body;

    const user = process.env.FNRH_USER;
    const pass = process.env.FNRH_PASSWORD;
    const baseUrl = process.env.FNRH_API_URL;

    if (!user || !pass || !baseUrl) {
      return NextResponse.json({ error: 'Configurações da FNRH ausentes no servidor' }, { status: 500 });
    }

    // Gerar Basic Auth Header
    const credentials = Buffer.from(`${user}:${pass}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    };

    // Lógica de Ações
    switch (action) {
      case 'create': {
        const numeroReserva = `${data.telefone}${data.nome_hosp_princ.replace(/\s+/g, '')}`;
        
        const payload = {
          numero_reserva: numeroReserva,
          numero_reserva_ota: data.reserva_ota || "",
          data_entrada: data.data_checkin,
          data_saida: data.data_checkout,
          quantidade_hospede_adulto: parseInt(data.qtd_adultos),
          quantidade_hospede_menor: parseInt(data.qtd_criancas),
          origem_reserva_id: data.reserva_ota ? "OTA" : "MEIODEHOSPEDAGEM"
        };

        const res = await fetch(`${baseUrl}/reservas`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        
        const resData = await res.json();
        
        // ADICIONE ESTA LINHA PARA VERMOS O QUE A FNRH RESPONDEU
        console.log("RESPOSTA DA FNRH:", JSON.stringify(resData, null, 2));
        
        return NextResponse.json(resData);
      }
      case 'update': {
        const numeroReserva = `${data.telefone}${data.nome_hosp_princ.replace(/\s+/g, '')}`;
        const payload = {
          numero_reserva: numeroReserva,
          numero_reserva_ota: data.reserva_ota || "",
          data_entrada: data.data_checkin,
          data_saida: data.data_checkout,
          quantidade_hospede_adulto: parseInt(data.qtd_adultos),
          quantidade_hospede_menor: parseInt(data.qtd_criancas)
        };

        const res = await fetch(`${baseUrl}/reservas/${fnrh_id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
        return NextResponse.json({ success: true }, { status: res.status });
      }

      case 'delete': {
        const res = await fetch(`${baseUrl}/reservas/${fnrh_id}`, {
          method: 'DELETE',
          headers
        });
        return NextResponse.json({ success: true }, { status: res.status });
      }

      case 'cancel': {
        const res = await fetch(`${baseUrl}/reservas/${fnrh_id}/cancelar`, {
          method: 'POST',
          headers
        });
        return NextResponse.json({ success: true }, { status: res.status });
      }

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Erro FNRH API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}