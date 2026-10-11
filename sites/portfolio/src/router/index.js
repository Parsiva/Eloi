import { createRouter, createWebHistory } from 'vue-router'
import { useSupabaseAuth } from '@/composables/useSupabaseAuth'

const StudioHome = () => import('../views/StudioHome.vue')
const ProjectsIndex = () => import('../components/ProjectsIndex.vue')
const ProjectDetail = () => import('../components/ProjectDetail.vue')
const MarginaliaIndex = () => import('../components/MarginaliaIndex.vue')
const MarginaliaEntry = () => import('../components/MarginaliaEntry.vue')
const AdminDashboard = () => import('../views/admin/AdminDashboard.vue')
const MarginaliaNewWizard = () => import('../views/marginalia/MarginaliaNewWizard.vue')
const Newsletter = () => import('../components/Newsletter.vue')
const About = () => import('../components/About.vue')
const Login = () => import('../components/Login.vue')
const Signup = () => import('../components/Signup.vue')
const Account = () => import('../components/Account.vue')
const AdminProjectForm = () => import('../views/admin/AdminProjectForm.vue')
const AdminMarginaliaForm = () => import('../views/admin/AdminMarginaliaForm.vue')
const ArticleView = () => import('../components/ArticleView.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'studio', component: StudioHome },
    { path: '/projects', name: 'projects', component: ProjectsIndex },
    { path: '/projects/:slug', name: 'project-detail', component: ProjectDetail },
    { path: '/marginalia', name: 'marginalia', component: MarginaliaIndex },
    { path: '/marginalia/:slug', name: 'marginalia-entry', component: MarginaliaEntry },
    { path: '/marginalia/new', name: 'marginalia-new', component: MarginaliaNewWizard, meta: { requiresAuth: true } },
    { path: '/newsletter', name: 'newsletter', component: Newsletter },
    { path: '/about', name: 'about', component: About },
    { path: '/login', name: 'login', component: Login },
    { path: '/signup', name: 'signup', component: Signup },
    { path: '/account', name: 'account', component: Account, meta: { requiresAuth: true } },
    { path: '/admin', name: 'admin-dashboard', component: AdminDashboard, meta: { requiresAuth: true } },
    // admin (protected)
    // Keep legacy project routes for editing existing items
    {
      path: '/admin/projects/new',
      name: 'admin-project-new',
      component: AdminProjectForm,
      meta: { requiresAuth: true, requiresProjectAdmin: true },
    },
    {
      path: '/admin/projects/:id',
      name: 'admin-project-edit',
      component: AdminProjectForm,
      meta: { requiresAuth: true, requiresProjectAdmin: true },
    },
    { path: '/admin/marginalia/new', name: 'admin-marginalia-new', component: AdminMarginaliaForm, meta: { requiresAuth: true } },
    { path: '/admin/marginalia/:id', name: 'admin-marginalia-edit', component: AdminMarginaliaForm, meta: { requiresAuth: true } },
    // dev-only tools (left out of production builds)
    ...(import.meta.env.DEV
      ? [{ path: '/dev/ornaments', name: 'dev-ornaments', component: () => import('../views/dev/OrnamentSpecimens.vue') }]
      : []),
    // legacy markdown articles
    { path: '/:category/:slug/', name: 'article', component: ArticleView },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

// Global auth guard for admin routes
router.beforeEach(async (to, _from, next) => {
  const requiresAuth = to.meta.requiresAuth
  const requiresProjectAdmin = to.meta.requiresProjectAdmin

  if (!requiresAuth && !requiresProjectAdmin) return next()

  const auth = useSupabaseAuth()
  await auth.waitForAuthReady()

  if (requiresAuth && !auth.user.value) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (requiresProjectAdmin && auth.profile.value?.can_manage_projects !== true) {
    return next({ path: '/account' })
  }

  return next()
})

export default router
