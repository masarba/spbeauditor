import { createRouter, createWebHistory } from "vue-router";
import store from "../store"; // Import the Vuex store
import Dashboard from "../views/Dashboard.vue";
import HasilAudit from "../views/Hasil Audit.vue";
import Signup from "../views/Signup.vue";
import AuditorSignin from "../views/AuditorSignin.vue";
import Signout from "../views/Signout.vue";
import SetupTwoFactor from "../views/SetupTwoFactor.vue"; // Komponen ini perlu dibuat
import VerifyTwoFactor from "../views/VerifyTwoFactor.vue"; // Komponen ini perlu dibuat


// Utility function to check token expiry (optional)
function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000;
  } catch (error) {
    console.error("Invalid token format:", error);
    return null;
  }
}

// Define the routes
const routes = [
  {
    path: "/",
    name: "Home",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
    meta: { requiresAuth: true, requiresCompleted2FA: true },
  },
  {
    path: "/auditees",
    name: "Hasil Audit",
    component: HasilAudit,
    meta: { requiresAuth: true, requiresCompleted2FA: true },
  },
  {
    path: "/signup",
    name: "Signup",
    component: Signup,
    meta: { guest: true },
  },
  {
    path: "/auditor-login",
    name: "AuditorSignin",
    component: AuditorSignin,
    meta: { guest: true },
  },
  {
    path: "/signout",
    name: "Signout",
    component: Signout,
    meta: { requiresAuth: true },
  },
  // Rute tambahan untuk 2FA
  {
    path: "/setup-2fa",
    name: "SetupTwoFactor",
    component: SetupTwoFactor,
    meta: { requiresAuth: true },
  },
  {
    path: "/verify-2fa",
    name: "VerifyTwoFactor",
    component: VerifyTwoFactor,
    meta: { requiresAuth: true },
  },
  
];

// Create the router instance
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Navigation guard to check authentication and redirect accordingly
router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters.isAuthenticated;
  const token = store.state.token;
  // Tambahkan variabel redirect_to dari localStorage
  const redirectTo = localStorage.getItem('redirect_to');

  // Jika token tidak tersedia, arahkan ke halaman login jika mencoba akses halaman yang membutuhkan autentikasi
  if (!token && to.meta.requiresAuth) {
    return next("/auditor-login");
  }

  // Jika token tersedia, periksa apakah token sudah kedaluwarsa
  if (token) {
    const tokenExpiry = getTokenExpiry(token);
    if (tokenExpiry && tokenExpiry < Date.now()) {
      store.dispatch("logout");
      return next("/auditor-login");
    }
  }

  // Jika halaman membutuhkan autentikasi dan pengguna tidak terautentikasi
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next("/auditor-login");
  }

  // Jika pengguna sudah login dan mencoba mengakses halaman tamu (seperti login atau signup)
  if (to.meta.guest && isAuthenticated) {
    // Jika ada redirect_to, prioritaskan itu
    if (redirectTo) {
      const redirectPath = redirectTo;
      localStorage.removeItem('redirect_to'); // Hapus setelah digunakan
      return next(redirectPath);
    }
    return next("/dashboard");
  }

  // Handle 2FA requirements
  if (to.meta.requiresCompleted2FA && redirectTo) {
    // Jika halaman memerlukan 2FA lengkap tapi ada redirect yang tertunda
    return next(redirectTo);
  }

  next();
});

export default router;