<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <div class="faqs-page">
        <header class="faqs-header">
          <button class="faqs-back" type="button" aria-label="Go back to profile" @click="goToProfile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1>FAQs</h1>
          <span class="faqs-spacer" aria-hidden="true"></span>
        </header>

        <main class="faqs-content">
          <section class="faq-card">
            <div class="faq-intro">
              <span class="faq-icon"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 1 1 4.4 1.9c-1.2 1.1-1.9 1.4-1.9 3"/><path d="M12 17h.01"/></svg></span>
              <div><h2>Frequently asked questions</h2><p>Find quick answers about your account and CIT Scheduler.</p></div>
            </div>
            <label class="faq-search">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
              <input v-model="searchQuery" type="search" placeholder="Search FAQs" aria-label="Search frequently asked questions" />
            </label>
            <div v-for="category in categories" :key="category" class="faq-category-group">
              <template v-if="faqsByCategory(category).length">
              <h3 class="faq-category-title">{{ category }}</h3>
              <div class="faq-list">
                <details v-for="(faq, index) in faqsByCategory(category)" :key="faq.question" class="faq-item" :open="category === 'Account' && index === 0">
                  <summary><span>{{ faq.question }}</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
                  <ul><li v-for="answer in faq.answers" :key="answer">{{ answer }}</li></ul>
                </details>
              </div>
              </template>
            </div>
            <div v-if="!filteredFaqs.length" class="faq-empty">No matching FAQs found.</div>
            <a class="support-link" href="mailto:citscheduler@gmail.com"><span class="support-icon"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="m4 6 8 6 8-6"/></svg></span><span><strong>Still need help?</strong><small>Contact CIT Scheduler support</small></span><svg class="support-arrow" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></a>
          </section>
        </main>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup>
import { IonContent, IonPage } from '@ionic/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQuery = ref('')
const categories = ['Account', 'Security', 'Schedule']
const faqs = [
  {
    category: 'Account',
    question: 'Is this a settings issue or a system issue?',
    answers: [
      'If the problem is on the student settings page itself, it is usually a personal account setting.',
      'If login, API, or email problems happen, it is usually a backend or system configuration issue.',
    ],
  },
  {
    category: 'Security',
    question: 'How do I change my password?',
    answers: [
      'Open Change Password and enter your current password.',
      'Request the 6-digit OTP, then enter your new password and confirm it.',
    ],
  },
  {
    category: 'Security',
    question: 'How does email verification work?',
    answers: [
      'Open Change Password and enter your current password below Email verification.',
      'Once enabled, a code will be sent to your email each time you log in.',
    ],
  },
  {
    category: 'Schedule',
    question: 'How do I find my schedule?',
    answers: [
      'Use the student dashboard and schedule pages from the main navigation.',
      'Profile and account pages are only for personal information and security.',
    ],
  },
]

const filteredFaqs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return faqs.filter((faq) => !query || `${faq.question} ${faq.answers.join(' ')}`.toLowerCase().includes(query))
})

function faqsByCategory(category) {
  return filteredFaqs.value.filter((faq) => faq.category === category)
}

function goToProfile() {
  document.body.classList.remove('student-settings-active')
  router.push('/student/profile')
}

onMounted(() => document.body.classList.add('student-settings-active'))
onBeforeUnmount(() => document.body.classList.remove('student-settings-active'))
</script>

<style scoped>
:global(body.student-settings-active .student-tab-bar) { display: none !important; }
:global(ion-content) { --background: linear-gradient(145deg, #eef0f1 0%, #dfe3e5 52%, #c7cdd1 100%); }
.faqs-page { width: 100%; max-width: 430px; min-height: 100dvh; margin: 0 auto; padding-bottom: calc(34px + env(safe-area-inset-bottom, 0px)); color: #252b31; background: radial-gradient(circle at 100% 0%, rgba(255,255,255,.78), transparent 34%), linear-gradient(145deg, #f1f3f4 0%, #dfe3e5 52%, #c7cdd1 100%); font-family: 'Poppins', sans-serif; }
.faqs-header { min-height: 68px; display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; }
.faqs-header h1 { color: #3e4851; font-size: 1.08rem; font-weight: 800; }
.faqs-back, .faqs-spacer { width: 44px; height: 44px; }
.faqs-back { display: grid; place-items: center; padding: 0; border: 1px solid rgba(255,255,255,.9); border-radius: 50%; color: #4d5860; background: linear-gradient(145deg,#fafbfb,#dfe3e5); box-shadow: inset 0 1px rgba(255,255,255,.95), 0 6px 14px rgba(48,57,64,.14); }
.faqs-content { padding: 0 16px; }
.faq-card { padding: 19px 16px; border: 1px solid rgba(255,255,255,.98); border-radius: 22px; background: linear-gradient(145deg,rgba(255,255,255,.96),rgba(235,239,241,.9)); box-shadow: inset 0 1px rgba(255,255,255,.98), 0 12px 26px rgba(48,57,64,.13); }
.faq-intro { display: flex; align-items: flex-start; gap: 11px; padding: 2px 2px 18px; }
.faq-icon { width: 36px; height: 36px; flex: 0 0 36px; display: grid; place-items: center; border-radius: 10px; color: #69747d; background: linear-gradient(145deg,#f8f9f9,#d7dde0); box-shadow: inset 0 1px rgba(255,255,255,.9); }
.faq-intro h2 { margin: 0; color: #252b31; font-size: 1.08rem; line-height: 1.25; font-weight: 800; }
.faq-intro p { margin: 4px 0 0; color: #7b868f; font-size: .73rem; line-height: 1.4; }
.faq-search { display: flex; align-items: center; gap: 9px; min-height: 46px; margin-bottom: 14px; padding: 0 13px; border: 1px solid #c5cdd2; border-radius: 13px; color: #7b868f; background: linear-gradient(180deg,rgba(250,251,251,.84),rgba(232,235,236,.84)); box-shadow: inset 2px 2px 5px rgba(61,67,73,.07), 0 1px rgba(255,255,255,.8); }
.faq-search:focus-within { border-color: #69747d; box-shadow: 0 0 0 3px rgba(83,91,100,.12), inset 2px 2px 5px rgba(61,67,73,.06); }
.faq-search input { min-width: 0; flex: 1; border: 0; outline: 0; color: #303940; background: transparent; font: inherit; font-size: .78rem; font-weight: 400; }
.faq-search input::placeholder { color: #87919a; font-weight: 400; }
.faq-search input::-webkit-search-cancel-button { display: none; }
.faq-category-group + .faq-category-group { margin-top: 20px; }
.faq-category-title { display: flex; align-items: center; gap: 9px; margin: 0 2px 8px; color: #707b84; font-size: .68rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.faq-category-title::after { content: ''; height: 1px; flex: 1; background: linear-gradient(90deg, rgba(104,112,120,.26), transparent); }
.faq-list { display: flex; flex-direction: column; gap: 9px; }
.faq-item { overflow: hidden; border: 1px solid rgba(255,255,255,.9); border-radius: 14px; background: rgba(255,255,255,.62); box-shadow: inset 0 1px rgba(255,255,255,.9); }
.faq-item summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 58px; padding: 12px 14px; color: #303940; cursor: pointer; list-style: none; font-size: .8rem; font-weight: 800; line-height: 1.3; }
.faq-item summary::-webkit-details-marker { display: none; }
.faq-item summary svg { flex: 0 0 auto; color: #89939b; transition: transform .2s ease; }
.faq-item[open] summary svg { transform: rotate(180deg); }
.faq-item ul { margin: 0; padding: 0 18px 15px 32px; color: #65717a; font-size: .76rem; line-height: 1.55; }
.faq-item li + li { margin-top: 7px; }
.faq-empty { padding: 22px 12px; color: #7b868f; text-align: center; font-size: .76rem; }
.support-link { display: flex; align-items: center; gap: 10px; margin-top: 15px; padding: 12px 10px; border-top: 1px solid rgba(104,112,120,.14); color: #303940; text-decoration: none; }
.support-icon { width: 34px; height: 34px; flex: 0 0 34px; display: grid; place-items: center; border-radius: 10px; color: #69747d; background: linear-gradient(145deg,#f8f9f9,#d7dde0); box-shadow: inset 0 1px rgba(255,255,255,.9); }
.support-link span:nth-child(2) { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 2px; }
.support-link strong { font-size: .78rem; font-weight: 800; }
.support-link small { color: #87919a; font-size: .68rem; }
.support-arrow { color: #89939b; }
@media (max-width: 380px) { .faqs-content { padding-inline: 14px; } .faq-card { padding-inline: 14px; } .faq-intro h2 { font-size: 1rem; } }
</style>
