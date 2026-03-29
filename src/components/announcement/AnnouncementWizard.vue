<template>
  <div class="flex flex-col min-h-0">

    <!-- Progress header -->
    <div class="sticky top-[106px] z-10 bg-white border-b border-gray-100 px-4 pt-3 pb-2">
      <!-- Step labels -->
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-semibold text-blue-600">Etapa {{ currentStep }} de {{ TOTAL_STEPS }}</span>
        <span class="text-xs text-gray-400 font-medium">{{ STEP_LABELS[currentStep - 1] }}</span>
      </div>
      <!-- Progress bar -->
      <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          class="h-full bg-blue-600 rounded-full transition-all duration-300"
          :style="{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }"
        />
      </div>
    </div>

    <!-- Step content -->
    <div class="flex-1 p-4 space-y-5 pb-36">

      <!-- ══════════════════════════════════════════════════════
           STEP 1 — Tipo & Categoria
           ══════════════════════════════════════════════════════ -->
      <template v-if="currentStep === 1">
        <div>
          <h2 class="text-base font-bold text-gray-900 mb-1">Tipo de anúncio</h2>
          <p class="text-xs text-gray-400 mb-3">Selecione o tipo que melhor descreve o que você está anunciando.</p>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="opt in filteredTypeOptions"
              :key="opt.value"
              type="button"
              @click="handleTypeChange(opt.value)"
              class="flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition text-sm"
              :class="form.type === opt.value
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'"
            >
              <component :is="opt.icon" class="w-7 h-7" />
              <span class="text-xs font-semibold">{{ opt.label }}</span>
            </button>
          </div>
          <p v-if="stepErrors.type" class="mt-2 text-xs text-red-600">{{ stepErrors.type }}</p>
        </div>

        <!-- Subcategory -->
        <div v-if="template.subcategories.length > 0">
          <h2 class="text-base font-bold text-gray-900 mb-1">Categoria</h2>
          <p class="text-xs text-gray-400 mb-3">Opcional — ajuda outros moradores a encontrar seu anúncio.</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="sub in template.subcategories"
              :key="sub"
              type="button"
              @click="form.subcategory = form.subcategory === sub ? '' : sub"
              class="px-3 py-2.5 rounded-xl border-2 text-xs font-medium text-left transition"
              :class="form.subcategory === sub
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'"
            >{{ sub }}</button>
          </div>
        </div>
      </template>

      <!-- ══════════════════════════════════════════════════════
           STEP 2 — Título & Descrição
           ══════════════════════════════════════════════════════ -->
      <template v-else-if="currentStep === 2">
        <div>
          <h2 class="text-base font-bold text-gray-900 mb-3">Título do anúncio</h2>
          <input
            v-model="form.title"
            type="text"
            placeholder="Ex: Sofá de 3 lugares, quase novo"
            maxlength="100"
            class="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            :class="stepErrors.title ? 'border-red-400' : 'border-gray-300'"
          />
          <div class="flex justify-between mt-1">
            <p v-if="stepErrors.title" class="text-xs text-red-600">{{ stepErrors.title }}</p>
            <p class="text-xs text-gray-400 ml-auto">{{ form.title.length }}/100</p>
          </div>
        </div>

        <div>
          <h2 class="text-base font-bold text-gray-900 mb-1">Descrição</h2>
          <p class="text-xs text-gray-400 mb-2">Opcional — descreva detalhes do item ou serviço.</p>
          <textarea
            v-model="form.description"
            placeholder="Descreva o item ou serviço com detalhes..."
            rows="5"
            maxlength="2000"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
          />
          <p class="text-xs text-gray-400 text-right mt-1">{{ form.description.length }}/2000</p>
        </div>
      </template>

      <!-- ══════════════════════════════════════════════════════
           STEP 3 — Preço & Galeria
           ══════════════════════════════════════════════════════ -->
      <template v-else-if="currentStep === 3">

        <!-- Mode toggle (only for types that support items) -->
        <div v-if="template.showItemsSection">
          <h2 class="text-base font-bold text-gray-900 mb-1">Modo de anúncio</h2>
          <p class="text-xs text-gray-400 mb-3">Escolha como quer listar seu(s) produto(s).</p>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              @click="setMultiItem(false)"
              class="flex flex-col items-start gap-1 p-4 rounded-2xl border-2 transition text-left"
              :class="!form.is_multi_item
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <PhImages :class="!form.is_multi_item ? 'text-blue-600' : 'text-gray-400'" class="w-6 h-6 mb-0.5" />
              <p :class="!form.is_multi_item ? 'text-blue-700 font-bold' : 'text-gray-700 font-semibold'" class="text-sm">Opção A</p>
              <p class="text-xs text-gray-500">Até 5 fotos e preço único</p>
            </button>
            <button
              type="button"
              @click="setMultiItem(true)"
              class="flex flex-col items-start gap-1 p-4 rounded-2xl border-2 transition text-left"
              :class="form.is_multi_item
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <PhListNumbers :class="form.is_multi_item ? 'text-blue-600' : 'text-gray-400'" class="w-6 h-6 mb-0.5" />
              <p :class="form.is_multi_item ? 'text-blue-700 font-bold' : 'text-gray-700 font-semibold'" class="text-sm">Opção B</p>
              <p class="text-xs text-gray-500">Múltiplos itens, cada um com foto e preço</p>
            </button>
          </div>
        </div>



        <!-- OPTION A: Single item (max 5 photos + price) -->
        <template v-if="!form.is_multi_item">
          <!-- Preço a combinar switch -->
          <div v-if="template.showPriceField" class="mb-4">
            <div class="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
              <span class="text-sm text-blue-800 font-semibold flex items-center gap-2"><PhTag class="w-4 h-4"/> Preço a combinar</span>
              <button
                type="button"
                @click="form.commerce_method = form.commerce_method === 'negotiable' ? '' : 'negotiable'"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                :class="form.commerce_method === 'negotiable' ? 'bg-blue-600' : 'bg-gray-200'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="form.commerce_method === 'negotiable' ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>
          </div>

          <!-- Price -->
          <div v-if="template.showPriceField && form.commerce_method !== 'negotiable'">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ form.type === 'service' ? 'Valor do serviço' : 'Preço' }}
            </label>
            <div class="relative">
              <span class="absolute left-4 top-3.5 text-gray-500 text-sm">R$</span>
              <input
                v-model.number="form.price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div class="flex items-center justify-between mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span class="text-sm text-gray-700 font-medium">Preço negociável</span>
              <button
                type="button"
                @click="form.price_negotiable = !form.price_negotiable"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                :class="form.price_negotiable ? 'bg-blue-600' : 'bg-gray-200'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="form.price_negotiable ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>
            <!-- Price preview -->
            <div class="mt-2 text-right">
              <span class="text-xs text-gray-400">Será exibido como: </span>
              <span class="text-xs font-semibold text-blue-600">{{ pricePreview }}</span>
            </div>
          </div>

          <!-- Gallery (max 5) -->
          <div>
            <h2 class="text-base font-bold text-gray-900 mb-1">Fotos</h2>
            <p class="text-xs text-gray-400 mb-3">Adicione até 5 fotos. A primeira selecionada será a capa.</p>
            <AnnouncementImageUpload
              :max-images="5"
              :existing-images="existingImages"
              :initial-files="imageFiles"
              @update:files="imageFiles = $event"
              @delete-existing="deletedImageIds.push($event)"
            />
          </div>
        </template>

        <!-- OPTION B: Multi-item catalog -->
        <template v-else>
          <div>
            <h2 class="text-base font-bold text-gray-900 mb-1">Foto de capa do anúncio</h2>
            <p class="text-xs text-gray-400 mb-3">Uma foto de capa geral para o anúncio.</p>
            <AnnouncementImageUpload
              :max-images="1"
              :existing-images="existingImages"
              :initial-files="imageFiles"
              @update:files="imageFiles = $event"
              @delete-existing="deletedImageIds.push($event)"
            />
          </div>

          <!-- Items -->
          <div>
            <h2 class="text-base font-bold text-gray-900 mb-1">Itens</h2>
            <p class="text-xs text-gray-400 mb-3">Cada item pode ter nome, foto e preço próprios.</p>
            <AnnouncementItemsSection
              :show-price="template.showPriceField"
              :initial-items="initialItems"
              @update:items="itemsList = $event"
            />
          </div>
        </template>

        <!-- Event fields -->
        <div v-if="form.type === 'event'" class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Data e horário do evento</label>
            <input
              v-model="form.event_date"
              type="datetime-local"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Local do evento</label>
            <input
              v-model="form.event_location"
              type="text"
              placeholder="Ex: Salão de festas, Térreo"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>

      </template>

      <!-- ══════════════════════════════════════════════════════
           STEP 4 — Informações extras
           ══════════════════════════════════════════════════════ -->
      <template v-else-if="currentStep === 4">
        <div>
          <h2 class="text-base font-bold text-gray-900 mb-1">Informações extras</h2>
          <p class="text-xs text-gray-400 mb-4">Tudo opcional — ative somente o que se aplica ao seu anúncio.</p>

          <!-- Business hours toggle -->
          <div v-if="template.showBusinessHours" class="space-y-3">
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div class="flex items-center gap-3">
                <PhClock class="w-5 h-5 text-gray-400" />
                <div>
                  <p class="text-sm font-semibold text-gray-800">Horário de atendimento</p>
                  <p class="text-xs text-gray-400">Configura abertura e fechamento por dia da semana</p>
                </div>
              </div>
              <button
                type="button"
                @click="showHours = !showHours"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                :class="showHours ? 'bg-blue-600' : 'bg-gray-300'"
              >
                <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform" :class="showHours ? 'translate-x-6' : 'translate-x-1'" />
              </button>
            </div>

            <div v-if="showHours" class="bg-white border border-gray-200 rounded-2xl overflow-hidden">

              <!-- Master quick-fill -->
              <div class="px-4 py-3 bg-blue-50 border-b border-blue-100 space-y-2">
                <p class="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                  <PhSun class="w-3.5 h-3.5" /> Definir horário padrão
                </p>
                <div class="flex items-center gap-2">
                  <input v-model="masterStart" type="time" class="flex-1 px-3 py-2 border border-blue-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <span class="text-gray-400 text-sm">–</span>
                  <input v-model="masterEnd" type="time" class="flex-1 px-3 py-2 border border-blue-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <button
                    type="button"
                    @click="applyMasterToAll"
                    class="px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition whitespace-nowrap flex-shrink-0"
                  >Replicar em todos</button>
                </div>
              </div>

              <!-- Per-day rows -->
              <div class="divide-y divide-gray-100">
                <div
                  v-for="(day, idx) in SCHEDULE_DAYS"
                  :key="day.key"
                  class="px-4 py-3 transition-colors space-y-2"
                  :class="{
                    'bg-blue-50':  highlightedDays.has(day.key),
                    'bg-green-50': !highlightedDays.has(day.key) && schedule[day.key].open,
                    'bg-red-50':   !highlightedDays.has(day.key) && !schedule[day.key].open,
                  }"
                >
                  <!-- Row 1: label + toggle + copy -->
                  <div class="flex items-center gap-2">
                    <span class="w-8 text-xs font-bold text-gray-700 flex-shrink-0">{{ day.label }}</span>
                    <button
                      type="button"
                      @click="toggleDayOpen(day.key)"
                      class="px-3 py-1 rounded-lg text-xs font-semibold border transition flex-shrink-0"
                      :class="schedule[day.key].open
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-500 border-red-100'"
                    >{{ schedule[day.key].open ? 'Aberto' : 'Fechado' }}</button>
                    <span v-if="schedule[day.key].open" class="flex-1 text-xs text-gray-400">
                      {{ schedule[day.key].start }} – {{ schedule[day.key].end }}
                    </span>
                    <span v-else class="flex-1 text-xs text-gray-300 italic">—</span>
                    <button
                      v-if="schedule[day.key].open"
                      type="button"
                      @click="copyToAllWeekdays(day.key)"
                      title="Copiar para todos os dias"
                      class="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-blue-500 transition flex-shrink-0"
                    ><PhCopy class="w-4 h-4" /></button>
                  </div>
                  <!-- Row 2: time inputs (only if open) -->
                  <div v-if="schedule[day.key].open" class="flex items-center gap-2 pl-10">
                    <input
                      v-model="schedule[day.key].start"
                      type="time"
                      class="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
                    />
                    <span class="text-gray-300 text-sm flex-shrink-0">–</span>
                    <input
                      v-model="schedule[day.key].end"
                      type="time"
                      class="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
                    />
                    <div class="w-7 flex-shrink-0" />
                  </div>
                </div>
              </div>

              <!-- Feriados row -->
              <div class="px-4 py-3 bg-amber-50 border-t border-amber-100 space-y-2">
                <!-- Row 1: icon + label + toggle -->
                <div class="flex items-center gap-2">
                  <PhCalendarX class="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span class="text-xs font-bold text-amber-700 flex-shrink-0">Feriados</span>
                  <button
                    type="button"
                    @click="schedule.holidays.open = !schedule.holidays.open"
                    class="px-3 py-1 rounded-lg text-xs font-semibold border transition flex-shrink-0"
                    :class="schedule.holidays.open
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-500 border-red-100'"
                  >{{ schedule.holidays.open ? 'Aberto' : 'Fechado' }}</button>
                  <span v-if="schedule.holidays.open" class="flex-1 text-xs text-amber-600">
                    {{ schedule.holidays.start }} – {{ schedule.holidays.end }}
                  </span>
                  <span v-else class="flex-1 text-xs text-gray-400 italic">—</span>
                </div>
                <!-- Row 2: time inputs (only if open) -->
                <div v-if="schedule.holidays.open" class="flex items-center gap-2 pl-5">
                  <input v-model="schedule.holidays.start" type="time" class="flex-1 px-3 py-2 border border-amber-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition" />
                  <span class="text-gray-300 text-sm flex-shrink-0">–</span>
                  <input v-model="schedule.holidays.end" type="time" class="flex-1 px-3 py-2 border border-amber-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition" />
                </div>
                <!-- Holiday message -->
                <input
                  v-model="schedule.holidays.message"
                  type="text"
                  maxlength="50"
                  placeholder="Ex: Exceto Natal e Carnaval (opcional)"
                  class="w-full px-3 py-2 border border-amber-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                />
              </div>
            </div>
          </div>

          <!-- Address / Maps toggle -->
          <div v-if="template.showMapsLink" class="mt-3 space-y-3">
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div class="flex items-center gap-3">
                <PhMapPin class="w-5 h-5 text-red-400" />
                <div>
                  <p class="text-sm font-semibold text-gray-800">Endereço / Localização</p>
                  <p class="text-xs text-gray-400">Adiciona um link do Google Maps</p>
                </div>
              </div>
              <button
                type="button"
                @click="showMaps = !showMaps"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                :class="showMaps ? 'bg-blue-600' : 'bg-gray-300'"
              >
                <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform" :class="showMaps ? 'translate-x-6' : 'translate-x-1'" />
              </button>
            </div>
            <div v-if="showMaps" class="bg-white border border-gray-200 rounded-2xl p-4">
              <label class="block text-xs text-gray-500 mb-1.5 flex items-center gap-1"><PhMapPin class="w-3.5 h-3.5 text-red-500" /> Link do Google Maps</label>
              <input
                v-model="form.maps_link"
                type="url"
                placeholder="https://maps.google.com/..."
                class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <!-- Links section -->
          <div class="mt-3 space-y-3">
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div class="flex items-center gap-3">
                <PhLink class="w-5 h-5 text-blue-400" />
                <div>
                  <p class="text-sm font-semibold text-gray-800">Links externos</p>
                  <p class="text-xs text-gray-400">Site, cardápio, portfólio, etc.</p>
                </div>
              </div>
              <button
                type="button"
                @click="showLinks = !showLinks"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                :class="showLinks ? 'bg-blue-600' : 'bg-gray-300'"
              >
                <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform" :class="showLinks ? 'translate-x-6' : 'translate-x-1'" />
              </button>
            </div>
            <div v-if="showLinks" class="bg-white border border-gray-200 rounded-2xl p-4">
              <AnnouncementLinksSection
                :initial-links="initialLinks"
                @update:links="linksList = $event"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- ══════════════════════════════════════════════════════
           STEP 5 — Contato
           ══════════════════════════════════════════════════════ -->
      <template v-else-if="currentStep === 5">
        <div>
          <h2 class="text-base font-bold text-gray-900 mb-1">Como quer receber contatos?</h2>
          <p class="text-xs text-gray-400 mb-4">Escolha uma ou mais formas de contato.</p>

          <!-- Chat option -->
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-3">
            <div class="flex items-center gap-3">
              <PhChatCircle class="w-5 h-5 text-blue-500" />
              <div>
                <p class="text-sm font-semibold text-gray-800">Chat do App</p>
                <p class="text-xs text-gray-400">Moradores enviam mensagem diretamente pelo app</p>
              </div>
            </div>
            <button
              type="button"
              @click="form.contact_type = form.contact_type === 'chat' ? 'whatsapp' : 'chat'"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
              :class="form.contact_type === 'chat' ? 'bg-blue-600' : 'bg-gray-300'"
            >
              <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform" :class="form.contact_type === 'chat' ? 'translate-x-6' : 'translate-x-1'" />
            </button>
          </div>

          <!-- WhatsApp contacts -->
          <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
            <div class="flex items-center gap-3">
              <PhWhatsappLogo class="w-5 h-5 text-green-500" />
              <div>
                <p class="text-sm font-semibold text-gray-800">WhatsApp</p>
                <p class="text-xs text-gray-400">Adicione um ou mais números. O primeiro será o principal.</p>
              </div>
            </div>

            <!-- WhatsApp list -->
            <div v-if="waList.length" class="space-y-2">
              <div
                v-for="(wa, idx) in waList"
                :key="wa._key"
                class="flex items-center gap-2"
              >
                <div class="flex-1 relative">
                  <span class="absolute left-3 top-2.5 text-xs text-gray-400 select-none">
                    {{ idx === 0 ? 'Principal' : `#${idx + 1}` }}
                  </span>
                  <input
                    v-model="wa.number"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    maxlength="20"
                    class="w-full pl-20 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    @input="syncContactType"
                  />
                </div>
                <input
                  v-model="wa.description"
                  type="text"
                  placeholder="Rótulo (opcional)"
                  maxlength="30"
                  class="w-28 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition text-gray-600"
                />
                <button
                  type="button"
                  @click="removeWa(idx)"
                  class="w-8 h-9 flex items-center justify-center text-gray-300 hover:text-red-400 transition flex-shrink-0"
                >
                  <PhTrash class="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              v-if="waList.length < 5"
              type="button"
              @click="addWa"
              class="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-green-400 hover:text-green-600 transition"
            >
              <PhPlus class="w-4 h-4" /> Adicionar WhatsApp
            </button>
          </div>

          <p v-if="stepErrors.contact" class="mt-2 text-xs text-red-600">{{ stepErrors.contact }}</p>
        </div>
      </template>

      <!-- ══════════════════════════════════════════════════════
           STEP 6 — Revisão / Criar
           ══════════════════════════════════════════════════════ -->
      <template v-else-if="currentStep === 6">
        <div>
          <h2 class="text-base font-bold text-gray-900 mb-1">Revisão do anúncio</h2>
          <p class="text-xs text-gray-400 mb-4">Tudo certo? Confira e publique.</p>

          <div class="space-y-3">

            <!-- Tipo & Categoria -->
            <div class="relative flex items-center gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <button type="button" @click="currentStep = 1" class="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400 hover:text-blue-600 bg-white p-1.5 rounded-lg border border-gray-200 transition"><PhPencilSimple class="w-4 h-4" /></button>
              <component :is="selectedTypeOption?.icon" class="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div class="min-w-0 pr-8">
                <p class="text-xs text-gray-400">Tipo</p>
                <p class="text-sm font-semibold text-gray-900">
                  {{ selectedTypeOption?.label }}
                  <span v-if="form.subcategory" class="font-normal text-gray-500"> · {{ form.subcategory }}</span>
                </p>
              </div>
            </div>

            <!-- Título -->
            <div class="relative bg-gray-50 rounded-2xl p-4 border border-gray-100 pr-12">
              <button type="button" @click="currentStep = 2" class="absolute top-4 right-4 text-gray-400 hover:text-blue-500 bg-white shadow-sm p-1.5 rounded-lg border border-gray-100 transition"><PhPencilSimple class="w-4 h-4" /></button>
              <p class="text-xs text-gray-400 mb-0.5">Título</p>
              <p class="text-sm font-semibold text-gray-900">{{ form.title }}</p>
              <p v-if="form.description" class="text-xs text-gray-500 mt-1 line-clamp-2 whitespace-pre-line">{{ form.description }}</p>
            </div>

            <!-- Preço -->
            <div v-if="template.showPriceField" class="relative bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <button type="button" @click="currentStep = 3" class="absolute top-4 right-4 text-gray-400 hover:text-blue-500 bg-white shadow-sm p-1.5 rounded-lg border border-gray-100 transition"><PhPencilSimple class="w-4 h-4" /></button>
              <p class="text-xs text-gray-400 mb-1">Preço</p>

              <!-- Multi-item: Tabelado + lista de itens -->
              <template v-if="form.is_multi_item">
                <p class="text-sm font-semibold text-blue-600 mb-2">Tabelado</p>
                <div v-if="reviewItems.length" class="space-y-1.5 pr-8">
                  <div
                    v-for="item in reviewItems"
                    :key="item._key"
                    class="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-3 py-2"
                  >
                    <span class="text-xs text-gray-700 font-medium truncate flex-1 mr-2">{{ item.name || '(sem nome)' }}</span>
                    <span class="text-xs font-semibold text-blue-600 flex-shrink-0">
                      {{ item.price ? formatPrice(item.price) : 'Sob consulta' }}
                    </span>
                  </div>
                </div>
                <p v-else class="text-xs text-gray-400 italic">Nenhum item adicionado ainda</p>
              </template>

              <!-- Item único -->
              <template v-else>
                <p class="text-sm font-semibold text-blue-600">{{ pricePreview }}</p>
              </template>
            </div>

            <!-- Fotos -->
            <div v-if="totalPhotoCount > 0" class="relative bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
              <PhImages class="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div class="pr-8">
                <p class="text-xs text-gray-400">Fotos</p>
                <p class="text-sm text-gray-700">
                  {{ totalPhotoCount }} foto{{ totalPhotoCount > 1 ? 's' : '' }}
                  <span v-if="form.is_multi_item && coverPhotoCount > 0" class="text-gray-400"> ({{ coverPhotoCount }} capa + {{ totalPhotoCount - coverPhotoCount }} de itens)</span>
                </p>
              </div>
              <button type="button" @click="currentStep = 3" class="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400 hover:text-blue-500 bg-white p-1.5 rounded-lg border border-gray-200 transition"><PhPencilSimple class="w-4 h-4" /></button>
            </div>

            <!-- Horários -->
            <div v-if="template.showBusinessHours && showHours" class="relative bg-gray-50 rounded-2xl p-4 border border-gray-100 pr-12">
              <button type="button" @click="currentStep = 4" class="absolute top-4 right-4 text-gray-400 hover:text-blue-500 bg-white shadow-sm p-1.5 rounded-lg border border-gray-100 transition"><PhPencilSimple class="w-4 h-4" /></button>
              <p class="text-xs text-gray-400 mb-2">Horário de atendimento</p>
              <div class="space-y-1">
                <div
                  v-for="day in SCHEDULE_DAYS"
                  :key="day.key"
                  class="flex items-center gap-2 text-xs"
                >
                  <span class="w-8 font-semibold text-gray-600 flex-shrink-0">{{ day.label }}</span>
                  <span
                    class="px-2 py-0.5 rounded-md text-xs font-semibold flex-shrink-0"
                    :class="schedule[day.key].open ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-400'"
                  >{{ schedule[day.key].open ? 'Aberto' : 'Fechado' }}</span>
                  <span v-if="schedule[day.key].open" class="text-gray-600">
                    {{ schedule[day.key].start }} – {{ schedule[day.key].end }}
                  </span>
                </div>
                <!-- Feriados -->
                <div class="flex items-center gap-2 text-xs pt-1 border-t border-gray-100 mt-1">
                  <span class="w-8 font-semibold text-amber-700 flex-shrink-0">Fer.</span>
                  <span
                    class="px-2 py-0.5 rounded-md text-xs font-semibold flex-shrink-0"
                    :class="schedule.holidays.open ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-400'"
                  >{{ schedule.holidays.open ? 'Aberto' : 'Fechado' }}</span>
                  <span v-if="schedule.holidays.open" class="text-gray-600">
                    {{ schedule.holidays.start }} – {{ schedule.holidays.end }}
                  </span>
                  <span v-if="schedule.holidays.message" class="text-amber-600 truncate">· {{ schedule.holidays.message }}</span>
                </div>
              </div>
            </div>

            <!-- Endereço -->
            <div v-if="showMaps && form.maps_link" class="relative bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
              <button type="button" @click="currentStep = 4" class="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400 hover:text-blue-500 bg-white p-1.5 rounded-lg border border-gray-200 transition"><PhPencilSimple class="w-4 h-4" /></button>
              <PhMapPin class="w-5 h-5 text-red-400 flex-shrink-0" />
              <div class="min-w-0 pr-8">
                <p class="text-xs text-gray-400">Localização</p>
                <p class="text-xs text-gray-600 truncate">{{ form.maps_link }}</p>
              </div>
            </div>

            <!-- Links externos -->
            <div v-if="reviewLinks.length" class="relative bg-gray-50 rounded-2xl p-4 border border-gray-100 pr-12">
              <button type="button" @click="currentStep = 4" class="absolute top-4 right-4 text-gray-400 hover:text-blue-500 bg-white shadow-sm p-1.5 rounded-lg border border-gray-100 transition"><PhPencilSimple class="w-4 h-4" /></button>
              <p class="text-xs text-gray-400 mb-2">Links externos ({{ reviewLinks.length }})</p>
              <div class="space-y-1">
                <div
                  v-for="link in reviewLinks"
                  :key="link._key"
                  class="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2"
                >
                  <PhLink class="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span class="text-xs text-blue-600 truncate">{{ link.title || link.url }}</span>
                </div>
              </div>
            </div>

            <!-- Contato -->
            <div class="relative bg-gray-50 rounded-2xl p-4 border border-gray-100 pr-12">
              <button type="button" @click="currentStep = 5" class="absolute top-4 right-4 text-gray-400 hover:text-blue-500 bg-white shadow-sm p-1.5 rounded-lg border border-gray-100 transition"><PhPencilSimple class="w-4 h-4" /></button>
              <p class="text-xs text-gray-400 mb-2">Contato</p>
              <div class="space-y-1.5">
                <!-- Chat -->
                <div v-if="form.contact_type === 'chat'" class="flex items-center gap-2">
                  <PhChatCircle class="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span class="text-sm text-gray-700">Chat do app</span>
                </div>
                <!-- WhatsApp list -->
                <div
                  v-for="(wa, idx) in reviewWa"
                  :key="wa._key"
                  class="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2"
                >
                  <PhWhatsappLogo class="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span class="text-xs font-semibold text-gray-500 flex-shrink-0">{{ idx === 0 ? 'Principal' : `#${idx + 1}` }}</span>
                  <span class="text-sm text-gray-700 truncate">{{ wa.number }}</span>
                  <span v-if="wa.description" class="text-xs text-gray-400 flex-shrink-0">· {{ wa.description }}</span>
                </div>
                <p v-if="form.contact_type !== 'chat' && reviewWa.length === 0" class="text-xs text-gray-400 italic">Nenhum número adicionado</p>
              </div>
            </div>

          </div>

          <!-- Submit error -->
          <p v-if="submitError" class="mt-4 text-sm text-red-600 text-center">{{ submitError }}</p>
        </div>
      </template>
    </div>

    <!-- Bottom nav (fixed) -->
    <div class="fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 py-3 flex gap-3 safe-area-bottom">
      <button
        v-if="currentStep > 1"
        type="button"
        @click="prevStep"
        class="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
      >
        ← Voltar
      </button>

      <button
        v-if="currentStep < TOTAL_STEPS"
        type="button"
        @click="nextStep"
        class="flex-1 py-3.5 bg-blue-600 text-white text-sm font-semibold rounded-2xl hover:bg-blue-700 transition"
      >
        Continuar →
      </button>

      <button
        v-if="isEdit && currentStep < TOTAL_STEPS"
        type="button"
        :disabled="submitting"
        @click="handleSubmit"
        class="flex-1 py-3.5 bg-green-600 text-white text-sm font-bold rounded-2xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Salvar
      </button>

      <button
        v-if="currentStep === TOTAL_STEPS"
        type="button"
        :disabled="submitting"
        @click="handleSubmit"
        class="flex-1 py-3.5 bg-blue-600 text-white text-sm font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {{ submitting ? (isEdit ? 'Salvando...' : 'Publicando...') : (isEdit ? 'Salvar alterações' : '🚀 Criar anúncio') }}
      </button>
    </div>

    <!-- ══════════ Zero-price donation popup ══════════ -->
    <Transition name="fade">
      <div v-if="showDonationPopup" class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" @click.self="showDonationPopup = false">
        <div class="w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 shadow-2xl">
          <div class="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
          <div class="text-center mb-5">
            <div class="text-4xl mb-2">🎁</div>
            <h3 class="text-lg font-bold text-gray-900">O anúncio é uma doação?</h3>
            <p class="text-sm text-gray-500 mt-1">O preço está em zero — este item é gratuito?</p>
          </div>
          <div class="flex flex-col gap-3">
            <button
              type="button"
              @click="confirmDonation"
              class="w-full py-3.5 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition"
            >
              ✅ Sim, é uma doação
            </button>
            <button
              type="button"
              @click="denyDonation"
              class="w-full py-3.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition"
            >
              ❌ Não, vou adicionar um preço
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import AnnouncementImageUpload from './AnnouncementImageUpload.vue'
import AnnouncementItemsSection from './AnnouncementItemsSection.vue'
import AnnouncementLinksSection from './AnnouncementLinksSection.vue'
import type { ItemFormData } from './AnnouncementItemsSection.vue'
import type { LinkFormData } from './AnnouncementLinksSection.vue'
import type { WhatsAppContactFormData } from './AnnouncementWhatsAppSection.vue'
import type { AnnouncementType, AnnouncementImage } from '@/types/app.types'
import { ANNOUNCEMENT_TEMPLATES, WEEK_DAYS, getCommerceMethods } from '@/config/announcementTemplates'
import { formatPrice } from '@/utils/formatters'
import { useAuthStore } from '@/stores/auth'

import {
  PhTag,
  PhWrench,
  PhGift,
  PhHandsPraying,
  PhCalendarBlank,
  PhMegaphone,
  PhChatCircle,
  PhWhatsappLogo,
  PhMapPin,
  PhSun,
  PhMoon,
  PhCalendarX,
  PhClock,
  PhImages,
  PhListNumbers,
  PhLink,
  PhTrash,
  PhPlus,
  PhCopy,
  PhPencilSimple,
} from '@phosphor-icons/vue'
import { createDefaultSchedule } from '@/config/announcementTemplates'
import type { BusinessSchedule } from '@/types/app.types'

// ─── Types ────────────────────────────────────────────────────────────────────
interface WaEntry {
  _key: string
  number: string
  description: string
}

interface FormData {
  type: AnnouncementType
  title: string
  description: string
  price: number | null
  price_negotiable: boolean
  is_multi_item: boolean
  subcategory: string
  commerce_method: string
  event_date: string
  event_location: string
  contact_type: 'chat' | 'whatsapp'
  contact_whatsapp: string
  maps_link: string
  business_open_time: string
  business_close_time: string
  business_days: string[]
  closed_on_holidays: boolean
  holiday_message: string
}

// ─── Props / Emits ───────────────────────────────────────────────────────────
const props = withDefaults(defineProps<{
  initialData?: Partial<FormData> & { business_schedule?: BusinessSchedule | null }
  existingImages?: Pick<AnnouncementImage, 'id' | 'url' | 'is_cover'>[]
  initialItems?: Omit<ItemFormData, '_key'>[]
  initialLinks?: Omit<LinkFormData, '_key'>[]
  initialContacts?: Omit<WhatsAppContactFormData, '_key'>[]
  isEdit?: boolean
  draftKey?: string
}>(), {
  initialData: () => ({}),
  existingImages: () => [],
  initialItems: () => [],
  initialLinks: () => [],
  initialContacts: () => [],
  isEdit: false,
  draftKey: 'new_announcement_draft',
})

const emit = defineEmits<{
  submit: [
    data: FormData,
    images: File[],
    deletedImageIds: string[],
    items: ItemFormData[],
    links: LinkFormData[],
    contacts: WhatsAppContactFormData[]
  ]
}>()

// ─── Constants ────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 6
const STEP_LABELS = ['Tipo & Categoria', 'Título & Descrição', 'Preço & Galeria', 'Infos extras', 'Contato', 'Revisão']

// ─── Auth ─────────────────────────────────────────────────────────────────────
const authStore = useAuthStore()
const isSyndic = computed(() => authStore.isSyndic)

// ─── Schedule state (per-day hours) ─────────────────────────────────────────
const SCHEDULE_DAYS = [
  { key: 'mon' as const, label: 'Seg' },
  { key: 'tue' as const, label: 'Ter' },
  { key: 'wed' as const, label: 'Qua' },
  { key: 'thu' as const, label: 'Qui' },
  { key: 'fri' as const, label: 'Sex' },
  { key: 'sat' as const, label: 'Sáb' },
  { key: 'sun' as const, label: 'Dom' },
]

const schedule = reactive<BusinessSchedule>(
  props.initialData?.business_schedule || createDefaultSchedule()
)
const masterStart = ref('08:00')
const masterEnd = ref('18:00')
const highlightedDays = ref(new Set<string>())

function toggleDayOpen(key: keyof Omit<BusinessSchedule, 'holidays'>) {
  schedule[key].open = !schedule[key].open
}

function applyMasterToAll() {
  const start = masterStart.value
  const end = masterEnd.value
  for (const day of SCHEDULE_DAYS) {
    schedule[day.key].start = start
    schedule[day.key].end = end
  }
  // Flash all rows
  highlightedDays.value = new Set(SCHEDULE_DAYS.map(d => d.key))
  setTimeout(() => { highlightedDays.value = new Set() }, 800)
}

function copyToAllWeekdays(sourceKey: keyof Omit<BusinessSchedule, 'holidays'>) {
  const { start, end } = schedule[sourceKey]
  for (const day of SCHEDULE_DAYS) {
    if (day.key !== sourceKey) {
      schedule[day.key].start = start
      schedule[day.key].end = end
    }
  }
  highlightedDays.value = new Set(SCHEDULE_DAYS.filter(d => d.key !== sourceKey).map(d => d.key))
  setTimeout(() => { highlightedDays.value = new Set() }, 800)
}

// ─── Step state ──────────────────────────────────────────────────────────────
const currentStep = ref(props.isEdit ? 6 : 1)
const stepErrors = reactive({ type: '', title: '', contact: '' })

// ─── Form state ──────────────────────────────────────────────────────────────
const form = reactive<FormData>({
  type: 'sale',
  title: '',
  description: '',
  price: null,
  price_negotiable: false,
  is_multi_item: false,
  subcategory: '',
  commerce_method: '',
  event_date: '',
  event_location: '',
  contact_type: 'chat',
  contact_whatsapp: '',
  maps_link: '',
  business_open_time: '',
  business_close_time: '',
  business_days: [],
  closed_on_holidays: false,
  holiday_message: '',
  ...props.initialData, // Apply initial data if available
})

// Show toggles for optional sections in Step 4
const showHours = ref(!!props.initialData?.business_schedule)
const showMaps = ref(!!props.initialData?.maps_link)
const showLinks = ref(props.initialLinks.length > 0)

// Files
const imageFiles = ref<File[]>([])
const deletedImageIds = ref<string[]>([])
const submitting = ref(false)
const submitError = ref('')

// WhatsApp entries
const now = Date.now()
const waList = ref<WaEntry[]>(
  props.initialContacts.length
    ? props.initialContacts.map((c, i) => ({ _key: `wa_${i}_${now}`, number: c.number, description: c.description ?? '' }))
    : []
)

// Lists (items + links)
const itemsList = ref<ItemFormData[]>(
  props.initialItems.map((item, i) => ({ ...item, _key: `item_${i}_${now}` }))
)
const linksList = ref<LinkFormData[]>(
  props.initialLinks.map((l, i) => ({ ...l, _key: `link_${i}_${now}` }))
)

// Donation popup
const showDonationPopup = ref(false)

// ─── Computed ─────────────────────────────────────────────────────────────────
const template = computed(() => ANNOUNCEMENT_TEMPLATES[form.type] ?? ANNOUNCEMENT_TEMPLATES.sale)
const activeCommerceMethods = computed(() => getCommerceMethods(form.type, form.is_multi_item))

const typeOptions = [
  { value: 'sale' as AnnouncementType, icon: PhTag, label: 'Produto' },
  { value: 'service' as AnnouncementType, icon: PhWrench, label: 'Serviço' },
  { value: 'donation' as AnnouncementType, icon: PhGift, label: 'Doação' },
  { value: 'donation_request' as AnnouncementType, icon: PhHandsPraying, label: 'Pedido' },
  { value: 'event' as AnnouncementType, icon: PhCalendarBlank, label: 'Evento', syndicOnly: true },
  { value: 'campaign' as AnnouncementType, icon: PhMegaphone, label: 'Campanha', syndicOnly: true },
]

const filteredTypeOptions = computed(() => {
  if (isSyndic.value) return typeOptions
  return typeOptions.filter(t => !(t as any).syndicOnly)
})

const selectedTypeOption = computed(() => typeOptions.find(t => t.value === form.type))

const pricePreview = computed(() => {
  if (!template.value.showPriceField) return '—'
  if (form.commerce_method === 'negotiable') return 'A combinar'
  return formatPrice(form.price ?? undefined, form.price_negotiable)
})

/** Items with at least a name — for the review step */
const reviewItems = computed(() => itemsList.value.filter(i => i.name?.trim()))

/** Cover photos: newly uploaded + existing ones not deleted */
const coverPhotoCount = computed(() => {
  return imageFiles.value.length + props.existingImages.length - deletedImageIds.value.length
})

/** Total photos: cover images + per-item images */
const totalPhotoCount = computed(() => {
  const itemPhotos = itemsList.value.filter(i => i.imageFile || i.image_url).length
  return coverPhotoCount.value + itemPhotos
})

/** Links with a filled URL — for the review step */
const reviewLinks = computed(() => linksList.value.filter(l => l.url?.trim()))

/** WhatsApp entries with a number — for the review step */
const reviewWa = computed(() => waList.value.filter(w => w.number?.trim()))

// ─── Methods ──────────────────────────────────────────────────────────────────
function handleTypeChange(val: AnnouncementType) {
  form.type = val
  form.subcategory = ''
  form.commerce_method = ''
  form.is_multi_item = false
  if (!ANNOUNCEMENT_TEMPLATES[val].showPriceField) {
    form.price = null
    form.price_negotiable = false
  }
}

function setMultiItem(val: boolean) {
  form.is_multi_item = val
  if (val) {
    form.commerce_method = 'tabelado'
  } else if (form.commerce_method === 'tabelado') {
    form.commerce_method = ''
  }
}

function toggleDay(key: string) {
  const idx = form.business_days.indexOf(key)
  if (idx >= 0) form.business_days.splice(idx, 1)
  else form.business_days.push(key)
}

function addWa() {
  waList.value.push({ _key: `wa_new_${Date.now()}`, number: '', description: '' })
  if (form.contact_type !== 'whatsapp') form.contact_type = 'whatsapp'
}

function removeWa(idx: number) {
  waList.value.splice(idx, 1)
  if (waList.value.length === 0) form.contact_type = 'chat'
}

function syncContactType() {
  const filled = waList.value.filter(w => w.number.trim())
  if (filled.length > 0) form.contact_type = 'whatsapp'
}

// ─── Validation & navigation ──────────────────────────────────────────────────
function validateStep(step: number): boolean {
  stepErrors.type = ''
  stepErrors.title = ''
  stepErrors.contact = ''

  if (step === 1) {
    if (!form.type) { stepErrors.type = 'Selecione o tipo'; return false }
    return true
  }
  if (step === 2) {
    if (!form.title || form.title.trim().length < 3) { stepErrors.title = 'Título deve ter ao menos 3 caracteres'; return false }
    return true
  }
  return true
}

function checkZeroPrice(): boolean {
  if (!template.value.showPriceField) return false
  if (form.is_multi_item) return false
  if (form.type === 'donation' || form.type === 'donation_request') return false
  if (form.commerce_method === 'negotiable') return false
  const hasPrice = form.price != null && form.price > 0
  return !hasPrice && !form.price_negotiable
}

function nextStep() {
  if (!validateStep(currentStep.value)) return

  // Zero-price check happens on Step 3 → Step 4
  if (currentStep.value === 3 && checkZeroPrice()) {
    showDonationPopup.value = true
    return
  }

  if (currentStep.value < TOTAL_STEPS) currentStep.value++
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function confirmDonation() {
  form.type = 'donation'
  form.price = null
  form.price_negotiable = false
  showDonationPopup.value = false
  currentStep.value++
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function denyDonation() {
  showDonationPopup.value = false
  // stays on Step 3 so user can add price
}

function handleSubmit() {
  submitError.value = ''
  if (!validateStep(1) || !validateStep(2)) {
    submitError.value = 'Verifique os campos obrigatórios.'
    return
  }

  // Build contacts list
  const contacts: WhatsAppContactFormData[] = waList.value
    .filter(w => w.number.trim())
    .map((w) => ({ _key: w._key, number: w.number.trim(), description: w.description || undefined }))

  // Sync primary whatsapp
  form.contact_whatsapp = contacts[0]?.number ?? ''
  if (contacts.length === 0) form.contact_type = 'chat'

  submitting.value = true
  // Exclude holiday_message — no DB column yet (UI-only field)
  const { holiday_message: _hm, ...formPayload } = form

  // Include per-day schedule if hours are enabled
  const businessSchedule = showHours.value ? { ...schedule } : null

  emit(
    'submit',
    { ...formPayload, business_schedule: businessSchedule } as any,
    imageFiles.value,
    deletedImageIds.value,
    itemsList.value,
    linksList.value,
    contacts
  )
}

// ─── Draft auto-save ─────────────────────────────────────────────────────────
let draftTimer: ReturnType<typeof setTimeout>
watch(form, () => {
  if (props.isEdit) return // Skip drafts during edit mode
  clearTimeout(draftTimer)
  draftTimer = setTimeout(() => {
    localStorage.setItem(props.draftKey, JSON.stringify(form))
  }, 1000)
}, { deep: true })

onMounted(() => {
  if (!props.isEdit) {
    const saved = localStorage.getItem(props.draftKey)
    if (saved) {
      try {
        const draft = JSON.parse(saved) as Partial<FormData>
        Object.assign(form, draft)
        // Restore toggles
        if (form.business_open_time || form.business_close_time) showHours.value = true
        if (form.maps_link) showMaps.value = true
      } catch { /* ignore */ }
    }
  } else {
    // If it's edit mode, ensure toggles are properly initialized from props
    // This is already done for refs above, but just to be sure
    if (props.initialData?.business_schedule) showHours.value = true
    if (props.initialData?.maps_link) showMaps.value = true
    if (props.initialLinks?.length > 0) showLinks.value = true
  }
})

onBeforeUnmount(() => clearTimeout(draftTimer))

// ─── Expose ───────────────────────────────────────────────────────────────────
function setSubmitting(val: boolean) { submitting.value = val }
function setError(msg: string) { submitError.value = msg }
function clearDraft() { localStorage.removeItem(props.draftKey) }

defineExpose({ setSubmitting, setError, clearDraft })
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
