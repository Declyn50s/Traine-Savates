// src/pages/admin/SponsorsAdmin.tsx
import { useEffect, useMemo, useState, FormEvent, ChangeEvent } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/adminApi';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import type { Sponsor } from '../../types/api';
import {
  Award,
  Globe,
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  Search,
  RefreshCw,
  ArrowUpDown,
  ExternalLink,
  UploadCloud,
} from 'lucide-react';

type CategoryKey = 'all' | 'principal' | 'secondary';

function formatCategory(cat?: string | null) {
  if (!cat) return 'Autres';
  if (cat === 'principal') return 'Sponsor principal';
  if (cat === 'secondary') return 'Sponsor secondaire';
  return cat;
}

/**
 * Upload d'un logo dans Supabase Storage.
 * Bucket supposé : "sponsor-logos"
 * Retourne le chemin (ex: "sponsors/uuid.png") à stocker dans logo_asset_id.
 */
async function uploadLogoFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png';
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = `sponsors/${fileName}`;

  const { error } = await supabase.storage
    .from('sponsor-logos')
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error(error);
    throw new Error("Erreur lors de l'upload du logo");
  }

  return filePath;
}

/**
 * À partir du chemin enregistré, renvoie une URL publique :
 * - si c'est déjà une URL http(s) → renvoie tel quel
 * - sinon → getPublicUrl depuis le bucket "sponsor-logos"
 */
function getLogoPublicUrl(logoAssetId?: string | null): string | null {
  if (!logoAssetId) return null;
  if (logoAssetId.startsWith('http://') || logoAssetId.startsWith('https://')) {
    return logoAssetId;
  }
  const { data } = supabase.storage
    .from('sponsor-logos')
    .getPublicUrl(logoAssetId);

  return data?.publicUrl ?? null;
}

export function SponsorsAdmin() {
  const [loading, setLoading] = useState(true);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingLogoId, setUploadingLogoId] = useState<string | 'new' | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey>('all');
  const [sortAsc, setSortAsc] = useState(true);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [newSponsor, setNewSponsor] = useState<Partial<Sponsor>>({
    name: '',
    category: 'principal' as any,
    website_url: '',
    logo_asset_id: '',
    order_index: 0,
  });

  useEffect(() => {
    loadSponsors();
  }, []);

  async function loadSponsors() {
    setLoading(true);
    try {
      const data = await adminApi.getSponsors();
      setSponsors(data);
    } finally {
      setLoading(false);
    }
  }

  function updateField(id: string, field: keyof Sponsor, value: any) {
    setSponsors((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function updateNewField(field: keyof Sponsor, value: any) {
    setNewSponsor((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveSponsor(sponsor: Sponsor) {
    setSavingId(sponsor.id);
    try {
      const { id, created_at, ...updates } = sponsor as any;
      const updated = await adminApi.updateSponsor(id, updates);
      setSponsors((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } finally {
      setSavingId(null);
    }
  }

  async function handleDeleteSponsor(id: string) {
    if (!window.confirm('Supprimer définitivement ce sponsor ?')) return;
    await adminApi.deleteSponsor(id);
    setSponsors((prev) => prev.filter((s) => s.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  async function handleCreateSponsor(e: FormEvent) {
    e.preventDefault();
    if (!newSponsor.name || newSponsor.name.trim().length < 2) {
      alert('Le nom du sponsor est obligatoire.');
      return;
    }

    const created = await adminApi.createSponsor(newSponsor);
    setSponsors((prev) => [...prev, created]);
    setNewSponsor({
      name: '',
      category: 'secondary' as any,
      website_url: '',
      logo_asset_id: '',
      order_index: (created as any).order_index ?? 0,
    });
    setExpandedId(created.id);
    setUploadingLogoId(null);
  }

  /**
   * Upload pour un sponsor EXISTANT
   */
  async function handleLogoChangeForSponsor(
    sponsor: Sponsor,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogoId(sponsor.id);
    try {
      const path = await uploadLogoFile(file);
      // On met à jour dans le state
      updateField(sponsor.id, 'logo_asset_id' as keyof Sponsor, path);
      // Et on sauvegarde directement côté DB
      await handleSaveSponsor({
        ...sponsor,
        logo_asset_id: path as any,
      } as Sponsor);
    } catch (err) {
      alert((err as Error).message || "Impossible d'uploader le logo");
    } finally {
      setUploadingLogoId(null);
      // on reset l'input file
      event.target.value = '';
    }
  }

  /**
   * Upload pour le NOUVEAU sponsor (pas encore créé)
   */
  async function handleLogoChangeForNew(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogoId('new');
    try {
      const path = await uploadLogoFile(file);
      setNewSponsor((prev) => ({
        ...prev,
        logo_asset_id: path as any,
      }));
    } catch (err) {
      alert((err as Error).message || "Impossible d'uploader le logo");
    } finally {
      setUploadingLogoId(null);
      event.target.value = '';
    }
  }

  const stats = useMemo(() => {
    const total = sponsors.length;
    const principal = sponsors.filter((s) => s.category === 'principal').length;
    const secondary = sponsors.filter((s) => s.category === 'secondary').length;
    const other = total - principal - secondary;
    return { total, principal, secondary, other };
  }, [sponsors]);

  const filteredSponsors = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let list = sponsors;

    if (categoryFilter !== 'all') {
      list = list.filter((s) => (s.category || 'other') === categoryFilter);
    }

    if (term) {
      list = list.filter((s) => {
        const name = s.name?.toLowerCase() ?? '';
        const site = (s.website_url ?? '').toLowerCase();
        const cat = (s.category ?? '').toLowerCase();
        const logo = (s as any).logo_asset_id?.toString().toLowerCase() ?? '';
        return (
          name.includes(term) ||
          site.includes(term) ||
          cat.includes(term) ||
          logo.includes(term)
        );
      });
    }

    list = [...list].sort((a, b) => {
      const ao = (a as any).order_index ?? 0;
      const bo = (b as any).order_index ?? 0;
      return sortAsc ? ao - bo : bo - ao;
    });

    return list;
  }, [sponsors, searchTerm, categoryFilter, sortAsc]);

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
      {/* HEADER */}
      <div className="flex flex-col gap-3 mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-orange-600" />
            Sponsors &amp; partenaires
          </h1>

          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1 rounded-full bg-white border border-gray-200 px-3 py-1">
              <span className="font-semibold">{stats.total}</span>
              <span>sponsors au total</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="px-2 py-1 rounded-full bg-orange-50 text-[11px] text-orange-700">
                Principaux&nbsp;: {stats.principal}
              </span>
              <span className="px-2 py-1 rounded-full bg-gray-100 text-[11px] text-gray-700">
                Secondaires&nbsp;: {stats.secondary}
              </span>
              {stats.other > 0 && (
                <span className="px-2 py-1 rounded-full bg-slate-100 text-[11px] text-slate-700">
                  Autres&nbsp;: {stats.other}
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={loadSponsors}
              className="inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Recharger
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-600 max-w-3xl">
          Ici tu gères les logos, les catégories et les liens des sponsors qui s&apos;affichent
          sur la page publique. Le but : mettre les partenaires en valeur sans se prendre la tête.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[3fr,2fr] gap-6 items-start">
        {/* LISTE + EDITION */}
        <Card className="max-h-[900px] flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold">Liste des sponsors</h2>
                <p className="text-sm text-gray-500">
                  Recherche, filtre, tri et modification des détails (nom, logo, site, ordre).
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {/* Recherche */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-2 top-2.5" />
                <input
                  className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-1.5 text-sm"
                  placeholder="Rechercher (nom, site, catégorie, ID logo)…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtre catégorie */}
              <select
                className="border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-700"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CategoryKey)}
              >
                <option value="all">Toutes catégories</option>
                <option value="principal">Sponsors principaux</option>
                <option value="secondary">Sponsors secondaires</option>
              </select>

              {/* Tri */}
              <button
                type="button"
                onClick={() => setSortAsc((s) => !s)}
                className="inline-flex items-center gap-1 text-xs text-gray-600 border border-gray-300 rounded-md px-2 py-1.5 hover:bg-gray-50"
              >
                <ArrowUpDown className="w-3 h-3" />
                Ordre&nbsp;
                <span className="font-semibold">{sortAsc ? '1 → 9' : '9 → 1'}</span>
              </button>

              <span className="text-[11px] text-gray-500">
                {filteredSponsors.length} sponsor(s) affiché(s)
              </span>
            </div>
          </CardHeader>

          <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
            {filteredSponsors.length === 0 && (
              <div className="text-xs text-gray-500 border border-dashed border-gray-300 rounded-md px-3 py-4 bg-gray-50">
                Aucun sponsor ne correspond à ces filtres. Modifie la recherche ou ajoute un
                nouveau sponsor dans le panneau de droite.
              </div>
            )}

            {filteredSponsors.map((sponsor) => {
              const isExpanded = expandedId === sponsor.id;
              const logoUrl = getLogoPublicUrl((sponsor as any).logo_asset_id);
              const isUploading = uploadingLogoId === sponsor.id;

              return (
                <div
                  key={sponsor.id}
                  className="border border-gray-200 rounded-lg bg-white text-sm"
                >
                  {/* En-tête cliquable */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId((cur) => (cur === sponsor.id ? null : sponsor.id))
                    }
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={sponsor.name}
                          className="h-8 w-auto rounded bg-white border border-gray-200 object-contain hidden sm:block"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hidden sm:flex">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}

                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-gray-900 truncate">
                          {sponsor.name || 'Sans nom'}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] bg-orange-50 text-orange-700">
                            {formatCategory(sponsor.category)}
                          </span>
                          {sponsor.website_url && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                              <Globe className="w-3 h-3" />
                              {new URL(sponsor.website_url).hostname.replace('www.', '')}
                            </span>
                          )}
                          {(sponsor as any).logo_asset_id && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                              <ImageIcon className="w-3 h-3" />
                              Logo&nbsp;:{' '}
                              <span className="font-mono">
                                {(sponsor as any).logo_asset_id.toString().slice(0, 10)}…
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-gray-400">
                        Ordre&nbsp;{(sponsor as any).order_index ?? 0}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {isExpanded ? 'Fermer' : 'Modifier'}
                      </span>
                    </div>
                  </button>

                  {/* Zone d'édition expandée */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 px-3 py-3 space-y-4">
                      {/* Logo + upload */}
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="flex flex-col items-start gap-2">
                          <span className="block text-xs font-medium text-gray-600">
                            Logo
                          </span>
                          <div className="h-16 w-32 border border-gray-200 rounded bg-white flex items-center justify-center overflow-hidden">
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={sponsor.name}
                                className="max-h-16 max-w-full object-contain"
                              />
                            ) : (
                              <div className="flex flex-col items-center text-[11px] text-gray-400">
                                <ImageIcon className="w-4 h-4 mb-1" />
                                <span>Aucun logo</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 space-y-2 text-xs text-gray-600">
                          <label className="block font-medium mb-1">
                            Importer / remplacer le logo
                          </label>
                          <p className="text-[11px] text-gray-500">
                            Formats recommandés : PNG ou SVG sur fond transparent. Le fichier sera
                            envoyé dans le Storage Supabase (bucket{' '}
                            <code>sponsor-logos</code>).
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
                              <UploadCloud className="w-4 h-4" />
                              <span>
                                {isUploading ? 'Upload en cours…' : 'Choisir un fichier'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleLogoChangeForSponsor(sponsor, e)
                                }
                                disabled={isUploading}
                              />
                            </label>
                            {(sponsor as any).logo_asset_id && (
                              <span className="text-[11px] text-gray-500">
                                ID&nbsp;:{' '}
                                <span className="font-mono">
                                  {(sponsor as any).logo_asset_id.toString()}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Infos texte */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Nom du sponsor
                          </label>
                          <input
                            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                            value={sponsor.name || ''}
                            onChange={(e) =>
                              updateField(sponsor.id, 'name', e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Catégorie
                          </label>
                          <select
                            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                            value={sponsor.category || 'secondary'}
                            onChange={(e) =>
                              updateField(sponsor.id, 'category', e.target.value)
                            }
                          >
                            <option value="principal">Sponsor principal</option>
                            <option value="secondary">Sponsor secondaire</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Site web (optionnel)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                              value={sponsor.website_url || ''}
                              onChange={(e) =>
                                updateField(sponsor.id, 'website_url', e.target.value)
                              }
                              placeholder="https://…"
                            />
                            {sponsor.website_url && (
                              <a
                                href={sponsor.website_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2 py-1 hover:bg-gray-100"
                              >
                                <ExternalLink className="w-3 h-3 text-gray-700" />
                              </a>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-gray-500">
                            Si renseigné, le logo côté front pourra pointer vers ce site.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Identifiant logo (path Storage ou URL directe)
                          </label>
                          <input
                            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm font-mono"
                            value={(sponsor as any).logo_asset_id || ''}
                            onChange={(e) =>
                              updateField(
                                sponsor.id,
                                'logo_asset_id' as any,
                                e.target.value,
                              )
                            }
                            placeholder="sponsors/xxxx.png ou https://…"
                          />
                          <p className="mt-1 text-[11px] text-gray-500">
                            Tu peux aussi coller ici une URL d&apos;image externe, elle sera
                            utilisée telle quelle.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Ordre d&apos;affichage
                          </label>
                          <input
                            type="number"
                            className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm"
                            value={(sponsor as any).order_index ?? 0}
                            onChange={(e) =>
                              updateField(
                                sponsor.id,
                                'order_index' as any,
                                Number(e.target.value) || 0,
                              )
                            }
                          />
                          <p className="mt-1 text-[11px] text-gray-500">
                            1 = affiché en premier dans sa catégorie.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSaveSponsor(sponsor)}
                            disabled={savingId === sponsor.id}
                          >
                            <Save className="w-4 h-4 mr-1" />
                            {savingId === sponsor.id ? 'Enregistrement…' : 'Enregistrer'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSponsor(sponsor.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* CREATION / APERÇU NOUVEAU SPONSOR */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Ajouter un sponsor</h2>
            <p className="text-sm text-gray-500">
              Crée un nouveau sponsor et, si tu veux, importe déjà son logo. Tu pourras ensuite
              affiner dans la liste.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <form onSubmit={handleCreateSponsor} className="space-y-4">
              {/* Logo nouveau sponsor */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Logo (optionnel)
                </label>
                <div className="flex items-start gap-4">
                  <div className="h-16 w-32 border border-gray-200 rounded bg-white flex items-center justify-center overflow-hidden">
                    {newSponsor.logo_asset_id ? (
                      <img
                        src={getLogoPublicUrl(newSponsor.logo_asset_id as any) ?? ''}
                        alt={newSponsor.name || 'Nouveau sponsor'}
                        className="max-h-16 max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-[11px] text-gray-400">
                        <ImageIcon className="w-4 h-4 mb-1" />
                        <span>Aucun logo</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2 text-xs text-gray-600">
                    <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
                      <UploadCloud className="w-4 h-4" />
                      <span>
                        {uploadingLogoId === 'new'
                          ? 'Upload en cours…'
                          : 'Choisir un fichier'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChangeForNew}
                        disabled={uploadingLogoId === 'new'}
                      />
                    </label>
                    {newSponsor.logo_asset_id && (
                      <p className="text-[11px] text-gray-500">
                        ID :{' '}
                        <span className="font-mono">
                          {(newSponsor.logo_asset_id as any).toString()}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nom du sponsor
                </label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={newSponsor.name || ''}
                  onChange={(e) => updateNewField('name', e.target.value)}
                  placeholder="Ex. BCV, Migros Vaud…"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Catégorie
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={(newSponsor.category as any) || 'principal'}
                    onChange={(e) => updateNewField('category', e.target.value as any)}
                  >
                    <option value="principal">Sponsor principal</option>
                    <option value="secondary">Sponsor secondaire</option>
                  </select>
                  <p className="mt-1 text-[11px] text-gray-500">
                    Les sponsors « principaux » peuvent être mis plus en avant sur le front.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Ordre d&apos;affichage
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={(newSponsor as any).order_index ?? 0}
                    onChange={(e) =>
                      updateNewField('order_index' as any, Number(e.target.value) || 0)
                    }
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    Valeur indicative, tu pourras ajuster ensuite.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Site web (optionnel)
                </label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={newSponsor.website_url || ''}
                  onChange={(e) => updateNewField('website_url', e.target.value)}
                  placeholder="https://…"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Identifiant logo (path Storage ou URL directe) (optionnel)
                </label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                  value={(newSponsor as any).logo_asset_id || ''}
                  onChange={(e) =>
                    updateNewField('logo_asset_id' as any, e.target.value)
                  }
                  placeholder="sponsors/xxxx.png ou https://…"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-gray-500 max-w-xs">
                  Tu peux soit uploader un logo (Storage), soit coller une URL d&apos;image
                  existante.
                </p>
                <Button type="submit" variant="primary" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter le sponsor
                </Button>
              </div>
            </form>

            {/* Mini explication front */}
            <div className="mt-4 border-t border-gray-200 pt-4">
              <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Comment l&apos;utiliser côté front
              </h3>
              <div className="border border-dashed border-gray-300 rounded-lg p-3 text-[11px] text-gray-600 bg-gray-50 space-y-2">
                <p>
                  Le front pourra récupérer <code>logo_asset_id</code> pour chaque sponsor et :
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    si la valeur commence par <code>http</code> → utiliser directement comme
                    <code>src</code>,
                  </li>
                  <li>
                    sinon → appeler <code>supabase.storage.from('sponsor-logos')</code> avec ce
                    path pour obtenir l&apos;URL publique.
                  </li>
                </ul>
                <p className="mt-1">
                  Les sponsors « principaux » et « secondaires » peuvent être affichés dans des
                  sections séparées ou avec des tailles de logos différentes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
