import { supabase } from '../lib/supabase';
import type {
  Edition,
  RaceCategory,
  ProgramItem,
  ClubContent,
  TrainingSession,
  CommitteeMember,
  Sponsor,
  FaqItem,
  PracticalInfo,
} from '../types/api';

export const adminApi = {
  async getDashboardStats() {
    const { data: edition } = await supabase
      .from('editions')
      .select('*')
      .eq('status', 'published')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { count: newMessages } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new');

    const { count: newMemberships } = await supabase
      .from('membership_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new');

    const { data: recentMessages } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      activeEdition: edition,
      newMessagesCount: newMessages || 0,
      newMembershipsCount: newMemberships || 0,
      recentMessages: recentMessages || [],
    };
  },

  async getEditions() {
    const { data, error } = await supabase
      .from('editions')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data as Edition[];
  },

  async createEdition(edition: Partial<Edition>) {
    const { data, error } = await supabase
      .from('editions')
      .insert(edition)
      .select()
      .single();

    if (error) throw error;
    return data as Edition;
  },

  async updateEdition(id: string, updates: Partial<Edition>) {
    // 1) UPDATE simple, sans SELECT pour éviter les soucis de coercition
    const { error: updateError } = await supabase
      .from('editions')
      .update(updates)
      .eq('id', id);

    if (updateError) throw updateError;

    // 2) On relit l’édition mise à jour
    const { data, error: fetchError } = await supabase
      .from('editions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    // Si pour une raison bizarre on ne récupère rien, on renvoie au moins les données envoyées
    if (!data) {
      return {
        id,
        // on met les valeurs qu’on vient d’envoyer, avec quelques défauts
        slug: updates.slug ?? '',
        year: updates.year ?? new Date().getFullYear(),
        edition_number: updates.edition_number ?? 1,
        date: updates.date ?? new Date().toISOString().slice(0, 10),
        title: updates.title ?? '',
        hero_subtitle: updates.hero_subtitle,
        status: updates.status ?? 'draft',
        registration_online_url: updates.registration_online_url,
        results_url: updates.results_url,
        photos_album_url: updates.photos_album_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Edition;
    }

    return data as Edition;
  },

  async duplicateEdition(sourceId: string, newYear: number) {
    const { data: source, error: sourceError } = await supabase
      .from('editions')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (sourceError) throw sourceError;

    const newEdition = {
      ...source,
      id: undefined,
      slug: newYear.toString(),
      year: newYear,
      edition_number: source.edition_number + 1,
      date: `${newYear}-06-14`,
      status: 'draft',
      registration_online_url: null,
      results_url: null,
      photos_album_url: null,
    };

    const { data: created, error: createError } = await supabase
      .from('editions')
      .insert(newEdition)
      .select()
      .single();

    if (createError) throw createError;

    const { data: races } = await supabase
      .from('race_categories')
      .select('*')
      .eq('edition_id', sourceId);

    if (races && races.length > 0) {
      const newRaces = races.map((race) => ({
        ...race,
        id: undefined,
        edition_id: created.id,
      }));

      await supabase.from('race_categories').insert(newRaces);
    }

    const { data: program } = await supabase
      .from('program_items')
      .select('*')
      .eq('edition_id', sourceId);

    if (program && program.length > 0) {
      const newProgram = program.map((item) => ({
        ...item,
        id: undefined,
        edition_id: created.id,
      }));

      await supabase.from('program_items').insert(newProgram);
    }

    return created as Edition;
  },

  async activateEdition(id: string) {
    await supabase.from('editions').update({ status: 'archived' }).neq('id', id);

    const { data, error } = await supabase
      .from('editions')
      .update({ status: 'published' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Edition;
  },

  async getRaces(editionId: string) {
    const { data, error } = await supabase
      .from('race_categories')
      .select('*')
      .eq('edition_id', editionId)
      .order('order_index');

    if (error) throw error;
    return data as RaceCategory[];
  },

  async createRace(race: Partial<RaceCategory>) {
    const { data, error } = await supabase
      .from('race_categories')
      .insert(race)
      .select()
      .single();

    if (error) throw error;
    return data as RaceCategory;
  },

  async updateRace(id: string, updates: Partial<RaceCategory>) {
    const { data, error } = await supabase
      .from('race_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as RaceCategory;
  },

  async deleteRace(id: string) {
    const { error } = await supabase.from('race_categories').delete().eq('id', id);

    if (error) throw error;
  },

  async getProgram(editionId: string) {
    const { data, error } = await supabase
      .from('program_items')
      .select('*')
      .eq('edition_id', editionId)
      .order('order_index');

    if (error) throw error;
    return data as ProgramItem[];
  },

  async createProgramItem(item: Partial<ProgramItem>) {
    const { data, error } = await supabase
      .from('program_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data as ProgramItem;
  },

  async updateProgramItem(id: string, updates: Partial<ProgramItem>) {
    const { data, error } = await supabase
      .from('program_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ProgramItem;
  },

  async deleteProgramItem(id: string) {
    const { error } = await supabase.from('program_items').delete().eq('id', id);

    if (error) throw error;
  },

  async getClubContent() {
    const { data, error } = await supabase.from('club_content').select('*').single();

    if (error) throw error;
    return data as ClubContent;
  },

  async updateClubContent(updates: Partial<ClubContent>) {
    const { data: existing } = await supabase.from('club_content').select('id').maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('club_content')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as ClubContent;
    } else {
      const { data, error } = await supabase
        .from('club_content')
        .insert(updates)
        .select()
        .single();

      if (error) throw error;
      return data as ClubContent;
    }
  },

  async getTrainingSessions() {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .order('order_index');

    if (error) throw error;
    return data as TrainingSession[];
  },

  async createTrainingSession(session: Partial<TrainingSession>) {
    const { data, error } = await supabase
      .from('training_sessions')
      .insert(session)
      .select()
      .single();

    if (error) throw error;
    return data as TrainingSession;
  },

  async updateTrainingSession(id: string, updates: Partial<TrainingSession>) {
    const { data, error } = await supabase
      .from('training_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TrainingSession;
  },

  async deleteTrainingSession(id: string) {
    const { error } = await supabase.from('training_sessions').delete().eq('id', id);

    if (error) throw error;
  },

  async getCommitteeMembers() {
    const { data, error } = await supabase
      .from('committee_members')
      .select('*')
      .order('order_index');

    if (error) throw error;
    return data as CommitteeMember[];
  },

  async createCommitteeMember(member: Partial<CommitteeMember>) {
    const { data, error } = await supabase
      .from('committee_members')
      .insert(member)
      .select()
      .single();

    if (error) throw error;
    return data as CommitteeMember;
  },

  async updateCommitteeMember(id: string, updates: Partial<CommitteeMember>) {
    const { data, error } = await supabase
      .from('committee_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CommitteeMember;
  },

  async deleteCommitteeMember(id: string) {
    const { error } = await supabase.from('committee_members').delete().eq('id', id);

    if (error) throw error;
  },

  async getSponsors() {
    const { data, error } = await supabase.from('sponsors').select('*').order('order_index');

    if (error) throw error;
    return data as Sponsor[];
  },

  async createSponsor(sponsor: Partial<Sponsor>) {
    const { data, error } = await supabase.from('sponsors').insert(sponsor).select().single();

    if (error) throw error;
    return data as Sponsor;
  },

  async updateSponsor(id: string, updates: Partial<Sponsor>) {
    const { data, error } = await supabase
      .from('sponsors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Sponsor;
  },

  async deleteSponsor(id: string) {
    const { error } = await supabase.from('sponsors').delete().eq('id', id);

    if (error) throw error;
  },

  

  async getPracticalInfo() {
    const { data, error } = await supabase.from('practical_info').select('*').single();

    if (error) throw error;
    return data as PracticalInfo;
  },

  async updatePracticalInfo(updates: Partial<PracticalInfo>) {
    const { data: existing } = await supabase.from('practical_info').select('id').maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('practical_info')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as PracticalInfo;
    } else {
      const { data, error } = await supabase
        .from('practical_info')
        .insert(updates)
        .select()
        .single();

      if (error) throw error;
      return data as PracticalInfo;
    }
  },

  async getFaqItems() {
    const { data, error } = await supabase.from('faq_items').select('*').order('order_index');

    if (error) throw error;
    return data as FaqItem[];
  },

  async createFaqItem(item: Partial<FaqItem>) {
    const { data, error } = await supabase.from('faq_items').insert(item).select().single();

    if (error) throw error;
    return data as FaqItem;
  },

  async updateFaqItem(id: string, updates: Partial<FaqItem>) {
    const { data, error } = await supabase
      .from('faq_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as FaqItem;
  },

  async deleteFaqItem(id: string) {
    const { error } = await supabase.from('faq_items').delete().eq('id', id);

    if (error) throw error;
  },

  async getContactMessages(status?: string) {
    let query = supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async updateContactMessage(id: string, status: string) {
    const { data, error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMembershipRequests(status?: string) {
    let query = supabase
      .from('membership_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async updateMembershipRequest(id: string, status: string) {
    const { data, error } = await supabase
      .from('membership_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
