<template>
    <div class="verify-2fa-container">
      <div class="verify-header">
        <img 
          src="@/assets/img/logopoltek.png" 
          alt="Logo Politeknik" 
          class="logo"
        />
        <h2>SPBE-SCAN AUDITOR</h2>
        <p>Enter your OTP code from Google Authenticator</p>
      </div>
  
      <div class="verify-content">
        <div class="otp-input-container">
          <input
            v-model="otpCode"
            type="text"
            class="otp-input"
            placeholder="Enter 6-digit code"
            maxlength="6"
            autocomplete="off"
            autofocus
          />
        </div>
  
        <div class="button-container">
          <button
            class="verify-button"
            @click="handleVerify"
            :disabled="isLoading || !otpCode || otpCode.length < 6"
          >
            <span v-if="isLoading" class="loading-spinner"></span>
            <span v-else>Verify</span>
          </button>
  
          <button
            class="back-button"
            @click="handleBack"
            :disabled="isLoading"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios'; // Tambahkan import axios
  
  export default {
    data() {
      return {
        otpCode: "",
        isLoading: false,
        userEmail: ""
      }
    },
    created() {
      // Get email from localStorage that was saved during login
      this.userEmail = localStorage.getItem("user_email") || "";
    },
    methods: {
      async handleVerify() {
        if (!this.otpCode || this.otpCode.length !== 6) {
          this.$q.notify({
            message: "Please enter a valid 6-digit code",
            type: "warning",
            position: "top-right"
          });
          return;
        }
  
        if (!this.userEmail) {
          this.$q.notify({
            message: "User email not found. Please try logging in again.",
            type: "negative",
            position: "top-right"
          });
          return;
        }
  
        try {
          this.isLoading = true;
          
          // Call new verify endpoint with email instead of token
          const response = await axios.post("https://spbebackend-production.up.railway.app/api/auth/verify-2fa", {
            otp: this.otpCode,
            email: this.userEmail
          });
          
          // Save new token from response
          localStorage.setItem('token', response.data.access_token);
          localStorage.setItem('refresh_token', response.data.refresh_token);
          localStorage.setItem('is2FAVerified', 'true'); // Set 2FA verification status
          localStorage.removeItem('user_email'); // Clean up
          
          // Update the Vuex store
          this.$store.dispatch('verify2FAStatus', true);
          
          this.$q.notify({
            message: "Verification successful!",
            type: "positive",
            position: "top-right"
          });
          
          // Check if there's a redirect_to destination
          const redirectTo = localStorage.getItem('redirect_to');
          if (redirectTo) {
            const redirectPath = redirectTo;
            localStorage.removeItem('redirect_to'); // Clean up
            this.$router.push(redirectPath);
          } else {
            this.$router.push("/dashboard");
          }
        } catch (error) {
          console.error("Verification error:", error);
          this.$q.notify({
            message: error.response?.data?.error || "Invalid verification code",
            type: "negative",
            position: "top-right"
          });
        } finally {
          this.isLoading = false;
        }
      },
      
      handleBack() {
        localStorage.removeItem('token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('redirect_to');
        this.$router.push("/auditor-login");
      }
    }
  }
  </script>
  
  <style scoped>
  /* Styles dapat dipertahankan dari versi sebelumnya */
  .verify-2fa-container {
    max-width: 400px;
    margin: 80px auto;
    text-align: center;
    padding: 30px;
    border-radius: 12px;
    background-color: white;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
  
  .verify-header {
    margin-bottom: 30px;
  }
  
  .logo {
    max-height: 80px;
    margin-bottom: 20px;
  }
  
  h2 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 5px;
    color: #333;
  }
  
  .verify-header p {
    font-size: 16px;
    color: #666;
    margin-top: 10px;
  }
  
  .verify-content {
    text-align: center;
  }
  
  .otp-input-container {
    margin-bottom: 25px;
  }
  
  .otp-input {
    width: 100%;
    padding: 15px;
    font-size: 20px;
    letter-spacing: 6px;
    text-align: center;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
    transition: border-color 0.3s;
  }
  
  .otp-input:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }
  
  .button-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .verify-button {
    width: 100%;
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 12px;
    font-size: 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.3s;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .verify-button:hover:not([disabled]) {
    background-color: #45a049;
  }
  
  .verify-button:disabled {
    background-color: #a0a0a0;
    cursor: not-allowed;
  }
  
  .loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .back-button {
    background: none;
    border: none;
    color: #666;
    font-size: 14px;
    cursor: pointer;
    padding: 8px;
    text-decoration: underline;
    transition: color 0.3s;
  }
  
  .back-button:hover:not([disabled]) {
    color: #333;
  }
  
  .back-button:disabled {
    color: #ccc;
    cursor: not-allowed;
  }
  </style>