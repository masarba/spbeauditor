<script setup>
import { ref, reactive } from "vue";
import { onBeforeUnmount, onBeforeMount } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import axios from "axios";
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonSwitch from "@/components/ArgonSwitch.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import { useQuasar } from "quasar";
import logo from "@/assets/img/logopoltek.png";

const body = document.getElementsByTagName("body")[0];
const store = useStore();
const router = useRouter();
const $q = useQuasar();

const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const isLoading = ref(false);

// Tambahkan state untuk 2FA
const showOtpInput = ref(false);
const otpCode = ref("");
const twoFAData = reactive({
  token: "",
  refreshToken: "",
  role: "",
  auditorId: "",
  google2faSecret: ""
});

const handleSignIn = async () => {
  try {
    isLoading.value = true;
    
    // Jika sedang menampilkan form OTP
    if (showOtpInput.value) {
      return await verifyOtp();
    }
    
    const response = await axios.post("https://spbebackend-production.up.railway.app/api/auth/auditor-login", {
      email: email.value,
      password: password.value,
    });

    console.log("Login response:", response.data); // Debug log

    // Periksa apakah response memiliki data yang diperlukan
    if (!response.data) {
      throw new Error("Tidak ada data dari server");
    }

    const token = response.data.access_token;
    const userRole = response.data.role;
    const refreshToken = response.data.refresh_token;
    const redirectTo = response.data.redirect_to;
    
    // Handle redirect berdasarkan response dari backend
    if (redirectTo) {
      // Simpan sementara data user untuk digunakan nanti
      twoFAData.token = token;
      twoFAData.refreshToken = refreshToken;
      twoFAData.role = userRole;
      
      // Decode JWT token untuk mendapatkan sub (user ID)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const decodedToken = JSON.parse(jsonPayload);
      twoFAData.auditorId = decodedToken.sub;
      
      if (redirectTo === '/verify-2fa') {
        // User sudah setup 2FA, minta OTP
        twoFAData.google2faSecret = response.data.google2fa_secret;
        showOtpInput.value = true;
        $q.notify({
          message: "Silakan masukkan kode OTP dari Google Authenticator",
          type: "info",
          icon: false,
          timeout: 3000,
          textColor: "white",
          actions: [{ label: 'OK', color: 'white' }],
          position: "top-right",
        });
      } else if (redirectTo === '/change-password') {
        // User baru harus ganti password dulu
        store.dispatch("login", { token, role: userRole });
        localStorage.setItem("auditor_id", twoFAData.auditorId.toString());
        router.push("/change-password");
      } else if (redirectTo === '/setup-2fa') {
        // User perlu setup 2FA
        store.dispatch("login", { token, role: userRole });
        localStorage.setItem("auditor_id", twoFAData.auditorId.toString());
        router.push("/setup-2fa");
      }
      
      return;
    }

    // Periksa keberadaan token dan role
    if (!token || !userRole) {
      throw new Error("Data login tidak lengkap");
    }

    // Decode JWT token untuk mendapatkan sub (user ID)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const decodedToken = JSON.parse(jsonPayload);
    const auditorId = decodedToken.sub;

    if (!auditorId) {
      throw new Error("ID Auditor tidak ditemukan");
    }

    // Simpan data ke store dan localStorage
    store.dispatch("login", { token, role: userRole });
    localStorage.setItem("auditor_id", auditorId.toString());

    $q.notify({
      message: "Login berhasil!",
      type: "positive",
      icon: false,
      timeout: 3000,
      textColor: "white",
      actions: [{ label: 'OK', color: 'white' }],
      position: "top-right",
    });

    // Redirect ke dashboard
    if (userRole === 'auditor') {
      router.push("/dashboard");
    } else {
      throw new Error("Anda bukan auditor");
    }
  } catch (error) {
    console.error("Login failed:", error);
    console.log("Error response:", error.response?.data); // Debug log

    let errorMessage = "Login gagal. ";

    if (error.response?.data?.message === "The credentials you entered are incorrect.") {
      errorMessage += "Periksa email dan password Anda.";
    } else if (error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += "Terjadi kesalahan pada server.";
    }

    $q.notify({
      message: errorMessage,
      type: "negative",
      icon: false,
      timeout: 3000,
      textColor: "white",
      actions: [{ label: 'OK', color: 'white' }],
      position: "top-right",
    });
  } finally {
    isLoading.value = false;
  }
};

// Fungsi baru untuk verifikasi OTP
const verifyOtp = async () => {
  try {
    // Persiapkan data yang dibutuhkan oleh backend
    const verificationData = {
      otp: otpCode.value,
      email: email.value, // Email yang disimpan dari form login
      google2fa_secret: twoFAData.google2faSecret // Secret yang didapat dari response login
    };
    
    console.log("Sending 2FA verification data:", verificationData); // Debug log
    
    const response = await axios.post("https://spbebackend-production.up.railway.app/api/auth/verify-2fa", verificationData);

    console.log("2FA verification response:", response.data); // Debug log

    if (response.data.success) {
      // Gunakan token baru dari response verifikasi 2FA
      const newToken = response.data.access_token;

      
      // Simpan data ke store dan localStorage dengan token baru
      store.dispatch("login", { 
        token: newToken, 
        role: twoFAData.role 
      });
      localStorage.setItem("auditor_id", twoFAData.auditorId.toString());

      $q.notify({
        message: "Verifikasi 2FA berhasil!",
        type: "positive",
        icon: false,
        timeout: 3000,
        textColor: "white",
        actions: [{ label: 'OK', color: 'white' }],
        position: "top-right",
      });

      // Reset form OTP
      showOtpInput.value = false;
      otpCode.value = "";

      // Redirect ke dashboard
      router.push("/dashboard");
    } else {
      throw new Error("Verifikasi OTP gagal");
    }
  } catch (error) {
    console.error("OTP verification failed:", error);

    let errorMessage = "Verifikasi OTP gagal. ";
    if (error.response?.data?.errors) {
      const errorDetails = Object.values(error.response.data.errors).flat().join(", ");
      errorMessage += errorDetails;
    } else if (error.response?.data?.message) {
      errorMessage += error.response.data.message;
    } else if (error.message) {
      errorMessage += error.message;
    }

    $q.notify({
      message: errorMessage,
      type: "negative",
      icon: false,
      timeout: 3000,
      textColor: "white",
      actions: [{ label: 'OK', color: 'white' }],
      position: "top-right",
    });
  }
};

// Fungsi untuk kembali ke form login
const backToLogin = () => {
  showOtpInput.value = false;
  otpCode.value = "";
};

onBeforeMount(() => {
  store.state.hideConfigButton = true;
  store.state.showNavbar = false;
  store.state.showSidenav = false;
  store.state.showFooter = false;
  body.classList.remove("bg-gray-100");
});

onBeforeUnmount(() => {
  store.state.hideConfigButton = false;
  store.state.showNavbar = true;
  store.state.showSidenav = true;
  store.state.showFooter = true;
  body.classList.add("bg-gray-100");
});
</script>

<template>
  <main class="min-vh-100 d-flex align-items-center">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-xl-4 col-lg-5 col-md-7">
          <div class="card card-plain">
            <div class="pb-0 card-header text-center">
              <div class="d-flex flex-column align-items-center mb-4">
                <img 
                  :src="logo" 
                  alt="Logo Politeknik" 
                  class="mb-4"
                  style="max-height: 100px; width: auto;"
                />
                <h4 class="font-weight-bolder">SPBE-SCAN AUDITOR</h4>
                <p v-if="!showOtpInput" class="mb-0">Enter your email and password to sign in as auditor</p>
                <p v-else class="mb-0">Enter your OTP code from Google Authenticator</p>
              </div>
            </div>
            <div class="card-body">
              <!-- Form Login -->
              <form v-if="!showOtpInput" @submit.prevent="handleSignIn">
                <div class="mb-3">
                  <argon-input
                    v-model="email"
                    id="email"
                    type="email"
                    placeholder="Email"
                    name="email"
                    size="lg"
                    required
                  />
                </div>
                <div class="mb-3">
                  <argon-input
                    v-model="password"
                    id="password"
                    type="password"
                    placeholder="Password"
                    name="password"
                    size="lg"
                    required
                  />
                </div>
                <argon-switch
                  v-model="rememberMe"
                  id="rememberMe"
                  name="remember-me"
                  >Remember me</argon-switch
                >
                <div class="text-center">
                  <argon-button
                    class="mt-4"
                    variant="gradient"
                    color="success"
                    :loading="isLoading"
                    :disabled="isLoading"  
                    size="lg"
                    type="submit"
                    >Sign in</argon-button
                  >
                </div>
              </form>
              
              <!-- Form OTP untuk 2FA -->
              <form v-else @submit.prevent="handleSignIn">
                <div class="mb-3">
                  <argon-input
                    v-model="otpCode"
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP code"
                    name="otp"
                    size="lg"
                    required
                  />
                </div>
                <div class="text-center">
                  <argon-button
                    class="mt-4"
                    variant="gradient"
                    color="success"
                    :loading="isLoading"
                    :disabled="isLoading"  
                    size="lg"
                    type="submit"
                    >Verify</argon-button
                  >
                </div>
                <div class="text-center mt-3">
                  <a href="#" @click.prevent="backToLogin">Back to login</a>
                </div>
              </form>
            </div>
            <div class="px-1 pt-0 text-center card-footer px-lg-2">
              
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>