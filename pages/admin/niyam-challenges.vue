<template>
  <div class="space-y-6">
    <p v-for="message in problems" :key="message" class="text-sm text-red-600">{{ message }}</p>

    <!-- ── Every niyam at a glance ────────────────────────────────── -->
    <AdminNiyamOverview
      :rows="overview"
      :awaiting-total="awaitingTotal"
      :loading="overviewLoading"
      :publishing="!!publishingId"
      :publishing-id="publishingId"
      @select="selectChallenge"
      @review="goToQueue"
      @publish="onPublish"
      @refresh="loadOverview"
    />

    <!-- ── The five defaults that are not documents yet ───────────── -->
    <section
      v-if="unpublishedDefaults.length"
      aria-labelledby="niyam-publish-heading"
      class="admin-panel space-y-3"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 id="niyam-publish-heading" class="font-display text-xl font-semibold text-[hsl(var(--primary))]">
          Not published yet ({{ unpublishedDefaults.length }})
        </h2>
        <button
          type="button"
          class="admin-btn min-h-[44px]"
          :disabled="!!publishingId"
          @click="onPublishAll"
        >
          {{ publishingId === ALL ? 'Publishing…' : `Publish all ${unpublishedDefaults.length}` }}
        </button>
      </div>
      <p class="text-sm text-[hsl(var(--muted-foreground))]">
        These niyams already show on <code>/niyams</code>, but nobody can add to them: a devotee's
        entry is only allowed once the niyam exists as a document. Publishing writes it at its own
        slug id with the values below, and it becomes editable like any other.
      </p>
      <ul class="divide-y divide-[hsl(var(--border))]">
        <li
          v-for="challenge in unpublishedDefaults"
          :key="challenge.id"
          class="flex flex-wrap items-center gap-3 py-3"
        >
          <NiyamIcon :name="iconFor(challenge)" class="h-5 w-5 shrink-0 text-[hsl(var(--golden-900))]" />
          <div class="min-w-[12rem] flex-1">
            <p class="font-semibold text-[hsl(var(--foreground))]">{{ challenge.title }}</p>
            <p class="text-xs text-[hsl(var(--muted-foreground))]">
              {{ formatCount(challenge.target) }} {{ challenge.unit }} ·
              auto-approve up to {{ formatCount(challenge.autoApproveMax) }} ·
              hard limit {{ formatCount(challenge.maxPerSubmission) }} ·
              <code>{{ challenge.id }}</code>
            </p>
          </div>
          <button
            type="button"
            class="admin-btn-secondary min-h-[44px]"
            @click="selectChallenge(challenge.id)"
          >
            Review values
          </button>
          <button
            type="button"
            class="admin-btn min-h-[44px]"
            :disabled="!!publishingId"
            @click="onPublish(challenge.id)"
          >
            {{ publishingId === challenge.id ? 'Publishing…' : 'Publish' }}
          </button>
        </li>
      </ul>
    </section>

    <!-- ── One queue across all niyams ────────────────────────────── -->
    <div ref="queueEl">
      <AdminNiyamQueue
        :rows="queue"
        :challenges="allChallenges"
        :context-for="queueContextFor"
        :reviewing-id="reviewingId"
        :history-loading="historyLoading"
        :filter-id="queueFilter"
        :loading="overviewLoading"
        :capped="anyQueueCapped"
        @approve="approve"
        @reject="askReject"
        @filter="queueFilter = $event"
        @load-history="loadHistory"
      />
    </div>

    <!-- ── Everything the page says that is not a niyam ───────────── -->
    <AdminNiyamCopy />

    <AdminEditorLayout
      :count-label="countLabel"
      create-label="New niyam"
      empty-label="No niyams yet."
      :loading="loading"
      :empty="!allChallenges.length"
      @create="openNew"
    >
      <template #list>
        <button
          v-for="c in allChallenges"
          :key="c.id"
          type="button"
          class="admin-row min-h-[44px]"
          :class="editingId === c.id ? 'admin-row-active' : ''"
          @click="openEdit(c)"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="flex items-center gap-2 font-semibold text-[hsl(var(--primary))]">
              <NiyamIcon :name="iconFor(c)" class="h-4 w-4 shrink-0 text-[hsl(var(--golden-900))]" />
              {{ c.title }}
            </p>
            <span
              class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
              :class="listChipClass(c)"
            >
              {{ listChipLabel(c) }}
            </span>
          </div>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {{ formatCount(c.target) }} {{ c.unit }} · closes {{ dateLabel(c.endAt) }}
          </p>
        </button>
      </template>

      <template #form>
        <div v-if="showForm" class="space-y-6">
          <!-- ── Niyam settings ──────────────────────────────────── -->
          <form class="space-y-4" @submit.prevent="save">
            <div class="flex items-center justify-between gap-3">
              <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">
                {{ editingId ? 'Edit niyam' : 'New niyam' }}
              </h2>
              <button
                v-if="editingId && editingPublished"
                type="button"
                class="admin-btn-danger min-h-[44px]"
                @click="confirmDelete = true"
              >
                Delete
              </button>
            </div>

            <p
              v-if="editingId && !editingPublished"
              class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
            >
              Not published yet. Saving writes it at <code>{{ editingId }}</code> and devotees can
              start adding to it straight away.
            </p>

            <div>
              <label :for="`${uid}-title`" class="admin-label">Title</label>
              <input :id="`${uid}-title`" v-model="form.title" required class="admin-input" placeholder="Mala">
            </div>

            <div>
              <label :for="`${uid}-detail`" class="admin-label">Detail</label>
              <textarea
                :id="`${uid}-detail`"
                v-model="form.detail"
                rows="2"
                class="admin-input"
                placeholder="Every mala you turn between now and the utsav counts towards our shared total."
              />
            </div>

            <div>
              <label :for="`${uid}-gloss`" class="admin-label">Sub-line on the board</label>
              <input
                :id="`${uid}-gloss`"
                v-model="form.gloss"
                :maxlength="GLOSS_MAX"
                class="admin-input"
                :placeholder="NIYAM_GLOSS_BY_ICON[form.icon] || form.unit"
              >
              <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                The small grey line under the niyam's name on <code>/niyams</code> — plain English
                under the Sanskrit. Blank uses the wording that goes with the
                <strong>{{ form.icon }}</strong> icon, shown above.
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div>
                <label :for="`${uid}-target`" class="admin-label">Target</label>
                <input :id="`${uid}-target`" v-model.number="form.target" type="number" min="1" step="1" class="admin-input">
              </div>
              <div>
                <label :for="`${uid}-unit`" class="admin-label">Unit (plural)</label>
                <input :id="`${uid}-unit`" v-model="form.unit" class="admin-input" placeholder="malas">
              </div>
              <div>
                <label :for="`${uid}-unit-singular`" class="admin-label">Unit (singular)</label>
                <input :id="`${uid}-unit-singular`" v-model="form.unitSingular" class="admin-input" placeholder="mala">
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label :for="`${uid}-start`" class="admin-label">Starts</label>
                <input :id="`${uid}-start`" v-model="form.startDate" type="date" class="admin-input">
              </div>
              <div>
                <label :for="`${uid}-end`" class="admin-label">Closes (end of that day)</label>
                <input :id="`${uid}-end`" v-model="form.endDate" type="date" class="admin-input">
              </div>
            </div>

            <!-- ── How the devotee's card behaves ───────────────── -->
            <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-3">
              <p class="text-sm font-semibold text-[hsl(var(--primary))]">The devotee's card</p>

              <fieldset class="mt-3">
                <legend class="admin-label">How an entry is made</legend>
                <div class="flex flex-wrap gap-2">
                  <label
                    v-for="mode in inputModes"
                    :key="mode.id"
                    class="flex min-h-[44px] flex-1 cursor-pointer items-start gap-2 rounded-lg border bg-white px-3 py-2 text-sm"
                    :class="form.inputMode === mode.id
                      ? 'border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary))]/10'
                      : 'border-[hsl(var(--border))]'"
                  >
                    <input
                      v-model="form.inputMode"
                      type="radio"
                      :value="mode.id"
                      :name="`${uid}-input-mode`"
                      class="mt-1 h-4 w-4"
                    >
                    <span>
                      <span class="block font-semibold text-[hsl(var(--foreground))]">{{ mode.label }}</span>
                      <span class="block text-xs text-[hsl(var(--muted-foreground))]">{{ mode.hint }}</span>
                    </span>
                  </label>
                </div>
              </fieldset>

              <div class="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label :for="`${uid}-presets`" class="admin-label">One-tap amounts</label>
                  <input
                    :id="`${uid}-presets`"
                    v-model="form.presets"
                    class="admin-input"
                    :disabled="form.inputMode === 'checkin'"
                    placeholder="1, 5, 11, 51"
                  >
                  <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    <template v-if="form.inputMode === 'checkin'">
                      Not used for a check-in — one tap is always one {{ form.unitSingular || 'entry' }}.
                    </template>
                    <template v-else>
                      Up to six, separated by commas. Buttons on the card, in this order:
                      {{ presetNumbers.length ? presetNumbers.join(' · ') : 'none' }}.
                    </template>
                  </p>
                </div>
                <div>
                  <label :for="`${uid}-icon`" class="admin-label">Icon</label>
                  <div class="flex items-center gap-2">
                    <NiyamIcon :name="form.icon" class="h-5 w-5 shrink-0 text-[hsl(var(--golden-900))]" />
                    <select :id="`${uid}-icon`" v-model="form.icon" class="admin-input">
                      <option v-for="name in iconOptions" :key="name" :value="name">{{ name }}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="mt-3">
                <label :for="`${uid}-hint`" class="admin-label">Hint — what counts as one</label>
                <input
                  :id="`${uid}-hint`"
                  v-model="form.hint"
                  class="admin-input"
                  placeholder="One full mala of 108 counts as one mala."
                >
              </div>

              <!-- Where the words are. A counter is no use to a devotee who
                   does not have the text in front of them. -->
              <div class="mt-3">
                <p class="text-sm font-semibold text-[hsl(var(--primary))]">Reading text</p>
                <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Link a document from Bhaktiras, or an external page — not both.
                </p>
                <div class="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label :for="`${uid}-resource-doc`" class="admin-label">Document</label>
                    <select :id="`${uid}-resource-doc`" v-model="form.resourceDocumentId" class="admin-input">
                      <option value="">None</option>
                      <option v-for="doc in documentOptions" :key="doc.id" :value="doc.id">
                        {{ doc.title }}
                      </option>
                    </select>
                    <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                      Opens in-app with English / Gujarati toggle.
                      <NuxtLink to="/admin/documents" class="font-semibold text-[hsl(var(--primary))] underline">
                        Manage documents
                      </NuxtLink>
                    </p>
                  </div>
                  <div>
                    <label :for="`${uid}-resource-url`" class="admin-label">Or external link</label>
                    <input
                      :id="`${uid}-resource-url`"
                      v-model="form.resourceUrl"
                      type="url"
                      inputmode="url"
                      :maxlength="RESOURCE_URL_MAX"
                      class="admin-input"
                      :disabled="!!form.resourceDocumentId"
                      placeholder="https://path.swaminarayan.faith/…"
                    >
                    <p class="mt-1 text-xs" :class="resourceUrlProblem ? 'text-red-600' : 'text-[hsl(var(--muted-foreground))]'">
                      <template v-if="form.resourceDocumentId">Clear the document above to use an external link.</template>
                      <template v-else-if="resourceUrlProblem">{{ resourceUrlProblem }}</template>
                      <template v-else-if="form.resourceUrl">Opens in a new browser tab.</template>
                      <template v-else>Leave blank if you linked a document instead.</template>
                    </p>
                  </div>
                </div>
                <div class="mt-3">
                  <label :for="`${uid}-resource-label`" class="admin-label">Link text</label>
                  <input
                    :id="`${uid}-resource-label`"
                    v-model="form.resourceLabel"
                    :maxlength="RESOURCE_LABEL_MAX"
                    class="admin-input"
                    :placeholder="copy('resourceLinkLabel')"
                    :disabled="!form.resourceDocumentId && !form.resourceUrl.trim()"
                  >
                  <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Blank uses the document title or the wording in Section copy
                    (“{{ copy('resourceLinkLabel') }}”).
                  </p>
                </div>
              </div>

              <div class="mt-4">
                <AdminNiyamCardPreview
                  :challenge="previewChallenge"
                  :approved-total="stats?.approvedTotal || 0"
                />
              </div>
            </div>

            <!-- The anti-inflation dials. -->
            <div
              v-if="form.inputMode !== 'checkin'"
              class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-3"
            >
              <p class="text-sm font-semibold text-[hsl(var(--primary))]">Review thresholds</p>
              <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                An entry at or below the auto-approve figure joins the total straight away.
                Anything larger is held here for you to approve first. The hard limit is refused outright.
              </p>
              <div class="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label :for="`${uid}-auto`" class="admin-label">Auto-approve up to</label>
                  <input :id="`${uid}-auto`" v-model.number="form.autoApproveMax" type="number" min="0" step="1" class="admin-input">
                </div>
                <div>
                  <label :for="`${uid}-max`" class="admin-label">Hard limit per entry</label>
                  <input :id="`${uid}-max`" v-model.number="form.maxPerSubmission" type="number" min="1" step="1" class="admin-input">
                </div>
              </div>
            </div>
            <div
              v-else
              class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-3 text-sm text-[hsl(var(--muted-foreground))]"
            >
              Check-in niyams count straight away — one morning and one evening sabha per day.
              There is no approval queue or entry table for them.
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label :for="`${uid}-order`" class="admin-label">Order</label>
                <input :id="`${uid}-order`" v-model.number="form.order" type="number" min="0" class="admin-input max-w-[8rem]">
              </div>
              <label class="flex items-end gap-2 pb-2 text-sm font-semibold text-[hsl(var(--foreground))]">
                <input v-model="form.active" type="checkbox" class="h-4 w-4 rounded border-[hsl(var(--border))]">
                Accepting entries
              </label>
            </div>

            <div class="flex gap-2">
              <button type="submit" class="admin-btn min-h-[44px]" :disabled="saving">
                {{ saving ? 'Saving…' : editingId && !editingPublished ? 'Publish niyam' : 'Save' }}
              </button>
              <button type="button" class="admin-btn-secondary min-h-[44px]" @click="closeForm">Cancel</button>
            </div>
          </form>

          <!-- ── Live totals ─────────────────────────────────────── -->
          <div v-if="editingId && editingPublished" class="border-t border-[hsl(var(--border))] pt-5">
            <h3 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Progress</h3>
            <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              Counted from approved entries by the <code>syncNiyamChallengeTotals</code> function.
              Approving or rejecting updates it within a second or two.
            </p>
            <dl class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div class="rounded-xl bg-[hsl(var(--muted))]/60 px-3 py-2">
                <dt class="text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--golden-900))]">Counted</dt>
                <dd class="font-display text-lg text-[hsl(var(--primary))]" :title="formatCount(stats?.approvedTotal || 0)">
                  {{ formatBigCount(stats?.approvedTotal || 0) }}
                </dd>
              </div>
              <div class="rounded-xl bg-amber-50 px-3 py-2">
                <dt class="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800">Held</dt>
                <dd class="font-display text-lg text-amber-800" :title="formatCount(stats?.pendingTotal || 0)">
                  {{ formatBigCount(stats?.pendingTotal || 0) }}
                </dd>
              </div>
              <div class="rounded-xl bg-[hsl(var(--muted))]/60 px-3 py-2">
                <dt class="text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--golden-900))]">Devotees</dt>
                <dd class="font-display text-lg text-[hsl(var(--primary))]">{{ formatCount(stats?.participants || 0) }}</dd>
              </div>
              <div class="rounded-xl bg-[hsl(var(--muted))]/60 px-3 py-2">
                <dt class="text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--golden-900))]">Entries</dt>
                <dd class="font-display text-lg text-[hsl(var(--primary))]">
                  {{ form.inputMode === 'checkin' ? formatCount(stats?.approvedCount || 0) : formatCount(submissions.length) }}
                </dd>
              </div>
            </dl>
            <p v-if="lastDays.length" class="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
              Recent days:
              <span v-for="day in lastDays" :key="day.dayKey" class="mr-2 inline-block">
                {{ formatUkDateLabel(day.dayKey) }} · {{ formatCount(day.amount) }}
              </span>
            </p>
          </div>

          <!-- ── Logging on behalf of the mandir ─────────────────── -->
          <div
            v-if="editingId && editingPublished && form.inputMode !== 'checkin'"
            class="border-t border-[hsl(var(--border))] pt-5"
          >
            <h3 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">
              Add a count on behalf of the mandir
            </h3>
            <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              For what the sangat did together — the collective Janmangal, a sheet of counts gathered
              at sabha. It is written as an ordinary entry under <strong>your own admin account</strong>,
              because an entry can only be created under the account making it; the name below is what
              everyone will see against it. The niyam's hard limit and auto-approve figure apply exactly
              as they do to anyone else, so a large count will be held for review — yours to approve, in
              the queue above.
            </p>
            <form class="mt-3 space-y-3" @submit.prevent="onLogMandir">
              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <label :for="`${uid}-mandir-amount`" class="admin-label">
                    How many {{ form.unit }}?
                  </label>
                  <input
                    :id="`${uid}-mandir-amount`"
                    v-model.number="mandir.amount"
                    type="number"
                    inputmode="numeric"
                    min="1"
                    :max="form.maxPerSubmission"
                    step="1"
                    class="admin-input"
                  >
                </div>
                <div>
                  <label :for="`${uid}-mandir-day`" class="admin-label">Day it was done</label>
                  <input :id="`${uid}-mandir-day`" v-model="mandir.dayKey" type="date" class="admin-input">
                </div>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <label :for="`${uid}-mandir-name`" class="admin-label">Shown as (max 32 characters)</label>
                  <input
                    :id="`${uid}-mandir-name`"
                    v-model="mandir.name"
                    type="text"
                    :maxlength="SUBMISSION_NAME_MAX"
                    class="admin-input"
                    placeholder="Mandir sabha"
                  >
                </div>
                <div>
                  <label :for="`${uid}-mandir-note`" class="admin-label">Where the count came from</label>
                  <input
                    :id="`${uid}-mandir-note`"
                    v-model="mandir.note"
                    type="text"
                    :maxlength="SUBMISSION_NOTE_MAX"
                    class="admin-input"
                    placeholder="Counted on paper at Sunday sabha"
                  >
                </div>
              </div>
              <p class="text-xs text-[hsl(var(--muted-foreground))]">
                {{ mandirOutlook }}
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <button type="submit" class="admin-btn min-h-[44px]" :disabled="mandirSaving || !isChallengeOpen(previewChallenge)">
                  {{ mandirSaving ? 'Adding…' : 'Add to this niyam' }}
                </button>
                <span v-if="!isChallengeOpen(previewChallenge)" class="text-xs text-amber-800">
                  This niyam is not open, so no entry can be created against it.
                </span>
              </div>
            </form>
            <p v-if="mandirError" class="mt-2 text-sm text-red-600">{{ mandirError }}</p>
            <p
              v-else-if="mandirResult"
              class="mt-2 rounded-lg px-3 py-2 text-sm"
              :class="mandirResult.held
                ? 'bg-amber-50 text-amber-800'
                : 'bg-[hsl(var(--golden-50))] text-[hsl(var(--primary))]'"
            >
              {{ mandirResult.message }}
              <button
                v-if="mandirResult.held"
                type="button"
                class="font-semibold underline underline-offset-2"
                @click="goToQueue(editingId || '')"
              >
                Approve it in the queue
              </button>
            </p>
          </div>

          <!-- ── Everyone's entries / check-ins ─────────────────────── -->
          <div
            v-if="editingId && editingPublished"
            class="border-t border-[hsl(var(--border))] pt-5"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">
                  {{ form.inputMode === 'checkin' ? 'Check-ins' : 'All entries' }}
                </h3>
                <p v-if="form.inputMode === 'checkin'" class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Daily Darshan check-ins are auto-approved. Reject duplicates or spam — totals update within a second or two.
                </p>
              </div>
              <div class="inline-flex rounded-lg border border-[hsl(var(--border))] bg-white p-0.5 text-xs">
                <button
                  v-for="option in entryFilters"
                  :key="option.id"
                  type="button"
                  class="min-h-[36px] rounded-md px-2.5 py-1 font-semibold transition-colors"
                  :class="filter === option.id
                    ? 'bg-[hsl(var(--primary))] text-white'
                    : 'text-[hsl(var(--muted-foreground))]'"
                  @click="filter = option.id"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <p v-if="loadingSubmissions" class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Loading entries…</p>
            <p v-else-if="!filtered.length" class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
              No entries to show.
            </p>
            <div v-else class="mt-3 overflow-x-auto">
              <table class="w-full min-w-[34rem] text-left text-sm">
                <thead class="text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                  <tr>
                    <th class="py-2 pr-3 font-semibold">Devotee</th>
                    <th class="py-2 pr-3 font-semibold">{{ form.inputMode === 'checkin' ? 'Sabhas' : 'Amount' }}</th>
                    <th v-if="form.inputMode === 'checkin'" class="py-2 pr-3 font-semibold">Slot</th>
                    <th class="py-2 pr-3 font-semibold">Day</th>
                    <th class="py-2 pr-3 font-semibold">Status</th>
                    <th class="py-2 font-semibold">Change</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[hsl(var(--border))]">
                  <tr v-for="entry in filtered" :key="entry.id">
                    <td class="py-2 pr-3">
                      <span class="font-semibold text-[hsl(var(--foreground))]">{{ entry.userName }}</span>
                      <span v-if="entry.note" class="block text-xs text-[hsl(var(--muted-foreground))]">{{ entry.note }}</span>
                      <span v-if="entry.reviewNote" class="block text-xs text-red-700">{{ entry.reviewNote }}</span>
                      <span v-if="entry.status === 'pending'" class="block text-xs text-[hsl(var(--muted-foreground))]">
                        {{ personSummary(entry) }}
                      </span>
                      <span v-else-if="form.inputMode === 'checkin'" class="block text-xs text-[hsl(var(--muted-foreground))]">
                        {{ personSummary(entry) }}
                      </span>
                    </td>
                    <td class="py-2 pr-3 font-semibold text-[hsl(var(--primary))]">{{ formatCount(entry.amount) }}</td>
                    <td v-if="form.inputMode === 'checkin'" class="py-2 pr-3 text-xs text-[hsl(var(--muted-foreground))]">
                      {{ checkinSlotLabel(entry) }}
                    </td>
                    <td class="py-2 pr-3 text-xs text-[hsl(var(--muted-foreground))]">{{ formatUkDateLabel(entry.dayKey) }}</td>
                    <td class="py-2 pr-3">
                      <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="chipClass(entry.status)">
                        {{ chipLabel(entry.status) }}
                      </span>
                    </td>
                    <td class="py-2">
                      <div class="flex flex-wrap gap-1.5">
                        <button
                          v-if="entry.status !== 'approved' && form.inputMode !== 'checkin'"
                          type="button"
                          class="min-h-[36px] text-xs font-semibold text-[hsl(var(--primary))] hover:underline disabled:opacity-40"
                          :disabled="!!reviewingId"
                          @click="approve(entry)"
                        >
                          Approve
                        </button>
                        <button
                          v-if="entry.status === 'rejected'"
                          type="button"
                          class="min-h-[36px] text-xs font-semibold text-[hsl(var(--primary))] hover:underline disabled:opacity-40"
                          :disabled="!!reviewingId"
                          @click="approve(entry)"
                        >
                          Restore
                        </button>
                        <button
                          v-if="entry.status === 'approved' && form.inputMode !== 'checkin'"
                          type="button"
                          class="min-h-[36px] text-xs font-semibold text-amber-700 hover:underline disabled:opacity-40"
                          :disabled="!!reviewingId"
                          @click="hold(entry)"
                        >
                          Hold
                        </button>
                        <button
                          v-if="entry.status !== 'rejected'"
                          type="button"
                          class="min-h-[36px] text-xs font-semibold text-red-600 hover:underline disabled:opacity-40"
                          :disabled="!!reviewingId"
                          @click="askReject(entry)"
                        >
                          Reject
                        </button>
                        <button
                          v-if="form.inputMode === 'checkin'"
                          type="button"
                          class="min-h-[36px] text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:underline disabled:opacity-40"
                          :disabled="!!reviewingId"
                          @click="askDelete(entry)"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="submissions.length >= 300" class="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
              Showing the 300 most recent entries.
            </p>
          </div>

          <!-- ── Per-person totals ───────────────────────────────── -->
          <div v-if="editingId && contributors.length" class="border-t border-[hsl(var(--border))] pt-5">
            <h3 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">
              Devotees ({{ contributors.length }})
            </h3>
            <ul class="mt-3 divide-y divide-[hsl(var(--border))] text-sm">
              <li v-for="person in contributors" :key="person.id" class="flex items-center justify-between gap-3 py-2">
                <span class="font-semibold text-[hsl(var(--foreground))]">{{ person.userName }}</span>
                <span class="text-right">
                  <span class="font-semibold text-[hsl(var(--primary))]">
                    {{ formatCount(person.approvedTotal) }} {{ form.unit }}
                  </span>
                  <span v-if="person.pendingTotal" class="block text-xs text-amber-700">
                    +{{ formatCount(person.pendingTotal) }} held
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">
          Select a niyam to edit it and review its entries, or create a new one.
        </p>
      </template>
    </AdminEditorLayout>

    <AdminConfirmDialog
      :open="!!rejectTarget"
      title="Not counting this entry"
      :body="rejectBody"
      confirm-label="Reject entry"
      with-reason
      danger
      reason-label="Why is it not being counted? (optional)"
      reason-placeholder="e.g. counted twice — the same malas are already in Sunday's entry"
      @confirm="onRejectConfirm"
      @cancel="rejectTarget = null"
    />

    <AdminConfirmDialog
      :open="!!deleteTarget"
      title="Delete this check-in?"
      :body="deleteBody"
      confirm-label="Delete check-in"
      danger
      @confirm="onDeleteConfirm"
      @cancel="deleteTarget = null"
    />

    <AdminConfirmDialog
      :open="confirmDelete"
      title="Delete this niyam?"
      body="Every entry devotees have submitted towards it is deleted too, and its total is unwound."
      confirm-label="Delete niyam and entries"
      danger
      @confirm="onDelete"
      @cancel="confirmDelete = false"
    />
  </div>
</template>

<script setup lang="ts">
import { Timestamp } from 'firebase/firestore'
import type { NiyamSubmission, NiyamSubmissionStatus } from '~/types'
import type { NiyamChallenge, NiyamIconKey, NiyamInputMode } from '~/types'
import { formatBigCount, NIYAM_ICON_NAMES } from '~/composables/useAdminNiyamChallenges'
import { iconFor, isPublished, mandirCheckinSlot, mandirCheckinSlotLabel } from '~/utils/niyamChallenge'
import {
  DEFAULT_AUTO_APPROVE_MAX,
  DEFAULT_MAX_PER_SUBMISSION,
  formatCount,
  GLOSS_MAX,
  isChallengeOpen,
  needsReview,
  NIYAM_GLOSS_BY_ICON,
  RESOURCE_LABEL_MAX,
  RESOURCE_URL_MAX,
  safeResourceUrl,
  SUBMISSION_NAME_MAX,
  SUBMISSION_NOTE_MAX,
  toMillis,
  unitLabel
} from '~/utils/niyamChallenge'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const {
  allChallenges,
  unpublishedDefaults,
  overview,
  awaitingTotal,
  overviewLoading,
  overviewError,
  queue,
  queueCapped,
  loadOverview,
  refreshChallenge,
  historyLoading,
  loadHistory,
  loading,
  saving,
  error,
  create,
  setItem,
  updateItem,
  submissions,
  contributors,
  stats,
  loadingSubmissions,
  reviewingId,
  submissionError,
  contextFor,
  queueContextFor,
  loadChallengeDetail,
  approve,
  reject,
  hold,
  removeSubmission,
  publishDefault,
  publishAllDefaults,
  logMandirEntry,
  mandirSaving,
  mandirError,
  purgeChallenge
} = useAdminNiyamChallenges()

type FilterId = 'all' | 'pending' | 'approved' | 'rejected'

const ALL = '__all__'

const filters: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Held' },
  { id: 'approved', label: 'Counted' },
  { id: 'rejected', label: 'Rejected' }
]

const entryFilters = computed(() =>
  form.inputMode === 'checkin'
    ? filters.filter(option => option.id !== 'pending')
    : filters
)

const copy = useNiyamCopy()
const { items: niyamDocuments, fetchAll: fetchNiyamDocuments } = useAdminNiyamDocuments()

const documentOptions = computed(() =>
  [...niyamDocuments.value]
    .filter(doc => doc.active)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title))
)

const uid = useId()
const filter = ref<FilterId>('all')
const showForm = ref(false)
const editingId = ref<string | null>(null)
const editingPublished = ref(false)
const queueFilter = ref('')
const queueEl = ref<HTMLElement | null>(null)
const publishingId = ref<string | null>(null)
const rejectTarget = ref<NiyamSubmission | null>(null)
const deleteTarget = ref<NiyamSubmission | null>(null)
const confirmDelete = ref(false)

const form = reactive({
  title: '',
  detail: '',
  unit: 'malas',
  unitSingular: 'mala',
  target: 10000,
  startDate: '',
  endDate: '',
  active: true,
  order: 0,
  autoApproveMax: DEFAULT_AUTO_APPROVE_MAX,
  maxPerSubmission: DEFAULT_MAX_PER_SUBMISSION,
  inputMode: 'count' as NiyamInputMode,
  presets: '',
  hint: '',
  gloss: '',
  resourceDocumentId: '',
  resourceUrl: '',
  resourceLabel: '',
  icon: 'niyam' as NiyamIconKey
})

watch(() => form.resourceDocumentId, (id) => {
  if (id) form.resourceUrl = ''
})

watch(() => form.resourceUrl, (url) => {
  if (safeResourceUrl(url)) form.resourceDocumentId = ''
})

const mandir = reactive({
  amount: '' as number | string,
  name: 'Mandir sabha',
  note: '',
  dayKey: ''
})
const mandirResult = ref<{ held: boolean; message: string } | null>(null)

const iconOptions = NIYAM_ICON_NAMES
const inputModes: { id: NiyamInputMode; label: string; hint: string }[] = [
  { id: 'count', label: 'Count', hint: 'The devotee enters how many they have done.' },
  { id: 'checkin', label: 'Check-in', hint: 'One tap adds a single entry — no number to type.' }
]

/** Three sources of failure, one banner — and never the same sentence twice. */
const problems = computed(() =>
  [...new Set([error.value, overviewError.value, submissionError.value].filter(Boolean))]
)

const countLabel = computed(() => {
  const total = allChallenges.value.length
  const waiting = unpublishedDefaults.value.length
  return waiting
    ? `${total} niyams · ${waiting} not published`
    : `${total} niyam${total === 1 ? '' : 's'}`
})

const filtered = computed(() =>
  filter.value === 'all'
    ? submissions.value
    : submissions.value.filter(s => s.status === filter.value)
)

const anyQueueCapped = computed(() => Object.values(queueCapped.value).some(Boolean))

/** Said before Save rather than after, so a typo never silently drops the link. */
const resourceUrlProblem = computed(() => {
  const raw = form.resourceUrl.trim()
  if (!raw) return ''
  return safeResourceUrl(raw) ? '' : 'That link is not a full https:// web address, so it will not be shown.'
})

const presetNumbers = computed(() =>
  form.presets
    .split(/[,\s]+/)
    .map(part => Math.floor(Number(part)))
    .filter(n => Number.isFinite(n) && n > 0)
    .slice(0, 6)
)

/** The form as a challenge, for the preview and for the open/closed checks. */
const previewChallenge = computed<NiyamChallenge>(() => ({
  id: editingId.value || 'preview',
  title: form.title,
  detail: form.detail,
  unit: form.unit.trim() || 'entries',
  unitSingular: form.unitSingular.trim() || form.unit.trim() || 'entry',
  target: Math.max(1, Math.floor(Number(form.target) || 0)),
  startAt: form.startDate ? toTimestamp(form.startDate, 'start') : null,
  endAt: form.endDate ? toTimestamp(form.endDate, 'end') : null,
  active: !!form.active,
  order: form.order,
  autoApproveMax: Math.max(0, Math.floor(Number(form.autoApproveMax) || 0)),
  maxPerSubmission: Math.max(1, Math.floor(Number(form.maxPerSubmission) || 1)),
  inputMode: form.inputMode,
  presets: presetNumbers.value,
  hint: form.hint,
  gloss: form.gloss,
  resourceDocumentId: form.resourceDocumentId.trim(),
  resourceUrl: form.resourceDocumentId.trim() ? '' : safeResourceUrl(form.resourceUrl),
  resourceLabel: form.resourceLabel.trim(),
  icon: form.icon
}))

/** Says up front whether this mandir entry will count or wait for approval. */
const mandirOutlook = computed(() => {
  const amount = Math.floor(Number(mandir.amount) || 0)
  const unit = unitLabel(previewChallenge.value, amount || 2)
  if (amount < 1) return `Recorded as “${mandir.name.trim() || 'Mandir sabha'}”, with your account behind it.`
  if (amount > previewChallenge.value.maxPerSubmission) {
    return `Over the hard limit of ${formatCount(previewChallenge.value.maxPerSubmission)} ${unit} — Firestore will refuse it. Split it across entries.`
  }
  return needsReview(previewChallenge.value, amount)
    ? `${formatCount(amount)} ${unit} is above the auto-approve figure, so it will be held and you will need to approve it in the queue.`
    : `${formatCount(amount)} ${unit} counts towards the total straight away.`
})

/** The last few days the Cloud Function has rolled up, when it has written any. */
const lastDays = computed(() => {
  const daily = stats.value?.dailyTotals
  if (!daily) return []
  return Object.entries(daily)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 5)
    .map(([dayKey, amount]) => ({ dayKey, amount }))
})

const rejectBody = computed(() => {
  const entry = rejectTarget.value
  if (!entry) return ''
  const challenge = allChallenges.value.find(c => c.id === entry.challengeId)
  const unit = challenge ? unitLabel(challenge, entry.amount) : 'entries'
  return `${entry.userName} · ${formatCount(entry.amount)} ${unit} on ${formatUkDateLabel(entry.dayKey)}. It stays on their card, marked not counted, with your reason.`
})

const deleteBody = computed(() => {
  const entry = deleteTarget.value
  if (!entry) return ''
  return `Permanently delete ${entry.userName}'s check-in for ${formatUkDateLabel(entry.dayKey)}? Totals update within a second or two.`
})

onMounted(() => {
  void loadOverview()
  void fetchNiyamDocuments()
})

/** `YYYY-MM-DD` for a date input, in UK time so it matches what admins see. */
function dateInputValue(value: NiyamChallenge['startAt']): string {
  const ms = toMillis(value)
  return ms ? ukDateId(new Date(ms)) : ''
}

function dateLabel(value: NiyamChallenge['endAt']): string {
  const ms = toMillis(value)
  return ms ? formatUkDateLabel(ukDateId(new Date(ms))) : 'no end date'
}

/** Start of the given day; end dates get the whole day, so the last day counts. */
function toTimestamp(dateString: string, edge: 'start' | 'end'): Timestamp | null {
  if (!dateString) return null
  const [year, month, day] = dateString.split('-').map(Number)
  if (!year || !month || !day) return null
  const date = edge === 'start'
    ? new Date(year, month - 1, day, 0, 0, 0, 0)
    : new Date(year, month - 1, day, 23, 59, 59, 999)
  return Timestamp.fromDate(date)
}

function listChipLabel(challenge: NiyamChallenge) {
  if (!isPublished(challenge)) return 'Not published'
  if (isChallengeOpen(challenge)) return 'Open'
  return challenge.active ? 'Scheduled' : 'Paused'
}

function listChipClass(challenge: NiyamChallenge) {
  if (!isPublished(challenge)) return 'bg-amber-50 text-amber-800'
  if (isChallengeOpen(challenge)) return 'bg-[hsl(var(--golden-50))] text-[hsl(var(--primary))]'
  return 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
}

function resetMandirForm() {
  mandir.amount = ''
  mandir.name = 'Mandir sabha'
  mandir.note = ''
  mandir.dayKey = ukDateId()
  mandirResult.value = null
  mandirError.value = ''
}

function openNew() {
  editingId.value = null
  editingPublished.value = false
  Object.assign(form, {
    title: '',
    detail: '',
    unit: 'malas',
    unitSingular: 'mala',
    target: 10000,
    startDate: ukDateId(),
    endDate: addUkDays(ukDateId(), 90),
    active: true,
    order: allChallenges.value.length + 1,
    autoApproveMax: DEFAULT_AUTO_APPROVE_MAX,
    maxPerSubmission: DEFAULT_MAX_PER_SUBMISSION,
    inputMode: 'count',
    presets: '1, 5, 11',
    hint: '',
    gloss: '',
    resourceDocumentId: '',
    resourceUrl: '',
    resourceLabel: '',
    icon: 'niyam'
  })
  showForm.value = true
  submissions.value = []
  contributors.value = []
  stats.value = null
  resetMandirForm()
}

async function openEdit(challenge: NiyamChallenge) {
  const id = String(challenge.id || '').trim()
  if (!id) {
    error.value = 'This niyam is missing a document id.'
    return
  }
  editingId.value = id
  editingPublished.value = isPublished(challenge)
  Object.assign(form, {
    title: challenge.title,
    detail: challenge.detail,
    unit: challenge.unit || 'entries',
    unitSingular: challenge.unitSingular || 'entry',
    target: challenge.target || 0,
    startDate: dateInputValue(challenge.startAt),
    endDate: dateInputValue(challenge.endAt),
    active: challenge.active !== false,
    order: challenge.order ?? 0,
    autoApproveMax: challenge.autoApproveMax ?? DEFAULT_AUTO_APPROVE_MAX,
    maxPerSubmission: challenge.maxPerSubmission ?? DEFAULT_MAX_PER_SUBMISSION,
    inputMode: challenge.inputMode || 'count',
    presets: (challenge.presets || []).join(', '),
    hint: challenge.hint || '',
    gloss: challenge.gloss || '',
    resourceDocumentId: challenge.resourceDocumentId || '',
    resourceUrl: challenge.resourceUrl || '',
    resourceLabel: challenge.resourceLabel || '',
    icon: challenge.icon || 'niyam'
  })
  showForm.value = true
  filter.value = 'all'
  resetMandirForm()
  if (editingPublished.value) {
    await loadChallengeDetail(id)
  } else {
    submissions.value = []
    contributors.value = []
    stats.value = null
  }
}

function selectChallenge(challengeId: string) {
  const challenge = allChallenges.value.find(c => c.id === challengeId)
  if (challenge) openEdit(challenge)
}

function goToQueue(challengeId: string) {
  queueFilter.value = challengeId
  nextTick(() => queueEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

function closeForm() {
  showForm.value = false
  editingId.value = null
}

async function save() {
  if (saving.value) return
  const title = form.title.trim()
  if (!title) {
    error.value = 'Give the niyam a title.'
    return
  }
  if (resourceUrlProblem.value) {
    error.value = resourceUrlProblem.value
    return
  }
  const target = Math.max(1, Math.floor(Number(form.target) || 0))
  const isCheckin = form.inputMode === 'checkin'
  const maxPerSubmission = isCheckin
    ? 2
    : Math.max(1, Math.floor(Number(form.maxPerSubmission) || 1))
  const autoApproveMax = isCheckin
    ? 1
    : Math.min(maxPerSubmission, Math.max(0, Math.floor(Number(form.autoApproveMax) || 0)))

  const payload = {
    title,
    detail: form.detail.trim(),
    unit: form.unit.trim() || 'entries',
    unitSingular: form.unitSingular.trim() || form.unit.trim() || 'entry',
    target,
    startAt: toTimestamp(form.startDate, 'start'),
    endAt: toTimestamp(form.endDate, 'end'),
    active: !!form.active,
    order: Math.max(0, Math.floor(Number(form.order) || 0)),
    autoApproveMax,
    maxPerSubmission,
    inputMode: form.inputMode,
    presets: presetNumbers.value,
    hint: form.hint.trim(),
    gloss: form.gloss.trim().slice(0, GLOSS_MAX),
    // Normalised, not just trimmed: an unusable href is stored as no link at
    // all rather than as a dead one the devotee finds out about by tapping it.
    resourceDocumentId: form.resourceDocumentId.trim(),
    resourceUrl: form.resourceDocumentId.trim() ? '' : safeResourceUrl(form.resourceUrl),
    resourceLabel: (form.resourceDocumentId.trim() || safeResourceUrl(form.resourceUrl))
      ? form.resourceLabel.trim().slice(0, RESOURCE_LABEL_MAX)
      : '',
    icon: form.icon
  }

  try {
    if (editingId.value && editingPublished.value) {
      await updateItem(editingId.value, payload)
    } else if (editingId.value) {
      // An unpublished default: write it at its own slug id, never a new one.
      await setItem(editingId.value, payload)
      editingPublished.value = true
      await loadChallengeDetail(editingId.value)
    } else {
      const id = await create(payload)
      editingId.value = id || null
      editingPublished.value = !!id
      if (id) await loadChallengeDetail(id)
    }
    form.autoApproveMax = autoApproveMax
    form.maxPerSubmission = maxPerSubmission
    // `items` already refreshed inside the write, so only this niyam's
    // totals and held entries still need re-reading.
    if (editingId.value) await refreshChallenge(editingId.value)
  } catch {
    /* error already set by the composable */
  }
}

async function onPublish(challengeId: string) {
  if (publishingId.value) return
  publishingId.value = challengeId
  try {
    await publishDefault(challengeId)
    await refreshChallenge(challengeId)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    publishingId.value = null
  }
}

async function onPublishAll() {
  if (publishingId.value) return
  publishingId.value = ALL
  try {
    await publishAllDefaults()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    publishingId.value = null
  }
}

async function onLogMandir() {
  const challenge = allChallenges.value.find(c => c.id === editingId.value)
  if (!challenge) return
  mandirResult.value = null
  try {
    const result = await logMandirEntry(challenge, {
      amount: Number(mandir.amount) || 0,
      name: mandir.name,
      note: mandir.note,
      dayKey: mandir.dayKey || ukDateId()
    })
    const unit = unitLabel(challenge, result.amount)
    mandirResult.value = result.status === 'pending'
      ? {
          held: true,
          message: `${formatCount(result.amount)} ${unit} recorded as “${mandir.name.trim() || 'Mandir sabha'}” and held for review — it is over the auto-approve figure, so it is not in the total yet.`
        }
      : {
          held: false,
          message: `${formatCount(result.amount)} ${unit} added to the total as “${mandir.name.trim() || 'Mandir sabha'}”.`
        }
    mandir.amount = ''
    mandir.note = ''
  } catch {
    /* mandirError is already set by the composable */
  }
}

async function onDelete() {
  const id = editingId.value
  confirmDelete.value = false
  if (!id) return
  try {
    await purgeChallenge(id)
    closeForm()
  } catch (e) {
    error.value = (e as Error).message
  }
}

/** Rejecting without a word back is a dead end for the devotee, so offer a reason. */
function askReject(entry: NiyamSubmission) {
  rejectTarget.value = entry
}

function onRejectConfirm(reason: string) {
  const entry = rejectTarget.value
  rejectTarget.value = null
  if (entry) reject(entry, reason)
}

function askDelete(entry: NiyamSubmission) {
  deleteTarget.value = entry
}

function onDeleteConfirm() {
  const entry = deleteTarget.value
  deleteTarget.value = null
  if (entry) void removeSubmission(entry)
}

function checkinSlotLabel(entry: NiyamSubmission): string {
  if (entry.amount >= 2) return 'Morning + evening'
  if (entry.checkinSlot === 'morning' || entry.checkinSlot === 'evening') {
    return mandirCheckinSlotLabel(entry.checkinSlot)
  }
  return mandirCheckinSlotLabel(mandirCheckinSlot(toMillis(entry.createdAt) || Date.now()))
}

/** One line an admin can judge a held entry against, inside the loaded challenge. */
function personSummary(entry: NiyamSubmission): string {
  const context = contextFor(entry)
  const unit = form.inputMode === 'checkin' ? (form.unitSingular || form.unit || 'sabha') : form.unit
  const parts = [
    `${formatCount(context.approvedTotal)} ${unit} counted so far`,
    `${context.entryCount} ${form.inputMode === 'checkin' ? (context.entryCount === 1 ? 'check-in' : 'check-ins') : (context.entryCount === 1 ? 'entry' : 'entries')} in total`
  ]
  if (context.sameDayCount > 1) {
    parts.push(`${context.sameDayCount} on this day (${formatCount(context.sameDayTotal)} ${unit})`)
  }
  if (context.pendingCount > 1) parts.push(`${context.pendingCount} awaiting review`)
  return parts.join(' · ')
}

function chipLabel(status: NiyamSubmissionStatus) {
  if (status === 'approved') return 'Counted'
  if (status === 'rejected') return 'Rejected'
  return 'Held'
}

function chipClass(status: NiyamSubmissionStatus) {
  if (status === 'approved') return 'bg-[hsl(var(--golden-50))] text-[hsl(var(--primary))]'
  if (status === 'rejected') return 'bg-red-50 text-red-700'
  return 'bg-amber-50 text-amber-800'
}

useHead({ title: 'Niyams · Admin' })
</script>
