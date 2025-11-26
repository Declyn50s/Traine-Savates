// src/pages/admin/Dashboard.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Mail,
  Users,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

import { adminApi } from '../../services/adminApi';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { Edition } from '../../types/api';

type DashboardStats = {
  activeEdition: Edition | null;
  newMessagesCount: number;
  newMembershipsCount: number;
  recentMessages: Array<{
    id: string;
    name: string;
    email?: string;
    subject?: string;
    message?: string;
    status: 'new' | 'read' | string;
    created_at: string;
  }>;
};

function formatDateLong(dateStr?: string | null) {
  if (!dateStr) return 'Date à définir';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('fr-CH', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatShortDate(dateStr?: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('fr-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await adminApi.getDashboardStats();
        setStats(data as DashboardStats);
      } catch (error) {
        console.error('Erreur dashboard stats', error);
        setStats({
          activeEdition: null,
          newMessagesCount: 0,
          newMembershipsCount: 0,
          recentMessages: [],
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading || !stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  const activeEdition = stats.activeEdition;
  const hasActiveEdition = !!activeEdition;
  const hasNewMessages = stats.newMessagesCount > 0;
  const hasNewMemberships = stats.newMembershipsCount > 0;

  const hasTodoAlerts =
    !hasActiveEdition || hasNewMessages || hasNewMemberships;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <span>Tableau de bord</span>
            </h1>
            <p className="mt-1 text-sm text-gray-600 max-w-2xl">
              Vue d’ensemble de la course&nbsp;: messages à traiter, demandes
              d’adhésion, édition active et activité récente du site public.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/" target="_blank">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Voir le site public
              </Button>
            </Link>
            <Link to="/admin/editions">
              <Button variant="primary" size="sm" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Gérer les éditions
              </Button>
            </Link>
          </div>
        </div>

        {/* CARTES KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Messages */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Messages de contact
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.newMessagesCount}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    en attente de traitement
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
                  <Mail className="text-orange-600" size={24} />
                </div>
              </div>
              <Link
                to="/admin/forms"
                className="inline-flex items-center text-xs text-orange-600 mt-4 hover:underline"
              >
                Voir les messages
                <ChevronRight className="w-3 h-3 ml-1" />
              </Link>
            </CardContent>
          </Card>

          {/* Adhésions */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Demandes d’adhésion
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.newMembershipsCount}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    à valider ou refuser
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>
              <Link
                to="/admin/forms?tab=memberships"
                className="inline-flex items-center text-xs text-blue-600 mt-4 hover:underline"
              >
                Voir les demandes
                <ChevronRight className="w-3 h-3 ml-1" />
              </Link>
            </CardContent>
          </Card>

          {/* Édition active */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Édition active
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {activeEdition ? activeEdition.year : 'Aucune'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activeEdition
                      ? activeEdition.title
                      : 'Choisis une édition à activer'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                  <Calendar className="text-green-600" size={24} />
                </div>
              </div>
              <Link
                to="/admin/editions"
                className="inline-flex items-center text-xs text-green-700 mt-4 hover:underline"
              >
                Gérer les éditions
                <ChevronRight className="w-3 h-3 ml-1" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* ZONE PRINCIPALE : ÉDITION ACTIVE + À FAIRE */}
        <div className="grid grid-cols-1 xl:grid-cols-[2fr,1.3fr] gap-6 items-start">
          {/* Édition active */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Édition active</h2>
                  <p className="text-xs text-orange-100">
                    C’est cette édition qui est affichée sur la page d’accueil.
                  </p>
                </div>
                {activeEdition && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px]">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {!activeEdition && (
                <div className="flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-800 font-medium mb-1">
                      Aucune édition active.
                    </p>
                    <p className="text-xs text-gray-600 mb-3">
                      Active une édition pour que les infos de course (date,
                      inscriptions, résultats) soient visibles sur le site.
                    </p>
                    <Link to="/admin/editions">
                      <Button variant="primary" size="sm">
                        Choisir une édition active
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {activeEdition && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {activeEdition.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDateLong(activeEdition.date)}
                      </p>
                      {activeEdition.hero_subtitle && (
                        <p className="mt-2 text-sm text-gray-700">
                          {activeEdition.hero_subtitle}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-gray-800">
                        Configuration de l’édition :
                      </p>
                      <div className="space-y-1.5">
                        <ConfigRow
                          label="Lien d’inscription en ligne"
                          ok={!!activeEdition.registration_online_url}
                        />
                        <ConfigRow
                          label="Lien des résultats"
                          ok={!!activeEdition.results_url}
                        />
                        <ConfigRow
                          label="Album photos"
                          ok={!!activeEdition.photos_album_url}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                      <p className="font-medium text-gray-800 mb-1">
                        Raccourcis utiles
                      </p>
                      <ul className="space-y-1">
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                          <span>
                            Gérer les catégories de course et le programme dans
                            l’onglet « La course » de cette édition.
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                          <span>
                            Mets à jour le sous-titre pour refléter la prochaine
                            date ou un message important.
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link to={`/admin/editions/${activeEdition.id}`}>
                        <Button variant="primary" className="w-full">
                          Gérer cette édition
                        </Button>
                      </Link>
                      <Link to="/" target="_blank">
                        <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Voir la page publique
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* À FAIRE / ALERTES */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                À faire en priorité
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Vue rapide des points à traiter pour que le site soit à jour.
              </p>
            </CardHeader>
            <CardContent className="p-5">
              {!hasTodoAlerts && (
                <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-100 p-3 text-xs text-green-800">
                  <CheckCircle2 className="w-4 h-4" />
                  <div>
                    <p className="font-medium text-green-800">
                      Rien de critique à traiter.
                    </p>
                    <p className="text-[11px]">
                      Les messages, les adhésions et l’édition active sont sous
                      contrôle.
                    </p>
                  </div>
                </div>
              )}

              {hasTodoAlerts && (
                <div className="space-y-3 text-sm">
                  {!hasActiveEdition && (
                    <TodoRow
                      type="warning"
                      label="Aucune édition active"
                      description="Active une édition pour que la prochaine course apparaisse sur le site."
                      to="/admin/editions"
                      cta="Choisir une édition"
                    />
                  )}

                  {hasNewMessages && (
                    <TodoRow
                      type="info"
                      label={`${stats.newMessagesCount} message(s) de contact`}
                      description="Réponds aux messages des coureurs ou des visiteurs."
                      to="/admin/forms"
                      cta="Ouvrir la messagerie"
                    />
                  )}

                  {hasNewMemberships && (
                    <TodoRow
                      type="info"
                      label={`${stats.newMembershipsCount} demande(s) d’adhésion`}
                      description="Accepte ou refuse les nouvelles demandes de membres."
                      to="/admin/forms?tab=memberships"
                      cta="Gérer les adhésions"
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* MESSAGES RÉCENTS */}
        {stats.recentMessages && stats.recentMessages.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                Messages récents
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Un aperçu des derniers messages reçus via le formulaire de
                contact.
              </p>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                {stats.recentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="border-l-4 border-orange-500 pl-4 py-2 bg-orange-50/40 rounded-r-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {msg.name}
                          {msg.email && (
                            <span className="text-xs text-gray-500 ml-2">
                              ({msg.email})
                            </span>
                          )}
                        </p>
                        {msg.subject && (
                          <p className="text-xs text-gray-600">
                            {msg.subject}
                          </p>
                        )}
                        {msg.message && (
                          <p className="mt-1 text-xs text-gray-700 line-clamp-2">
                            {msg.message}
                          </p>
                        )}
                      </div>
                      {msg.status === 'new' && (
                        <span className="bg-orange-100 text-orange-800 text-[11px] px-2 py-1 rounded-full whitespace-nowrap">
                          Nouveau
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Reçu le {formatShortDate(msg.created_at)}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                to="/admin/forms"
                className="inline-flex items-center text-sm text-orange-600 mt-4 hover:underline"
              >
                Voir tous les messages
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

/**
 * Petite ligne de configuration "OK / manquant" pour l’édition active
 */
function ConfigRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <>
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="w-3 h-3 text-green-600" />
          </span>
          <span className="text-gray-800">{label}</span>
        </>
      ) : (
        <>
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-100">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
          </span>
          <span className="text-gray-500">
            {label}{' '}
            <span className="text-xs text-gray-400">(à configurer)</span>
          </span>
        </>
      )}
    </div>
  );
}

/**
 * Ligne "À faire" avec CTA
 */
function TodoRow(props: {
  type: 'warning' | 'info';
  label: string;
  description: string;
  to: string;
  cta: string;
}) {
  const color =
    props.type === 'warning'
      ? 'bg-orange-50 border-orange-100 text-orange-800'
      : 'bg-blue-50 border-blue-100 text-blue-800';

  return (
    <Link
      to={props.to}
      className={`block rounded-lg border p-3 text-xs ${color} hover:brightness-95 transition`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-[13px] mb-0.5">{props.label}</p>
          <p className="text-[11px] opacity-90">{props.description}</p>
        </div>
        <ChevronRight className="w-3 h-3 flex-shrink-0" />
      </div>
      <p className="mt-1 font-medium text-[11px] underline">{props.cta}</p>
    </Link>
  );
}