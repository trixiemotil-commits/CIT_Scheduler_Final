<template>
  <main class="review-page">
    <section class="review-panel" aria-labelledby="review-title">
      <img class="review-seal" src="/branding/cit-college-seal.png" alt="" />
      <p class="review-kicker">CIT Scheduler account security</p>
      <template v-if="result">
        <h1 id="review-title">{{ result.passwordResetRequired ? 'Sign-in reported' : 'Device confirmed' }}</h1>
        <p class="review-copy">{{ result.message }}</p>
        <RouterLink v-if="result.passwordResetRequired" class="review-link" to="/forgot-password">Reset password</RouterLink>
        <RouterLink v-else class="review-link review-link--quiet" to="/">Return to sign in</RouterLink>
      </template>
      <template v-else>
        <h1 id="review-title">Review this sign-in</h1>
        <p class="review-copy">
          {{ preferredChoice === 'report'
            ? 'You opened the link for a sign-in you do not recognize. Confirm your choice below.'
            : 'Choose whether this sign-in was yours. Nothing changes until you confirm below.' }}
        </p>
        <label class="review-option">
          <input v-model="invalidateOtherSessions" type="checkbox" />
          Also sign out all other devices if I report this sign-in
        </label>
        <p v-if="error" class="review-error" role="alert">{{ error }}</p>
        <div class="review-actions">
          <button type="button" class="review-trust" :disabled="busy || !reviewToken" @click="confirmChoice('trust')">It was me</button>
          <button type="button" class="review-report" :disabled="busy || !reviewToken" @click="confirmChoice('report')">It wasn't me</button>
        </div>
        <p class="review-footnote">This link is private, expires after 15 minutes, and works once.</p>
      </template>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const route = useRoute()
const router = useRouter()
const reviewToken = ref(String(route.query.token || ''))
const preferredChoice = ['trust', 'report'].includes(String(route.query.choice || ''))
  ? String(route.query.choice)
  : 'trust'
const invalidateOtherSessions = ref(true)
const busy = ref(false)
const error = ref('')
const result = ref(null)

onMounted(() => {
  if (reviewToken.value) {
    router.replace({ path: route.path, query: { choice: preferredChoice } })
  }
})

async function confirmChoice(choice) {
  if (!reviewToken.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    const response = await fetch(`${API_BASE}/auth/security-review/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: reviewToken.value,
        choice,
        invalidateOtherSessions: choice === 'report' ? invalidateOtherSessions.value : false,
      }),
    })
    const body = await response.json()
    if (!response.ok) throw new Error(body.message || 'Unable to confirm this sign-in.')
    result.value = body
    reviewToken.value = ''
  } catch (requestError) {
    error.value = requestError.message || 'Unable to confirm this sign-in.'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.review-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  padding: 24px;
  color: #202a32;
  background: linear-gradient(135deg, #edf2f1 0%, #e2e8e7 52%, #d5dfe0 100%);
  font-family: 'Poppins', sans-serif;
}
.review-panel {
  width: min(100%, 480px);
  box-sizing: border-box;
  padding: clamp(24px, 6vw, 42px);
  border: 1px solid #cbd6d5;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 20px 60px rgba(32, 49, 53, .12);
}
.review-seal { display: block; width: 58px; height: 58px; object-fit: contain; margin-bottom: 22px; }
.review-kicker { margin: 0 0 9px; color: #176b55; font-size: .72rem; font-weight: 700; text-transform: uppercase; }
h1 { margin: 0; color: #202a32; font-size: 1.55rem; line-height: 1.2; }
.review-copy { margin: 12px 0 22px; color: #5d6b72; font-size: .9rem; line-height: 1.6; }
.review-option { display: flex; align-items: flex-start; gap: 10px; margin: 0 0 20px; color: #36434a; font-size: .82rem; line-height: 1.5; }
.review-option input { margin: 3px 0 0; accent-color: #176b55; }
.review-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.review-actions button, .review-link { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; padding: 10px 16px; border: 1px solid transparent; border-radius: 4px; font: inherit; font-size: .82rem; font-weight: 700; text-decoration: none; cursor: pointer; }
.review-trust, .review-link { background: #176b55; color: #fff; }
.review-report { background: #fff; border-color: #a33434 !important; color: #a33434; }
.review-actions button:disabled { cursor: not-allowed; opacity: .5; }
.review-link--quiet { background: #edf2f1; color: #34434a; }
.review-error { margin: -7px 0 16px; color: #a33434; font-size: .82rem; }
.review-footnote { margin: 20px 0 0; color: #6f7c82; font-size: .72rem; line-height: 1.5; }
@media (max-width: 440px) {
  .review-actions { flex-direction: column; }
  .review-actions button { width: 100%; }
}
</style>