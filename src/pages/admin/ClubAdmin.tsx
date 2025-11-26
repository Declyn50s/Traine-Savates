// src/pages/admin/ClubAdmin.tsx
import {
  useEffect,
  useState,
  useMemo,
  FormEvent,
  ChangeEvent,
} from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/adminApi';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';
import type {
  ClubContent,
  TrainingSession,
  CommitteeMember,
} from '../../types/api';
import {
  Users,
  Calendar,
  MapPin,
  Save,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  Info,
  UploadCloud,
  Image as ImageIcon,
} from 'lucide-react';

type TabKey = 'content' | 'trainings' | 'committee';
type TrainingCategory = 'adult' | 'junior' | 'nordic' | 'prep_20km';

const TRAINING_CATEGORY_LABELS: Record<TrainingCategory, string> = {
  adult: 'Adultes',
  junior: 'Juniors',
  nordic: 'Nordic walking',
  prep_20km: 'Préparation 20 km',
};

function formatDate(dateString?: string | null) {
  if (!dateString) return 'Jamais enregistré';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return 'Date inconnue';
  return d.toLocaleString('fr-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Upload d'une photo de membre dans Supabase Storage.
 * Bucket : "committee-photos"
 * Retourne le chemin (ex: "committee/uuid.png") à stocker dans photo_asset_id.
 */
async function uploadCommitteePhoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png';
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = `committee/${fileName}`;

  const { error } = await supabase.storage
    .from('committee-photos')
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error(error);
    throw new Error("Erreur lors de l'upload de la photo");
  }

  return filePath;
}

/**
 * Génère une URL publique à partir de photo_asset_id :
 * - si c'est déjà une URL http(s) → renvoyée telle quelle
 * - sinon → bucket "committee-photos"
 */
function getCommitteePhotoUrl(photoAssetId?: string | null): string | null {
  if (!photoAssetId) return null;
  if (photoAssetId.startsWith('http://') || photoAssetId.startsWith('https://')) {
    return photoAssetId;
  }
  const { data } = supabase.storage
    .from('committee-photos')
    .getPublicUrl(photoAssetId);

  return data?.publicUrl ?? null;
}

export function ClubAdmin() {
  const [tab, setTab] = useState<TabKey>('content');

  const [loading, setLoading] = useState(true);

  const [clubContent, setClubContent] = useState<ClubContent | null>(null);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([]);

  const [savingContent, setSavingContent] = useState(false);
  const [savingTrainingId, setSavingTrainingId] = useState<string | null>(null);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);

  const [uploadingMemberPhotoId, setUploadingMemberPhotoId] =
    useState<string | 'new' | null>(null);

  const [trainingSearch, setTrainingSearch] = useState('');
  const [trainingCategoryFilter, setTrainingCategoryFilter] =
    useState<'all' | TrainingCategory>('all');
  const [expandedTrainingId, setExpandedTrainingId] = useState<string | null>(null);

  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const [newSession, setNewSession] = useState<Partial<TrainingSession>>({
    category: 'adult' as any,
    title: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    location: '',
    level: '',
    description: '',
    target_audience: '',
    order_index: 0,
  });

  const [newMember, setNewMember] = useState<
    Partial<CommitteeMember> & { photo_asset_id?: string }
  >({
    first_name: '',
    last_name: '',
    role: '',
    email: '',
    phone: '',
    order_index: 0,
    photo_asset_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      let content: ClubContent | null = null;
      try {
        content = await adminApi.getClubContent();
      } catch {
        // Première fois : objet par défaut
        content = {
          id: '' as any,
          club_intro: '',
          club_history: '',
          club_spirit: '',
          members_count: 0,
          founded_year: new Date().getFullYear(),
          updated_at: null as any,
        } as ClubContent;
      }

      const [sessions, committee] = await Promise.all([
        adminApi.getTrainingSessions(),
        adminApi.getCommitteeMembers(),
      ]);

      setClubContent(content);
      setTrainingSessions(sessions);
      setCommitteeMembers(committee);
    } finally {
      setLoading(false);
    }
  }

  // ——————————————————————
  // CLUB CONTENT
  // ——————————————————————

  function updateContentField<K extends keyof ClubContent>(
    field: K,
    value: ClubContent[K],
  ) {
    setClubContent((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSaveContent(e: FormEvent) {
    e.preventDefault();
    if (!clubContent) return;

    setSavingContent(true);
    try {
      const { id, updated_at, ...updates } = clubContent as any;
      const saved = await adminApi.updateClubContent(updates);
      setClubContent(saved);
    } finally {
      setSavingContent(false);
    }
  }

  // ——————————————————————
  // ENTRAÎNEMENTS
  // ——————————————————————

  function updateSessionField(
    id: string,
    field: keyof TrainingSession,
    value: any,
  ) {
    setTrainingSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  }

  function updateNewSession<K extends keyof TrainingSession>(
    field: K,
    value: any,
  ) {
    setNewSession((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveSession(session: TrainingSession) {
    setSavingTrainingId(session.id);
    try {
      const { id, created_at, ...updates } = session as any;
      const updated = await adminApi.updateTrainingSession(id, updates);
      setTrainingSessions((prev) =>
        prev.map((s) => (s.id === id ? updated : s)),
      );
    } finally {
      setSavingTrainingId(null);
    }
  }

  async function handleDeleteSession(id: string) {
    if (!window.confirm('Supprimer cette séance ?')) return;
    await adminApi.deleteTrainingSession(id);
    setTrainingSessions((prev) => prev.filter((s) => s.id !== id));
    if (expandedTrainingId === id) setExpandedTrainingId(null);
  }

  async function handleCreateSession(e: FormEvent) {
    e.preventDefault();
    if (!newSession.title || !newSession.day_of_week || !newSession.start_time) {
      alert('Titre, jour et heure de début sont obligatoires.');
      return;
    }

    const created = await adminApi.createTrainingSession(newSession);
    setTrainingSessions((prev) => [...prev, created]);
    setNewSession({
      category: 'adult' as any,
      title: '',
      day_of_week: '',
      start_time: '',
      end_time: '',
      location: '',
      level: '',
      description: '',
      target_audience: '',
      order_index: (created as any).order_index ?? 0,
    });
    setExpandedTrainingId((created as any).id);
  }

  function handleTrainingSearchChange(e: ChangeEvent<HTMLInputElement>) {
    setTrainingSearch(e.target.value);
  }

  const filteredSessions = useMemo(() => {
    const term = trainingSearch.trim().toLowerCase();

    let list = trainingSessions;

    if (trainingCategoryFilter !== 'all') {
      list = list.filter(
        (s) => (s.category as any) === trainingCategoryFilter,
      );
    }

    if (term) {
      list = list.filter((s) => {
        const haystack =
          `${s.title ?? ''} ${s.day_of_week ?? ''} ${s.location ?? ''} ${
            s.description ?? ''
          }`.toLowerCase();
        return haystack.includes(term);
      });
    }

    return [...list].sort((a, b) => {
      const ao = (a as any).order_index ?? 0;
      const bo = (b as any).order_index ?? 0;
      return ao - bo;
    });
  }, [trainingSessions, trainingSearch, trainingCategoryFilter]);

  const trainingStats = useMemo(() => {
    const total = trainingSessions.length;
    const byCategory: Record<string, number> = {};
    trainingSessions.forEach((s) => {
      const cat = (s.category as any) || 'autre';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });
    return { total, byCategory };
  }, [trainingSessions]);

  // ——————————————————————
  // COMITÉ
  // ——————————————————————

  function updateMemberField(
    id: string,
    field: keyof CommitteeMember | 'photo_asset_id',
    value: any,
  ) {
    setCommitteeMembers((prev) =>
      prev.map((m) =>
        m.id === id ? { ...(m as any), [field]: value } : m,
      ),
    );
  }

  function updateNewMember<K extends keyof CommitteeMember | 'photo_asset_id'>(
    field: K,
    value: any,
  ) {
    setNewMember((prev) => ({ ...(prev as any), [field]: value }));
  }

  async function handleSaveMember(member: CommitteeMember) {
    setSavingMemberId(member.id);
    try {
      const { id, created_at, ...updates } = member as any;
      const updated = await adminApi.updateCommitteeMember(id, updates);
      setCommitteeMembers((prev) =>
        prev.map((m) => (m.id === id ? updated : m)),
      );
    } finally {
      setSavingMemberId(null);
    }
  }

  async function handleDeleteMember(id: string) {
    if (!window.confirm('Supprimer ce membre du comité ?')) return;
    await adminApi.deleteCommitteeMember(id);
    setCommitteeMembers((prev) => prev.filter((m) => m.id !== id));
    if (expandedMemberId === id) setExpandedMemberId(null);
  }

  async function handleCreateMember(e: FormEvent) {
    e.preventDefault();
    if (!newMember.first_name || !newMember.last_name || !newMember.role) {
      alert('Prénom, nom et rôle sont obligatoires.');
      return;
    }

    const created = await adminApi.createCommitteeMember(newMember as any);
    setCommitteeMembers((prev) => [...prev, created]);
    setNewMember({
      first_name: '',
      last_name: '',
      role: '',
      email: '',
      phone: '',
      order_index: (created as any).order_index ?? 0,
      photo_asset_id: '',
    });
    setExpandedMemberId((created as any).id);
  }

  async function handleMemberPhotoChange(
    member: CommitteeMember,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingMemberPhotoId(member.id);
    try {
      const path = await uploadCommitteePhoto(file);
      updateMemberField(member.id, 'photo_asset_id', path);
      await handleSaveMember({ ...(member as any), photo_asset_id: path } as CommitteeMember);
    } catch (err) {
      alert((err as Error).message || "Impossible d'uploader la photo");
    } finally {
      setUploadingMemberPhotoId(null);
      event.target.value = '';
    }
  }

  async function handleNewMemberPhotoChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingMemberPhotoId('new');
    try {
      const path = await uploadCommitteePhoto(file);
      setNewMember((prev) => ({
        ...(prev as any),
        photo_asset_id: path,
      }));
    } catch (err) {
      alert((err as Error).message || "Impossible d'uploader la photo");
    } finally {
      setUploadingMemberPhotoId(null);
      event.target.value = '';
    }
  }

  const sortedCommittee = useMemo(
    () =>
      [...committeeMembers].sort((a, b) => {
        const ao = (a as any).order_index ?? 0;
        const bo = (b as any).order_index ?? 0;
        return ao - bo;
      }),
    [committeeMembers],
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  if (!clubContent) {
    return (
      <AdminLayout>
        <div className="py-12 text-sm text-red-600">
          Impossible de charger les données du club. Vérifie Supabase / RLS.
        </div>
      </AdminLayout>
    );
  }

  // ——————————————————————
  // RENDER
  // ——————————————————————

  return (
    <AdminLayout>
      {/* HEADER GLOBAL */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-orange-600" />
              Le club
            </h1>
            <p className="mt-1 text-sm text-gray-600 max-w-3xl">
              Gère ici la présentation du club, les séances d&apos;entraînement et la
              composition du comité. Tout ce que tu saisis alimente directement la
              page publique « Le club ».
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex flex-col items-end">
              <span className="text-[11px] text-gray-500">
                Dernière mise à jour du contenu
              </span>
              <span className="font-medium">
                {formatDate(clubContent.updated_at as any)}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={loadData}
              className="inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Recharger
            </Button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1">
            <Users className="w-3 h-3 text-orange-600" />
            <span className="text-gray-600">
              Membres estimés&nbsp;:&nbsp;
              <span className="font-semibold">
                {clubContent.members_count ?? 0}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1">
            <Calendar className="w-3 h-3 text-orange-600" />
            <span className="text-gray-600">
              Séances d&apos;entraînement&nbsp;:&nbsp;
              <span className="font-semibold">
                {trainingStats.total}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1">
            <Info className="w-3 h-3 text-orange-600" />
            <span className="text-gray-600">
              Membres du comité&nbsp;:&nbsp;
              <span className="font-semibold">
                {committeeMembers.length}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="mb-6 border-b border-gray-200 flex gap-2">
        <button
          type="button"
          onClick={() => setTab('content')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'content'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Contenu du club
        </button>
        <button
          type="button"
          onClick={() => setTab('trainings')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'trainings'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Entraînements
        </button>
        <button
          type="button"
          onClick={() => setTab('committee')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'committee'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Comité
        </button>
      </div>

      {/* TAB : CONTENU */}
      {tab === 'content' && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Présentation du club</h2>
            <p className="text-sm text-gray-500">
              Ces textes servent à présenter le club, son histoire et son esprit sur la
              page publique « Le club ».
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveContent} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Introduction (accroche)
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  rows={3}
                  value={clubContent.club_intro || ''}
                  onChange={(e) =>
                    updateContentField('club_intro', e.target.value)
                  }
                  placeholder="Quelques phrases courtes pour donner envie de rejoindre le club."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Histoire du club
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  rows={4}
                  value={clubContent.club_history || ''}
                  onChange={(e) =>
                    updateContentField('club_history', e.target.value)
                  }
                  placeholder="Quelques repères sur la création, l'évolution, les moments forts..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Esprit du club / valeurs
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  rows={4}
                  value={clubContent.club_spirit || ''}
                  onChange={(e) =>
                    updateContentField('club_spirit', e.target.value)
                  }
                  placeholder="Ce qui fait la particularité des Traîne-Savates : ambiance, valeurs, philosophie, etc."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre approximatif de membres
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={clubContent.members_count ?? 0}
                    onChange={(e) =>
                      updateContentField(
                        'members_count',
                        Number(e.target.value) || 0,
                      )
                    }
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Affiché comme indicateur sur la page du club, même approximatif.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Année de fondation
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={clubContent.founded_year ?? ''}
                    onChange={(e) =>
                      updateContentField(
                        'founded_year',
                        Number(e.target.value) || undefined,
                      )
                    }
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                  Pense « coureur qui découvre le club pour la première fois ». L’essentiel en
                  quelques paragraphes, sans jargon.
                </p>
                <Button type="submit" variant="primary" disabled={savingContent}>
                  {savingContent ? 'Enregistrement…' : 'Enregistrer le contenu'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB : ENTRAÎNEMENTS */}
      {tab === 'trainings' && (
        <div className="grid grid-cols-1 xl:grid-cols-[3fr,2fr] gap-6 items-start">
          {/* Liste + édition */}
          <Card className="max-h-[900px] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    Séances d&apos;entraînement
                  </h2>
                  <p className="text-sm text-gray-500">
                    Toutes les séances affichées sur la page publique « Entraînements ».
                  </p>
                </div>
              </div>

              {/* Filtres */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-4 h-4 text-gray-400 absolute left-2 top-2.5" />
                  <input
                    className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-1.5 text-sm"
                    placeholder="Rechercher (titre, jour, lieu…)…"
                    value={trainingSearch}
                    onChange={handleTrainingSearchChange}
                  />
                </div>

                <select
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-700"
                  value={trainingCategoryFilter}
                  onChange={(e) =>
                    setTrainingCategoryFilter(e.target.value as any)
                  }
                >
                  <option value="all">Toutes catégories</option>
                  <option value="adult">Adultes</option>
                  <option value="junior">Juniors</option>
                  <option value="nordic">Nordic walking</option>
                  <option value="prep_20km">Prépa 20 km</option>
                </select>

                <span className="text-[11px] text-gray-500">
                  {filteredSessions.length} séance(s) affichée(s)
                </span>
              </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
              {filteredSessions.length === 0 && (
                <div className="text-xs text-gray-500 border border-dashed border-gray-300 rounded-md px-3 py-4 bg-gray-50">
                  Aucune séance pour ces filtres. Modifie la recherche ou ajoute une
                  nouvelle séance à droite.
                </div>
              )}

              {filteredSessions.map((session) => {
                const isExpanded = expandedTrainingId === session.id;
                const categoryLabel =
                  TRAINING_CATEGORY_LABELS[session.category as TrainingCategory] ??
                  session.category ??
                  'Autre';

                return (
                  <div
                    key={session.id}
                    className="border border-gray-200 rounded-lg bg-white text-sm"
                  >
                    {/* header card */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedTrainingId((cur) =>
                          cur === session.id ? null : session.id,
                        )
                      }
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] bg-orange-50 text-orange-700">
                            {categoryLabel}
                          </span>
                          <span className="font-medium text-gray-900 truncate">
                            {session.title || 'Sans titre'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                          {session.day_of_week && (
                            <span>{session.day_of_week}</span>
                          )}
                          {session.start_time && (
                            <span>
                              {session.start_time}
                              {session.end_time ? `–${session.end_time}` : ''}
                            </span>
                          )}
                          {session.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {session.location}
                            </span>
                          )}
                          <span className="text-gray-400">
                            ID: {session.id.slice(0, 6)}…
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-400">
                          Ordre {(session as any).order_index ?? 0}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {isExpanded ? 'Fermer' : 'Modifier'}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50 px-3 py-3 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Catégorie
                            </label>
                            <select
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                              value={session.category || 'adult'}
                              onChange={(e) =>
                                updateSessionField(
                                  session.id,
                                  'category',
                                  e.target.value as any,
                                )
                              }
                            >
                              <option value="adult">Adultes</option>
                              <option value="junior">Juniors</option>
                              <option value="nordic">Nordic walking</option>
                              <option value="prep_20km">Prépa 20 km</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Titre
                            </label>
                            <input
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                              value={session.title || ''}
                              onChange={(e) =>
                                updateSessionField(
                                  session.id,
                                  'title',
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Jour
                            </label>
                            <input
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                              value={session.day_of_week || ''}
                              onChange={(e) =>
                                updateSessionField(
                                  session.id,
                                  'day_of_week',
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Heure de début
                            </label>
                            <input
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                              value={session.start_time || ''}
                              onChange={(e) =>
                                updateSessionField(
                                  session.id,
                                  'start_time',
                                  e.target.value,
                                )
                              }
                              placeholder="18:30"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Heure de fin (optionnel)
                            </label>
                            <input
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                              value={session.end_time || ''}
                              onChange={(e) =>
                                updateSessionField(
                                  session.id,
                                  'end_time',
                                  e.target.value,
                                )
                              }
                              placeholder="20:00"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Lieu
                            </label>
                            <input
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                              value={session.location || ''}
                              onChange={(e) =>
                                updateSessionField(
                                  session.id,
                                  'location',
                                  e.target.value,
                                )
                              }
                              placeholder="Collège, piste, etc."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Niveau / public
                            </label>
                            <input
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                              value={session.level || ''}
                              onChange={(e) =>
                                updateSessionField(
                                  session.id,
                                  'level',
                                  e.target.value,
                                )
                              }
                              placeholder="Débutant, tous niveaux…"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Description
                            </label>
                            <textarea
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                              rows={2}
                              value={session.description || ''}
                              onChange={(e) =>
                                updateSessionField(
                                  session.id,
                                  'description',
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Public cible (optionnel)
                            </label>
                            <textarea
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                              rows={2}
                              value={session.target_audience || ''}
                              onChange={(e) =>
                                updateSessionField(
                                  session.id,
                                  'target_audience',
                                  e.target.value,
                                )
                              }
                              placeholder="Adultes débutants, juniors dès 10 ans, etc."
                            />
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
                              value={(session as any).order_index ?? 0}
                              onChange={(e) =>
                                updateSessionField(
                                  session.id,
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
                              onClick={() => handleSaveSession(session)}
                              disabled={savingTrainingId === session.id}
                            >
                              <Save className="w-4 h-4 mr-1" />
                              {savingTrainingId === session.id
                                ? 'Enregistrement…'
                                : 'Enregistrer'}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSession(session.id)}
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

          {/* Création nouvelle séance */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Ajouter une séance</h2>
              <p className="text-sm text-gray-500">
                Crée une nouvelle séance d&apos;entraînement. Tu pourras ensuite affiner
                les détails dans la liste.
              </p>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleCreateSession}
                className="space-y-4 text-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Catégorie
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={(newSession.category as any) || 'adult'}
                      onChange={(e) =>
                        updateNewSession('category', e.target.value as any)
                      }
                    >
                      <option value="adult">Adultes</option>
                      <option value="junior">Juniors</option>
                      <option value="nordic">Nordic walking</option>
                      <option value="prep_20km">Prépa 20 km</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Titre
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={newSession.title || ''}
                      onChange={(e) =>
                        updateNewSession('title', e.target.value)
                      }
                      placeholder="Ex. Entraînement du mardi soir"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Jour
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={newSession.day_of_week || ''}
                      onChange={(e) =>
                        updateNewSession('day_of_week', e.target.value)
                      }
                      placeholder="Mardi"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Heure de début
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={newSession.start_time || ''}
                      onChange={(e) =>
                        updateNewSession('start_time', e.target.value)
                      }
                      placeholder="18:30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Heure de fin (optionnel)
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={newSession.end_time || ''}
                      onChange={(e) =>
                        updateNewSession('end_time', e.target.value)
                      }
                      placeholder="20:00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Lieu
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={newSession.location || ''}
                      onChange={(e) =>
                        updateNewSession('location', e.target.value)
                      }
                      placeholder="Collège, piste, salle, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Niveau / public
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={newSession.level || ''}
                      onChange={(e) =>
                        updateNewSession('level', e.target.value)
                      }
                      placeholder="Tous niveaux, débutants, etc."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Description (optionnel)
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    rows={3}
                    value={newSession.description || ''}
                    onChange={(e) =>
                      updateNewSession('description', e.target.value)
                    }
                    placeholder="Quelques infos sur le contenu, le rythme, etc."
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-[11px] text-gray-500 max-w-xs">
                    Tu peux te contenter du minimum (titre, jour, heure, lieu) et compléter
                    plus tard.
                  </p>
                  <Button type="submit" variant="primary" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter la séance
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB : COMITÉ */}
      {tab === 'committee' && (
        <div className="grid grid-cols-1 xl:grid-cols-[3fr,2fr] gap-6 items-start">
          {/* Liste + édition */}
          <Card className="max-h-[900px] flex flex-col">
            <CardHeader className="pb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                Comité du club
              </h2>
              <p className="text-sm text-gray-500">
                Les membres du comité sont affichés sur la page publique avec leur rôle,
                leur photo et, si tu le souhaites, un moyen de contact.
              </p>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
              {sortedCommittee.length === 0 && (
                <div className="text-xs text-gray-500 border border-dashed border-gray-300 rounded-md px-3 py-4 bg-gray-50">
                  Aucun membre de comité enregistré. Ajoute au moins la présidence et
                  quelques rôles clés.
                </div>
              )}

              {sortedCommittee.map((member) => {
                const isExpanded = expandedMemberId === member.id;
                const photoUrl = getCommitteePhotoUrl(
                  (member as any).photo_asset_id,
                );

                return (
                  <div
                    key={member.id}
                    className="border border-gray-200 rounded-lg bg-white text-sm"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMemberId((cur) =>
                          cur === member.id ? null : member.id,
                        )
                      }
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar/photo */}
                        <div className="h-9 w-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden text-[11px] font-medium text-gray-500">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={`${member.first_name} ${member.last_name}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>
                              {(member.first_name?.[0] || '').toUpperCase()}
                              {(member.last_name?.[0] || '').toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 truncate">
                              {member.first_name} {member.last_name}
                            </span>
                            <span className="text-[11px] text-gray-500 truncate">
                              {member.role}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                            {member.email && <span>{member.email}</span>}
                            {member.phone && <span>{member.phone}</span>}
                            <span className="text-gray-400">
                              Ordre {(member as any).order_index ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {isExpanded ? 'Fermer' : 'Modifier'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50 px-3 py-3 space-y-3">
                        {/* Photo + upload */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                          <div className="flex flex-col items-start gap-2">
                            <span className="block text-xs font-medium text-gray-600">
                              Photo
                            </span>
                            <div className="h-16 w-16 rounded-full border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
                              {photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt={`${member.first_name} ${member.last_name}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex flex-col items-center text-[11px] text-gray-400">
                                  <ImageIcon className="w-4 h-4 mb-1" />
                                  <span>Aucune photo</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex-1 space-y-2 text-xs text-gray-600">
                            <label className="block font-medium mb-1">
                              Importer / remplacer la photo
                            </label>
                            <p className="text-[11px] text-gray-500">
                              Formats recommandés : JPG ou PNG, photo portrait (tête/épaules).
                              Le fichier sera stocké dans le bucket{' '}
                              <code>committee-photos</code>.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                              <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
                                <UploadCloud className="w-4 h-4" />
                                <span>
                                  {uploadingMemberPhotoId === member.id
                                    ? 'Upload en cours…'
                                    : 'Choisir un fichier'}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleMemberPhotoChange(member, e)
                                  }
                                  disabled={uploadingMemberPhotoId === member.id}
                                />
                              </label>
                              {(member as any).photo_asset_id && (
                                <span className="text-[11px] text-gray-500">
                                  ID&nbsp;:{' '}
                                  <span className="font-mono">
                                    {(member as any).photo_asset_id.toString()}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Infos texte */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Prénom
                            </label>
                            <input
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                              value={member.first_name || ''}
                              onChange={(e) =>
                                updateMemberField(
                                  member.id,
                                  'first_name',
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Nom
                            </label>
                            <input
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                              value={member.last_name || ''}
                              onChange={(e) =>
                                updateMemberField(
                                  member.id,
                                  'last_name',
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Rôle / fonction
                            </label>
                            <input
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                              value={member.role || ''}
                              onChange={(e) =>
                                updateMemberField(
                                  member.id,
                                  'role',
                                  e.target.value,
                                )
                              }
                              placeholder="Président·e, caissier·ère, responsable juniors…"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Email (optionnel)
                            </label>
                            <input
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                              value={member.email || ''}
                              onChange={(e) =>
                                updateMemberField(
                                  member.id,
                                  'email',
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Téléphone (optionnel)
                            </label>
                            <input
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                              value={member.phone || ''}
                              onChange={(e) =>
                                updateMemberField(
                                  member.id,
                                  'phone',
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Ordre d&apos;affichage
                            </label>
                            <input
                              type="number"
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                              value={(member as any).order_index ?? 0}
                              onChange={(e) =>
                                updateMemberField(
                                  member.id,
                                  'order_index' as any,
                                  Number(e.target.value) || 0,
                                )
                              }
                            />
                            <p className="mt-1 text-[11px] text-gray-500">
                              1 = affiché en premier.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSaveMember(member)}
                            disabled={savingMemberId === member.id}
                          >
                            <Save className="w-4 h-4 mr-1" />
                            {savingMemberId === member.id
                              ? 'Enregistrement…'
                              : 'Enregistrer'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMember(member.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Création nouveau membre */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Ajouter un membre du comité</h2>
              <p className="text-sm text-gray-500">
                Ajoute un nouveau membre. Tu peux déjà importer sa photo, ou le faire plus
                tard.
              </p>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleCreateMember}
                className="space-y-4 text-sm"
              >
                {/* Photo nouveau membre */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Photo (optionnel)
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
                      {newMember.photo_asset_id ? (
                        <img
                          src={
                            getCommitteePhotoUrl(
                              newMember.photo_asset_id as any,
                            ) ?? ''
                          }
                          alt={
                            newMember.first_name || 'Nouveau membre du comité'
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-[11px] text-gray-400">
                          <ImageIcon className="w-4 h-4 mb-1" />
                          <span>Aucune photo</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2 text-xs text-gray-600">
                      <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
                        <UploadCloud className="w-4 h-4" />
                        <span>
                          {uploadingMemberPhotoId === 'new'
                            ? 'Upload en cours…'
                            : 'Choisir un fichier'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleNewMemberPhotoChange}
                          disabled={uploadingMemberPhotoId === 'new'}
                        />
                      </label>
                      {newMember.photo_asset_id && (
                        <p className="text-[11px] text-gray-500">
                          ID :{' '}
                          <span className="font-mono">
                            {(newMember.photo_asset_id as any).toString()}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Prénom
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={newMember.first_name || ''}
                      onChange={(e) =>
                        updateNewMember('first_name', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Nom
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={newMember.last_name || ''}
                      onChange={(e) =>
                        updateNewMember('last_name', e.target.value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Rôle / fonction
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={newMember.role || ''}
                    onChange={(e) => updateNewMember('role', e.target.value)}
                    placeholder="Président·e, vice-président·e, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Email (optionnel)
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={newMember.email || ''}
                      onChange={(e) =>
                        updateNewMember('email', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Téléphone (optionnel)
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={newMember.phone || ''}
                      onChange={(e) =>
                        updateNewMember('phone', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Ordre d&apos;affichage
                    </label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={(newMember as any).order_index ?? 0}
                      onChange={(e) =>
                        updateNewMember(
                          'order_index' as any,
                          Number(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-[11px] text-gray-500 max-w-xs">
                    Mets les rôles principaux en premier pour que ce soit clair côté
                    public.
                  </p>
                  <Button type="submit" variant="primary" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter le membre
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
