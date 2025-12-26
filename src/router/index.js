import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Auth/LoginView.vue'),
    meta: { requiresGuest: true, title: 'Login' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Auth/RegisterView.vue'),
    meta: { requiresGuest: true, title: 'Register' }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/Auth/ForgotPasswordView.vue'),
    meta: { requiresGuest: true, title: 'Login' }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/Auth/ResetPasswordView.vue'),
    meta: { requiresGuest: true, title: 'Login' }
  },
  {
    path: '/',
    name: 'Library',
    component: () => import('@/views/LibraryView.vue'),
    meta: { requiresAuth: true, title: 'Library' }
  },
  {
    path: '/browse',
    name: 'Browse',
    component: () => import('@/views/BrowseView.vue'),
    meta: { requiresAuth: true, title: 'Browse' }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/SearchView.vue'),
    meta: { requiresAuth: true, title: 'Search' }
  },
  {
    path: '/news',
    name: 'News',
    component: () => import('@/views/NewsView.vue'),
    meta: { requiresAuth: true, title: 'News' }
  },
  {
    path: '/collection/:id',
    name: 'Collection',
    component: () => import('@/views/CollectionView.vue'),
    meta: { requiresAuth: true, title: 'Collection' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true, title: 'Profile' }
  },
  {
    path: '/settings/deletion-status',
    name: 'DeletionStatus',
    component: () => import('@/views/DeletionStatusView.vue'),
    meta: { requiresAuth: true, title: 'Account deletion' }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, title: 'Admin' }
  },
  {
    path: '/credits',
    name: 'Credits',
    component: () => import('@/views/CreditsView.vue'),
    meta: { requiresAuth: true, title: 'Credits' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (!authStore.user && localStorage.getItem('access_token')) {
    try {
      await authStore.initializeAuth()
    } catch (err) {
      console.error('Auth initialization failed:', err)
    }
  }
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'Library' })
    return
  }

  if (to.meta.requiresAdmin && !authStore.isSuperuser) {
    next({ name: 'Library' })
    return
  }

  next()
})

router.afterEach((to) => {
  const title = to.meta.title || ''
  document.title = `${title} • Sono Web`
})

export default router