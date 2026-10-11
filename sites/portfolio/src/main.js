import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js' 

import './assets/tailwind.css'
import './assets/tw.css'
import './styles/theme.css'

createApp(App).use(router).mount('#app')
