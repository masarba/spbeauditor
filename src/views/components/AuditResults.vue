<template>
  <div class="audit-results">
    <div class="header">
      <div class="title-section">
    <h1 class="audit-title">Hasil Audit</h1>
        <p class="subtitle">Sistem Informasi Audit Keamanan Siber yang membantu dalam pelaksanaan audit keamanan teknologi informasi.</p>
      </div>
      <div class="logo-section">
        <img src="/images/logopoltek.png" alt="Logo Politeknik" class="logo">
      </div>
    </div>
    <div class="audit-table-container">
      <table class="audit-table">
        <thead>
          <tr>
            <th>Audit ID</th>
            <th>Auditee</th>
            <th>Status</th>
            <th>File NDA</th>
            <th>Hasil Audit</th>
            <th>Pertanyaan & Jawaban</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <!-- Data Pending -->
          <tr v-for="audit in pendingAudits" :key="'pending-'+audit.id" class="audit-row">
            <td>
              <span class="id-badge">#{{ audit.id }}</span>
            </td>
            <td>
              <div class="auditee-info">
                <span class="auditee-name">{{ audit.auditee?.username || "Tidak Diketahui" }}</span>
              </div>
            </td>
            <td>
              <span class="status-badge pending">{{ audit.status }}</span>
            </td>
            <td>
              <div class="file-actions">
                <button @click="downloadAuditeeNDA(audit)" class="btn-download">
                  <i class="fas fa-download"></i> Unduh NDA
                </button>
                <div v-if="!hasSignedNDA(audit)" class="upload-section">
                  <label class="custom-file-upload">
                  <input type="file" @change="handleFileChange($event, audit)" accept="application/pdf" />
                    <i class="fas fa-cloud-upload-alt"></i> Pilih File
                  </label>
                  <button 
                    @click="uploadSignedNDA(audit)" 
                    :disabled="!selectedFile || selectedFile.auditId !== audit.id"
                    class="btn-upload"
                  >
                    <i class="fas fa-file-signature"></i> Unggah Signed NDA
                  </button>
                </div>
                <div v-else class="file-status">
                  <i class="fas fa-check-circle text-success"></i>
                  <span>File Signed NDA telah diunggah</span>
                </div>
              </div>
            </td>
            <td>
              <div class="audit-status pending">
                <i class="fas fa-clock"></i>
                <span>Hasil audit belum tersedia</span>
              </div>
            </td>
            <td>
              <div class="qa-section">
                <h4 class="qa-header" v-if="audit.additional_answers && audit.additional_answers.length > 0">
                  <i class="fas fa-comments"></i> Pertanyaan & Jawaban
                </h4>
                <div v-if="audit.additional_answers && audit.additional_answers.length > 0" class="qa-container">
                  <div v-for="(item, index) in audit.additional_answers" :key="index" class="qa-item">
                    <div class="qa-item-number">
                      Nomor {{ item.question_number }}
                    </div>
                    <div class="qa-question">
                      <i class="fas fa-question-circle question-icon"></i>
                      <div class="question-content">
                        <div class="question-label">Pertanyaan:</div>
                        <div class="question-text">{{ item.question }}</div>
                        <div class="question-meta">Dibuat: {{ formatDate(item.created_at) }}</div>
                      </div>
                    </div>
                    
                    <!-- Jawaban yang ada -->
                    <div class="qa-answer" v-if="item.answer">
                      <i class="fas fa-comment answer-icon"></i>
                      <div class="answer-content">
                        <div class="answer-label">Jawaban:</div>
                        <div class="answer-text" v-html="formatAnswerText(item._raw_answer || item.answer)"></div>
                        <div class="answer-meta">Dijawab: {{ formatDate(item.answered_at) }}</div>
                      </div>
                    </div>
                    
                    <!-- Form untuk menjawab -->
                    <div class="qa-answer-form" v-else>
                      <i class="fas fa-info-circle answer-icon"></i>
                      <div class="answer-form-content">
                        <div class="answer-status">Pertanyaan ini belum dijawab</div>
                      </div>
                    </div>
                    
                    <div class="qa-no-answer" v-if="!item.answer && !hasDraftAnswer(audit.id, item.id)">
                      <i class="fas fa-clock"></i>
                      <span>Belum dijawab</span>
                    </div>
                  </div>
                  
                  <!-- Tombol submit semua jawaban -->
                  <div class="submit-answers-section" v-if="false">
                    <button 
                      @click="submitAllAnswers(audit.id)" 
                      class="btn-submit-answers"
                    >
                      <i class="fas fa-paper-plane"></i> Kirim Semua Jawaban
                    </button>
                  </div>
                </div>
                <div v-else class="qa-status pending">
                  <i class="fas fa-question-circle"></i>
                  <span>Belum ada pertanyaan tambahan</span>
                </div>
                
                <!-- Bagian riwayat -->
                <div class="history-section mt-4" v-if="questionHistory[audit.id] && questionHistory[audit.id].length > 0">
                  <div class="history-header">
                    <div class="history-header-left" @click="toggleHistory(audit.id)">
                      <i :class="showHistory[audit.id] ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                      <h4 class="history-title">Riwayat Pertanyaan dan Jawaban</h4>
                    </div>
                    <div class="history-actions">
                      <button class="btn-clear-history" @click="clearHistory(audit.id)" title="Hapus riwayat">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div class="history-content" v-if="showHistory[audit.id]">
                    <div 
                      v-for="(session, sessionIndex) in questionHistory[audit.id]" 
                      :key="'session-'+sessionIndex" 
                      class="history-session"
                    >
                      <div class="session-header">
                        <span class="session-badge">Sesi #{{ sessionIndex + 1 }}</span>
                        <span class="session-date">{{ formatDate(session.timestamp) }}</span>
                      </div>
                      
                      <div class="session-content">
                        <div 
                          v-for="(item, itemIndex) in session.questions" 
                          :key="'history-'+sessionIndex+'-'+itemIndex" 
                          class="history-item"
                        >
                          <div class="history-q">
                            <i class="fas fa-question-circle history-icon question-color"></i>
                            <div class="history-q-content">
                              <div class="history-q-label">Pertanyaan:</div>
                              <div class="history-q-text">{{ item.question }}</div>
                            </div>
                          </div>
                          
                          <div 
                            v-if="item.answer || session.answers[item.id]" 
                            class="history-a"
                          >
                            <i class="fas fa-comment history-icon answer-color"></i>
                            <div class="history-a-content">
                              <div class="history-a-label">Jawaban:</div>
                              <div class="history-a-text" v-html="formatAnswerText(item.answer || session.answers[item.id])"></div>
                            </div>
                          </div>
                          <div v-else class="history-no-answer">
                            <i class="fas fa-times-circle history-icon"></i>
                            <span>Tidak dijawab</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Form tambah pertanyaan -->
                <div class="question-form mt-3">
                  <div class="form-label">Tambahkan Pertanyaan Baru:</div>
                  <textarea 
                    :value="additionalQuestions[audit.id] || ''" 
                    class="form-control question-textarea" 
                    placeholder="Tulis pertanyaan tambahan..."
                    rows="2"
                    @input="updateAdditionalQuestion(audit.id, $event.target.value)"
                  ></textarea>
                  <button 
                    @click="submitAdditionalQuestions(audit.id)" 
                    class="btn-question mt-2"
                    :disabled="!additionalQuestions[audit.id]"
                  >
                    <i class="fas fa-paper-plane"></i> Kirim Pertanyaan
                  </button>
                </div>
              </div>
            </td>
            <td>
              <div class="action-buttons">
                <button @click="approveAudit(audit)" class="btn-approve">
                  <i class="fas fa-check"></i> Setujui
                </button>
                <button @click="rejectAudit(audit)" class="btn-reject">
                  <i class="fas fa-times"></i> Tolak
                </button>
              </div>
            </td>
          </tr>

          <!-- Data Answered -->
          <tr v-for="audit in answeredAudits" :key="'answered-'+audit.id" class="audit-row">
            <td>
              <span class="id-badge">#{{ audit.id }}</span>
            </td>
            <td>
              <div class="auditee-info">
                <span class="auditee-name">{{ audit.auditee?.username || "Tidak Diketahui" }}</span>
              </div>
            </td>
            <td>
              <span class="status-badge answered">{{ audit.status }}</span>
            </td>
            <td>
              <div class="file-actions">
                <button @click="downloadAuditeeNDA(audit)" class="btn-download">
                  <i class="fas fa-download"></i> Unduh NDA
                </button>
                <div v-if="audit.signed_nda" class="file-status">
                  <i class="fas fa-check-circle text-success"></i>
                  <span>File Signed NDA telah diunggah</span>
                </div>
              </div>
            </td>
            <td>
              <div v-if="audit.pdf_path && audit.pdf_path !== 'NULL'" class="audit-status">
                <button @click="downloadAuditResult(audit)" class="btn-download">
                  <i class="fas fa-file-pdf"></i> Unduh Hasil Audit
                </button>
              </div>
              <div v-else class="audit-status pending">
                <i class="fas fa-clock"></i>
                <span>Hasil audit belum tersedia</span>
              </div>
            </td>
            <td>
              <div class="qa-section">
                <h4 class="qa-header" v-if="audit.additional_answers && audit.additional_answers.length > 0">
                  <i class="fas fa-comments"></i> Pertanyaan & Jawaban
                </h4>
                <div v-if="audit.additional_answers && audit.additional_answers.length > 0" class="qa-container">
                  <div v-for="(item, index) in audit.additional_answers" :key="index" class="qa-item">
                    <div class="qa-item-number">
                      Nomor {{ item.question_number }}
                  </div>
                    <div class="qa-question">
                      <i class="fas fa-question-circle question-icon"></i>
                      <div class="question-content">
                        <div class="question-label">Pertanyaan:</div>
                        <div class="question-text">{{ item.question }}</div>
                        <div class="question-meta">Dibuat: {{ formatDate(item.created_at) }}</div>
                </div>
                    </div>
                    
                    <!-- Jawaban yang ada -->
                    <div class="qa-answer" v-if="item.answer">
                      <i class="fas fa-comment answer-icon"></i>
                      <div class="answer-content">
                        <div class="answer-label">Jawaban:</div>
                        <div class="answer-text" v-html="formatAnswerText(item._raw_answer || item.answer)"></div>
                        <div class="answer-meta">Dijawab: {{ formatDate(item.answered_at) }}</div>
                      </div>
                    </div>
                    
                    <!-- Form untuk menjawab -->
                    <div class="qa-answer-form" v-else>
                      <i class="fas fa-info-circle answer-icon"></i>
                      <div class="answer-form-content">
                        <div class="answer-status">Pertanyaan ini belum dijawab</div>
                      </div>
                    </div>
                    
                    <div class="qa-no-answer" v-if="!item.answer && !hasDraftAnswer(audit.id, item.id)">
                      <i class="fas fa-clock"></i>
                      <span>Belum dijawab</span>
                    </div>
                  </div>
                  
                  <!-- Tombol submit semua jawaban -->
                  <div class="submit-answers-section" v-if="false">
                    <button 
                      @click="submitAllAnswers(audit.id)" 
                      class="btn-submit-answers"
                    >
                      <i class="fas fa-paper-plane"></i> Kirim Semua Jawaban
                    </button>
                  </div>
                </div>
                <div v-else class="qa-status pending">
                  <i class="fas fa-question-circle"></i>
                  <span>Belum ada pertanyaan tambahan</span>
                </div>
                
                <!-- Bagian riwayat -->
                <div class="history-section mt-4" v-if="questionHistory[audit.id] && questionHistory[audit.id].length > 0">
                  <div class="history-header">
                    <div class="history-header-left" @click="toggleHistory(audit.id)">
                      <i :class="showHistory[audit.id] ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                      <h4 class="history-title">Riwayat Pertanyaan dan Jawaban</h4>
                    </div>
                    <div class="history-actions">
                      <button class="btn-clear-history" @click="clearHistory(audit.id)" title="Hapus riwayat">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div class="history-content" v-if="showHistory[audit.id]">
                    <div 
                      v-for="(session, sessionIndex) in questionHistory[audit.id]" 
                      :key="'session-'+sessionIndex" 
                      class="history-session"
                    >
                      <div class="session-header">
                        <span class="session-badge">Sesi #{{ sessionIndex + 1 }}</span>
                        <span class="session-date">{{ formatDate(session.timestamp) }}</span>
                      </div>
                      
                      <div class="session-content">
                        <div 
                          v-for="(item, itemIndex) in session.questions" 
                          :key="'history-'+sessionIndex+'-'+itemIndex" 
                          class="history-item"
                        >
                          <div class="history-q">
                            <i class="fas fa-question-circle history-icon question-color"></i>
                            <div class="history-q-content">
                              <div class="history-q-label">Pertanyaan:</div>
                              <div class="history-q-text">{{ item.question }}</div>
                            </div>
                          </div>
                          
                          <div 
                            v-if="item.answer || session.answers[item.id]" 
                            class="history-a"
                          >
                            <i class="fas fa-comment history-icon answer-color"></i>
                            <div class="history-a-content">
                              <div class="history-a-label">Jawaban:</div>
                              <div class="history-a-text" v-html="formatAnswerText(item.answer || session.answers[item.id])"></div>
                            </div>
                          </div>
                          <div v-else class="history-no-answer">
                            <i class="fas fa-times-circle history-icon"></i>
                            <span>Tidak dijawab</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Form tambah pertanyaan -->
                <div class="question-form mt-3">
                  <div class="form-label">Tambahkan Pertanyaan Baru:</div>
                  <textarea 
                    :value="additionalQuestions[audit.id] || ''" 
                    class="form-control question-textarea" 
                    placeholder="Tulis pertanyaan tambahan..."
                    rows="2"
                    @input="updateAdditionalQuestion(audit.id, $event.target.value)"
                  ></textarea>
                  <button 
                    @click="submitAdditionalQuestions(audit.id)" 
                    class="btn-question mt-2"
                    :disabled="!additionalQuestions[audit.id]"
                  >
                    <i class="fas fa-paper-plane"></i> Kirim Pertanyaan
                  </button>
                </div>
              </div>
            </td>
            <td>
              <div class="action-buttons">
                <button @click="approveAudit(audit)" class="btn-approve">
                  <i class="fas fa-check"></i> Setujui
                </button>
                <button @click="rejectAudit(audit)" class="btn-reject">
                  <i class="fas fa-times"></i> Tolak
                </button>
                <button @click="completeAudit(audit)" class="btn-complete">
                  <i class="fas fa-flag-checkered"></i> Audit Selesai
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Setelah tabel audit dijawab, tambahkan bagian untuk menampilkan audit yang telah selesai -->
    <div class="completed-audits-container" v-if="completedAudits.length > 0">
      <h2 class="section-title">
        <i class="fas fa-flag-checkered"></i> Riwayat Audit Selesai
      </h2>
      
      <div class="completed-audits-list">
        <div v-for="audit in completedAudits" :key="'completed-'+audit.id" class="completed-audit-card">
          <div class="completed-header">
            <span class="completed-id">#{{ audit.id }}</span>
            <span class="completed-date">Selesai: {{ formatDate(audit.completed_at) }}</span>
          </div>
          
          <!-- Ubah bagian completed-body untuk menambahkan bagian pertanyaan dan jawaban tambahan -->
          <div class="completed-body">
            <div class="completed-info">
              <div><strong>Auditee:</strong> {{ audit.auditee }}</div>
              <div><strong>Status:</strong> <span class="status-badge completed">{{ audit.status }}</span></div>
            </div>
            
            <!-- Tambahkan bagian riwayat pertanyaan dan jawaban -->
            <div class="completed-qa-section">
              <div class="completed-qa-toggle">
                <div class="completed-qa-toggle-left" @click="toggleCompletedHistory(audit.id)">
                  <i :class="showCompletedHistory[audit.id] ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                  <span>Riwayat Pertanyaan & Jawaban</span>
                </div>
                <div class="completed-qa-actions" v-if="hasCompletedHistoryOrAnswers(audit)">
                  <button class="btn-clear-history small" @click="clearCompletedHistory(audit.id)" title="Hapus riwayat">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
              
              <div class="completed-qa-content" v-if="showCompletedHistory[audit.id]">
                <div v-if="hasCompletedHistoryOrAnswers(audit)">
                  <!-- Tampilkan sesi-sesi riwayat -->
                  <div v-for="(session, sessionIndex) in getAllQuestionsAndAnswers(audit)" :key="'comp-session-'+audit.id+'-'+sessionIndex" class="completed-qa-session">
                    <div class="completed-qa-session-header">
                      <span class="completed-session-badge">Sesi #{{ sessionIndex + 1 }}</span>
                      <span class="completed-session-date" v-if="session.timestamp">{{ formatDate(session.timestamp) }}</span>
                    </div>
                    
                    <div v-for="(item, itemIndex) in session.questions" :key="'comp-qa-'+audit.id+'-'+sessionIndex+'-'+itemIndex" class="completed-qa-item">
                      <div class="completed-qa-question">
                        <i class="fas fa-question-circle history-icon question-color"></i>
                        <div>
                          <strong>Pertanyaan:</strong> {{ item.question }}
                        </div>
                      </div>
                      
                      <div 
                        v-if="item.answer || (session.answers && session.answers[item.id])" 
                        class="completed-qa-answer"
                      >
                        <i class="fas fa-comment history-icon answer-color"></i>
                        <div>
                          <strong>Jawaban:</strong> <span v-html="formatAnswerText(item.answer || (session.answers && session.answers[item.id]))"></span>
                        </div>
                      </div>
                      <div v-else class="completed-qa-no-answer">
                        <i class="fas fa-times-circle history-icon"></i>
                        <span>Tidak ada jawaban</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-if="!hasCompletedHistoryOrAnswers(audit)" class="completed-qa-empty">
                  Tidak ada riwayat pertanyaan dan jawaban
                </div>
              </div>
            </div>
            
            <div class="completed-actions">
              <button v-if="audit.pdf_path" @click="downloadCompletedAudit(audit)" class="btn-download">
                <i class="fas fa-file-pdf"></i> Unduh Hasil
              </button>
              <button @click="removeCompletedAudit(audit.id)" class="btn-remove">
                <i class="fas fa-trash"></i> Hapus
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { useQuasar } from 'quasar';

export default {
  setup() {
    const $q = useQuasar();
    return {
      $q
    };
  },
  data() {
    return {
      pendingAudits: [],
      answeredAudits: [],
      completedAudits: [],
      additionalAnswers: [],
      selectedFile: null,
      additionalQuestions: {},
      isAuthenticated: false,
      userRole: null,
      currentAuditorId: null,
      questionHistory: {},
      draftAnswers: {},
      autoSaveTimer: null,
      pollingTimer: null,
      isPolling: false,
      showHistory: {},
      showCompletedHistory: {}
    };
  },
  methods: {
    async checkAuth() {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const auditorId = localStorage.getItem("auditor_id");
      
      if (!token || !auditorId) {
        console.error("Token atau ID Auditor tidak ditemukan");
        return false;
      }

      this.isAuthenticated = true;
      this.userRole = role;
      this.currentAuditorId = auditorId;
      
      // Set default axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return true;
    },
    
    async fetchPendingAudits() {
      try {
        if (!await this.checkAuth()) return;
        
        const response = await axios.get(
          "http://127.0.0.1:8000/api/auth/audit-requests/pending"
        );

        // Ambil daftar audit yang sudah selesai dari localStorage
        const completedAuditIds = this.getCompletedAuditIds();

        // Filter data berdasarkan auditor_id dan exclude yang sudah selesai
        this.pendingAudits = response.data
          .filter(audit => 
            audit.auditor_id?.toString() === this.currentAuditorId && 
            !completedAuditIds.includes(audit.id.toString())
          );

        console.log("Data pending audits (filtered):", this.pendingAudits);
      } catch (error) {
        console.error("Gagal mengambil data audit pending:", error.response?.data || error);
        this.pendingAudits = [];
      }
    },
    async fetchAnsweredAudits() {
  try {
        if (!await this.checkAuth()) return;
        
        const response = await axios.get(
          "http://127.0.0.1:8000/api/auth/audit-requests/answered"
        );

        // Ambil daftar audit yang sudah selesai dari localStorage
        const completedAuditIds = this.getCompletedAuditIds();
        console.log("Completed audit IDs:", completedAuditIds);

        // Filter data berdasarkan auditor_id dan exclude yang sudah selesai
        const filteredAudits = response.data.audit_requests
          .filter(audit => 
            audit.auditor_id?.toString() === this.currentAuditorId && 
            !completedAuditIds.includes(audit.id.toString())
          );

        // Proses data yang sudah difilter
        this.answeredAudits = filteredAudits.map(audit => {
          return {
            ...audit,
            pdf_path: audit.pdf_path || null
          };
        });

        // Ambil jawaban tambahan hanya untuk audit yang difilter
    for (let audit of this.answeredAudits) {
          try {
            // Muat riwayat dari localStorage terlebih dahulu
            this.loadHistoryFromLocalStorage(audit.id);
            
            // Inisialisasi flag tampilan riwayat
            if (!this.showHistory[audit.id]) {
              // Gunakan pendekatan objek baru untuk reaktivitas
              this.showHistory = {
                ...this.showHistory,
                [audit.id]: false
              };
            }
            
            // Ambil data terbaru dari server
            try {
              // Gunakan metode raw untuk mendapatkan data asli
              const rawData = await this.loadRawAdditionalAnswers(audit.id);
              
              console.log(`Data mentah jawaban dari server untuk Audit #${audit.id}:`, rawData);
              
              // Log jawaban untuk debugging
              if (Array.isArray(rawData)) {
                rawData.forEach((item, idx) => {
                  if (item.answer) {
                    console.log(`Jawaban #${idx} (${item.id}): "${item.answer}"`);
                    if (item._raw_answer && item._raw_answer !== item.answer) {
                      console.log(`Raw jawaban #${idx}: "${item._raw_answer}"`);
                    }
                  }
                });
              }
              
              // Proses data yang diterima
              if (Array.isArray(rawData) && rawData.length > 0) {
                // Proses data baru dari server
                const serverQuestions = this.processAnswersData(rawData);
                
                // Jika tidak ada data di localStorage atau data server berbeda, gunakan data server
                if (!this.questionHistory[audit.id] || this.questionHistory[audit.id].length === 0) {
                  // Jika belum ada history, buat sesi baru dari data server
                  this.initializeHistory(audit.id, serverQuestions);
                } else {
                  // Update history jika ada pertanyaan baru
                  this.updateHistoryWithServerData(audit.id, serverQuestions);
                }
                
                // Load draft jawaban yang tersimpan
                this.loadDraftAnswers(audit.id);
                
                // Set data pertanyaan untuk ditampilkan
                audit.additional_answers = serverQuestions.map(q => {
                  // Cek apakah ada draft jawaban
                  if (this.draftAnswers[audit.id] && this.draftAnswers[audit.id][q.id]) {
                    return { ...q, draft_answer: this.draftAnswers[audit.id][q.id] };
                  }
                  return q;
                });
              } else {
                audit.additional_answers = [];
                // History tetap dipertahankan meskipun tidak ada pertanyaan baru
              }
            } catch (additionalError) {
              console.error(`Error getting raw answers for audit ${audit.id}:`, additionalError);
              
              // Fallback ke metode normal jika metode raw gagal
              const additionalResponse = await axios.get(
                `http://127.0.0.1:8000/api/auth/audit-requests/${audit.id}/additional-answers`,
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem("token")}`,
                    'Accept': 'application/json'
                  }
                }
              );
              
              // Log data mentah untuk debugging
              console.log(`Fallback: Data mentah jawaban dari server untuk Audit #${audit.id}:`, additionalResponse.data);
              
              // Proses data yang diterima dengan metode fallback
              if (Array.isArray(additionalResponse.data) && additionalResponse.data.length > 0) {
                // Kode yang sama seperti di atas
                const serverQuestions = this.processAnswersData(additionalResponse.data);
                
                if (!this.questionHistory[audit.id] || this.questionHistory[audit.id].length === 0) {
                  this.initializeHistory(audit.id, serverQuestions);
                } else {
                  this.updateHistoryWithServerData(audit.id, serverQuestions);
                }
                
                this.loadDraftAnswers(audit.id);
                
                audit.additional_answers = serverQuestions.map(q => {
                  if (this.draftAnswers[audit.id] && this.draftAnswers[audit.id][q.id]) {
                    return { ...q, draft_answer: this.draftAnswers[audit.id][q.id] };
                  }
                  return q;
                });
              } else {
                audit.additional_answers = [];
              }
            }
            
            // Log untuk debugging
            console.log(`Processed additional answers for Audit ID ${audit.id}:`, audit.additional_answers);
            console.log(`History for Audit ID ${audit.id}:`, this.questionHistory[audit.id]);
          } catch (error) {
            console.error(`Gagal mengambil jawaban tambahan untuk audit ${audit.id}:`, error);
            audit.additional_answers = [];
          }
        }

        console.log('Processed answered audits (filtered):', this.answeredAudits);
        
        // Setup auto-save setelah semua data dimuat
        this.setupAutoSave();
      } catch (error) {
        console.error("Gagal mengambil data audit answered:", error);
        this.answeredAudits = [];
      }
    },
    handleFileChange(event, audit) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = { file, auditId: audit.id };
      }
    },
    async uploadSignedNDA(audit) {
      try {
        if (!await this.checkAuth()) return;

      if (!this.selectedFile || this.selectedFile.auditId !== audit.id) {
        alert("Pilih file Signed NDA yang valid.");
        return;
      }

      const formData = new FormData();
        
        // Log file yang akan dikirim
        console.log("Selected file:", this.selectedFile.file);
        
        // Pastikan file yang dipilih adalah PDF
        if (this.selectedFile.file.type !== 'application/pdf') {
          alert("File harus berformat PDF");
          return;
        }

        // Tambahkan file ke FormData dengan nama field yang benar
        formData.append("signed_nda", this.selectedFile.file, this.selectedFile.file.name);

        const token = localStorage.getItem("token");
        
        // Log FormData untuk debugging
        for (let pair of formData.entries()) {
          console.log(pair[0] + ': ' + pair[1]);
        }

        const response = await axios.post(
          `http://127.0.0.1:8000/api/auth/audit-requests/${audit.id}/upload-signed-nda`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
              Accept: "application/json"
            }
          }
        );

        console.log("Response upload:", response.data);
        
        if (response.data.success || response.status === 200) {
        alert("Signed NDA berhasil diunggah.");
          this.selectedFile = null;
          await this.fetchPendingAudits();
        } else {
          throw new Error(response.data.message || "Gagal mengunggah file");
        }
      } catch (error) {
        console.error("Gagal mengunggah Signed NDA:", error);
        console.log("Error response:", error.response?.data);
        
        const errorMessage = error.response?.data?.message 
          || error.response?.data?.errors?.signed_nda?.[0]
          || "Terjadi kesalahan saat mengunggah file";
          
        alert("Gagal mengunggah: " + errorMessage);
      }
    },
    async downloadAuditeeNDA(audit) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://127.0.0.1:8000/api/auth/audit-requests/${audit.id}/download-nda-auditee`,
          {
            responseType: 'blob',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        // Buat blob dan trigger download browser
        const blob = new Blob([response.data], { 
          type: 'application/pdf'
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `NDA_Auditee_${audit.id}.pdf`);
        document.body.appendChild(link);
        link.click();
        
        // Cleanup URL setelah download dimulai
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        }, 100);

      } catch (error) {
        // Hanya log error ke console tanpa menampilkan alert
        console.error("Debug - Gagal mengunduh NDA:", error);
      }
    },
    async downloadAuditResult(audit) {
      try {
        const token = localStorage.getItem("token");
        
        const response = await axios.get(
          `http://127.0.0.1:8000/api/auth/audits/${audit.id}/download-result`,
          {
            responseType: 'blob',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        // Buat blob dan trigger download browser
        const blob = new Blob([response.data], { 
          type: 'application/pdf'
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = `Hasil_Audit_${audit.id}.pdf`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        
        // Cleanup URL setelah download dimulai
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(link);
        }, 100);

      } catch (error) {
        // Log error dengan informasi lengkap dari response
        console.error("Debug - Gagal mengunduh:", error);
        
        // Coba dapatkan pesan error lengkap dari response
        if (error.response) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              // Coba parse response sebagai JSON
              const errorResponse = JSON.parse(reader.result);
              console.log("Error response body:", errorResponse);
            } catch (e) {
              // Jika bukan JSON, tampilkan sebagai text
              console.log("Error response text:", reader.result);
            }
          };
          
          if (error.response.data instanceof Blob) {
            reader.readAsText(error.response.data);
          }
        }
      }
    },
    async approveAudit(audit) {
      try {
        if (!await this.checkAuth()) return;
        
        // Log untuk debugging
        console.log('Data audit yang akan disetujui:', {
          id: audit.id,
          signed_nda: audit.signed_nda,
          nda_document: audit.nda_document
        });
        
        // Periksa apakah signed NDA sudah ada di database
        if (!audit.signed_nda) {
          alert('Anda harus mengunggah Signed NDA terlebih dahulu sebelum menyetujui audit.');
          return;
        }

        const token = localStorage.getItem("token");

        // Kirim request persetujuan dengan path signed_nda
        const response = await axios.patch(
          `http://127.0.0.1:8000/api/auth/audit-requests/${audit.id}/approve`,
          {
            signed_nda: audit.signed_nda // Kirim path signed_nda yang sudah tersimpan
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        );
        
        // Log response
        console.log('Response dari server:', response.data);
        
        alert(`Audit ID ${audit.id} telah disetujui.`);
        await this.fetchPendingAudits();
        await this.fetchAnsweredAudits();
        
      } catch (error) {
        console.error("Gagal menyetujui audit:", error.response?.data || error);
        console.log("Detail error:", {
          message: error.response?.data?.message,
          errors: error.response?.data?.errors
        });
        alert("Gagal menyetujui audit: " + (error.response?.data?.message || "Terjadi kesalahan"));
      }
    },
    async rejectAudit(audit) {
      try {
        if (!await this.checkAuth()) return;
        
        if (!confirm('Apakah Anda yakin ingin menolak audit ini? Data audit akan dihapus secara permanen.')) {
          return;
        }

        await axios.patch(
          `http://127.0.0.1:8000/api/auth/audit-requests/${audit.id}/reject`,
          {}
        );

        this.pendingAudits = this.pendingAudits.filter(a => a.id !== audit.id);
        this.answeredAudits = this.answeredAudits.filter(a => a.id !== audit.id);

        await this.fetchPendingAudits();
        await this.fetchAnsweredAudits();

        alert('Audit berhasil ditolak dan dihapus');
      } catch (error) {
        console.error('Gagal menolak audit:', error.response?.data || error);
        alert('Gagal menolak audit: ' + (error.response?.data?.message || "Terjadi kesalahan"));
      }
    },
    async submitAdditionalQuestions(auditId) {
      try {
        if (!await this.checkAuth()) return;

      const questions = this.additionalQuestions[auditId];
        if (!questions || questions.trim() === '') {
          this.$q.notify({
            message: 'Pertanyaan tidak boleh kosong',
            type: 'warning',
            timeout: 2000
          });
        return;
      }

        // Pastikan cache untuk audit ini sudah diinisialisasi
        if (!this.questionHistory[auditId]) {
          this.questionHistory[auditId] = [];
        }

        // Mengirim pertanyaan baru
        const submitResponse = await axios.post(
          `http://127.0.0.1:8000/api/auth/audit-requests/${auditId}/additional-questions`,
          { questions }
        );
        
        // Log response untuk debugging
        console.log("Response setelah submit pertanyaan:", submitResponse.data);

        this.$q.notify({
          message: 'Pertanyaan berhasil dikirim',
          type: 'positive',
          timeout: 2000
        });

        // Reset pertanyaan setelah berhasil dikirim
        this.additionalQuestions[auditId] = '';
        
        // Ambil data pertanyaan tambahan terbaru (hanya yang baru ditambahkan)
        const additionalResponse = await axios.get(
          `http://127.0.0.1:8000/api/auth/audit-requests/${auditId}/additional-answers`
        );
        
        // Log response untuk debugging
        console.log("Data pertanyaan setelah refresh:", additionalResponse.data);
        
        // Cari audit yang sesuai di array answeredAudits
        const auditIndex = this.answeredAudits.findIndex(audit => audit.id === auditId);
        if (auditIndex !== -1) {
          // Proses data baru dari database
          const newAnswerData = this.processAnswersData(additionalResponse.data);
          
          // Menentukan nomor untuk pertanyaan baru
          let maxQuestionNumber = 0;
          if (this.questionHistory[auditId] && this.questionHistory[auditId].length > 0) {
            maxQuestionNumber = Math.max(...this.questionHistory[auditId].map(q => q.questions.length));
          }
          
          // Siapkan data pertanyaan baru dengan nomor yang sesuai
          const processedNewAnswers = newAnswerData.map((item, index) => {
            return {
              ...item,
              question_number: maxQuestionNumber + index + 1
            };
          });
          
          // Jika ini adalah pertanyaan pertama, inisialisasi history dengan data baru
          if (this.questionHistory[auditId].length === 0) {
            this.questionHistory[auditId].push({
              timestamp: new Date().toISOString(),
              questions: processedNewAnswers,
              answers: {}
            });
          } else {
            // Jika sudah ada pertanyaan sebelumnya, tambahkan pertanyaan baru ke history
            // Cari pertanyaan yang belum ada di history berdasarkan konten pertanyaan
            const newQuestions = processedNewAnswers.filter(newItem => {
              return !this.questionHistory[auditId].some(existingItem => 
                existingItem.questions.some(q => q.question === newItem.question && q.answer === newItem.answer)
              );
            });
            
            if (newQuestions.length > 0) {
              this.questionHistory[auditId].push({
                timestamp: new Date().toISOString(),
                questions: newQuestions,
                answers: {}
              });
            }
          }
          
          // Tampilkan pertanyaan dari history
          this.answeredAudits[auditIndex].additional_answers = [...this.questionHistory[auditId][this.questionHistory[auditId].length - 1].questions];
          
          console.log("History pertanyaan diperbarui:", this.questionHistory[auditId]);
        }
      } catch (error) {
        console.error("Gagal mengirim pertanyaan:", error);
        this.$q.notify({
          message: 'Gagal mengirim pertanyaan: ' + (error.response?.data?.message || 'Terjadi kesalahan'),
          type: 'negative',
          timeout: 3000
        });
      }
    },
    processAnswersData(answersData, startIndex = 0) {
      if (!Array.isArray(answersData)) {
        console.error("Data jawaban bukan array:", answersData);
        return [];
      }
      
      console.log("Processing answers data:", JSON.stringify(answersData));
      
      // Proses setiap item dalam data jawaban
      const processed = answersData.map((item, index) => {
        try {
          // Cek apakah data memiliki format JSON yang cacat
          let fullAnswer = '';
          
          if (item.answer) {
            // PRIORITAS: Gunakan jawaban mentah jika tersedia (_raw_answer)
            if (item._raw_answer && typeof item._raw_answer === 'string') {
              fullAnswer = item._raw_answer;
              console.log(`Using raw answer for item ${index}: "${fullAnswer}"`);
            } else {
              // Fallback: Gunakan jawaban biasa
              fullAnswer = String(item.answer);
              
              // Cek apakah jawaban berisi karakter escape yang tidak lengkap
              if (fullAnswer.includes('\\') && !fullAnswer.includes('\\\\')) {
                console.log(`Fixing potentially broken escape sequences in answer: ${fullAnswer}`);
                fullAnswer = fullAnswer.replace(/\\/g, '\\\\');
              }
              
              // Jika jawaban hanya tampil sebagian, periksa apakah ada tanda baca yang memotong
              // Ini mencakup semua tanda baca umum: , . ! ? ; :
              const punctuationMarks = [',', '.', '!', '?', ';', ':'];
              for (const mark of punctuationMarks) {
                if (fullAnswer.endsWith(mark)) {
                  console.log(`Jawaban mungkin terpotong pada tanda baca: ${fullAnswer}`);
                  break;
                }
              }
            }
          }
          
          console.log(`Item ${index} final processed answer:`, fullAnswer);
          
          // Handle berbagai kemungkinan struktur data
          return {
            // Prioritaskan penggunaan id asli dari database
            id: item.id || index,
            // Gunakan field 'additional_questions' (dari screenshot) atau 'question'
            question: item.additional_questions || item.question || '',
            // Gunakan field 'answer' tanpa memotong pada tanda baca
            answer: fullAnswer,
            created_at: item.created_at || new Date().toISOString(),
            answered_at: item.answered_at || null,
            // Gunakan nomor yang sudah ada atau buat baru
            question_number: item.question_number || (index + 1 + startIndex)
          };
        } catch (e) {
          console.error(`Error processing answer item ${index}:`, e);
          // Fallback ke data minimal
          return {
            id: index,
            question: item.additional_questions || item.question || 'Pertanyaan tidak tersedia',
            answer: item.answer || '',
            created_at: new Date().toISOString(),
            answered_at: null,
            question_number: index + 1 + startIndex
          };
        }
      });
      
      console.log("Processed answers:", processed);
      return processed;
    },
    formatDate(dateString) {
      if (!dateString) return 'Tidak tersedia';
      
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    },
    formatAnswerText(text) {
      if (!text) return '';
      
      console.log("Original text to format:", text);
      
      // Pastikan text dalam bentuk string
      const safeText = String(text);
      
      // Tidak perlu memeriksa apakah terpotong karena kita menggunakan data mentah langsung
      
      // Escape HTML untuk keamanan
      const escaped = safeText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      
      // Konversi line breaks ke <br>
      const formatted = escaped.replace(/\n/g, '<br>');
      
      console.log("Formatted text:", formatted);
      
      return formatted;
    },
    updateAnswerInLocalCache(auditId, questionId, answer) {
      if (!this.questionHistory[auditId]) {
        console.error("History untuk audit " + auditId + " tidak ditemukan.");
        return;
      }
      
      // Cari pertanyaan dengan ID yang sesuai
      const questionIndex = this.questionHistory[auditId].findIndex(q => q.questions.some(q => q.id === questionId));
      if (questionIndex !== -1) {
        // Perbarui jawaban tanpa mengubah data lain
        this.questionHistory[auditId][questionIndex].answers[questionId] = answer;
        console.log(`Jawaban untuk pertanyaan ID ${questionId} diperbarui dalam history.`);
      } else {
        console.error(`Pertanyaan dengan ID ${questionId} tidak ditemukan dalam history.`);
      }
    },
    async handleNewAnswer(auditId, questionId, answer) {
      try {
        // Perbarui jawaban di history
        this.updateAnswerInLocalCache(auditId, questionId, answer);
        
        // Perbarui tampilan
        const auditIndex = this.answeredAudits.findIndex(audit => audit.id === auditId);
        if (auditIndex !== -1) {
          // Gunakan data dari history untuk tampilan
          this.answeredAudits[auditIndex].additional_answers = [...this.questionHistory[auditId][this.questionHistory[auditId].length - 1].questions];
        }
      } catch (error) {
        console.error("Gagal memperbarui jawaban:", error);
      }
    },
    startPollingForAnswers() {
      // Hentikan polling sebelumnya jika ada
      this.stopPollingForAnswers();
      
      // Set flag polling
      this.isPolling = true;
      
      // Mulai polling setiap 30 detik
      this.pollingTimer = setInterval(() => {
        if (this.isAuthenticated && !this.$route.meta.disablePolling) {
          this.checkForNewAnswers();
        }
      }, 30000); // 30 detik
      
      console.log("Polling untuk jawaban baru dimulai.");
    },
    stopPollingForAnswers() {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
        this.isPolling = false;
        console.log("Polling untuk jawaban baru dihentikan.");
      }
    },
    async checkForNewAnswers() {
      try {
        if (!this.isAuthenticated || this.isPolling) {
          return;
        }
        
        this.isPolling = true;
        
        // Iterate melalui semua audit yang sudah dijawab
        for (let audit of this.answeredAudits) {
          // Skip jika tidak ada pertanyaan
          if (!this.questionHistory[audit.id] || this.questionHistory[audit.id].length === 0) {
            continue;
          }
          
          try {
            // Gunakan metode raw untuk mendapatkan data asli
            const rawData = await this.loadRawAdditionalAnswers(audit.id);
            
            // Proses data yang diterima
            if (Array.isArray(rawData) && rawData.length > 0) {
              const newAnswersFromServer = this.processAnswersData(rawData);
              let hasNewAnswers = false;
              
              // Bandingkan dengan data yang ada di history
              newAnswersFromServer.forEach(serverItem => {
                const historyItemIndex = this.questionHistory[audit.id].findIndex(
                  item => item.questions.some(q => q.id === serverItem.id || q.question === serverItem.question)
                );
                
                if (historyItemIndex !== -1) {
                  const historyItem = this.questionHistory[audit.id][historyItemIndex];
                  
                  // Periksa apakah ada jawaban baru atau perubahan jawaban
                  if (serverItem.answer && 
                      (historyItem.answers[serverItem.id] !== serverItem.answer || !historyItem.answers[serverItem.id])) {
                    
                    // Perbarui jawaban di history
                    this.updateAnswerInLocalCache(audit.id, serverItem.id, serverItem.answer);
                    
                    hasNewAnswers = true;
                  }
                }
              });
              
              // Jika ada jawaban baru, perbarui tampilan dan tampilkan notifikasi
              if (hasNewAnswers) {
                // Perbarui tampilan
                const auditIndex = this.answeredAudits.findIndex(a => a.id === audit.id);
                if (auditIndex !== -1) {
                  this.answeredAudits[auditIndex].additional_answers = [...this.questionHistory[audit.id][this.questionHistory[audit.id].length - 1].questions];
                }
                
                // Tampilkan notifikasi
                this.$q.notify({
                  message: `Ada jawaban baru untuk Audit #${audit.id}!`,
                  type: 'positive',
                  timeout: 5000,
                  position: 'top-right'
                });
                
                console.log(`Jawaban baru ditemukan untuk Audit #${audit.id}`);
              }
            }
          } catch (error) {
            console.error(`Error getting raw answers for audit ${audit.id}:`, error);
            
            try {
              // Fallback ke metode normal
              // Ambil data terbaru dari server
              const response = await axios.get(
                `http://127.0.0.1:8000/api/auth/audit-requests/${audit.id}/additional-answers`,
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem("token")}`
                  }
                }
              );
              
              // Proses data yang diterima
              if (Array.isArray(response.data) && response.data.length > 0) {
                // Kode yang sama seperti sebelumnya
                const newAnswersFromServer = this.processAnswersData(response.data);
                let hasNewAnswers = false;
                
                // Log untuk debugging variabel
                console.log("Fallback processed answers:", newAnswersFromServer.length, "items");
                
                // Bandingkan dengan data yang ada di history
                newAnswersFromServer.forEach(serverItem => {
                  const historyItemIndex = this.questionHistory[audit.id].findIndex(
                    item => item.questions.some(q => q.id === serverItem.id || q.question === serverItem.question)
                  );
                  
                  if (historyItemIndex !== -1) {
                    const historyItem = this.questionHistory[audit.id][historyItemIndex];
                    
                    // Periksa apakah ada jawaban baru atau perubahan jawaban
                    if (serverItem.answer && 
                        (historyItem.answers[serverItem.id] !== serverItem.answer || !historyItem.answers[serverItem.id])) {
                      
                      // Perbarui jawaban di history
                      this.updateAnswerInLocalCache(audit.id, serverItem.id, serverItem.answer);
                      
                      hasNewAnswers = true;
                    }
                  }
                });
                
                // Jika ada jawaban baru, perbarui tampilan dan tampilkan notifikasi
                if (hasNewAnswers) {
                  // Perbarui tampilan
                  const auditIndex = this.answeredAudits.findIndex(a => a.id === audit.id);
                  if (auditIndex !== -1) {
                    this.answeredAudits[auditIndex].additional_answers = [...this.questionHistory[audit.id][this.questionHistory[audit.id].length - 1].questions];
                  }
                  
                  // Tampilkan notifikasi
                  this.$q.notify({
                    message: `Ada jawaban baru untuk Audit #${audit.id}!`,
                    type: 'positive',
                    timeout: 5000,
                    position: 'top-right'
                  });
                  
                  console.log(`Jawaban baru ditemukan untuk Audit #${audit.id}`);
                }
              }
            } catch (fallbackError) {
              console.error(`Fallback method also failed for audit ${audit.id}:`, fallbackError);
              audit.additional_answers = [];
            }
          }
        }
      } catch (error) {
        console.error("Gagal memeriksa jawaban baru:", error);
      } finally {
        this.isPolling = false;
      }
    },
    areNewQuestionsAvailable(auditId, serverQuestions) {
      if (!this.questionHistory[auditId] || !Array.isArray(this.questionHistory[auditId]) || this.questionHistory[auditId].length === 0) {
        return true; // Belum ada riwayat sama sekali
      }
      
      // Ambil pertanyaan terbaru dari riwayat
      const latestSession = this.questionHistory[auditId][this.questionHistory[auditId].length - 1];
      if (!latestSession || !latestSession.questions) {
        return true;
      }
      
      // Bandingkan jumlah pertanyaan
      if (serverQuestions.length !== latestSession.questions.length) {
        return true;
      }
      
      // Bandingkan pertanyaan satu per satu
      for (let i = 0; i < serverQuestions.length; i++) {
        const serverQuestion = serverQuestions[i].question || serverQuestions[i].additional_questions || '';
        const historyQuestion = latestSession.questions[i].question || '';
        
        if (serverQuestion !== historyQuestion) {
          return true;
        }
      }
      
      return false;
    },
    saveCurrentSessionToHistory(auditId, questions, answers) {
      if (!this.questionHistory[auditId]) {
        this.questionHistory[auditId] = [];
      }
      
      // Buat objek sesi baru
      const newSession = {
        timestamp: new Date().toISOString(),
        questions: JSON.parse(JSON.stringify(questions)), // Deep copy
        answers: JSON.parse(JSON.stringify(answers)) // Deep copy
      };
      
      // Tambahkan ke riwayat
      this.questionHistory[auditId].push(newSession);
      
      // Simpan ke localStorage
      this.saveHistoryToLocalStorage(auditId);
    },
    async loadHistoryFromLocalStorage(auditId) {
      try {
        const storedHistory = localStorage.getItem(`audit_${auditId}_history`);
        if (storedHistory) {
          this.questionHistory[auditId] = JSON.parse(storedHistory);
          console.log(`Riwayat untuk Audit #${auditId} dimuat dari localStorage:`, this.questionHistory[auditId]);
          
          // Set default status tampilan riwayat untuk setiap audit
          if (!this.showHistory[auditId]) {
            // Gunakan pendekatan objek baru untuk reaktivitas
            this.showHistory = {
              ...this.showHistory,
              [auditId]: false
            };
          }
          
          return true;
        }
      } catch (error) {
        console.error(`Gagal memuat riwayat dari localStorage:`, error);
      }
      
      // Inisialisasi history kosong jika tidak ada data
      this.questionHistory[auditId] = [];
      
      // Set default status tampilan
      this.showHistory = {
        ...this.showHistory,
        [auditId]: false
      };
      
      return false;
    },
    saveDraftAnswers(auditId, answers) {
      try {
        const answersData = {
          lastUpdated: new Date().toISOString(),
          answers: answers
        };
        
        localStorage.setItem(`audit_${auditId}_draft_answers`, JSON.stringify(answersData));
        console.log(`Draft jawaban untuk Audit #${auditId} disimpan.`);
      } catch (error) {
        console.error(`Gagal menyimpan draft jawaban:`, error);
      }
    },
    loadDraftAnswers(auditId) {
      try {
        const storedDraft = localStorage.getItem(`audit_${auditId}_draft_answers`);
        if (storedDraft) {
          const data = JSON.parse(storedDraft);
          this.draftAnswers[auditId] = data.answers || {};
          console.log(`Draft jawaban untuk Audit #${auditId} dimuat.`);
          return true;
        }
      } catch (error) {
        console.error(`Gagal memuat draft jawaban:`, error);
      }
      
      this.draftAnswers[auditId] = {};
      return false;
    },
    setupAutoSave() {
      // Hentikan timer sebelumnya jika ada
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer);
      }
      
      // Setup timer baru untuk auto-save setiap 30 detik
      this.autoSaveTimer = setInterval(() => {
        this.autoSaveAllDrafts();
        // Juga simpan semua history
        for (const auditId in this.questionHistory) {
          if (this.questionHistory[auditId] && this.questionHistory[auditId].length > 0) {
            this.saveHistoryToLocalStorage(auditId);
          }
        }
      }, 30000); // 30 detik
      
      // Tambahkan event listener untuk menyimpan saat meninggalkan halaman
      window.addEventListener('beforeunload', this.saveBeforeUnload);
      
      console.log('Auto-save telah diaktifkan untuk draft jawaban dan riwayat.');
    },
    autoSaveAllDrafts() {
      for (const auditId in this.draftAnswers) {
        if (Object.keys(this.draftAnswers[auditId]).length > 0) {
          this.saveDraftAnswers(auditId, this.draftAnswers[auditId]);
        }
      }
    },
    toggleHistory(auditId) {
      // Pastikan objek showHistory sudah diinisialisasi
      if (!this.showHistory) {
        this.showHistory = {};
      }
      
      // Toggle nilai dengan pendekatan objek baru untuk reaktivitas
      this.showHistory = {
        ...this.showHistory,
        [auditId]: !this.showHistory[auditId]
      };
      
      // Log untuk debugging
      console.log(`Toggle history for Audit ID ${auditId}: ${this.showHistory[auditId]}`);
    },
    saveAnswer(auditId, questionId, answer) {
      if (!this.draftAnswers[auditId]) {
        this.draftAnswers[auditId] = {};
      }
      this.draftAnswers[auditId][questionId] = answer;
    },
    async submitAllAnswers(auditId) {
      if (!this.isAuthenticated) return;
      
      try {
        // Siapkan data jawaban dari draft
        const answers = this.draftAnswers[auditId] || {};
        const auditIndex = this.answeredAudits.findIndex(audit => audit.id === auditId);
        
        if (auditIndex === -1 || !this.answeredAudits[auditIndex].additional_answers) {
          throw new Error('Data audit tidak ditemukan');
        }
        
        // Siapkan data untuk dikirim ke API
        const answersData = [];
        Object.keys(answers).forEach(questionId => {
          answersData.push({
            question_id: questionId,
            answer: answers[questionId]
          });
        });
        
        // Jika tidak ada jawaban untuk dikirim
        if (answersData.length === 0) {
          this.$q.notify({
            message: 'Tidak ada jawaban untuk dikirim',
            type: 'warning',
            timeout: 2000
          });
          return;
        }
        
        // Kirim jawaban ke API
        const response = await axios.post(
          `http://127.0.0.1:8000/api/auth/audit-requests/${auditId}/submit-answers`,
          { answers: answersData },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Log response untuk debugging
        console.log('Response setelah submit jawaban:', response.data);
        
        // Perbarui data di aplikasi
        if (response.data.success) {
          // Ambil sesi terakhir di history
          if (this.questionHistory[auditId] && this.questionHistory[auditId].length > 0) {
            const lastSessionIndex = this.questionHistory[auditId].length - 1;
            const lastSession = this.questionHistory[auditId][lastSessionIndex];
            
            // Update jawaban pada pertanyaan di sesi terakhir
            for (const questionId in answers) {
              const questionIndex = lastSession.questions.findIndex(q => q.id.toString() === questionId.toString());
              if (questionIndex !== -1) {
                lastSession.questions[questionIndex].answer = answers[questionId];
                lastSession.questions[questionIndex].answered_at = new Date().toISOString();
              }
            }
            
            // Simpan perubahan ke localStorage
            this.saveHistoryToLocalStorage(auditId);
            
            // Hapus draft jawaban setelah berhasil dikirim
            this.draftAnswers[auditId] = {};
            this.saveDraftAnswers(auditId, {});
            
            // Update tampilan
            this.answeredAudits[auditIndex].additional_answers = [...lastSession.questions];
            
            // Tampilkan notifikasi sukses
            this.$q.notify({
              message: 'Jawaban berhasil dikirim',
              type: 'positive',
              timeout: 2000
            });
          }
        } else {
          throw new Error(response.data.message || 'Gagal mengirim jawaban');
        }
      } catch (error) {
        console.error('Gagal menyimpan jawaban:', error);
        
        // Tampilkan notifikasi error
        this.$q.notify({
          message: 'Gagal mengirim jawaban: ' + (error.response?.data?.message || error.message || 'Terjadi kesalahan'),
          type: 'negative',
          timeout: 3000
        });
      }
    },
    getDraftAnswer(auditId, questionId) {
      if (!this.draftAnswers[auditId]) {
        return '';
      }
      return this.draftAnswers[auditId][questionId] || '';
    },
    hasDraftAnswer(auditId, questionId) {
      return !!(this.draftAnswers[auditId] && this.draftAnswers[auditId][questionId]);
    },
    hasDraftAnswers(auditId) {
      return this.draftAnswers[auditId] && Object.keys(this.draftAnswers[auditId]).length > 0;
    },
    updateAdditionalQuestion(auditId, value) {
      // Gunakan pendekatan objek baru untuk reaktivitas
      this.additionalQuestions = {
        ...this.additionalQuestions,
        [auditId]: value
      };
    },
    initializeHistory(auditId, questions) {
      console.log(`Initializing history for Audit ID ${auditId}`);
      
      // Struktur data untuk sesi pertanyaan
      if (!this.questionHistory[auditId]) {
        this.questionHistory[auditId] = [];
      }
      
      // Buat sesi baru dari pertanyaan server
      const sessionData = {
        timestamp: new Date().toISOString(),
        questions: JSON.parse(JSON.stringify(questions)), // Deep copy
        answers: {}
      };
      
      // Tambahkan sesi ke history
      this.questionHistory[auditId].push(sessionData);
      
      // Simpan ke localStorage
      this.saveHistoryToLocalStorage(auditId);
    },
    updateHistoryWithServerData(auditId, serverQuestions) {
      console.log(`Updating history for Audit ID ${auditId} with new server data`);
      
      // Dapatkan sesi terakhir
      const currentSessions = this.questionHistory[auditId];
      
      if (!currentSessions || currentSessions.length === 0) {
        // Jika belum ada sesi, inisialisasi
        return this.initializeHistory(auditId, serverQuestions);
      }
      
      // Bandingkan dengan pertanyaan yang sudah ada
      const lastSession = currentSessions[currentSessions.length - 1];
      
      // Periksa apakah ada pertanyaan baru
      let hasNewQuestions = false;
      
      // Identifikasi pertanyaan baru
      const newQuestions = serverQuestions.filter(newQ => {
        // Anggap pertanyaan baru jika tidak ada yang cocok di sesi terakhir
        return !lastSession.questions.some(existingQ => 
          existingQ.id === newQ.id || 
          (existingQ.question === newQ.question && (!existingQ.answer || existingQ.answer === newQ.answer))
        );
      });
      
      // Jika ada pertanyaan baru, buat sesi baru
      if (newQuestions.length > 0) {
        hasNewQuestions = true;
        console.log(`Found ${newQuestions.length} new questions, creating new session`);
        
        // Buat sesi baru untuk pertanyaan baru
        const newSession = {
          timestamp: new Date().toISOString(),
          questions: JSON.parse(JSON.stringify(newQuestions)),
          answers: {}
        };
        
        // Tambahkan ke history
        this.questionHistory[auditId].push(newSession);
      }
      
      // Update jawaban di sesi yang ada jika ada perubahan
      serverQuestions.forEach(serverQ => {
        if (!serverQ.answer) return; // Skip jika tidak ada jawaban

        // Cari pertanyaan yang sama di semua sesi
        for (let i = this.questionHistory[auditId].length - 1; i >= 0; i--) {
          const session = this.questionHistory[auditId][i];
          
          // Cari pertanyaan yang cocok berdasarkan ID atau konten
          const matchIndex = session.questions.findIndex(q => 
            q.id === serverQ.id || q.question === serverQ.question
          );
          
          if (matchIndex !== -1) {
            // Jika pertanyaan cocok dan ada jawaban baru, update
            if (serverQ.answer && serverQ.answer !== session.questions[matchIndex].answer) {
              session.questions[matchIndex].answer = serverQ.answer;
              session.questions[matchIndex].answered_at = serverQ.answered_at || new Date().toISOString();
              hasNewQuestions = true; // Tandai ada perubahan
            }
            
            // Hanya update pertanyaan di sesi pertama yang cocok
            break;
          }
        }
      });
      
      // Simpan ke localStorage jika ada perubahan
      if (hasNewQuestions) {
        this.saveHistoryToLocalStorage(auditId);
      }
    },
    saveHistoryToLocalStorage(auditId) {
      try {
        if (!this.questionHistory[auditId]) {
          this.questionHistory[auditId] = [];
        }
        
        // Filter history untuk menghapus duplikat dan entry kosong
        const cleanHistory = this.questionHistory[auditId].filter(session => {
          return session && session.questions && session.questions.length > 0;
        });
        
        localStorage.setItem(`audit_${auditId}_history`, JSON.stringify(cleanHistory));
        console.log(`Riwayat untuk Audit #${auditId} disimpan ke localStorage dengan ${cleanHistory.length} sesi.`);
      } catch (error) {
        console.error(`Gagal menyimpan riwayat ke localStorage:`, error);
      }
    },
    saveBeforeUnload() {
      this.autoSaveAllDrafts();
      // Juga simpan semua history
      for (const auditId in this.questionHistory) {
        if (this.questionHistory[auditId] && this.questionHistory[auditId].length > 0) {
          this.saveHistoryToLocalStorage(auditId);
        }
      }
    },
    async completeAudit(audit) {
      try {
        if (!await this.checkAuth()) return;
        
        if (!confirm('Apakah Anda yakin ingin menandai audit ini sebagai selesai?')) {
          return;
        }
        
        // Set loading notification
        this.$q && this.$q.loading.show({
          message: 'Menyelesaikan audit...'
        });
        
        // Simpan status selesai audit di localStorage
        const completedAudits = JSON.parse(localStorage.getItem('completed_audits') || '[]');
        
        // Ambil riwayat pertanyaan dan jawaban jika ada
        let history = [];
        
        // Jika ada riwayat di questionHistory, gunakan itu
        if (this.questionHistory[audit.id] && Array.isArray(this.questionHistory[audit.id]) && this.questionHistory[audit.id].length > 0) {
          history = JSON.parse(JSON.stringify(this.questionHistory[audit.id]));
        } 
        // Jika ada jawaban tambahan tetapi tidak ada history, buat history dari jawaban tambahan
        else if (audit.additional_answers && Array.isArray(audit.additional_answers) && audit.additional_answers.length > 0) {
          const questions = audit.additional_answers.map((item, index) => ({
            id: item.id || index,
            question: item.question || item.additional_questions || 'Pertanyaan ' + (index + 1),
            answer: item.answer || null,
            created_at: item.created_at || new Date().toISOString(),
            answered_at: item.answered_at || null,
            question_number: item.question_number || (index + 1)
          }));
          
          if (questions.length > 0) {
            history = [{
              timestamp: new Date().toISOString(),
              questions: questions,
              answers: {}
            }];
          }
        }
        
        const auditData = {
          id: audit.id,
          auditee: audit.auditee?.username || "Tidak Diketahui",
          status: "completed",
          completed_at: new Date().toISOString(),
          pdf_path: audit.pdf_path,
          source: audit.source || 'audit_requests',
          history: history,
          additional_answers: audit.additional_answers || [],
          auditor_id: this.currentAuditorId // Tambahkan auditor_id
        };
        
        // Cek apakah audit sudah ada di daftar selesai
        const existingIndex = completedAudits.findIndex(a => a.id === audit.id);
        if (existingIndex >= 0) {
          // Update jika sudah ada
          completedAudits[existingIndex] = auditData;
        } else {
          // Tambahkan jika belum ada
          completedAudits.push(auditData);
        }
        
        // Simpan kembali ke localStorage
        localStorage.setItem('completed_audits', JSON.stringify(completedAudits));
        
        // Tunda sedikit untuk efek loading
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Sembunyikan loading
        this.$q && this.$q.loading.hide();
        
        // Tampilkan notifikasi sukses
        this.$q && this.$q.notify({
          message: 'Audit berhasil ditandai sebagai selesai',
          type: 'positive',
          timeout: 3000
        });
        
        // Pindahkan audit dari answeredAudits ke completedAudits di state
        this.answeredAudits = this.answeredAudits.filter(a => a.id !== audit.id);
        
        // Tambahkan ke variable baru jika belum ada
        if (!this.completedAudits) {
          this.completedAudits = [];
        }
        
        // Tambahkan ke completedAudits jika belum ada
        if (!this.completedAudits.some(a => a.id === audit.id)) {
          this.completedAudits.push(auditData);
        }
        
        // Inisialisasi toggle untuk history - gunakan spread operator
        this.showCompletedHistory = {
          ...this.showCompletedHistory,
          [audit.id]: false
        };
        
      } catch (error) {
        // Sembunyikan loading
        this.$q && this.$q.loading.hide();
        
        console.error('Gagal menyelesaikan audit:', error);
        
        this.$q && this.$q.notify({
          message: 'Gagal menyelesaikan audit: ' + (error.message || 'Terjadi kesalahan'),
          type: 'negative',
          timeout: 3000
        });
      }
    },
    // Tambahkan metode untuk memuat audit yang selesai dari localStorage
    loadCompletedAudits() {
      try {
        // Ambil data dari localStorage
        const completedAuditsString = localStorage.getItem('completed_audits');
        
        if (completedAuditsString) {
          // Parse data JSON
          const completedAuditsData = JSON.parse(completedAuditsString);
          
          // Pastikan data valid (array)
          if (Array.isArray(completedAuditsData)) {
            // Filter audit berdasarkan auditor_id
            this.completedAudits = completedAuditsData.filter(audit => {
              // Jika audit memiliki auditor_id, filter berdasarkan ID auditor saat ini
              // Jika tidak, tampilkan hanya jika ini adalah audit lama (backward compatibility)
              return !audit.auditor_id || audit.auditor_id === this.currentAuditorId;
            });
            console.log('Audit yang telah selesai berhasil dimuat (filtered by auditor):', this.completedAudits);
          } else {
            console.warn('Data audit yang selesai di localStorage bukan array:', completedAuditsData);
            this.completedAudits = [];
          }
        } else {
          console.log('Tidak ada data audit yang selesai di localStorage');
          this.completedAudits = [];
        }
      } catch (error) {
        console.error('Gagal memuat audit yang telah selesai dari localStorage:', error);
        this.completedAudits = [];
      }
    },
    // Tambahkan metode untuk menandai audit sebagai selesai
    markAuditAsCompleted(auditId, auditData) {
      try {
        auditId = auditId.toString();
        
        // Pastikan auditData memiliki semua properti yang diperlukan
        const completedAudit = {
          id: auditId,
          completed_at: auditData.completed_at || new Date().toISOString(),
          status: 'completed',
          audit_name: auditData.audit_name || `Audit #${auditId}`,
          auditor_id: this.currentAuditorId, // Tambahkan auditor_id
          ...auditData
        };
        
        // Cek apakah audit sudah ada di daftar yang selesai
        const existingIndex = this.completedAudits.findIndex(a => a.id.toString() === auditId);
        
        if (existingIndex !== -1) {
          // Update audit yang sudah ada menggunakan pendekatan reaktif
          const updatedCompletedAudits = [...this.completedAudits];
          updatedCompletedAudits[existingIndex] = completedAudit;
          this.completedAudits = updatedCompletedAudits;
        } else {
          // Tambahkan audit baru ke daftar yang selesai
          this.completedAudits = [...this.completedAudits, completedAudit];
        }
        
        // Simpan ke localStorage
        localStorage.setItem('completed_audits', JSON.stringify(this.completedAudits));
        
        console.log(`Audit ID ${auditId} berhasil ditandai sebagai selesai:`, completedAudit);
      } catch (error) {
        console.error(`Gagal menandai audit ID ${auditId} sebagai selesai:`, error);
      }
    },
    // Tambahkan metode untuk menghapus audit dari daftar selesai (jika diperlukan)
    removeCompletedAudit(auditId) {
      if (confirm('Apakah Anda yakin ingin menghapus riwayat audit ini?')) {
        auditId = auditId.toString();
        const initialLength = this.completedAudits.length;
        
        // Filter audit yang akan dihapus
        this.completedAudits = this.completedAudits.filter(a => a.id.toString() !== auditId);
        
        // Jika ada perubahan, simpan ke localStorage
        if (initialLength !== this.completedAudits.length) {
          localStorage.setItem('completed_audits', JSON.stringify(this.completedAudits));
          console.log(`Audit ID ${auditId} dihapus dari daftar selesai`);
          
          // Perbarui status
          this.updateCompletedAuditStatus();
          
          // Muat ulang daftar audit
          this.fetchPendingAudits();
          this.fetchAnsweredAudits();
          
          // Tampilkan notifikasi berhasil
          this.$q && this.$q.notify({
            message: 'Audit berhasil dihapus dari daftar',
            type: 'positive',
            timeout: 2000
          });
          
          return true;
        }
      }
      
      return false;
    },
    // Tambahkan metode untuk mengunduh hasil audit yang telah selesai
    async downloadCompletedAudit(audit) {
      // Gunakan metode yang sama seperti downloadAuditResult
      try {
        // Menggunakan endpoint yang sama dengan audit biasa karena ID dan path masih sama
        await this.downloadAuditResult(audit);
      } catch (error) {
        console.error('Gagal mengunduh hasil audit:', error);
        this.$q && this.$q.notify({
          message: 'Gagal mengunduh hasil audit: ' + (error.message || 'Terjadi kesalahan'),
          type: 'negative',
          timeout: 3000
        });
      }
    },
    toggleCompletedHistory(auditId) {
      // Gunakan spread operator untuk reaktivitas
      this.showCompletedHistory = {
        ...this.showCompletedHistory,
        [auditId]: !this.showCompletedHistory[auditId]
      };
    },
    hasCompletedHistory(audit) {
      return audit && audit.history && Array.isArray(audit.history) && 
        audit.history.length > 0 && 
        audit.history.some(session => session.questions && session.questions.length > 0);
    },
    hasCompletedHistoryOrAnswers(audit) {
      return (
        this.hasCompletedHistory(audit) || 
        (audit.additional_answers && Array.isArray(audit.additional_answers) && audit.additional_answers.length > 0)
      );
    },
    getAllQuestionsAndAnswers(audit) {
      let allSessions = [];
      
      // Jika ada riwayat, tambahkan ke sesi
      if (audit.history && Array.isArray(audit.history) && audit.history.length > 0) {
        allSessions = [...audit.history];
      }
      
      // Jika ada jawaban tambahan, konversi menjadi format sesi dan tambahkan
      if (audit.additional_answers && Array.isArray(audit.additional_answers) && audit.additional_answers.length > 0) {
        const questions = audit.additional_answers.map((item, index) => ({
          id: item.id || `add-${index}`,
          question: item.question || item.additional_questions || 'Pertanyaan ' + (index + 1),
          answer: item.answer || null,
          created_at: item.created_at || new Date().toISOString(),
          answered_at: item.answered_at || null,
          question_number: item.question_number || (index + 1)
        }));
        
        // Jika ini adalah jawaban tambahan tunggal, tambahkan ke sesi terakhir jika tidak ada
        if (questions.length > 0) {
          if (allSessions.length === 0) {
            allSessions.push({
              timestamp: new Date().toISOString(),
              questions: questions,
              answers: {}
            });
          } else {
            // Jika sudah ada sesi, tambahkan sebagai sesi baru
            allSessions.push({
              timestamp: new Date().toISOString(),
              questions: questions,
              answers: {}
            });
          }
        }
      }
      
      return allSessions;
    },
    // Tambahkan metode untuk mendapatkan ID audit yang sudah selesai
    getCompletedAuditIds() {
      try {
        const completedAudits = JSON.parse(localStorage.getItem('completed_audits') || '[]');
        return completedAudits.map(audit => audit.id.toString());
      } catch (error) {
        console.error('Gagal mengambil daftar audit selesai:', error);
        return [];
      }
    },
    // Tambahkan metode untuk memperbarui status audit selesai
    updateCompletedAuditStatus() {
      // Load completed audits saat aplikasi pertama kali dimuat
      this.loadCompletedAudits();
      
      // Simpan ID audit yang sudah selesai ke localStorage agar tetap tersimpan setelah refresh/login ulang
      const completedAuditIds = this.completedAudits.map(audit => audit.id.toString());
      localStorage.setItem('completed_audit_ids', JSON.stringify(completedAuditIds));
    },
    // Modifikasi submitAnswers agar menandai audit yang sudah dijawab sebagai selesai
    async submitAnswers(id) {
      try {
        this.loading = true;
        const token = localStorage.getItem("token");

        // Data yang akan dikirim
        const answersToSend = [];
        const questionIds = Object.keys(this.answers[id] || {});
        
        // Cek apakah ada jawaban
        if (questionIds.length === 0) {
          alert("Silakan isi jawaban terlebih dahulu");
          this.loading = false;
          return;
        }

        // Siapkan data jawaban
        for (const questionId of questionIds) {
          if (this.answers[id][questionId]) {
            answersToSend.push({
              question_id: questionId,
              answer: this.answers[id][questionId]
            });
          }
        }

        // Log data yang akan dikirim
        console.log("Jawaban yang akan dikirim:", answersToSend);

        // Kirim jawaban ke API
        const response = await axios.post(
          `http://127.0.0.1:8000/api/auth/submit-answers/${id}`,
          { answers: answersToSend },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        // Cek response
        console.log("Response dari API:", response);

        // Jika berhasil, tandai audit sebagai selesai
        if (response.status === 200 || response.status === 201) {
          // Tandai audit sebagai selesai
          this.markAuditAsCompleted(id, {
            id: id,
            completed_at: new Date().toISOString(),
            status: 'completed',
            audit_name: this.pendingAudits.find(a => a.id.toString() === id.toString())?.name || 
                        this.answeredAudits.find(a => a.id.toString() === id.toString())?.name || 
                        `Audit #${id}`
          });
          
          // Hapus jawaban draft dari localStorage
          this.removeDraftAnswers(id);
          
          // Hapus riwayat tanya jawab untuk audit ini dari localStorage
          this.removeHistoryForAudit(id);
          
          // Tampilkan pesan sukses
          this.$q && this.$q.notify({
            message: 'Jawaban berhasil dikirim dan audit ditandai sebagai selesai',
            type: 'positive',
            timeout: 2000
          });
          
          // Perbarui daftar audit
          this.fetchPendingAudits();
          this.fetchAnsweredAudits();
        }

        this.loading = false;
      } catch (error) {
        console.error("Error submitting answers:", error);
        this.loading = false;
        
        this.$q && this.$q.notify({
          message: 'Gagal mengirim jawaban: ' + (error.response?.data?.message || error.message || 'Terjadi kesalahan'),
          type: 'negative',
          timeout: 3000
        });
      }
    },

    // Fungsi untuk menghapus draft jawaban
    removeDraftAnswers(auditId) {
      auditId = auditId.toString();
      try {
        // Hapus jawaban draft dari localStorage
        localStorage.removeItem(`draft_answers_${auditId}`);
        console.log(`Draft jawaban untuk audit ID ${auditId} berhasil dihapus`);
      } catch (error) {
        console.error(`Gagal menghapus draft jawaban untuk audit ID ${auditId}:`, error);
      }
    },

    // Fungsi untuk menghapus riwayat tanya jawab untuk audit tertentu
    removeHistoryForAudit(auditId) {
      auditId = auditId.toString();
      try {
        // Hapus riwayat dari localStorage
        localStorage.removeItem(`qa_history_${auditId}`);
        console.log(`Riwayat tanya jawab untuk audit ID ${auditId} berhasil dihapus`);
      } catch (error) {
        console.error(`Gagal menghapus riwayat tanya jawab untuk audit ID ${auditId}:`, error);
      }
    },
    async loadRawAdditionalAnswers(auditId) {
      try {
        // Gunakan pendekatan fetch standar yang lebih sederhana
        const token = localStorage.getItem("token");
        const response = await fetch(`http://127.0.0.1:8000/api/auth/audit-requests/${auditId}/additional-answers`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        // Ambil respons sebagai teks mentah terlebih dahulu
        const responseText = await response.text();
        console.log("Raw response:", responseText);
        
        // Parse JSON secara manual
        try {
          const data = JSON.parse(responseText);
          console.log("Parsed data:", data);
          
          // Proses data untuk mengatasi masalah tanda baca
          if (Array.isArray(data)) {
            return data.map(item => {
              // Pastikan answer adalah string
              if (item.answer) {
                // Simpan jawaban asli apa adanya
                item._raw_answer = item.answer;
              }
              return item;
            });
          }
          return data;
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError);
          
          // Coba ekstrak data dengan regex jika parsing gagal
          const jsonObjects = [];
          let bracketCount = 0;
          let startPos = -1;
          
          // Cari objek JSON secara manual
          for (let i = 0; i < responseText.length; i++) {
            if (responseText[i] === '{' && bracketCount === 0) {
              startPos = i;
              bracketCount++;
            } else if (responseText[i] === '{') {
              bracketCount++;
            } else if (responseText[i] === '}') {
              bracketCount--;
              if (bracketCount === 0 && startPos !== -1) {
                try {
                  const jsonStr = responseText.substring(startPos, i + 1);
                  const obj = JSON.parse(jsonStr);
                  jsonObjects.push(obj);
                } catch (e) {
                  console.warn("Couldn't parse object:", e);
                }
                startPos = -1;
              }
            }
          }
          
          if (jsonObjects.length > 0) {
            console.log("Manually extracted objects:", jsonObjects);
            return jsonObjects;
          }
          
          return [];
        }
      } catch (error) {
        console.error("Error in loadRawAdditionalAnswers:", error);
        throw error;
      }
    },
    async processAPIResponse(response) {
      // Fungsi ini memperbaiki struktur data dari API
      try {
        // Jika response sudah berbentuk objek, gunakan langsung
        if (typeof response === 'object' && !Array.isArray(response)) {
          console.log("API response already an object:", response);
          return response;
        }
        
        // Jika response berbentuk array, pastikan strukturnya benar
        if (Array.isArray(response)) {
          console.log("Processing array response with", response.length, "items");
          
          // Perbaiki format jawaban
          const fixed = response.map(item => {
            if (!item) return null;
            
            // Buat objek baru dengan properti yang sama
            const result = { ...item };
            
            // Pastikan answer adalah string yang benar
            if (item.answer) {
              // Jika jawaban berbentuk JSON string, coba parse
              if (typeof item.answer === 'string' && 
                  (item.answer.startsWith('{') || item.answer.startsWith('['))) {
                try {
                  const parsed = JSON.parse(item.answer);
                  result._json_answer = parsed; // Simpan versi JSON untuk jaga-jaga
                  result.answer = item.answer; // Tetap pertahankan versi string asli
                } catch (e) {
                  console.log("Answer looks like JSON but isn't parseable:", item.answer);
                }
              }
              
              // Beri tanda jika jawaban mungkin terpotong
              if (typeof item.answer === 'string' && 
                 [',', '.', '!', '?', ';', ':'].some(mark => item.answer.endsWith(mark)) &&
                 item.answer.length < 100) {
                console.warn("Potentially truncated answer detected:", item.answer);
                result._potentially_truncated = true;
              }
            }
            
            return result;
          }).filter(Boolean); // Hapus null items
          
          return fixed;
        }
        
        // Jika response adalah string, coba parse sebagai JSON
        if (typeof response === 'string') {
          try {
            return JSON.parse(response);
          } catch (e) {
            console.error("Failed to parse response string as JSON:", e);
            return response;
          }
        }
        
        // Fallback, kembalikan apa adanya
        return response;
      } catch (error) {
        console.error("Error processing API response:", error);
        return response; // Kembalikan respons asli jika terjadi error
      }
    },
    clearHistory(auditId) {
      if (confirm('Apakah Anda yakin ingin menghapus semua riwayat pertanyaan dan jawaban ini?')) {
        // Hapus riwayat dari array dan localStorage
        // Gunakan Vue.set atau pendekatan reaktif langsung
        this.questionHistory = {
          ...this.questionHistory,
          [auditId]: []
        };
        localStorage.removeItem(`audit_${auditId}_history`);
        
        // Tampilkan notifikasi
        this.$q && this.$q.notify({
          message: 'Riwayat berhasil dihapus',
          type: 'positive',
          timeout: 2000
        });
      }
    },
    clearCompletedHistory(auditId) {
      if (confirm('Apakah Anda yakin ingin menghapus semua riwayat pertanyaan dan jawaban ini?')) {
        // Cari audit yang sesuai di completedAudits
        const auditIndex = this.completedAudits.findIndex(a => a.id.toString() === auditId.toString());
        
        if (auditIndex !== -1) {
          // Buat salinan audit tanpa riwayat
          const updatedAudit = {...this.completedAudits[auditIndex]};
          updatedAudit.history = [];
          
          // Update completedAudits array dengan pendekatan reaktif
          const newCompletedAudits = [...this.completedAudits];
          newCompletedAudits[auditIndex] = updatedAudit;
          this.completedAudits = newCompletedAudits;
          
          // Update localStorage
          localStorage.setItem('completed_audits', JSON.stringify(this.completedAudits));
          
          // Tampilkan notifikasi
          this.$q && this.$q.notify({
            message: 'Riwayat berhasil dihapus',
            type: 'positive',
            timeout: 2000
          });
        }
      }
    },
    // Tambahkan method baru untuk migrasi data lama
    migrateCompletedAudits() {
      try {
        const completedAuditsString = localStorage.getItem('completed_audits');
        if (completedAuditsString) {
          const completedAuditsData = JSON.parse(completedAuditsString);
          
          if (Array.isArray(completedAuditsData)) {
            let hasChanges = false;
            
            // Tambahkan auditor_id ke audit yang belum memilikinya
            const updatedAudits = completedAuditsData.map(audit => {
              if (!audit.auditor_id) {
                hasChanges = true;
                return {
                  ...audit,
                  auditor_id: this.currentAuditorId
                };
              }
              return audit;
            });
            
            // Simpan perubahan jika ada
            if (hasChanges) {
              localStorage.setItem('completed_audits', JSON.stringify(updatedAudits));
              console.log('Data audit yang selesai berhasil dimigrasi dengan auditor_id');
            }
          }
        }
      } catch (error) {
        console.error('Gagal melakukan migrasi data audit:', error);
      }
    },
  },
  async mounted() {
    if (await this.checkAuth()) {
      // Migrasi data audit lama terlebih dahulu
      this.migrateCompletedAudits();
      
      // Load completed audits
      this.loadCompletedAudits();
      
      // Perbarui status audit selesai
      this.updateCompletedAuditStatus();
      
      // Fetch data dengan filter yang sudah diperbarui
      await this.fetchPendingAudits();
      await this.fetchAnsweredAudits();
      
      this.startPollingForAnswers();
    } else {
      alert("Anda harus login sebagai auditor untuk mengakses halaman ini");
      // Redirect to login if needed
      // this.$router.push('/login');
    }
  },
  beforeUnmount() {
    this.stopPollingForAnswers();
    
    // Bersihkan timer auto-save
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    // Lepas event listener
    window.removeEventListener('beforeunload', this.saveBeforeUnload);
    
    // Simpan draft jawaban terakhir kali
    this.autoSaveAllDrafts();
  },
  computed: {
    hasSignedNDA() {
      return (audit) => {
        // Log untuk debugging
        console.log(`Checking NDA status for Audit ID ${audit.id}:`, {
          signed_nda: audit.signed_nda,
          nda_document: audit.nda_document,
          signed_nda_type: typeof audit.signed_nda,
          nda_document_type: typeof audit.nda_document
        });
        
        // Periksa apakah nilai tidak null dan tidak undefined
        if (audit.signed_nda === null || audit.signed_nda === undefined) {
          return false;
        }
        
        if (audit.nda_document === null || audit.nda_document === undefined) {
          return false;
        }

        // Periksa apakah ada nilai string yang valid
        const hasSignedNDA = typeof audit.signed_nda === 'string' && audit.signed_nda.trim() !== '';
        const hasNDADocument = typeof audit.nda_document === 'string' && audit.nda_document.trim() !== '';
        
        return hasSignedNDA || hasNDADocument;
      }
    }
  },
};
</script>

<style scoped>
.audit-results {
  padding: 2rem;
  background: linear-gradient(to right bottom, #ffffff, #f8f9fe);
  border-radius: 20px;
  min-height: calc(100vh - 4rem);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

.header:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.title-section {
  flex: 1;
}

.audit-title {
  margin: 0;
  background: linear-gradient(45deg, #1e3c72 0%, #2a5298 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 1rem 0 0 0;
  color: #64748b;
  font-size: 1.1rem;
  line-height: 1.6;
}

.logo-section {
  margin-left: 2rem;
}

.logo {
  height: 120px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 5px 10px rgba(0,0,0,0.1));
  transition: all 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.audit-table-container {
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  overflow: hidden;
  transition: all 0.3s ease;
}

.audit-table-container:hover {
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.audit-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.audit-table th {
  background: linear-gradient(to right, #f8f9fa, #ffffff);
  color: #475569;
  font-size: 0.75rem;
  padding: 1rem 1.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
  border-bottom: 2px solid #e2e8f0;
}

.audit-table td {
  padding: 1.25rem 1.5rem;
  vertical-align: middle;
  border-bottom: 1px solid #e2e8f0;
  color: #334155;
  font-size: 0.875rem;
}

.audit-row {
  transition: all 0.2s ease;
}

.audit-row:hover {
  background-color: #f8fafc;
  transform: translateY(-2px);
}

.id-badge {
  background: #f1f5f9;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.status-badge.pending {
  background: linear-gradient(45deg, #f2994a, #f2c94c);
  color: white;
}

.status-badge.answered {
  background: linear-gradient(45deg, #11998e, #38ef7d);
  color: white;
}

.file-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-download, .btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.btn-download {
  background: linear-gradient(45deg, #2193b0, #6dd5ed);
  color: white;
}

.btn-download:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}

.btn-upload {
  background: linear-gradient(45deg, #11998e, #38ef7d);
  color: white;
}

.btn-upload:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}

.btn-upload:disabled {
  background: linear-gradient(45deg, #cbd5e0, #e2e8f0);
  cursor: not-allowed;
  transform: none;
}

.custom-file-upload {
  display: inline-block;
  padding: 0.75rem 1rem;
  background: linear-gradient(45deg, #4b6cb7, #182848);
  color: white;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.custom-file-upload:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}

.custom-file-upload input[type="file"] {
  display: none;
}

.file-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #10b981;
  font-size: 0.875rem;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn-approve, .btn-reject {
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.btn-approve {
  background: linear-gradient(45deg, #11998e, #38ef7d);
  color: white;
}

.btn-approve:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}

.btn-reject {
  background: linear-gradient(45deg, #eb3349, #f45c43);
  color: white;
}

.btn-reject:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}

.qa-section {
  max-width: 300px;
}

.qa-header {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.qa-container {
  max-height: 350px;
  overflow-y: auto;
  padding-right: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
}

.qa-item {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
  border-left: 3px solid #3b82f6;
}

.qa-item:last-child {
  margin-bottom: 0;
}

.qa-item-number {
  background: #3b82f6;
  color: white;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  display: inline-block;
  margin-bottom: 0.75rem;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.question-label, .answer-label {
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
}

.answer-label {
  color: #10b981;
}

.form-label {
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.qa-question {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.question-icon {
  color: #3b82f6;
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.question-content {
  flex: 1;
}

.question-text {
  color: #334155;
  font-weight: 500;
  margin-bottom: 0.25rem;
  line-height: 1.5;
}

.question-meta {
  font-size: 0.75rem;
  color: #94a3b8;
}

.qa-answer {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #e2e8f0;
}

.answer-icon {
  color: #10b981;
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.answer-content {
  flex: 1;
}

.answer-text {
  color: #475569;
  margin-bottom: 0.25rem;
  line-height: 1.5;
}

.answer-meta {
  font-size: 0.75rem;
  color: #94a3b8;
}

.qa-no-answer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #f59e0b;
  font-style: italic;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #e2e8f0;
}

.audit-status, .qa-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.audit-status.pending, .qa-status.pending {
  color: #f59e0b;
}

.text-success {
  color: #10b981;
}

i {
  font-size: 1rem;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    text-align: center;
  }

  .logo-section {
    margin: 1.5rem 0 0 0;
  }

  .audit-table {
    display: block;
    overflow-x: auto;
  }

  .action-buttons {
    flex-direction: column;
  }
}

.question-form {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.question-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  resize: vertical;
  transition: all 0.2s ease;
}

.question-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-question {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(45deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  justify-content: center;
}

.btn-question:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}

.btn-question:disabled {
  background: linear-gradient(45deg, #cbd5e0, #e2e8f0);
  cursor: not-allowed;
  transform: none;
}

.answer-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  resize: vertical;
  transition: all 0.2s ease;
}

.answer-textarea:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.qa-answer-form {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #e2e8f0;
}

.answer-form-content {
  flex: 1;
}

.submit-answers-section {
  margin-top: 1.5rem;
  text-align: right;
}

.btn-submit-answers {
  background: linear-gradient(45deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-submit-answers:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}

.history-section {
  border-radius: 12px;
  background-color: #f8fafc;
  padding: 0;
  margin-top: 1.5rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.history-section:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: linear-gradient(to right, #f1f5f9, #f8fafc);
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.history-header-left {
  display: flex;
  align-items: center;
  cursor: pointer;
  flex: 1;
}

.history-header:hover {
  background: linear-gradient(to right, #e2e8f0, #f1f5f9);
}

.history-header i {
  color: #3b82f6;
  margin-right: 0.75rem;
  transition: transform 0.2s ease;
}

.history-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
}

.history-content {
  padding: 1rem;
  max-height: 500px;
  overflow-y: auto;
}

.history-session {
  margin-bottom: 1.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.history-session:last-child {
  margin-bottom: 0;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.session-badge {
  background-color: #3b82f6;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.session-date {
  font-size: 0.75rem;
  color: #64748b;
}

.session-content {
  padding: 1rem;
}

.history-item {
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
}

.history-item:last-child {
  margin-bottom: 0;
}

.history-q, .history-a {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.history-icon {
  font-size: 1rem;
  margin-right: 0.75rem;
  margin-top: 0.25rem;
}

.question-color {
  color: #3b82f6;
}

.answer-color {
  color: #10b981;
}

.history-q-content, .history-a-content {
  flex: 1;
}

.history-q-label, .history-a-label {
  font-weight: 600;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
}

.history-q-label {
  color: #3b82f6;
}

.history-a-label {
  color: #10b981;
}

.history-q-text, .history-a-text {
  color: #334155;
  line-height: 1.5;
}

.history-no-answer {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  font-style: italic;
  color: #94a3b8;
  background-color: #f1f5f9;
  border-radius: 4px;
}

.history-no-answer i {
  color: #ef4444;
  margin-right: 0.5rem;
}

.qa-no-answer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #f59e0b;
  font-style: italic;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #e2e8f0;
}

.btn-complete {
  background: linear-gradient(45deg, #6366f1, #4f46e5);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  margin-top: 0.5rem;
  width: 100%;
}

.btn-complete:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}

.completed-audits-container {
  margin-top: 2rem;
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
}

.section-title {
  color: #334155;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-title i {
  color: #4f46e5;
}

.completed-audits-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.completed-audit-card {
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
}

.completed-audit-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.completed-header {
  background: linear-gradient(45deg, #4f46e5, #6366f1);
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.completed-id {
  font-weight: 700;
  font-size: 1.25rem;
}

.completed-date {
  font-size: 0.875rem;
  opacity: 0.9;
}

.completed-body {
  padding: 1.25rem;
}

.completed-info {
  margin-bottom: 1.25rem;
}

.completed-info > div {
  margin-bottom: 0.5rem;
}

.status-badge.completed {
  background: linear-gradient(45deg, #4f46e5, #6366f1);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  display: inline-block;
}

.completed-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-remove {
  background: linear-gradient(45deg, #ef4444, #f87171);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.btn-remove:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}

.completed-qa-section {
  margin: 1rem 0;
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}

.completed-qa-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(to right, #f1f5f9, #f8fafc);
  border: 1px solid #e2e8f0;
  border-radius: 8px 8px 0 0;
  transition: all 0.2s ease;
  margin-bottom: 0;
}

.completed-qa-toggle-left {
  display: flex;
  align-items: center;
  cursor: pointer;
  flex: 1;
}

.completed-qa-toggle:hover {
  background: linear-gradient(to right, #e2e8f0, #f1f5f9);
}

.completed-qa-toggle i {
  color: #6366f1;
  margin-right: 0.75rem;
  transition: transform 0.2s ease;
}

.completed-qa-toggle span {
  font-weight: 600;
  color: #334155;
}

.completed-qa-content {
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 8px 8px;
  padding: 1rem;
  background-color: white;
}

/* Animasi tambahan untuk toggle */
.fa-chevron-down {
  transform: rotate(0deg);
}

.fa-chevron-right {
  transform: rotate(0deg);
}

/* Styling untuk bagian audit yang sudah selesai */
.completed-qa-session {
  margin-bottom: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.completed-qa-session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.completed-session-badge {
  background-color: #6366f1;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
}

.completed-session-date {
  font-size: 0.75rem;
  color: #64748b;
}

.completed-qa-item {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.completed-qa-item:last-child {
  border-bottom: none;
}

.completed-qa-question, .completed-qa-answer {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
}

.completed-qa-question {
  background-color: #f8fafc;
  border-radius: 6px;
}

.completed-qa-answer {
  background-color: #f0fdf4;
  border-radius: 6px;
  margin-left: 1rem;
}

.completed-qa-no-answer {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  margin-left: 1rem;
  font-style: italic;
  color: #94a3b8;
  background-color: #f1f5f9;
  border-radius: 4px;
}

.btn-clear-history {
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
}

.btn-clear-history:hover {
  background-color: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);
}

.btn-clear-history.small {
  width: 28px;
  height: 28px;
  font-size: 0.75rem;
}
</style>

