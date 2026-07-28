<template>
  <div class="clock-field">
    <button type="button" class="clock-trigger" @click="openPicker">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
      </svg>
      <span :class="{ placeholder: !modelValue }">{{ modelValue ? displayTime(modelValue) : placeholder }}</span>
      <span class="clock-trigger-icon">⌄</span>
    </button>

    <Teleport to="body">
      <div v-if="open" class="clock-overlay" @click.self="cancel">
        <section class="clock-dialog" role="dialog" aria-modal="true" :aria-label="placeholder">
          <header class="clock-header">
            <p>{{ placeholder }}</p>
            <div class="clock-digital">
              <button type="button" :class="{ active: stage === 'hour' }" @click="stage = 'hour'">{{ hour }}</button>
              <span>:</span>
              <button type="button" :class="{ active: stage === 'minute' }" @click="stage = 'minute'">{{ minute }}</button>
              <div class="period-switch">
                <button type="button" :class="{ active: period === 'AM' }" @click="period = 'AM'">AM</button>
                <button type="button" :class="{ active: period === 'PM' }" @click="period = 'PM'">PM</button>
              </div>
            </div>
          </header>

          <div class="clock-instruction">Select {{ stage === 'hour' ? 'hour' : 'minutes' }}</div>
          <div
            ref="clockFace"
            class="clock-face"
            @pointerdown="startDrag"
            @pointermove="dragPointer"
            @pointerup="stopDrag"
            @pointercancel="stopDrag"
          >
            <button
              v-for="item in faceItems"
              :key="item"
              type="button"
              class="clock-number"
              :class="{ selected: selectedValue === item }"
              :style="numberPosition(item)"
              @click="selectValue(item)"
            >{{ item }}</button>
            <div class="clock-center"></div>
            <div class="clock-hand" :style="handStyle"><span></span></div>
          </div>

          <footer class="clock-actions">
            <button type="button" @click="clearValue">Clear</button>
            <span></span>
            <button type="button" @click="cancel">Cancel</button>
            <button type="button" class="set-button" @click="setValue">Set</button>
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
  placeholder: { type: String, default: 'Select time' },
  min: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const stage = ref('hour')
const hour = ref('12')
const minute = ref('00')
const period = ref('AM')
const clockFace = ref(null)
const dragging = ref(false)

const faceItems = computed(() =>
  stage.value === 'hour'
    ? ['12', ...Array.from({ length: 11 }, (_, index) => String(index + 1))]
    : Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'))
)
const selectedValue = computed(() => stage.value === 'hour' ? String(Number(hour.value)) : minute.value)
const handAngle = computed(() =>
  stage.value === 'hour'
    ? (Number(hour.value) % 12) * 30
    : Number(minute.value) * 6
)
const handStyle = computed(() => ({ transform: `rotate(${handAngle.value}deg)` }))

function displayTime(value) {
  const [rawHour, rawMinute] = value.split(':').map(Number)
  const suffix = rawHour >= 12 ? 'PM' : 'AM'
  return `${rawHour % 12 || 12}:${String(rawMinute || 0).padStart(2, '0')} ${suffix}`
}

function openPicker() {
  if (props.modelValue) {
    const [rawHour, rawMinute] = props.modelValue.split(':').map(Number)
    hour.value = String(rawHour % 12 || 12).padStart(2, '0')
    minute.value = String(Math.round(rawMinute / 5) * 5 % 60).padStart(2, '0')
    period.value = rawHour >= 12 ? 'PM' : 'AM'
  }
  stage.value = 'hour'
  open.value = true
}

function numberPosition(item) {
  const index = faceItems.value.indexOf(item)
  const angle = index * 30
  return { transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-105px) rotate(-${angle}deg)` }
}

function selectValue(item) {
  if (stage.value === 'hour') {
    hour.value = String(item).padStart(2, '0')
    stage.value = 'minute'
  } else {
    minute.value = item
  }
}

function updateFromPointer(event) {
  if (!clockFace.value) return
  const bounds = clockFace.value.getBoundingClientRect()
  const x = event.clientX - (bounds.left + bounds.width / 2)
  const y = event.clientY - (bounds.top + bounds.height / 2)
  const degrees = (Math.atan2(y, x) * 180 / Math.PI + 90 + 360) % 360

  if (stage.value === 'hour') {
    const selectedHour = Math.round(degrees / 30) % 12 || 12
    hour.value = String(selectedHour).padStart(2, '0')
  } else {
    const selectedMinute = Math.round(degrees / 6) % 60
    minute.value = String(selectedMinute).padStart(2, '0')
  }
}

function startDrag(event) {
  if (event.target.closest('.clock-number')) return
  dragging.value = true
  clockFace.value?.setPointerCapture(event.pointerId)
  updateFromPointer(event)
}

function dragPointer(event) {
  if (dragging.value) updateFromPointer(event)
}

function stopDrag(event) {
  if (!dragging.value) return
  updateFromPointer(event)
  dragging.value = false
  if (clockFace.value?.hasPointerCapture(event.pointerId)) clockFace.value.releasePointerCapture(event.pointerId)
}

function to24Hour() {
  let value = Number(hour.value)
  if (period.value === 'AM' && value === 12) value = 0
  if (period.value === 'PM' && value !== 12) value += 12
  return `${String(value).padStart(2, '0')}:${minute.value}`
}

function setValue() {
  const value = to24Hour()
  if (props.min && value <= props.min) {
    window.alert('End time must be later than start time.')
    return
  }
  emit('update:modelValue', value)
  open.value = false
}

function clearValue() {
  emit('update:modelValue', '')
  open.value = false
}

function cancel() {
  open.value = false
}
</script>

<style scoped>
.clock-trigger{width:100%;height:46px;border:1px solid #d4d8dc;border-radius:10px;background:linear-gradient(145deg,#fafbfc,#edf0f2);display:flex;align-items:center;gap:8px;padding:0 11px;color:#303942;font:inherit;font-size:.8rem;cursor:pointer;box-shadow:inset 1px 1px #fff;min-width:0}
.clock-trigger:hover{border-color:#7b838b}.clock-trigger .placeholder{color:#92989e}.clock-trigger-icon{margin-left:auto;color:#66707a}
.clock-trigger>span:first-of-type{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.clock-overlay{position:fixed;inset:0;z-index:10000;background:rgba(31,35,39,.58);backdrop-filter:blur(5px);display:grid;place-items:center;padding:18px}
.clock-dialog{width:min(390px,100%);overflow:hidden;border:1px solid #9da4aa;border-radius:18px;background:#f7f8f9;box-shadow:0 24px 70px rgba(15,20,24,.35);font-family:Poppins,Arial,sans-serif}
.clock-header{padding:18px 24px;background:linear-gradient(145deg,#4b5563,#30383f);color:#fff}.clock-header p{margin:0 0 7px;text-transform:uppercase;font-size:.7rem;letter-spacing:.12em;opacity:.78}
.clock-digital{display:flex;align-items:center;gap:4px}.clock-digital>button{border:0;background:transparent;color:#d9dde0;font-size:2.9rem;font-weight:500;padding:0 3px;cursor:pointer}.clock-digital>button.active{color:#fff}.clock-digital>span{font-size:2.5rem}
.period-switch{display:grid;margin-left:auto;border:1px solid rgba(255,255,255,.28);border-radius:8px;overflow:hidden}.period-switch button{border:0;background:transparent;color:#d8dcdf;padding:4px 9px;font:inherit;font-size:.68rem;cursor:pointer}.period-switch button.active{background:#eef1f3;color:#30383f;font-weight:700}
.clock-instruction{text-align:center;padding:14px 0 2px;color:#69727a;font-size:.78rem}
.clock-face{position:relative;width:270px;height:270px;margin:4px auto 12px;border-radius:50%;background:linear-gradient(145deg,#e5e8ea,#f6f7f8);box-shadow:inset 4px 4px 10px rgba(63,70,76,.1),inset -4px -4px 10px #fff;touch-action:none;cursor:crosshair;user-select:none}
.clock-number{position:absolute;left:50%;top:50%;width:38px;height:38px;border:0;border-radius:50%;background:transparent;color:#252b30;font:600 .88rem Poppins,Arial;z-index:3;cursor:pointer}.clock-number.selected{background:#4b5563;color:#fff;box-shadow:0 4px 9px rgba(48,56,63,.3)}
.clock-center{position:absolute;left:50%;top:50%;width:8px;height:8px;transform:translate(-50%,-50%);border-radius:50%;background:#4b5563;z-index:2}.clock-hand{position:absolute;left:calc(50% - 1px);top:calc(50% - 84px);width:2px;height:84px;background:#4b5563;transform-origin:1px 84px;z-index:1}.clock-hand span{position:absolute;bottom:-4px;left:-3px;width:8px;height:8px;border-radius:50%;background:#4b5563}
.clock-actions{display:grid;grid-template-columns:auto 1fr auto auto;gap:7px;align-items:center;padding:12px 16px 16px}.clock-actions button{border:0;background:transparent;color:#4b5563;padding:9px 12px;border-radius:8px;font:700 .78rem Poppins;text-transform:uppercase;letter-spacing:.05em;cursor:pointer}.clock-actions button:hover{background:#e5e8ea}.clock-actions .set-button{background:#4b5563;color:#fff}.clock-actions .set-button:hover{background:#30383f}
</style>
