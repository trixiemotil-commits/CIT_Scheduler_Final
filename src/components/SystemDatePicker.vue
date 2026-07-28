<template>
  <div>
    <button type="button" class="date-trigger" @click="openPicker">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>
      </svg>
      <span :class="{ placeholder: !modelValue }">{{ modelValue ? formattedValue : placeholder }}</span>
      <span class="chevron">⌄</span>
    </button>

    <Teleport to="body">
      <div v-if="open" class="date-overlay" @click.self="open = false">
        <section class="date-dialog" role="dialog" aria-modal="true">
          <header>
            <p>{{ placeholder }}</p>
            <strong>{{ selectedHeading }}</strong>
          </header>
          <div class="calendar-head">
            <button type="button" @click="moveMonth(-1)">‹</button>
            <b>{{ monthHeading }}</b>
            <button type="button" @click="moveMonth(1)">›</button>
          </div>
          <div class="calendar-grid weekdays">
            <span v-for="day in weekdays" :key="day">{{ day }}</span>
          </div>
          <div class="calendar-grid days">
            <span v-for="blank in leadingBlanks" :key="`blank-${blank}`"></span>
            <button
              v-for="day in daysInMonth"
              :key="day"
              type="button"
              :disabled="isDisabled(day)"
              :class="{ selected: isSelected(day), today: isToday(day) }"
              @click="selectDay(day)"
            >{{ day }}</button>
          </div>
          <footer>
            <button type="button" @click="clearDate">Clear</button>
            <span></span>
            <button type="button" @click="open = false">Cancel</button>
            <button type="button" class="today-button" @click="chooseToday">Today</button>
          </footer>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  min: { type: String, default: '' },
  placeholder: { type: String, default: 'Select date' },
})
const emit = defineEmits(['update:modelValue'])
const open = ref(false)
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())
const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const daysInMonth = computed(() => new Date(viewYear.value, viewMonth.value + 1, 0).getDate())
const leadingBlanks = computed(() => new Date(viewYear.value, viewMonth.value, 1).getDay())
const monthHeading = computed(() => new Date(viewYear.value, viewMonth.value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
const formattedValue = computed(() => formatLong(props.modelValue))
const selectedHeading = computed(() => props.modelValue ? formatLong(props.modelValue) : 'Choose an event date')

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
function formatLong(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function openPicker() {
  const source = props.modelValue || props.min
  if (source) {
    const [year, month] = source.split('-').map(Number)
    viewYear.value = year
    viewMonth.value = month - 1
  }
  open.value = true
}
function moveMonth(amount) {
  const next = new Date(viewYear.value, viewMonth.value + amount, 1)
  viewYear.value = next.getFullYear()
  viewMonth.value = next.getMonth()
}
function isDisabled(day) {
  return Boolean(props.min && dateKey(viewYear.value, viewMonth.value, day) < props.min)
}
function isSelected(day) {
  return props.modelValue === dateKey(viewYear.value, viewMonth.value, day)
}
function isToday(day) {
  const today = new Date()
  return dateKey(viewYear.value, viewMonth.value, day) === dateKey(today.getFullYear(), today.getMonth(), today.getDate())
}
function selectDay(day) {
  emit('update:modelValue', dateKey(viewYear.value, viewMonth.value, day))
  open.value = false
}
function chooseToday() {
  const today = new Date()
  const value = dateKey(today.getFullYear(), today.getMonth(), today.getDate())
  if (!props.min || value >= props.min) emit('update:modelValue', value)
  open.value = false
}
function clearDate() {
  emit('update:modelValue', '')
  open.value = false
}
</script>

<style scoped>
.date-trigger{width:100%;height:46px;border:1px solid #d4d8dc;border-radius:10px;background:linear-gradient(145deg,#fafbfc,#edf0f2);display:flex;align-items:center;gap:8px;padding:0 11px;color:#303942;font:inherit;font-size:.8rem;cursor:pointer;box-shadow:inset 1px 1px #fff;min-width:0;text-align:left}.date-trigger:hover{border-color:#7b838b}.placeholder{color:#92989e}.chevron{margin-left:auto;color:#66707a;flex-shrink:0}.date-trigger>span:first-of-type{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.date-overlay{position:fixed;inset:0;z-index:10000;background:rgba(31,35,39,.58);backdrop-filter:blur(5px);display:grid;place-items:center;padding:18px}.date-dialog{width:min(390px,100%);overflow:hidden;border:1px solid #9da4aa;border-radius:18px;background:#f7f8f9;box-shadow:0 24px 70px rgba(15,20,24,.35);font-family:Poppins,Arial,sans-serif}
header{padding:19px 24px;background:linear-gradient(145deg,#4b5563,#30383f);color:#fff}header p{margin:0 0 7px;text-transform:uppercase;font-size:.7rem;letter-spacing:.12em;opacity:.75}header strong{font-size:1.45rem;font-weight:600}
.calendar-head{display:grid;grid-template-columns:42px 1fr 42px;align-items:center;padding:15px 17px 8px;text-align:center}.calendar-head button{border:0;border-radius:50%;background:transparent;color:#4b5563;font-size:1.7rem;cursor:pointer}.calendar-head button:hover{background:#e5e8ea}.calendar-head b{font-size:.92rem;color:#30383f}
.calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;padding:0 18px}.weekdays span{text-align:center;padding:6px 0;color:#899198;font-size:.69rem;font-weight:700;text-transform:uppercase}.days{padding-bottom:12px}.days button{aspect-ratio:1;border:0;border-radius:50%;background:transparent;color:#30383f;font:500 .82rem Poppins;cursor:pointer}.days button:hover:not(:disabled){background:#dfe3e6}.days button.today{box-shadow:inset 0 0 0 1px #65707a}.days button.selected{background:#4b5563;color:#fff;box-shadow:0 4px 9px rgba(48,56,63,.28)}.days button:disabled{color:#c5c9cc;cursor:not-allowed}
footer{display:grid;grid-template-columns:auto 1fr auto auto;gap:7px;padding:10px 16px 16px;border-top:1px solid #e0e3e5}footer button{border:0;background:transparent;color:#4b5563;padding:9px 12px;border-radius:8px;font:700 .75rem Poppins;text-transform:uppercase;letter-spacing:.05em;cursor:pointer}footer button:hover{background:#e5e8ea}footer .today-button{background:#4b5563;color:#fff}
</style>
