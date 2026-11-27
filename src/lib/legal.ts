// Textos jurídicos, cláusulas de proteção de dados (LGPD), veracidade dos sintomas,
// uso exclusivo do sistema e protocolo de transferência inter-hospitalar.

export const TERMS_VERSION = "1.0 — 2026";

export interface LegalLawReference {
  code: string;
  title: string;
  summary: string;
}

export const SYMPTOM_TRUTHFULNESS_LAWS: LegalLawReference[] = [
  {
    code: "Código Penal — Art. 299",
    title: "Falsidade Ideológica (Decreto-Lei nº 2.848/1940)",
    summary:
      "Omitir ou inserir declaração falsa ou diversa da que devia ser escrita, com o fim de alterar a verdade sobre fato juridicamente relevante, como simular sintomas graves para obter atendimento prioritário indevido.",
  },
  {
    code: "Código Penal — Art. 132",
    title: "Perigo para a Vida ou Saúde de Outrem",
    summary:
      "Expor a vida ou a saúde de outros pacientes em estado crítico a perigo direto e iminente ao desviar indevidamente recursos de emergência e retardar atendimentos urgentes.",
  },
  {
    code: "Código Civil — Arts. 186 e 927",
    title: "Responsabilidade Civil por Ato Ilícito (Lei nº 10.406/2002)",
    summary:
      "Aquele que, por ação ou omissão voluntária, violar direito e causar dano a outrem — inclusive prejuízo assistencial a terceiros na fila hospitalar — fica obrigado a repará-lo.",
  },
  {
    code: "Portaria MS nº 2.048/2002",
    title: "Protocolo de Acolhimento com Classificação de Risco",
    summary:
      "A pré-triagem digital é preliminar e obrigatoriamente validada presencialmente pela equipe de saúde. Em caso de fraude ou exagero intencional dos sintomas, a unidade poderá reclassificar o paciente para o final da fila ou cancelar a senha, com registro da ocorrência.",
  },
];

export const LGPD_PRINCIPLES = [
  {
    title: "Base Legal e Dados Sensíveis de Saúde",
    text: "Os dados informados (nome, idade, documento, sintomas, intensidade de dor e sinais clínicos) constituem dados pessoais e dados pessoais sensíveis de saúde, tratados conforme os arts. 5º, II, 7º e 11, II, alínea 'f' da Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018), exclusivamente para tutela da saúde, pré-triagem e organização do atendimento.",
  },
  {
    title: "Finalidade, Necessidade e Segurança",
    text: "Coletamos apenas o mínimo necessário para classificar a urgência clínica e direcionar o paciente ao hospital escolhido. O acesso aos detalhes clínicos é restrito à equipe autorizada da unidade de destino, observando o sigilo profissional previsto no Código de Ética Médica (Resolução CFM nº 2.217/2018).",
  },
  {
    title: "Compartilhamento em Transferências Hospitalares",
    text: "Caso a equipe médica determine a transferência do paciente para outra unidade de saúde, os dados da triagem poderão ser compartilhados com o hospital de destino — de forma eletrônica quando a unidade também utiliza o Sem Espera, ou por meio da Guia de Transferência Inter-Hospitalar quando se tratar de hospital externo.",
  },
  {
    title: "Direitos do Titular dos Dados (Art. 18 da LGPD)",
    text: "O paciente tem direito a confirmar a existência de tratamento, acessar seus dados, solicitar correção de informações incompletas ou inexatas, requerer anonimização ou eliminação de dados desnecessários e revogar o consentimento, respeitadas as obrigações legais de guarda de prontuário médico (Lei nº 13.787/2018).",
  },
];

export const EXCLUSIVE_USE_CLAUSES = {
  clinic: {
    title: "Termo de Uso Exclusivo e Obrigatório do Sistema (Instituições de Saúde)",
    text: "A clínica ou hospital cadastrado declara e confirma que adota exclusivamente o sistema Sem Espera para pré-triagem digital e gerenciamento de fila de urgência na unidade, comprometendo-se a não operar sistemas paralelos ou concorrentes de emissão de senhas que possam gerar duplicidade de chamadas, quebra da ordem de prioridade clínica ou risco à segurança do paciente.",
  },
  patient: {
    title: "Compromisso de Uso Exclusivo do Canal Oficial (Pacientes)",
    text: "O paciente confirma que realiza sua pré-triagem exclusivamente por meio do sistema oficial Sem Espera para o hospital selecionado e que cumpre integralmente esta regra, não realizando múltiplos cadastros duplicados nem utilizando canais paralelos para tentar adiantar sua posição na fila.",
  },
};

export const TRANSFER_POLICY = {
  internal:
    "Quando o hospital de destino também utiliza o sistema Sem Espera, o prontuário preliminar da triagem e a classificação de prioridade são transferidos eletronicamente, inserindo o paciente diretamente na fila de espera da unidade de destino com identificação da unidade de origem.",
  external:
    "Quando o hospital de destino não utiliza o sistema Sem Espera, a senha é encerrada na unidade de origem com status 'Transferido' e o sistema gera uma Guia de Transferência Inter-Hospitalar (imprimível e copiável) contendo protocolo único, sintomas, sinais críticos, nível de dor, motivo clínico e observações para entrega segura à equipe receptora.",
};

export interface TransferReportInput {
  protocol: string;
  createdAt: string | Date;
  patientName: string;
  patientAge: number;
  patientDocument: string;
  patientTicket: string;
  priorityLabel: string;
  symptoms: string;
  painLevel: number;
  hasFever: boolean;
  hasBreathingIssue: boolean;
  hasChestPain: boolean;
  fromClinicName: string;
  destinationUsesSystem: boolean;
  destinationName: string;
  destinationAddress?: string | null;
  destinationPhone?: string | null;
  reason: string;
  clinicalNotes?: string | null;
  transferredBy?: string | null;
}

export function formatTransferReportText(data: TransferReportInput): string {
  const flags: string[] = [];
  if (data.hasFever) flags.push("Febre");
  if (data.hasBreathingIssue) flags.push("Dificuldade respiratória / falta de ar");
  if (data.hasChestPain) flags.push("Dor no peito");

  const dateStr = new Date(data.createdAt).toLocaleString("pt-BR");

  return [
    "================================================================",
    "GUIA DE TRANSFERÊNCIA INTER-HOSPITALAR — SEM ESPERA",
    "================================================================",
    `Protocolo: ${data.protocol}`,
    `Data/Hora: ${dateStr}`,
    `Tipo de Destino: ${data.destinationUsesSystem ? "Hospital parceiro (integrado ao Sem Espera)" : "Hospital externo (fora do sistema Sem Espera)"}`,
    "",
    "--- ORIGEM E DESTINO ---",
    `Unidade de Origem: ${data.fromClinicName}`,
    `Unidade de Destino: ${data.destinationName}`,
    data.destinationAddress ? `Endereço Destino: ${data.destinationAddress}` : null,
    data.destinationPhone ? `Telefone Destino: ${data.destinationPhone}` : null,
    data.transferredBy ? `Responsável pela Transferência: ${data.transferredBy}` : null,
    "",
    "--- DADOS DO PACIENTE ---",
    `Senha Original: ${data.patientTicket}`,
    `Nome: ${data.patientName}`,
    `Idade: ${data.patientAge} anos`,
    `Documento: ${data.patientDocument || "Não informado"}`,
    `Prioridade na Triagem: ${data.priorityLabel}`,
    "",
    "--- QUADRO CLÍNICO ---",
    `Sintomas relatados: ${data.symptoms}`,
    `Nível de dor (0 a 10): ${data.painLevel}/10`,
    `Sinais de alerta: ${flags.length ? flags.join(", ") : "Nenhum sinal crítico assinalado"}`,
    "",
    "--- MOTIVO E OBSERVAÇÕES DA TRANSFERÊNCIA ---",
    `Motivo: ${data.reason}`,
    data.clinicalNotes ? `Observações clínicas: ${data.clinicalNotes}` : null,
    "",
    "--- AVISO LGPD (LEI Nº 13.709/2018) ---",
    "Documento confidencial contendo dados sensíveis de saúde. Uso restrito",
    "à equipe assistencial para continuidade do atendimento médico.",
    "================================================================",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

