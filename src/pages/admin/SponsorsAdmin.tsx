import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/adminApi';
import type { Sponsor } from '../../types/api';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Award,
  Eye,
  EyeOff,
  Globe2,
  GripVertical,
  Plus,
  Trash2,
  Save,
  Info,
} from 'lucide-react';

type SponsorFormState = {
  name: string;
  category: 'principal' | 'secondary';
  logo_asset_id: string;
  website_url: string;
};

export function SponsorsAdmin() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);

  const [sectionVisible, setSectionVisible] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const [editingSponsorId, setEditingSponsorId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<SponsorFormState | null>(null);

  const [newSponsorForm, setNewSponsorForm] = useState<SponsorFormState>({
    name: '',
    category: 'principal',
    logo_asset_id: '',
    website_url: '',
  });

  useEffect(() => {
    loadSponsors();
  }, []);

  async function loadSponsors() {
    setLoading(true);
    try {
      const data = await adminApi.getSponsors();
      // tri par order_index croissant
      const sorted = [...data].sort(
        (a, b) => (a.order_index || 0) - (b.order_index || 0),
      );
      setSponsors(sorted);

      if (sorted.length > 0) {
        const anySectionHidden = sorted.some((s) => s.section_visible === false);
        setSectionVisible(!anySectionHidden);
      } else {
        setSectionVisible(true);
      }
    } finally {
      setLoading(false);
    }
  }

  function startEdit(sponsor: Sponsor) {
    setEditingSponsorId(sponsor.id);
    setEditingForm({
      name: sponsor.name,
      category: sponsor.category,
      logo_asset_id: sponsor.logo_asset_id || '',
      website_url: sponsor.website_url || '',
    });
  }

  function cancelEdit() {
    setEditingSponsorId(null);
    setEditingForm(null);
  }

  async function saveEdit() {
    if (!editingSponsorId || !editingForm) return;
    try {
      const updated = await adminApi.updateSponsor(editingSponsorId, {
        name: editingForm.name.trim(),
        category: editingForm.category,
        logo_asset_id: editingForm.logo_asset_id.trim() || null,
        website_url: editingForm.website_url.trim() || null,
      });
      setSponsors((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s)),
      );
      cancelEdit();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la mise à jour du sponsor.");
    }
  }

  async function handleCreateSponsor(e: React.FormEvent) {
    e.preventDefault();
    if (!newSponsorForm.name.trim()) {
      alert('Le nom du sponsor est obligatoire.');
      return;
    }

    try {
      const created = await adminApi.createSponsor({
        name: newSponsorForm.name.trim(),
        category: newSponsorForm.category,
        logo_asset_id: newSponsorForm.logo_asset_id.trim() || null,
        website_url: newSponsorForm.website_url.trim() || null,
        order_index: sponsors.length
          ? Math.max(...sponsors.map((s) => s.order_index || 0)) + 1
          : 1,
        is_visible: true,
        section_visible: sectionVisible,
      } as Partial<Sponsor>);

      setSponsors((prev) =>
        [...prev, created].sort(
          (a, b) => (a.order_index || 0) - (b.order_index || 0),
        ),
      );
      setNewSponsorForm({
        name: '',
        category: 'principal',
        logo_asset_id: '',
        website_url: '',
      });
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création du sponsor.");
    }
  }

  async function handleDeleteSponsor(id: string) {
    if (!window.confirm('Supprimer ce sponsor ?')) return;
    try {
      await adminApi.deleteSponsor(id);
      setSponsors((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression du sponsor.");
    }
  }

  async function toggleSponsorVisibility(sponsor: Sponsor) {
    const newValue = sponsor.is_visible === false ? true : false;
    try {
      const updated = await adminApi.updateSponsor(sponsor.id, {
        is_visible: newValue,
      });
      setSponsors((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s)),
      );
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la mise à jour de la visibilité du sponsor.");
    }
  }

  async function handleToggleSectionVisible() {
    const newValue = !sectionVisible;
    setSectionVisible(newValue);
    try {
      // on applique la valeur à tous les sponsors existants
      await Promise.all(
        sponsors.map((s) =>
          adminApi.updateSponsor(s.id, { section_visible: newValue }),
        ),
      );
      setSponsors((prev) =>
        prev.map((s) => ({ ...s, section_visible: newValue })),
      );
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la mise à jour de la rubrique sponsors.");
      setSectionVisible(!newValue);
    }
  }

  // Drag & drop
  function handleDragStart(id: string) {
    return (e: React.DragEvent<HTMLDivElement>) => {
      setDraggedId(id);
      e.dataTransfer.effectAllowed = 'move';
    };
  }

  function handleDragOver(id: string) {
    return (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!draggedId || draggedId === id) return;

      setSponsors((prev) => {
        const currentIndex = prev.findIndex((s) => s.id === draggedId);
        const targetIndex = prev.findIndex((s) => s.id === id);
        if (currentIndex === -1 || targetIndex === -1) return prev;

        const updated = [...prev];
        const [moved] = updated.splice(currentIndex, 1);
        updated.splice(targetIndex, 0, moved);

        return updated.map((s, index) => ({
          ...s,
          order_index: index + 1,
        }));
      });
    };
  }

  async function handleDragEnd() {
    if (!draggedId) return;
    setDraggedId(null);
    setSavingOrder(true);
    try {
      await Promise.all(
        sponsors.map((s) =>
          adminApi.updateSponsor(s.id, { order_index: s.order_index }),
        ),
      );
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement du nouvel ordre des sponsors.");
    } finally {
      setSavingOrder(false);
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-orange-600" />
              Gestion des sponsors
            </h1>
            <p className="mt-1 text-sm text-gray-600 max-w-2xl">
              Ajoute, réorganise et masque les sponsors affichés sur le site
              public.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              Rubrique Sponsors sur le site
            </span>
            <button
              type="button"
              onClick={handleToggleSectionVisible}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                sectionVisible
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 bg-gray-50 text-gray-600'
              }`}
            >
              {sectionVisible ? (
                <>
                  <Eye className="w-3 h-3" />
                  Visible
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3" />
                  Masquée
                </>
              )}
            </button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Liste des sponsors
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Glisse-dépose les cartes pour changer l&apos;ordre. Les
                  sponsors sont affichés dans cet ordre sur le site.
                </p>
              </div>
              {savingOrder && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Save className="w-3 h-3" />
                  <span>Enregistrement de l&apos;ordre...</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500">Chargement…</p>
            ) : sponsors.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aucun sponsor enregistré pour l&apos;instant. Utilise le
                formulaire ci-dessous pour en ajouter.
              </p>
            ) : (
              <div className="space-y-3">
                {sponsors.map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className={`flex items-center justify-between gap-4 rounded-lg border bg-white px-3 py-2 text-sm shadow-sm ${
                      draggedId === sponsor.id
                        ? 'opacity-70 ring-2 ring-orange-400'
                        : ''
                    }`}
                    draggable
                    onDragStart={handleDragStart(sponsor.id)}
                    onDragOver={handleDragOver(sponsor.id)}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDragEnd}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="cursor-grab text-gray-400 hover:text-gray-600">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      {sponsor.logo_asset_id && (
                        <img
                          src={`/api/assets/${sponsor.logo_asset_id}`}
                          alt={sponsor.name}
                          className="h-10 w-24 object-contain rounded bg-gray-50"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {sponsor.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 ${
                              sponsor.category === 'principal'
                                ? 'bg-orange-50 text-orange-700 border border-orange-100'
                                : 'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}
                          >
                            {sponsor.category === 'principal'
                              ? 'Sponsor principal'
                              : 'Sponsor'}
                          </span>
                          {typeof sponsor.order_index === 'number' && (
                            <span className="text-gray-400">
                              Ordre : {sponsor.order_index}
                            </span>
                          )}
                          {sponsor.website_url && (
                            <a
                              href={sponsor.website_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                            >
                              <Globe2 className="w-3 h-3" />
                              <span className="truncate max-w-[180px]">
                                {sponsor.website_url}
                              </span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleSponsorVisibility(sponsor)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${
                          sponsor.is_visible === false
                            ? 'border-gray-300 text-gray-500 bg-gray-50'
                            : 'border-green-500 text-green-700 bg-green-50'
                        }`}
                      >
                        {sponsor.is_visible === false ? (
                          <>
                            <EyeOff className="w-3 h-3" />
                            Masqué
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            Visible
                          </>
                        )}
                      </button>

                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => startEdit(sponsor)}
                      >
                        Modifier
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSponsor(sponsor.id)}
                        className="inline-flex items-center justify-center rounded-full border border-red-100 bg-red-50 p-1 text-red-600 hover:bg-red-100"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Edition du sponsor sélectionné */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                Modifier un sponsor
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Sélectionne un sponsor dans la liste pour modifier ses
                informations.
              </p>
            </CardHeader>
            <CardContent>
              {!editingSponsorId || !editingForm ? (
                <p className="text-sm text-gray-500">
                  Aucun sponsor sélectionné. Clique sur « Modifier » dans la
                  liste ci-dessus.
                </p>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveEdit();
                  }}
                  className="space-y-4 text-sm"
                >
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Nom du sponsor
                    </label>
                    <input
                      type="text"
                      value={editingForm.name}
                      onChange={(e) =>
                        setEditingForm((prev) =>
                          prev ? { ...prev, name: e.target.value } : prev,
                        )
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Catégorie
                    </label>
                    <select
                      value={editingForm.category}
                      onChange={(e) =>
                        setEditingForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                category: e.target.value as
                                  | 'principal'
                                  | 'secondary',
                              }
                            : prev,
                        )
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="principal">Sponsor principal</option>
                      <option value="secondary">Autre sponsor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Logo (asset id)
                    </label>
                    <input
                      type="text"
                      value={editingForm.logo_asset_id}
                      onChange={(e) =>
                        setEditingForm((prev) =>
                          prev
                            ? { ...prev, logo_asset_id: e.target.value }
                            : prev,
                        )
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
                      placeholder="ex: sponsor_logo_01"
                    />
                    <p className="mt-1 text-[11px] text-gray-500">
                      Identifiant d&apos;un asset Supabase. Le logo sera
                      affiché sur le site public.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Site web (URL)
                    </label>
                    <input
                      type="url"
                      value={editingForm.website_url}
                      onChange={(e) =>
                        setEditingForm((prev) =>
                          prev
                            ? { ...prev, website_url: e.target.value }
                            : prev,
                        )
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={cancelEdit}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" variant="primary" size="sm">
                      Enregistrer
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Création d'un nouveau sponsor */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                Ajouter un sponsor
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Ajoute un nouveau sponsor. Tu pourras ensuite le
                réorganiser dans la liste.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSponsor} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nom du sponsor
                  </label>
                  <input
                    type="text"
                    value={newSponsorForm.name}
                    onChange={(e) =>
                      setNewSponsorForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={newSponsorForm.category}
                    onChange={(e) =>
                      setNewSponsorForm((prev) => ({
                        ...prev,
                        category: e.target.value as 'principal' | 'secondary',
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="principal">Sponsor principal</option>
                    <option value="secondary">Autre sponsor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Logo (asset id)
                  </label>
                  <input
                    type="text"
                    value={newSponsorForm.logo_asset_id}
                    onChange={(e) =>
                      setNewSponsorForm((prev) => ({
                        ...prev,
                        logo_asset_id: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
                    placeholder="ex: sponsor_logo_01"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Site web (URL)
                  </label>
                  <input
                    type="url"
                    value={newSponsorForm.website_url}
                    onChange={(e) =>
                      setNewSponsorForm((prev) => ({
                        ...prev,
                        website_url: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-start gap-2 mt-2 text-[11px] text-gray-500">
                  <Info className="w-3 h-3 mt-0.5" />
                  <p>
                    Le sponsor sera automatiquement ajouté en bas de la
                    liste. Tu peux ensuite le glisser-déposer pour changer
                    sa position.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter le sponsor
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
