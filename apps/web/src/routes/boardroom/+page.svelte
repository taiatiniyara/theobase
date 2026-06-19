<script lang="ts">
  import { getBoardMeetings, createBoardMeeting, getBoardMeeting, createBoardDecision } from '$lib/api';
  import { onMount } from 'svelte';

  let meetings = $state<any[]>([]);
  let loading = $state(true);
  let showCreate = $state(false);
  let selectedMeeting = $state<any>(null);

  let meetingDate = $state('');
  let agendaItems = $state([{ title: '' }]);
  let createError = $state('');

  let decisionTitle = $state('');
  let decisionDesc = $state('');
  let decisionVote = $state('approved');
  let decisionError = $state('');

  function addAgendaItem() {
    agendaItems = [...agendaItems, { title: '' }];
  }

  async function createMeeting() {
    createError = '';
    const agenda = agendaItems.filter(a => a.title.trim());
    if (!meetingDate || agenda.length === 0) {
      createError = 'Date and at least one agenda item required.';
      return;
    }
    try {
      const result = await createBoardMeeting({ date: meetingDate, agenda });
      if (result.error) { createError = result.error; return; }
      meetings = [result, ...meetings];
      showCreate = false;
      meetingDate = '';
      agendaItems = [{ title: '' }];
    } catch { createError = 'Failed to create meeting.'; }
  }

  async function viewMeeting(id: string) {
    try {
      selectedMeeting = await getBoardMeeting(id);
    } catch {}
  }

  async function addDecision() {
    if (!decisionTitle.trim()) return;
    decisionError = '';
    try {
      const result = await createBoardDecision(selectedMeeting.id, {
        title: decisionTitle,
        description: decisionDesc,
        voteOutcome: decisionVote,
      });
      if (result.error) { decisionError = result.error; return; }
      selectedMeeting.decisions = [...(selectedMeeting.decisions || []), result];
      decisionTitle = '';
      decisionDesc = '';
    } catch { decisionError = 'Failed to record decision.'; }
  }

  onMount(async () => {
    try { meetings = await getBoardMeetings(); } catch {}
    loading = false;
  });
</script>

<svelte:head>
  <title>Boardroom — Theobase</title>
</svelte:head>

<h1>Boardroom</h1>

{#if !showCreate && !selectedMeeting}
  <button onclick={() => showCreate = true} style="margin-bottom: 16px;">+ New Meeting</button>
{:else if showCreate}
  <div class="card">
    <h2>New Board Meeting</h2>
    <div class="label">Date</div>
    <input type="date" bind:value={meetingDate} />

    <div class="label">Agenda</div>
    {#each agendaItems as item, i}
      <input
        type="text"
        value={item.title}
        oninput={(e) => agendaItems = agendaItems.map((a, j) => j === i ? { title: (e.target as HTMLInputElement).value } : a)}
        placeholder="Agenda item {i + 1}"
        style="margin-bottom: 8px;"
      />
    {/each}
    <button onclick={addAgendaItem} style="background: #718096; padding: 8px 16px; font-size: 0.85rem; margin-bottom: 16px;">+ Add item</button>

    {#if createError}
      <p class="error">{createError}</p>
    {/if}

    <div style="display: flex; gap: 8px;">
      <button onclick={createMeeting}>Create</button>
      <button style="background: #718096;" onclick={() => showCreate = false}>Cancel</button>
    </div>
  </div>
{:else if selectedMeeting}
  <button onclick={() => selectedMeeting = null} style="background: #718096; margin-bottom: 16px;">← Back to meetings</button>

  <div class="card">
    <h2>Meeting — {selectedMeeting.date}</h2>
    <div class="label">Status</div>
    <div class="value" style="text-transform: capitalize;">{selectedMeeting.status?.replace(/_/g, ' ')}</div>

    {#if selectedMeeting.agenda?.length}
      <div class="label">Agenda</div>
      {#each selectedMeeting.agenda as item}
        <div class="value">{item.title}</div>
      {/each}
    {/if}
  </div>

  <div class="card">
    <h2>Decisions</h2>
    {#if selectedMeeting.decisions?.length}
      {#each selectedMeeting.decisions as dec}
        <div style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 600;">#{dec.number} — {dec.title}</div>
          {#if dec.description}
            <div style="color: #718096; font-size: 0.875rem;">{dec.description}</div>
          {/if}
          <div style="font-size: 0.8rem; margin-top: 4px; text-transform: capitalize; color: {dec.voteOutcome === 'approved' ? '#38a169' : '#e53e3e'};">
            {dec.voteOutcome}
          </div>
        </div>
      {/each}
    {:else}
      <p style="color: #718096;">No decisions recorded yet.</p>
    {/if}

    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
      <div class="label">Record a Decision</div>
      <input type="text" bind:value={decisionTitle} placeholder="Decision title" />
      <input type="text" bind:value={decisionDesc} placeholder="Description (optional)" />
      <select bind:value={decisionVote} style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; font-size: 0.9rem;">
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="tabled">Tabled</option>
      </select>
      {#if decisionError}
        <p class="error">{decisionError}</p>
      {/if}
      <button onclick={addDecision}>Record Decision</button>
    </div>
  </div>
{/if}

{#if loading}
  <p style="color: #718096;">Loading...</p>
{:else if !showCreate && !selectedMeeting}
  {#if meetings.length === 0}
    <div class="card">
      <p style="color: #718096;">No board meetings yet.</p>
    </div>
  {:else}
    {#each meetings as meeting}
      <div class="card" style="cursor: pointer;" onclick={() => viewMeeting(meeting.id)}>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 600;">{meeting.date}</div>
            <div style="color: #718096; font-size: 0.85rem; text-transform: capitalize;">{meeting.status?.replace(/_/g, ' ')}</div>
          </div>
          <span style="color: #a0aec0;">→</span>
        </div>
      </div>
    {/each}
  {/if}
{/if}
