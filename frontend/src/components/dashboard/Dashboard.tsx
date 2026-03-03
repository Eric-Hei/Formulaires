"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formsApi } from "@/lib/forms-api";
import type { DocsDocument, FormStatsData, FormResponseData } from "@/types";

interface DashboardProps {
  documentId: string;
  document: DocsDocument | null;
}

const CHART_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#14b8a6",
];

export function Dashboard({ documentId, document }: DashboardProps) {
  const [stats, setStats] = useState<FormStatsData | null>(null);
  const [responses, setResponses] = useState<FormResponseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "responses">("summary");

  useEffect(() => {
    Promise.all([formsApi.getStats(documentId), formsApi.getResponses(documentId)])
      .then(([s, r]) => {
        setStats(s);
        setResponses(r.results);
      })
      .catch(() => setError("Impossible de charger les données. Vérifiez votre authentification."))
      .finally(() => setLoading(false));
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard label="Réponses totales" value={stats?.total_responses ?? 0} />
        <StatCard
          label="Statut"
          value={stats?.is_accepting ? "Ouvert" : "Fermé"}
          valueClass={stats?.is_accepting ? "text-green-600" : "text-red-600"}
        />
        <StatCard
          label="Questions avec réponses"
          value={Object.keys(stats?.field_stats ?? {}).length}
        />
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "summary"
              ? "bg-primary-600 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Résumé
        </button>
        <button
          onClick={() => setActiveTab("responses")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "responses"
              ? "bg-primary-600 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Réponses individuelles ({responses.length})
        </button>
      </div>

      {activeTab === "summary" && stats && (
        <FieldStatsList stats={stats} />
      )}

      {activeTab === "responses" && (
        <ResponsesTable responses={responses} />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold text-gray-900 ${valueClass ?? ""}`}>{value}</p>
    </div>
  );
}

function FieldStatsList({ stats }: { stats: FormStatsData }) {
  const fields = Object.entries(stats.field_stats);

  if (!fields.length) {
    return (
      <div className="text-center text-gray-400 py-12">
        Aucune réponse enregistrée pour l&apos;instant.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {fields.map(([blockId, fieldStat]) => {
        const data = Object.entries(fieldStat.distribution).map(([name, value]) => ({
          name,
          value,
        }));

        const isNumeric = data.every((d) => !isNaN(Number(d.name)));
        const total = data.reduce((s, d) => s + d.value, 0);

        return (
          <div key={blockId} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">
                Question ID : <code className="text-xs text-gray-400">{blockId.slice(0, 8)}…</code>
              </h4>
              <span className="text-xs text-gray-400">{fieldStat.count} réponse(s)</span>
            </div>

            {data.length <= 8 ? (
              <div className="space-y-2">
                {data.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-32 truncate">{item.name}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.round((item.value / total) * 100)}%`,
                          backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-12 text-right">
                      {Math.round((item.value / total) * 100)}%
                    </span>
                    <span className="text-xs text-gray-400 w-8 text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ResponsesTable({ responses }: { responses: FormResponseData[] }) {
  if (!responses.length) {
    return (
      <div className="text-center text-gray-400 py-12">Aucune réponse pour l&apos;instant.</div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Répondant</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Réponses</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {responses.map((r, i) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-400">{i + 1}</td>
              <td className="px-4 py-3 text-gray-600">
                {new Date(r.submitted_at).toLocaleString("fr-FR")}
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">
                {r.respondent_id || <span className="italic">Anonyme</span>}
              </td>
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer text-primary-600 text-xs">
                    {Object.keys(r.answers).length} champ(s)
                  </summary>
                  <pre className="mt-1 text-xs text-gray-500 bg-gray-50 rounded p-2 overflow-auto max-h-40">
                    {JSON.stringify(r.answers, null, 2)}
                  </pre>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
