<template>
  <div ref="root" class="typeahead-select">
    <button
      type="button"
      class="form-select typeahead-input"
      :class="{ 'typeahead-placeholder': !selectedLabel }"
      role="combobox"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-label="selectedLabel || placeholder"
      @click="toggleMenu"
      @keydown="handleKeydown"
    >{{ selectedLabel || placeholder }}</button>
    <svg class="sel-arrow typeahead-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    <div v-if="open" :id="listId" class="typeahead-menu" role="listbox">
      <button
        v-for="(option, index) in visibleOptions"
        :key="option.value"
        :ref="element => setOptionRef(element, index)"
        type="button"
        class="typeahead-option"
        :class="{ highlighted: index === highlightedIndex }"
        role="option"
        :aria-selected="option.value === modelValue"
        @mousedown.prevent="selectOption(option)"
      >
        <span v-html="highlight(option.label)" />
      </button>
      <div v-if="!visibleOptions.length" class="typeahead-empty">No options available</div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Select' },
})
const emit = defineEmits(['update:modelValue'])
const root = ref(null)
const query = ref('')
const open = ref(false)
const highlightedIndex = ref(0)
const optionRefs = ref([])
const listId = `typeahead-${Math.random().toString(36).slice(2)}`

const normalizedOptions = computed(() => props.options.map(option =>
  typeof option === 'string' ? { label: option, value: option } : option
))
const visibleOptions = computed(() => normalizedOptions.value)
const matchingOptionIndex = computed(() => {
  const search = query.value.trim().toLowerCase()
  if (!search) return -1
  return visibleOptions.value.findIndex(option => option.label.toLowerCase().includes(search))
})
const selectedLabel = computed(() => normalizedOptions.value.find(option => option.value === props.modelValue)?.label || '')

function syncQuery() {
  query.value = ''
}
function toggleMenu() {
  open.value = !open.value
  if (open.value) query.value = ''
}
function selectOption(option) {
  emit('update:modelValue', option.value)
  query.value = ''
  open.value = false
}
function setOptionRef(element, index) {
  if (element) optionRefs.value[index] = element
}
function scrollHighlightedOptionIntoView() {
  nextTick(() => {
    optionRefs.value[highlightedIndex.value]?.scrollIntoView({ block: 'nearest' })
  })
}
function highlight(label) {
  const search = query.value.trim()
  if (!search) return label
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return label.replace(new RegExp(`(${escaped})`, 'ig'), '<mark>$1</mark>')
}
function handleKeydown(event) {
  if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
    event.preventDefault()
    query.value += event.key
    open.value = true
    return
  }
  if (event.key === 'Backspace') {
    event.preventDefault()
    query.value = query.value.slice(0, -1)
    open.value = true
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    open.value = true
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, visibleOptions.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
  } else if (event.key === 'Enter' && visibleOptions.value[highlightedIndex.value]) {
    event.preventDefault()
    selectOption(visibleOptions.value[highlightedIndex.value])
  } else if (event.key === 'Escape') {
    open.value = false
    query.value = ''
  }
}
function handleOutsideClick(event) {
  if (!root.value?.contains(event.target)) {
    open.value = false
    syncQuery()
  }
}
watch(() => props.modelValue, syncQuery, { immediate: true })
watch(() => query.value, () => {
  highlightedIndex.value = matchingOptionIndex.value >= 0 ? matchingOptionIndex.value : 0
  scrollHighlightedOptionIntoView()
})
watch(visibleOptions, () => {
  highlightedIndex.value = matchingOptionIndex.value >= 0 ? matchingOptionIndex.value : 0
  optionRefs.value = []
  scrollHighlightedOptionIntoView()
})
watch(highlightedIndex, scrollHighlightedOptionIntoView)
document.addEventListener('mousedown', handleOutsideClick)
onBeforeUnmount(() => document.removeEventListener('mousedown', handleOutsideClick))
</script>

<style scoped>
.typeahead-select { position: relative; display: block; width: 100%; min-width: 0; }
.typeahead-input {
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 46px;
  padding: 9px 34px 9px 11px;
  border: 1px solid #cbd3d8;
  border-radius: 9px;
  outline: none;
  color: #344149;
  background: #fff;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color .15s, box-shadow .15s;
}
.typeahead-input:focus { border-color: #7f8d96; box-shadow: 0 0 0 3px rgba(70, 84, 94, .09); }
.typeahead-arrow { position: absolute; z-index: 1; top: 50%; right: 12px; pointer-events: none; transform: translateY(-50%); }
.typeahead-menu { position: absolute; z-index: 40; top: calc(100% + 5px); left: 0; right: 0; max-height: 230px; overflow-y: auto; padding: 5px; border: 1px solid #d7e0df; border-radius: 8px; background: #fff; box-shadow: 0 12px 28px rgba(22, 49, 45, .16); }
.typeahead-option { display: block; width: 100%; padding: 9px 11px; border: 0; border-radius: 5px; background: transparent; color: #263139; text-align: left; font: inherit; cursor: pointer; }
.typeahead-option:hover, .typeahead-option.highlighted { background: #e6f1ed; color: #1b4332; }
.typeahead-option :deep(mark) { padding: 0; background: transparent; color: inherit; font-weight: 650; }
.typeahead-empty { padding: 12px 11px; color: #68777a; font-size: .9rem; }
</style>
