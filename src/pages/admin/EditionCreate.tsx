// src/pages/admin/EditionCreate.tsx
import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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

type EditionFormState = {
  year: number;
  edition_number: number;
  date: string;
  title: string;
  hero_subtitle: string;
  slug: string;
  registration_online_url: string;
  results_url: string;
  photos_album_url: string;
};

export function EditionCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState<EditionFormState>({
    year: new Date().getFullYear(),
    edition_number: 1,
    date: '',
    title: '',
    hero_subtitle: '',
    slug: '',
    registration_online_url: '',
    results_url: '',
    photos_album_url: '',
  });

  const [basedOnEdition, setBasedOnEdition] = useState<Edition | null>(null);
  const [loadingDefaults, setLoadingDefaults] = useState(true);
  const [saving, setSaving] = useState(false);

  // Charger les éditions existantes pour proposer de bons defaults
  useEffect(() => {
    async function loadDefaults() {
      try {
        const editions = await adminApi.getEditions();

        if (editions.length === 0) {
          // Première édition
          const year = new Date().getFullYear();
          setForm((prev) => ({
            ...prev,
            year,
            edition_number: 1,
            date: `${year}-04-18`,
            title: `Course des Traîne-Savates ${year}`,
            slug: year.toString(),
          }));
          setBasedOnEdition(null);
          return;
        }

        // Editions triées par date desc côté API
        const last = editions[0];
        setBasedOnEdition(last);

        const lastYear = last.year;
        const nowYear = new Date().getFullYear();
        const year =
          lastYear >= nowYear ? lastYear + 1 : Math.max(nowYear, lastYear + 1);

        let date = '';
        if (last.date) {
          const d = new Date(last.date);
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          date = `${year}-${month}-${day}`;
        } else {
          date = `${year}-04-18`;
        }

        setForm({
          year,
          edition_number: last.edition_number + 1,
          date,
          title: `Course des Traîne-Savates ${year}`,
          hero_subtitle: '',
          slug: year.toString(),
          registration_online_url: '',
          results_url: '',
          photos_album_url: '',
        });
      } finally {
        setLoadingDefaults(false);
      }
    }

    loadDefaults();
  }, []);

  function updateField<K extends keyof EditionFormState>(
    field: K,
    value: EditionFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.slug.trim()) {
      alert('Titre, date et slug sont obligatoires.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Edition> = {
        year: Number(form.year),
        edition_number: Number(form.edition_number),
        date: form.date,
        title: form.title.trim(),
        slug: form.slug.trim(),
        status: 'draft',
      };

      if (form.hero_subtitle.trim()) {
        payload.hero_subtitle = form.hero_subtitle.trim();
      }
      if (form.registration_online_url.trim()) {
        payload.registration_online_url = form.registration_online_url.trim();
      }
      if (form.results_url.trim()) {
        payload.results_url = form.results_url.trim();
      }
      if (form.photos_album_url.trim()) {
        payload.photos_album_url = form.photos_album_url.trim();
      }

      const created = await adminApi.createEdition(payload);

      // Rediriger vers la page d’édition détaillée
      navigate(`/admin/editions/${created.id}`);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création de l'édition.");
    } finally {
      setSaving(false);
    }
  }

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
              Créer une nouvelle édition
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Prépare la prochaine course : année, date, titre et liens principaux.
              L&apos;édition sera créée en brouillon, tu pourras l&apos;activer plus
              tard.
            </p>
          </div>
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
              Ces champs définissent l&apos;identité de l&apos;édition : année, numéro,
              date et titre affiché sur le site.
            </p>
          </CardHeader>
          <CardContent>
            {loadingDefaults ? (
              <div className="py-10 text-sm text-gray-500">
                Chargement des valeurs par défaut…
              </div>
            ) : (
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
                        updateField('year', Number(e.target.value) || new Date().getFullYear())
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
                          Number(e.target.value) || 1,
                        )
                      }
                    />
                    <p className="mt-1 text-[11px] text-gray-500">
                      32e, 33e, etc.
                    </p>
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
                      placeholder="Course des Traîne-Savates 2026"
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
                      placeholder="Rendez-vous le samedi 18 avril pour la 32e édition !"
                    />
                    <p className="mt-1 text-[11px] text-gray-500">
                      Affiché sous le titre principal sur la page d&apos;accueil.
                    </p>
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
                      placeholder="2026"
                    />
                    <p className="mt-1 text-[11px] text-gray-500">
                      Utilisé pour les URLs. Ex : <code>/la-course/2026</code>.
                    </p>
                  </div>
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
                    {saving ? 'Création…' : 'Créer l’édition'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* PANNEAU LATÉRAL : LIENS + RÉCAP */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Liens & aperçu public
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Tu peux déjà préparer les liens d&apos;inscription, de résultats et
              l&apos;album photos. Tout est modifiable ensuite.
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
                      updateField('registration_online_url', e.target.value)
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
                      updateField('photos_album_url', e.target.value)
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-600 flex gap-2">
              <Info className="mt-0.5 h-4 w-4 text-gray-400" />
              <div className="space-y-1">
                <p>
                  L&apos;édition sera créée avec le statut{' '}
                  <span className="font-semibold">brouillon</span>. C&apos;est le
                  bouton « Activer » dans la liste qui la passera en édition active
                  (et archivera la précédente).
                </p>
                {basedOnEdition && (
                  <p className="text-[11px] text-gray-500">
                    Suggestions calculées à partir de l&apos;édition{' '}
                    <span className="font-semibold">
                      {basedOnEdition.year} – {basedOnEdition.title}
                    </span>
                    .
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
