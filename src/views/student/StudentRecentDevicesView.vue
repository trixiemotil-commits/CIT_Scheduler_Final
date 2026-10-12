<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <div class="recent-devices-page student-recent-devices-active">
        <header class="recent-devices-header">
          <button class="recent-devices-back" type="button" aria-label="Go back to profile" @click="goToProfile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1>Recent Devices</h1>
          <span class="recent-devices-spacer" aria-hidden="true"></span>
        </header>

        <main class="recent-devices-content">
          <RecentDevices />
        </main>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup>
import RecentDevices from '@/components/RecentDevices.vue'
import { IonContent, IonPage, onIonViewWillEnter, onIonViewWillLeave } from '@ionic/vue'
import { onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function goToProfile() {
  document.body.classList.remove('student-recent-devices-active')
  router.push('/student/profile')
}

onIonViewWillEnter(() => {
  document.body.classList.add('student-recent-devices-active')
})

onIonViewWillLeave(() => {
  document.body.classList.remove('student-recent-devices-active')
})

onBeforeUnmount(() => {
  document.body.classList.remove('student-recent-devices-active')
})
</script>

<style scoped>
:global(ion-content) {
  --background: linear-gradient(145deg, #eef0f1 0%, #dfe3e5 52%, #c7cdd1 100%);
}
:global(body.student-recent-devices-active .student-tab-bar) {
  display: none !important;
}
.recent-devices-page {
  width: 100%;
  max-width: 430px;
  min-height: 100dvh;
  margin: 0 auto;
  padding-bottom: calc(34px + env(safe-area-inset-bottom, 0px));
  color: #252b31;
  background: radial-gradient(circle at 100% 0%, rgba(255,255,255,.78), transparent 34%), linear-gradient(145deg, #f1f3f4 0%, #dfe3e5 52%, #c7cdd1 100%);
  font-family: 'Poppins', sans-serif;
}
.recent-devices-header {
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(10px + env(safe-area-inset-top, 0px)) 18px 14px;
}
.recent-devices-header h1 {
  margin: 0;
  color: #3e4851;
  font-size: 1.08rem;
  font-weight: 800;
}
.recent-devices-back,
.recent-devices-spacer {
  width: 44px;
  height: 44px;
}
.recent-devices-back {
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(255,255,255,.9);
  border-radius: 50%;
  color: #4d5860;
  background: linear-gradient(145deg, #fafbfb, #dfe3e5);
  box-shadow: inset 0 1px rgba(255,255,255,.95), 0 6px 14px rgba(48,57,64,.14);
  cursor: pointer;
}
.recent-devices-content { padding: 8px 16px 0; }
.recent-devices-content :deep(.device-panel) {
  padding: 17px 14px;
  border-radius: 18px;
}
@media (max-width: 380px) {
  .recent-devices-content { padding-inline: 14px; }
}
</style>
