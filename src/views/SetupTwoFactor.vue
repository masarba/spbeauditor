<template>
    <div class="setup-2fa-container">
      <h2>Setup Two-Factor Authentication</h2>
      <p>Scan the QR code below with your authenticator app:</p>
  
      <!-- QR Code Canvas -->
      <canvas ref="qrCanvas" class="qr-code-canvas"></canvas>
  
      <!-- Verification Code Input -->
      <div class="verification-input" v-if="secret">
        <input
          v-model="verificationCode"
          type="text"
          placeholder="Enter verification code"
          required
          class="verification-code"
        />
      </div>
  
      <!-- Verify Button -->
      <div v-if="secret" class="verify-button-container">
        <button @click="verify2FA" class="verify-button">
          Verify 2FA
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import axios from 'axios';
  import QRious from 'qrious';  // Library for generating QR codes
  import { useQuasar } from 'quasar'; // Import Quasar
  import { useRouter } from 'vue-router';
  import { useStore } from 'vuex';
  
  const verificationCode = ref('');
  const qrCanvas = ref(null);
  const secret = ref('');
  const userEmail = ref(''); // Add a ref for user email
  const $q = useQuasar();
  const router = useRouter();
  const store = useStore();
  
  onMounted(async () => {
    try {
      // First, fetch user data to get email
      try {
        const userResponse = await axios.get("https://spbebackend-production.up.railway.app/api/auth/user", {
          headers: {
            Authorization: `Bearer ${store.state.token}`,
          },
        });
        
        // Store the email
        if (userResponse.data && userResponse.data.email) {
          userEmail.value = userResponse.data.email;
          // Also store in localStorage for future use
          localStorage.setItem('user_email', userResponse.data.email);
          console.log("User email fetched:", userEmail.value);
        } else {
          console.error("User email not found in response:", userResponse.data);
        }
      } catch (userError) {
        console.error("Error fetching user data:", userError);
        // If the /user endpoint fails, try getting email from token
        try {
          const token = store.state.token;
          if (token) {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const decodedToken = JSON.parse(jsonPayload);
            if (decodedToken.email) {
              userEmail.value = decodedToken.email;
              localStorage.setItem('user_email', decodedToken.email);
              console.log("Email extracted from token:", userEmail.value);
            }
          }
        } catch (e) {
          console.error("Error extracting email from token:", e);
        }
      }
      
      // Then proceed with 2FA setup
      const response = await axios.post("https://spbebackend-production.up.railway.app/api/auth/setup-2fa", {}, {
        headers: {
          Authorization: `Bearer ${store.state.token}`,
        },
      });
  
      secret.value = response.data.secret;
      
      // Generate QR code
      new QRious({
        element: qrCanvas.value,
        value: response.data.qr_code_url,
        size: 200,
      });
    } catch (error) {
      console.error("Error detail:", error.response?.data);
      $q.notify({
        message: "Failed to setup 2FA. Please try again.",
        type: "negative",
        position: "top-right",
      });
    }
  });
  const verify2FA = async () => {
    try {
      // Basic input validation
      if (!verificationCode.value) {
        $q.notify({
          message: "Please enter the verification code.",
          type: "negative",
          position: "top-right",
        });
        return;
      }
  
      // Check if the secret is available
      if (!secret.value) {
        $q.notify({
          message: "2FA secret is missing.",
          type: "negative",
          position: "top-right",
        });
        return;
      }
      
      // Check if we have the email
      if (!userEmail.value) {
        // If the ref is empty, try to get from localStorage as fallback
        const storedEmail = localStorage.getItem('user_email');
        if (storedEmail) {
          userEmail.value = storedEmail;
        } else {
          $q.notify({
            message: "User email not found. Please try logging in again.",
            type: "negative",
            position: "top-right",
          });
          return;
        }
      }
      
      console.log("Verifying 2FA with email:", userEmail.value);
  
      // Make the API call to verify 2FA
      const response = await axios.post("https://spbebackend-production.up.railway.app/api/auth/verify-2fa", {
        otp: verificationCode.value,
        google2fa_secret: secret.value, // Include the google2fa_secret in the request
        email: userEmail.value, // Include the email field
      }, {
        headers: {
          Authorization: `Bearer ${store.state.token}`, // Use the token from the store
        },
      });
  
      if (response.status === 200) {
        // Set 2FA verification status in store
        store.dispatch('verify2FAStatus', true);
        
        $q.notify({
          message: "Two-factor authentication setup successfully!",
          type: "positive",
          position: "top-right",
        });
        router.push("/dashboard"); // Redirect to the dashboard
      }
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      const errorMessage = error.response?.data?.message || "Failed to verify 2FA.";
      $q.notify({
        message: errorMessage,
        type: "negative",
        position: "top-right",
      });
    }
  };
  
  </script>
  
  <style scoped>
  .setup-2fa-container {
    max-width: 400px;
    margin: 50px auto;
    text-align: center;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
  }
  
  h2 {
    font-size: 24px;
    margin-bottom: 20px;
  }
  
  .qr-code-canvas {
    margin: 20px auto;
    display: block;
    border: 1px solid #ccc;
    padding: 10px;
    background-color: white;
  }
  
  .verification-input {
    margin-top: 20px;
  }
  
  .verification-code {
    padding: 10px;
    width: 100%;
    font-size: 16px;
    border-radius: 4px;
    border: 1px solid #ccc;
  }
  
  .verify-button-container {
    margin-top: 20px;
  }
  
  .verify-button {
    background-color: #28a745;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
  }
  
  .verify-button:hover {
    background-color: #218838;
  }
  </style>
  ``