import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'
import { useDataStore } from './stores/data'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')

//setup visibility listener for auto-refresh after pinia is initialized
const dataStore = useDataStore()
dataStore.setupVisibilityListener()