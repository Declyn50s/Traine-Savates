// src/pages/admin/EditionEdit.tsx
import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  Info,
  ArrowLeft,
  Save,
  Link2,
  Trophy,
  Image as ImageIcon,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { adminApi } from '../../services/adminApi';
import type { Edition } from '../../types/api';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

type EditionFormState = {
  year: number;
  edition_number: number;
  date: string;
  title: string;
  hero_subtitle: string;
  slug: string;
  status: Edition['status'];
  registration_online_url: string;
  results_url: string;
  photos_album_url: string;
};

export function EditionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [edition, setEdition] = useState<Edition | null>(null);
  const [form, setForm] = useState<EditionFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function loadEdition() {
      setLoading(true);
      try {
        // Il n'y a pas de getEdition(id), on filtre la liste
        const editions = await adminApi.getEditions();
        const found = editions.find((e) => e.id === id);
        if (!found) {
          setEdition(null);
          setForm(null);
        } else {
          setEdition(found);
          setForm({
            year: found.year,
            edition_number: found.edition_number,
            date: found.date,
            title: found.title,
            hero_subtitle: found.hero_subtitle ?? '',
            slug: found.slug,
            status: found.status,
            registration_online_url: found.registration_online_url ?? '',
            results_url: found.results_url ?? '',
            photos_album_url: found.photos_album_url ?? '',
          });
        }
      } finally {
        setLoading(false);
      }
    }

    loadEdition();
  }, [id]);

  function updateField<K extends keyof EditionFormState>(
    field: K,
    value: EditionFormState[K],
  ) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id || !form) return;

    if (!form.title.trim() || !form.date || !form.slug.trim()) {
      alert('Titre, date et slug sont obligatoires.');
      return;
    }

    setSaving(true);
    try {
      const updates: Partial<Edition> = {
        year: Number(form.year),
        edition_number: Number(form.edition_number),
        date: form.date,
        title: form.title.trim(),
        slug: form.slug.trim(),
        status: form.status,
        hero_subtitle: form.hero_subtitle.trim() || undefined,
        registration_online_url:
          form.registration_online_url.trim() || undefined,
        results_url: form.results_url.trim() || undefined,
        photos_album_url: form.photos_album_url.trim() || undefined,
      };

      const updated = await adminApi.updateEdition(id, updates);
      setEdition(updated);
      alert('Édition mise à jour.');
    } catch (error: any) {
      console.error(error);
      // On essaie d’afficher un message Supabase le plus précis possible
      const msg =
        (error && (error.message || error.error_description)) ||
        (error && typeof error === 'string'
          ? error
          : JSON.stringify(error, null, 2)) ||
        "Erreur inconnue côté base (Supabase).";
      alert(`Erreur lors de l'enregistrement de l'édition :\n${msg}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  if (!edition || !form) {
    return (
      <AdminLayout>
        <div className="py-24 text-center text-sm text-red-600">
          Édition introuvable.
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/editions')}
            >
              Retour à la liste des éditions
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const isPublished = form.status === 'published';

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/editions')}
            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Retour à la liste
          </button>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Calendar className="h-6 w-6 text-orange-600" />
              Édition {form.year} – {form.title}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Modifie les informations de cette édition : date, textes et liens
              affichés sur le site public.
            </p>
          </div>
        </div>

        <div className="rounded-full border px-3 py-1 text-xs flex items-center gap-2 bg-white">
          <span className="text-gray-500">Statut :</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              form.status === 'published'
                ? 'bg-green-100 text-green-800'
                : form.status === 'archived'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                form.status === 'published'
                  ? 'bg-green-500'
                  : form.status === 'archived'
                  ? 'bg-orange-500'
                  : 'bg-gray-400'
              }`}
            />
            {form.status === 'published'
              ? 'Active'
              : form.status === 'archived'
              ? 'Archivée'
              : 'Brouillon'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[3fr,2fr] gap-6 items-start">
        {/* FORMULAIRE PRINCIPAL */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Informations principales
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Mets à jour l&apos;année, la date, le titre et l&apos;identifiant de
              l&apos;édition.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Année
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.year}
                    onChange={(e) =>
                      updateField('year', Number(e.target.value) || form.year)
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Numéro d&apos;édition
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.edition_number}
                    onChange={(e) =>
                      updateField(
                        'edition_number',
                        Number(e.target.value) || form.edition_number,
                      )
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date de la course
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.date}
                    onChange={(e) => updateField('date', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Titre affiché
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Sous-titre (hero)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.hero_subtitle}
                    onChange={(e) =>
                      updateField('hero_subtitle', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Slug (identifiant dans l&apos;URL)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
                    value={form.slug}
                    onChange={(e) => updateField('slug', e.target.value)}
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    Utilisé dans les URLs. Attention si le slug est déjà utilisé dans des
                    liens publics.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <div className="flex flex-wrap gap-2 text-xs">
                  {(['draft', 'archived'] as Edition['status'][]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updateField('status', status)}
                      className={`rounded-full border px-3 py-1 ${
                        form.status === status
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {status === 'draft' ? 'Brouillon' : 'Archivée'}
                    </button>
                  ))}
                  {isPublished && (
                    <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs text-green-700">
                      Active (statut géré via le bouton « Activer » dans la liste)
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  Pour changer l&apos;édition active, utilise le bouton « Activer » dans
                  la liste des éditions. Ici tu peux passer une édition en brouillon ou
                  archivée.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/editions')}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                  className="inline-flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* PANNEAU LATÉRAL : LIENS + INFO STATUT */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Liens & visibilité publique
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Mets à jour les liens d&apos;inscription, de résultats et l&apos;album
              photos pour cette édition.
            </p>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Lien inscriptions en ligne
                </label>
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.registration_online_url}
                    onChange={(e) =>
                      updateField(
                        'registration_online_url',
                        e.target.value,
                      )
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Lien résultats
                </label>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.results_url}
                    onChange={(e) =>
                      updateField('results_url', e.target.value)
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Lien album photos
                </label>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.photos_album_url}
                    onChange={(e) =>
                      updateField(
                        'photos_album_url',
                        e.target.value,
                      )
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-600">
              <Info className="mt-0.5 h-4 w-4 text-gray-400" />
              <div className="space-y-1">
                <p>
                  C&apos;est l&apos;édition avec le statut{' '}
                  <span className="font-semibold">published</span> qui est
                  considérée comme « active » et affichée sur la page d&apos;accueil.
                </p>
                <p className="text-[11px] text-gray-500">
                  Le bouton « Activer » dans la liste s&apos;occupe d&apos;archiver les
                  autres éditions et de passer celle-ci en active proprement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}