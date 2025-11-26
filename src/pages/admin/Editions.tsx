// src/pages/admin/Editions.tsx
import {
  useEffect,
  useMemo,
  useState,
  ChangeEvent,
} from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle,
  Copy,
  Edit,
  Filter,
  Image as ImageIcon,
  Link2,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import type { Edition } from '../../types/api';

type StatusFilter = 'all' | 'draft' | 'published' | 'archived';

function formatDate(date: string) {
  if (!date) return 'À définir';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('fr-CH', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getStatusLabel(status: Edition['status']) {
  switch (status) {
    case 'published':
      return 'Active';
    case 'draft':
      return 'Brouillon';
    case 'archived':
      return 'Archivée';
    default:
      return status;
  }
}

function StatusBadge({ status }: { status: Edition['status'] }) {
  const base =
    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold';
  const map: Record<Edition['status'], string> = {
    published: 'bg-green-100 text-green-800',
    draft: 'bg-gray-100 text-gray-700',
    archived: 'bg-orange-100 text-orange-800',
  };

  return (
    <span className={`${base} ${map[status]}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === 'published'
            ? 'bg-green-500'
            : status === 'draft'
            ? 'bg-gray-400'
            : 'bg-orange-500'
        }`}
      />
      {getStatusLabel(status)}
    </span>
  );
}

export function Editions() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');

  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadEditions();
  }, []);

  async function loadEditions() {
    setLoading(true);
    try {
      const data = await adminApi.getEditions();
      setEditions(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleDuplicate(edition: Edition) {
    const nextYear = edition.year + 1;
    if (
      !window.confirm(
        `Dupliquer l'édition ${edition.year} pour créer l'édition ${nextYear} ?`
      )
    ) {
      return;
    }

    try {
      setProcessingId(edition.id);
      await adminApi.duplicateEdition(edition.id, nextYear);
      await loadEditions();
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la duplication de l’édition.');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleActivate(edition: Edition) {
    if (
      !window.confirm(
        `Activer l'édition ${edition.year} ? Cela archivera l'édition actuellement active.`
      )
    ) {
      return;
    }

    try {
      setProcessingId(edition.id);
      await adminApi.activateEdition(edition.id);
      await loadEditions();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'activation de l’édition.");
    } finally {
      setProcessingId(null);
    }
  }

  function handleStatusFilterChange(value: StatusFilter) {
    setStatusFilter(value);
  }

  function handleSearchChange(e: ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  const yearsOptions = useMemo(() => {
    const years = Array.from(new Set(editions.map((e) => e.year))).sort(
      (a, b) => b - a
    );
    return years;
  }, [editions]);

  const filteredEditions = useMemo(() => {
    let list = [...editions];

    if (statusFilter !== 'all') {
      list = list.filter((e) => e.status === statusFilter);
    }

    if (yearFilter !== 'all') {
      list = list.filter((e) => e.year === yearFilter);
    }

    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((e) => {
        const haystack = `${e.title} ${e.year} ${e.slug} ${
          e.hero_subtitle ?? ''
        }`.toLowerCase();
        return haystack.includes(term);
      });
    }

    // Déjà trié par date desc côté API, on laisse comme ça
    return list;
  }, [editions, statusFilter, search, yearFilter]);

  const activeEdition = editions.find((e) => e.status === 'published');
  const totalDrafts = editions.filter((e) => e.status === 'draft').length;
  const totalArchived = editions.filter((e) => e.status === 'archived').length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* HEADER + STATS */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Calendar className="h-6 w-6 text-orange-600" />
              Éditions de la course
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Gère ici les différentes éditions des Traîne-Savates : années, dates,
              statut actif, liens d’inscriptions, résultats et photos. C’est le cœur
              du contenu « course » côté public.
            </p>
          </div>

          <Link to="/admin/editions/new">
            <Button variant="primary" className="inline-flex items-center gap-2">
              <PlusIcon />
              <span>Créer une nouvelle édition</span>
            </Button>
          </Link>
        </div>

        {/* Stats rapides */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            <span className="text-gray-700">
              Total éditions&nbsp;:&nbsp;
              <span className="font-semibold">{editions.length}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-gray-700">
              Édition active&nbsp;:&nbsp;
              <span className="font-semibold">
                {activeEdition
                  ? `${activeEdition.year} – ${activeEdition.title}`
                  : 'aucune (à définir)'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-gray-700">
              Brouillons&nbsp;:&nbsp;
              <span className="font-semibold">{totalDrafts}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-gray-500" />
            <span className="text-gray-700">
              Archivées&nbsp;:&nbsp;
              <span className="font-semibold">{totalArchived}</span>
            </span>
          </div>
        </div>
      </div>

      {/* FILTRES / ACTION BAR */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
              <Filter className="h-4 w-4 text-gray-500" />
              Filtrer les éditions
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={loadEditions}
              className="inline-flex items-center gap-1 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
              Recharger
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Filtre statut */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['all', 'Toutes'],
                  ['published', 'Actives'],
                  ['draft', 'Brouillons'],
                  ['archived', 'Archivées'],
                ] as [StatusFilter, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleStatusFilterChange(value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    statusFilter === value
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Filtre année */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Année :</span>
              <select
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
                value={yearFilter === 'all' ? 'all' : yearFilter.toString()}
                onChange={(e) => {
                  const val = e.target.value;
                  setYearFilter(val === 'all' ? 'all' : Number(val));
                }}
              >
                <option value="all">Toutes</option>
                {yearsOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[180px] max-w-md">
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm pl-3"
                placeholder="Rechercher par titre, année, slug…"
                value={search}
                onChange={handleSearchChange}
              />
            </div>

            <div className="text-[11px] text-gray-500">
              {filteredEditions.length} édition(s) affichée(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LISTE DES ÉDITIONS */}
      {editions.length === 0 ? (
        <Card>
          <CardContent>
            <div className="py-10 text-center">
              <p className="mb-4 text-sm text-gray-600">
                Aucune édition n&apos;est encore définie.
              </p>
              <Link to="/admin/editions/new">
                <Button variant="primary">
                  Créer la première édition
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <h2 className="text-lg font-semibold text-gray-900">
              Toutes les éditions
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Clique sur « Modifier » pour gérer le détail : catégories de course,
              programme, liens d’inscriptions, résultats et photos.
            </p>
          </CardHeader>
          <CardContent className="pt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Édition
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Liens
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredEditions.map((edition) => {
                  const isActive = edition.status === 'published';
                  const isProcessing = processingId === edition.id;

                  const hasRegistration = !!edition.registration_online_url;
                  const hasResults = !!edition.results_url;
                  const hasPhotos = !!edition.photos_album_url;

                  return (
                    <tr
                      key={edition.id}
                      className="hover:bg-gray-50 align-top"
                    >
                      {/* Édition */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {edition.title}
                            </span>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                              {edition.edition_number}
                              <sup>e</sup> édition
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                            <span>Année {edition.year}</span>
                            <span className="text-gray-400">|</span>
                            <span className="font-mono text-[11px]">
                              slug: {edition.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 text-sm text-gray-900">
                          {formatDate(edition.date)}
                          {edition.hero_subtitle && (
                            <span className="text-xs text-gray-500">
                              {edition.hero_subtitle}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={edition.status} />
                          {isActive && (
                            <span className="text-[11px] text-green-700">
                              C&apos;est l&apos;édition affichée sur la page d&apos;accueil.
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Liens */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 text-xs text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Link2
                              className={`h-3.5 w-3.5 ${
                                hasRegistration
                                  ? 'text-orange-600'
                                  : 'text-gray-300'
                              }`}
                            />
                            <span
                              className={
                                hasRegistration
                                  ? 'text-gray-800'
                                  : 'text-gray-400'
                              }
                            >
                              Inscriptions en ligne
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Trophy
                              className={`h-3.5 w-3.5 ${
                                hasResults ? 'text-orange-600' : 'text-gray-300'
                              }`}
                            />
                            <span
                              className={
                                hasResults ? 'text-gray-800' : 'text-gray-400'
                              }
                            >
                              Résultats
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ImageIcon
                              className={`h-3.5 w-3.5 ${
                                hasPhotos ? 'text-orange-600' : 'text-gray-300'
                              }`}
                            />
                            <span
                              className={
                                hasPhotos ? 'text-gray-800' : 'text-gray-400'
                              }
                            >
                              Album photos
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <Link to={`/admin/editions/${edition.id}`}>
                            <button
                              className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                              title="Modifier l’édition"
                            >
                              <Edit className="mr-1 h-3.5 w-3.5" />
                              Modifier
                            </button>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDuplicate(edition)}
                            disabled={isProcessing}
                            className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                            title="Dupliquer cette édition pour l’année suivante"
                          >
                            <Copy className="mr-1 h-3.5 w-3.5" />
                            Dupliquer
                          </button>

                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => handleActivate(edition)}
                              disabled={isProcessing}
                              className="inline-flex items-center rounded-md border border-green-600 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-60"
                              title="Activer cette édition (archivera l’édition actuelle)"
                            >
                              <CheckCircle className="mr-1 h-3.5 w-3.5" />
                              Activer
                            </button>
                          )}

                          {isActive && (
                            <span
                              className="inline-flex items-center rounded-md border border-green-100 bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
                              title="Édition actuellement active"
                            >
                              <CheckCircle className="mr-1 h-3.5 w-3.5 fill-green-600 text-green-600" />
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}

function PlusIcon() {
  // petit helper pour ne pas importer Plus tout seul
  return <span className="flex h-4 w-4 items-center justify-center">+</span>;
}
