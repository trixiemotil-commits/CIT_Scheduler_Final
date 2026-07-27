<template>
  <IonRefresher slot="fixed" pull-factor="0.7" pull-min="70" pull-max="140" @ionRefresh="handleRefresh">
    <IonRefresherContent
      pulling-text="Pull down to refresh"
      refreshing-spinner="crescent"
      refreshing-text="Updating..."
    />
  </IonRefresher>
</template>

<script setup>
import { IonRefresher, IonRefresherContent } from '@ionic/vue'

const props = defineProps({
  refresh: {
    type: Function,
    required: true,
  },
})

async function handleRefresh(event) {
  try {
    await props.refresh()
  } finally {
    event.target.complete()
  }
}
</script>
