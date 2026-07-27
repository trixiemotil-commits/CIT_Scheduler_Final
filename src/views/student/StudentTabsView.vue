<template>
  <IonPage>
    <div class="student-app-shell">
      <IonTabs>
        <IonRouterOutlet />

        <IonTabBar slot="bottom" class="student-tab-bar">
          <IonTabButton
            v-for="item in navigation"
            :key="item.tab"
            :tab="item.tab"
            :href="item.href"
          >
            <IonIcon :icon="item.icon" aria-hidden="true" />
            <IonLabel>{{ item.label }}</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </div>
  </IonPage>
</template>

<script setup>
import {
  IonIcon,
  IonLabel,
  IonPage,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/vue'
import {
  calendarOutline,
  homeOutline,
  megaphoneOutline,
  peopleOutline,
  personOutline,
} from 'ionicons/icons'

const navigation = [
  { tab: 'home', label: 'Home', href: '/student/dashboard', icon: homeOutline },
  { tab: 'teachers', label: 'Teachers', href: '/student/teachers', icon: peopleOutline },
  { tab: 'consultations', label: 'Consultations', href: '/student/consultations', icon: calendarOutline },
  { tab: 'events', label: 'Events', href: '/student/events', icon: megaphoneOutline },
  { tab: 'profile', label: 'Profile', href: '/student/profile', icon: personOutline },
]
</script>

<style scoped>
.student-app-shell {
  position: relative;
  width: 100%;
  max-width: 430px;
  height: 100%;
  min-height: 100dvh;
  margin: 0 auto;
  overflow: hidden;
  background: #f3f5f7;
  box-shadow: 0 0 28px rgba(37, 41, 46, 0.14);
}

.student-tab-bar {
  height: calc(66px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  border-top: 1px solid #e5e7eb;
  --background: #ffffff;
  --border: 0;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
}

ion-tab-button {
  --background: #ffffff;
  --color: #9aa0a6;
  --color-selected: #30363d;
  max-width: none;
  font-family: 'Poppins', sans-serif;
}

ion-tab-button::part(native) {
  padding: 7px 2px 6px;
}

ion-icon {
  width: 21px;
  height: 21px;
}

ion-label {
  margin-top: 3px;
  font-size: 0.61rem;
  font-weight: 500;
  line-height: 1;
}

@media (max-width: 430px) {
  .student-app-shell {
    box-shadow: none;
  }
}
</style>
