import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { transferPatientFn } from "@/lib/api/triage.functions";
import {
  priorityLabel,
  usePublicClinics,
  type Patient,
  type Priority,
} from "@/lib/triage-store";
import { formatTransferReportText, type TransferReportInput } from "@/lib/legal";
import { PriorityBadge } from "@/components/PriorityBadge";
import {
  ArrowLeftRight,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Printer,
  X,
} from "lucide-react";

export function printTransferReport(report: TransferReportInput) {
  const text = formatTransferReportText(report);
  const win = window.open("", "_blank", "width=800,height=700");
  if (!win) {
    window.print();
    return;
  }
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  win.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Guia de Transferência ${report.protocol}</title>
  <style>
    body { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; padding: 32px; color: #111; line-height: 1.5; }
    pre { white-space: pre-wrap; font-size: 13px; border: 1px solid #ccc; padding: 24px; border-radius: 8px; }
  </style>
</head>
<body>
  <pre>${escaped}</pre>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`);
  win.document.close();
}

interface TransferPatientModalProps {
  patient: Patient | null;
  token: string;
  currentClinicId: string;
  currentClinicName: string;
  onClose: () => void;
  onTransferred?: () => void;
}

export function TransferPatientModal({
  patient,
  token,
  currentClinicId,
  currentClinicName,
  onClose,
  onTransferred,
}: TransferPatientModalProps) {
  const qc = useQueryClient();
  const clinicsQuery = usePublicClinics();
  const otherClinics = (clinicsQuery.data ?? []).filter((c) => c.id !== currentClinicId);

  const [usesSystem, setUsesSystem] = useState<boolean>(true);
  const [toClinicId, setToClinicId] = useState<string>("");
  const [externalName, setExternalName] = useState("");
  const [externalAddress, setExternalAddress] = useState("");
  const [externalPhone, setExternalPhone] = useState("");
  const [reason, setReason] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedReport, setCompletedReport] = useState<TransferReportInput | null>(null);
  const [copied, setCopied] = useState(false);

  if (!patient) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patient) return;
    setError(null);

    if (usesSystem && !toClinicId) {
      return setError("Selecione o hospital parceiro de destino.");
    }
    if (!usesSystem && externalName.trim().length < 2) {
      return setError("Informe o nome do hospital externo de destino.");
    }
    if (reason.trim().length < 3) {
      return setError("Informe o motivo da transferência.");
    }

    setSubmitting(true);
    try {
      const result = await transferPatientFn({
        data: {
          token,
          patientId: patient.id,
          destinationUsesSystem: usesSystem,
          toClinicId: usesSystem ? toClinicId : undefined,
          externalHospitalName: usesSystem ? undefined : externalName.trim(),
          externalHospitalAddress: usesSystem ? undefined : externalAddress.trim() || undefined,
          externalHospitalPhone: usesSystem ? undefined : externalPhone.trim() || undefined,
          reason: reason.trim(),
          clinicalNotes: clinicalNotes.trim() || undefined,
        },
      });

      const destName = result.destinationUsesSystem
        ? result.toClinic?.name ?? "Hospital parceiro"
        : result.externalHospitalName ?? externalName.trim();
      const destAddress = result.destinationUsesSystem
        ? result.toClinic?.address
        : result.externalHospitalAddress;
      const destPhone = result.destinationUsesSystem
        ? result.toClinic?.phone
        : result.externalHospitalPhone;

      setCompletedReport({
        protocol: result.protocol,
        createdAt: result.createdAt,
        patientName: result.patient.name,
        patientAge: result.patient.age,
        patientDocument: result.patient.document,
        patientTicket: result.patient.ticket,
        priorityLabel:
          priorityLabel[(result.patient.priority as Priority) ?? "low"] ?? result.patient.priority,
        symptoms: result.patient.symptoms,
        painLevel: result.patient.painLevel,
        hasFever: result.patient.hasFever,
        hasBreathingIssue: result.patient.hasBreathingIssue,
        hasChestPain: result.patient.hasChestPain,
        fromClinicName: result.fromClinic?.name ?? currentClinicName,
        destinationUsesSystem: result.destinationUsesSystem,
        destinationName: destName,
        destinationAddress: destAddress,
        destinationPhone: destPhone,
        reason: result.reason,
        clinicalNotes: result.clinicalNotes,
        transferredBy: result.transferredBy,
      });

      await Promise.all([
        qc.invalidateQueries({ queryKey: ["patients"] }),
        qc.invalidateQueries({ queryKey: ["transfers"] }),
        qc.invalidateQueries({ queryKey: ["public-clinics"] }),
      ]);
      onTransferred?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao transferir paciente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!completedReport) return;
    await navigator.clipboard.writeText(formatTransferReportText(completedReport));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const inputCls =
    "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h2 id="transfer-modal-title" className="text-lg font-bold">
                Transferir Paciente
              </h2>
              <p className="text-xs text-muted-foreground">
                Origem: {currentClinicName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Resumo do paciente */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm">
          <div>
            <span className="mr-2 font-black text-primary">{patient.ticket}</span>
            <span className="font-bold">{patient.name}</span>
            <span className="ml-2 text-xs text-muted-foreground">{patient.age} anos</span>
          </div>
          <PriorityBadge priority={patient.priority} size="sm" />
        </div>

        {completedReport ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-priority-low/30 bg-priority-low/10 p-4 text-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-priority-low" />
              <div>
                <p className="font-bold text-foreground">
                  Transferência registrada — Protocolo {completedReport.protocol}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {completedReport.destinationUsesSystem
                    ? `O paciente foi transferido eletronicamente para a fila de ${completedReport.destinationName} com os dados clínicos preservados.`
                    : `Como ${completedReport.destinationName} não utiliza o sistema Sem Espera, a senha foi encerrada nesta unidade como "Transferido". Utilize a guia abaixo para entrega presencial ou envio à equipe receptora.`}
                </p>
              </div>
            </div>

            <pre className="max-h-64 overflow-auto rounded-2xl border border-border bg-background p-4 text-xs leading-relaxed text-foreground">
              {formatTransferReportText(completedReport)}
            </pre>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => printTransferReport(completedReport)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                <Printer className="h-4 w-4" /> Imprimir Guia
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-bold hover:bg-muted"
              >
                {copied ? <Check className="h-4 w-4 text-priority-low" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar Resumo"}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-muted py-2.5 text-sm font-semibold text-foreground hover:bg-muted/80"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo de hospital de destino */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                O hospital de destino utiliza o sistema Sem Espera?
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setUsesSystem(true);
                    setError(null);
                  }}
                  className={`rounded-2xl border p-3.5 text-left transition-all ${
                    usesSystem
                      ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Building2 className="h-4 w-4 text-primary" />
                    Sim, usa o Sem Espera
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Envia direto para a fila digital do hospital parceiro com histórico preservado.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUsesSystem(false);
                    setError(null);
                  }}
                  className={`rounded-2xl border p-3.5 text-left transition-all ${
                    !usesSystem
                      ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <ExternalLink className="h-4 w-4 text-primary" />
                    Não, hospital externo
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Encerra nesta fila e gera Guia de Transferência imprimível/copiável.
                  </p>
                </button>
              </div>
            </div>

            {usesSystem ? (
              <div>
                <label htmlFor="transfer-clinic" className="mb-1.5 block text-sm font-bold">
                  Hospital parceiro de destino *
                </label>
                {otherClinics.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                    Não há outros hospitais cadastrados no sistema no momento. Selecione a opção{" "}
                    <strong>"Não, hospital externo"</strong> acima para registrar uma transferência
                    externa com guia clínica.
                  </div>
                ) : (
                  <select
                    id="transfer-clinic"
                    className={inputCls}
                    value={toClinicId}
                    onChange={(e) => setToClinicId(e.target.value)}
                    required
                  >
                    <option value="">Selecione a unidade de destino...</option>
                    {otherClinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.address ? ` — ${c.address}` : ""} ({c.waitingCount} na fila)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div className="space-y-3 rounded-2xl border border-border bg-background p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Dados do hospital externo (fora do sistema)
                </p>
                <div>
                  <label htmlFor="ext-hospital-name" className="mb-1 block text-xs font-bold">
                    Nome do hospital de destino *
                  </label>
                  <input
                    id="ext-hospital-name"
                    className={inputCls}
                    placeholder="Ex: Hospital Municipal São Lucas"
                    value={externalName}
                    onChange={(e) => setExternalName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ext-hospital-address" className="mb-1 block text-xs font-bold">
                      Endereço / Cidade
                    </label>
                    <input
                      id="ext-hospital-address"
                      className={inputCls}
                      placeholder="Ex: Av. Central, 500"
                      value={externalAddress}
                      onChange={(e) => setExternalAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="ext-hospital-phone" className="mb-1 block text-xs font-bold">
                      Telefone da unidade
                    </label>
                    <input
                      id="ext-hospital-phone"
                      className={inputCls}
                      placeholder="(11) 3333-4444"
                      value={externalPhone}
                      onChange={(e) => setExternalPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="transfer-reason" className="mb-1.5 block text-sm font-bold">
                Motivo da transferência *
              </label>
              <input
                id="transfer-reason"
                className={inputCls}
                placeholder="Ex: Necessidade de atendimento cardiológico / UTI indisponível"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="transfer-notes" className="mb-1.5 block text-sm font-bold">
                Observações clínicas para a equipe receptora
              </label>
              <textarea
                id="transfer-notes"
                rows={3}
                className={`${inputCls} resize-none`}
                placeholder="Sinais vitais, medicações administradas, orientações para o transporte..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
              />
            </div>

            {error && (
              <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || (usesSystem && otherClinics.length === 0)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowLeftRight className="h-4 w-4" />
                )}
                Confirmar Transferência
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
