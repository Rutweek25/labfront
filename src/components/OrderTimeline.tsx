import type { Order } from "../types";

type OrderTimelineProps = {
  order: Order;
};

const statusIcon = (done: boolean) => (done ? "✔" : "⏳");

export const OrderTimeline = ({ order }: OrderTimelineProps) => {
  const hasPaid = order.payments.some((payment) => payment.status === "PAID");
  const hasReport = order.reports.length > 0;

  const steps = [
    { label: "Request Created", done: true, tone: "text-slate-700" },
    { label: `Sample ${order.sampleStatus === "PENDING" ? "Pending" : "Done"}`, done: order.sampleStatus !== "PENDING", tone: order.sampleStatus === "PENDING" ? "text-amber-700" : "text-emerald-700" },
    { label: `Lab ${order.status === "COMPLETED" ? "Completed" : order.status === "IN_PROGRESS" ? "In Progress" : "Pending"}`, done: order.status !== "PENDING", tone: order.status === "PENDING" ? "text-blue-700" : "text-emerald-700" },
    { label: `Payment ${hasPaid ? "Done" : "Pending"}`, done: hasPaid, tone: hasPaid ? "text-emerald-700" : "text-amber-700" },
    { label: `Report ${hasReport ? order.reports[0].status.replace("_", " ") : "Pending"}`, done: hasReport, tone: hasReport ? "text-emerald-700" : "text-amber-700" }
  ];

  return (
    <div className="mt-3 space-y-2 text-sm">
      {steps.map((step) => (
        <div key={step.label} className="flex items-start gap-2 text-slate-700">
          <span className={`mt-0.5 inline-flex w-5 shrink-0 justify-center ${step.tone}`}>{statusIcon(step.done)}</span>
          <span className="min-w-0 leading-6">{step.label}</span>
        </div>
      ))}
    </div>
  );
};