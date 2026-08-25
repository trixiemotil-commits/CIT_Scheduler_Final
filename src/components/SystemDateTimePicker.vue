<template>
  <div class="dt-field">
    <button type="button" class="dt-trigger" @click="openPicker">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </svg>
      <span :class="{ placeholder: !modelValue }">{{ modelValue ? displayValue : placeholder }}</span>
      <span class="dt-chevron">⌄</span>
    </button>

    <Teleport to="body">
      <div v-if="open" class="dt-overlay" @click.self="cancel">
        <section class="dt-dialog" role="dialog" aria-modal="true" :aria-label="placeholder">
          <header class="dt-header">
            <p>{{ placeholder }}</p>
            <strong>{{ selectedDate ? formattedSelectedDate : 'Choose date and time' }}</strong>
          </header>

          <div class="dt-body">
            <div class="dt-calendar">
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
                  :class="{ selected: isSelected(day), today: isToday(day) }"
                  @click="selectDay(day)"
                >
                  {{ day }}
                </button>
              </div>
            </div>

            <div class="dt-time-card">
              <div class="time-card-head">
                <span class="time-label">Time</span>
                <div class="period-pills">
                  <button type="button" :class="{ active: period === 'AM' }" @click="period = 'AM'">AM</button>
                  <button type="button" :class="{ active: period === 'PM' }" @click="period = 'PM'">PM</button>
                </div>
              </div>

              <div class="time-display">
                <button type="button" :class="{ active: stage === 'hour' }" @click="stage = 'hour'">{{ hour }}</button>
                <span>:</span>
                <button type="button" :class="{ active: stage === 'minute' }" @click="stage = 'minute'">{{ minute }}</button>
              </div>

              <div class="clock-face" :class="`clock-face--${stage}`">
                <button
                  v-for="item in faceItems"
                  :key="item"
                  type="button"
                  class="clock-number"
                  :class="{ selected: selectedValue === item }"
                  :style="numberPosition(item)"
                  @click="selectClockValue(item)"
                >
                  {{ item }}
                </button>
                <div class="clock-center"></div>
              </div>
            </div>
          </div>

          <footer class="dt-actions">
            <button type="button" @click="clearValue">Clear</button>
            <span></span>
            <button type="button" @click="cancel">Cancel</button>
            <button type="button" class="set-button" :disabled="!selectedDate" @click="setValue">Set</button>
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
  placeholder: { type: String, default: 'Select date & time' },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())
const selectedDate = ref('')
const hour = ref('12')
const minute = ref('00')
const period = ref('AM')
const stage = ref('hour')
const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const daysInMonth = computed(() => new Date(viewYear.value, viewMonth.value + 1, 0).getDate())
const leadingBlanks = computed(() => new Date(viewYear.value, viewMonth.value, 1).getDay())
const monthHeading = computed(() => new Date(viewYear.value, viewMonth.value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
const displayValue = computed(() => formatDateTime(props.modelValue))
const formattedSelectedDate = computed(() => formatLongDate(selectedDate.value))
const faceItems = computed(() =>
  stage.value === 'hour'
    ? ['12', ...Array.from({ length: 11 }, (_, index) => String(index + 1))]
    : Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'))
)
const selectedValue = computed(() => stage.value === 'hour' ? String(Number(hour.value) || 12) : minute.value)

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function openPicker() {
  if (props.modelValue) {
    const [datePart, timePart = ''] = props.modelValue.split('T')
    selectedDate.value = datePart || ''
    const [rawHour = 0, rawMinute = 0] = timePart.split(':').map(Number)
    hour.value = String(rawHour % 12 || 12).padStart(2, '0')
    minute.value = String(Math.round((rawMinute || 0) / 5) * 5 % 60).padStart(2, '0')
    period.value = rawHour >= 12 ? 'PM' : 'AM'
    if (datePart) {
      const [year, month] = datePart.split('-').map(Number)
      viewYear.value = year
      viewMonth.value = month - 1
    }
  } else {
    const now = new Date()
    viewYear.value = now.getFullYear()
    viewMonth.value = now.getMonth()
    selectedDate.value = ''
    hour.value = String(now.getHours() % 12 || 12).padStart(2, '0')
    minute.value = String(Math.round(now.getMinutes() / 5) * 5 % 60).padStart(2, '0')
    period.value = now.getHours() >= 12 ? 'PM' : 'AM'
  }
  stage.value = 'hour'
  open.value = true
}

function moveMonth(amount) {
  const next = new Date(viewYear.value, viewMonth.value + amount, 1)
  viewYear.value = next.getFullYear()
  viewMonth.value = next.getMonth()
}

function selectDay(day) {
  selectedDate.value = dateKey(viewYear.value, viewMonth.value, day)
}

function isSelected(day) {
  return selectedDate.value === dateKey(viewYear.value, viewMonth.value, day)
}

function isToday(day) {
  const today = new Date()
  return dateKey(viewYear.value, viewMonth.value, day) === dateKey(today.getFullYear(), today.getMonth(), today.getDate())
}

function to24Hour() {
  let value = Number(hour.value)
  if (period.value === 'AM' && value === 12) value = 0
  if (period.value === 'PM' && value !== 12) value += 12
  return String(value).padStart(2, '0')
}

function numberPosition(item) {
  const index = faceItems.value.indexOf(item)
  const angle = index * 30
  return { transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-72px) rotate(-${angle}deg)` }
}

function selectClockValue(item) {
  if (stage.value === 'hour') {
    hour.value = String(item).padStart(2, '0')
    stage.value = 'minute'
    return
  }
  minute.value = item
}

function setValue() {
  if (!selectedDate.value) return
  emit('update:modelValue', `${selectedDate.value}T${to24Hour()}:${minute.value}`)
  open.value = false
}

function clearValue() {
  emit('update:modelValue', '')
  open.value = false
}

function cancel() {
  open.value = false
}

function formatLongDate(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
</script>

<style scoped>
.dt-field{position:relative;min-width:0}.dt-trigger{width:100%;height:46px;border:1px solid #d7e0e6;border-radius:12px;background:#fbfcfd;display:flex;align-items:center;gap:9px;padding:0 12px;color:#24303a;font:inherit;font-size:.82rem;cursor:pointer;box-shadow:inset 0 1px 2px rgba(68,80,91,.06);min-width:0;text-align:left}.dt-trigger:hover{border-color:#8c98a3;background:#fff}.dt-trigger:focus-visible{outline:0;border-color:#6b7884;box-shadow:0 0 0 3px rgba(100,113,126,.12)}.dt-trigger .placeholder{color:#a7b0b8}.dt-chevron{margin-left:auto;color:#66727c;flex-shrink:0}.dt-trigger>span:first-of-type{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.dt-overlay{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:18px;background:rgba(31,35,39,.56);backdrop-filter:blur(6px)}.dt-dialog{width:min(560px,100%);overflow:hidden;border:1px solid #d8e0e6;border-radius:22px;background:#f8fafb;box-shadow:0 26px 70px rgba(18,24,30,.34);font-family:Poppins,Arial,sans-serif}.dt-header{padding:20px 24px;background:linear-gradient(145deg,#5d6873,#343e48);color:#fff}.dt-header p{margin:0 0 7px;text-transform:uppercase;font-size:.68rem;font-weight:800;letter-spacing:.14em;opacity:.75}.dt-header strong{display:block;font-size:1.28rem;line-height:1.25;font-weight:850;letter-spacing:-.035em}
.dt-body{display:grid;grid-template-columns:minmax(0,1fr) 168px;gap:18px;padding:18px}.dt-calendar{padding:12px;border:1px solid #e1e7eb;border-radius:18px;background:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.9)}.calendar-head{display:grid;grid-template-columns:40px 1fr 40px;align-items:center;margin-bottom:8px;text-align:center}.calendar-head button{width:34px;height:34px;border:1px solid transparent;border-radius:11px;background:transparent;color:#46515d;font-size:1.5rem;line-height:1;cursor:pointer}.calendar-head button:hover{border-color:#dbe3e8;background:#f3f6f8}.calendar-head b{color:#26313b;font-size:.92rem;font-weight:850}.calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.weekdays span{padding:6px 0;text-align:center;color:#7d8790;font-size:.66rem;font-weight:850;text-transform:uppercase}.days button{aspect-ratio:1;border:0;border-radius:12px;background:transparent;color:#29323b;font:750 .82rem Poppins,Arial;cursor:pointer}.days button:hover{background:#eef2f4}.days button.today{box-shadow:inset 0 0 0 1px #9aa6af}.days button.selected{background:linear-gradient(145deg,#5d6873,#343e48);color:#fff;box-shadow:0 8px 16px rgba(55,66,77,.2)}
.dt-time-card{display:flex;flex-direction:column;justify-content:center;gap:13px;padding:16px;border:1px solid #e1e7eb;border-radius:18px;background:linear-gradient(145deg,#fff,#eef2f4)}.time-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.time-label{color:#66727c;font-size:.72rem;font-weight:850;text-transform:uppercase;letter-spacing:.12em}.period-pills{display:inline-flex;gap:4px;padding:4px;border:1px solid #dbe3e8;border-radius:999px;background:#fff}.period-pills button{width:38px;height:28px;border:0;border-radius:999px;background:transparent;color:#697680;font:850 .68rem Poppins,Arial;cursor:pointer}.period-pills button.active{background:linear-gradient(145deg,#5d6873,#343e48);color:#fff;box-shadow:0 6px 12px rgba(55,66,77,.18)}.time-display{display:flex;align-items:center;justify-content:center;gap:6px}.time-display button{min-width:54px;height:42px;border:1px solid #d8e0e6;border-radius:12px;background:#fff;color:#26313b;font:900 1rem Poppins,Arial;cursor:pointer}.time-display button.active{border-color:#44515d;background:linear-gradient(145deg,#5d6873,#343e48);color:#fff;box-shadow:0 8px 14px rgba(55,66,77,.18)}.time-display span{color:#66727c;font-weight:900}.clock-face{position:relative;width:184px;height:184px;margin:0 auto;border-radius:50%;background:linear-gradient(145deg,#eef3f6,#fff);box-shadow:inset 5px 5px 12px rgba(84,96,106,.1),inset -5px -5px 12px rgba(255,255,255,.95);user-select:none}.clock-number{position:absolute;left:50%;top:50%;width:34px;height:34px;border:0;border-radius:50%;background:transparent;color:#2d3741;font:850 .78rem Poppins,Arial;cursor:pointer;z-index:2}.clock-number:hover{background:#e6ecef}.clock-number.selected{background:linear-gradient(145deg,#5d6873,#343e48);color:#fff;box-shadow:0 7px 14px rgba(55,66,77,.22)}.clock-center{position:absolute;left:50%;top:50%;width:8px;height:8px;transform:translate(-50%,-50%);border-radius:50%;background:#44515d;box-shadow:0 0 0 5px rgba(68,81,93,.08)}
.dt-actions{display:grid;grid-template-columns:auto 1fr auto auto;gap:9px;align-items:center;padding:14px 18px 18px;border-top:1px solid #e2e8ec;background:#fff}.dt-actions button{min-height:40px;border:1px solid #dde4e9;border-radius:11px;background:#fff;color:#4f5b66;padding:0 14px;font:800 .76rem Poppins,Arial;cursor:pointer}.dt-actions button:hover{background:#f4f6f8}.dt-actions .set-button{border-color:#3e4a55;background:linear-gradient(145deg,#5d6873,#343e48);color:#fff;box-shadow:0 10px 18px rgba(48,57,66,.16)}.dt-actions .set-button:disabled{opacity:.5;cursor:not-allowed;box-shadow:none}
@media(max-width:640px){.dt-body{grid-template-columns:1fr}.dt-time-card{justify-content:flex-start}.dt-dialog{max-height:calc(100vh - 36px);overflow:auto}.dt-actions{position:sticky;bottom:0}}

.dt-dialog{width:min(680px,calc(100vw - 36px))}.dt-body{grid-template-columns:minmax(0,1fr) 238px;align-items:stretch;gap:20px;padding:20px}.dt-calendar,.dt-time-card{min-height:360px;box-sizing:border-box}.dt-calendar{display:flex;flex-direction:column;padding:16px}.calendar-head{margin-bottom:12px}.calendar-grid{gap:6px}.days{flex:1;align-content:start}.days button{min-height:38px;border-radius:11px}.dt-time-card{justify-content:flex-start;padding:18px}.time-card-head{min-height:36px}.time-display{margin-top:2px}.clock-face{width:190px;height:190px;margin:4px auto 0}.clock-number{width:34px;height:34px}.dt-actions{padding:16px 20px 20px}

@media(max-width:760px){.dt-dialog{width:min(560px,calc(100vw - 36px))}.dt-body{grid-template-columns:1fr}.dt-calendar,.dt-time-card{min-height:auto}.dt-time-card{align-items:stretch}.clock-face{width:190px;height:190px}.dt-actions{position:sticky;bottom:0}}
</style>
