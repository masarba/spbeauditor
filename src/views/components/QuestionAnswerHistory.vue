<template>
  <div class="qa-history-component">
    <h3 class="section-title" v-if="title">{{ title }}</h3>
    
    <!-- Tampilan utama pertanyaan dan jawaban -->
    <div class="qa-main-container" v-if="questionAnswers && questionAnswers.length > 0">
      <div v-for="(item, index) in questionAnswers" :key="index" class="qa-item">
        <div class="qa-item-number">
          Nomor {{ item.question_number || index + 1 }}
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
            <div class="answer-text">{{ item.answer }}</div>
            <div class="answer-meta">Dijawab: {{ formatDate(item.answered_at) }}</div>
          </div>
        </div>
        
        <!-- Tampilkan form input jika editMode aktif dan belum ada jawaban -->
        <div class="qa-answer-form" v-else-if="editMode">
          <i class="fas fa-reply answer-icon"></i>
          <div class="answer-form-content">
            <div class="answer-label">Jawaban Anda:</div>
            <textarea 
              v-model="draftAnswers[item.id]" 
              class="answer-textarea" 
              placeholder="Tulis jawaban Anda..."
              rows="2"
            ></textarea>
          </div>
        </div>
        
        <div class="qa-no-answer" v-else>
          <i class="fas fa-clock"></i>
          <span>Belum dijawab</span>
        </div>
      </div>
      
      <!-- Tombol submit jawaban jika ada draft -->
      <div class="submit-answers-section" v-if="editMode && hasDraftAnswers">
        <button 
          @click="submitAnswers" 
          class="btn-submit-answers"
        >
          <i class="fas fa-paper-plane"></i> Kirim Semua Jawaban
        </button>
      </div>
    </div>
    
    <!-- Tampilkan pesan jika tidak ada pertanyaan -->
    <div v-else class="qa-empty-state">
      <i class="fas fa-question-circle"></i>
      <span>Belum ada pertanyaan</span>
    </div>
    
    <!-- Bagian riwayat -->
    <div class="history-section mt-4" v-if="historyData && historyData.length > 0">
      <div class="history-header" @click="toggleHistory">
        <i class="fas" :class="showHistory ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
        <h5>Riwayat Pertanyaan dan Jawaban</h5>
      </div>
      
      <div class="history-content" v-if="showHistory">
        <div 
          v-for="(session, sessionIndex) in historyData" 
          :key="'session-'+sessionIndex" 
          class="history-session"
        >
          <div class="history-session-header">
            <span class="history-session-title">Sesi #{{ sessionIndex + 1 }}</span>
            <span class="history-session-date">{{ formatDate(session.timestamp) }}</span>
          </div>
          
          <div class="history-session-content">
            <div 
              v-for="(item, itemIndex) in session.questions" 
              :key="'history-'+sessionIndex+'-'+itemIndex" 
              class="history-qa-item"
            >
              <div class="history-question">
                <span class="history-q-label">P{{ itemIndex + 1 }}:</span>
                <span class="history-q-text">{{ item.question }}</span>
              </div>
              
              <div 
                v-if="item.answer || (session.answers && session.answers[item.id])" 
                class="history-answer"
              >
                <span class="history-a-label">J:</span>
                <span class="history-a-text">{{ item.answer || session.answers[item.id] }}</span>
              </div>
              <div v-else class="history-no-answer">Tidak dijawab</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Form tambah pertanyaan jika enableQuestionForm aktif -->
    <div class="question-form mt-3" v-if="enableQuestionForm">
      <div class="form-label">Tambahkan Pertanyaan Baru:</div>
      <textarea 
        v-model="newQuestion" 
        class="form-control question-textarea" 
        placeholder="Tulis pertanyaan tambahan..."
        rows="2"
      ></textarea>
      <button 
        @click="submitQuestion" 
        class="btn-question mt-2"
        :disabled="!newQuestion"
      >
        <i class="fas fa-paper-plane"></i> Kirim Pertanyaan
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    // Judul bagian
    title: {
      type: String,
      default: 'Pertanyaan & Jawaban'
    },
    // Data pertanyaan dan jawaban untuk ditampilkan
    questionAnswers: {
      type: Array,
      default: () => []
    },
    // Data riwayat pertanyaan dan jawaban
    historyData: {
      type: Array,
      default: () => []
    },
    // Apakah user dapat menambahkan jawaban
    editMode: {
      type: Boolean,
      default: false
    },
    // Apakah user dapat menambahkan pertanyaan baru
    enableQuestionForm: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      draftAnswers: {},
      newQuestion: '',
      showHistory: false
    };
  },
  computed: {
    hasDraftAnswers() {
      return Object.keys(this.draftAnswers).length > 0;
    }
  },
  methods: {
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
    submitAnswers() {
      this.$emit('submit-answers', this.draftAnswers);
      this.draftAnswers = {}; // Reset draft setelah submit
    },
    submitQuestion() {
      if (!this.newQuestion.trim()) return;
      
      this.$emit('submit-question', this.newQuestion);
      this.newQuestion = ''; // Reset input setelah submit
    },
    toggleHistory() {
      this.showHistory = !this.showHistory;
    }
  }
};
</script>

<style scoped>
.qa-history-component {
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.qa-history-component:hover {
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #334155;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.75rem;
}

.qa-main-container {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 0.5rem;
  margin-bottom: 1rem;
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

.qa-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
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

.question-label, .answer-label {
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
}

.answer-label {
  color: #10b981;
}

.question-text {
  color: #334155;
  font-weight: 500;
  margin-bottom: 0.25rem;
  line-height: 1.5;
}

.question-meta, .answer-meta {
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

.qa-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  color: #94a3b8;
  text-align: center;
}

.qa-empty-state i {
  font-size: 2.5rem;
  color: #cbd5e1;
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
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
  margin-top: 1.5rem;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.history-header:hover {
  background: #f8fafc;
}

.history-header h5 {
  margin: 0;
  font-size: 1rem;
  color: #334155;
}

.history-content {
  margin-top: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.history-session {
  background: #f8fafc;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  border-left: 3px solid #64748b;
}

.history-session-header {
  display: flex;
  justify-content: space-between;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.history-session-title {
  font-weight: 600;
  color: #334155;
}

.history-session-date {
  font-size: 0.75rem;
  color: #64748b;
}

.history-qa-item {
  padding: 0.5rem 0;
  border-bottom: 1px dashed #e2e8f0;
}

.history-qa-item:last-child {
  border-bottom: none;
}

.history-question, .history-answer {
  display: flex;
  margin-bottom: 0.25rem;
}

.history-q-label, .history-a-label {
  flex-shrink: 0;
  font-weight: 600;
  margin-right: 0.5rem;
  min-width: 1.5rem;
}

.history-q-label {
  color: #3b82f6;
}

.history-a-label {
  color: #10b981;
}

.history-q-text, .history-a-text {
  flex: 1;
  font-size: 0.875rem;
}

.history-no-answer {
  font-style: italic;
  color: #94a3b8;
  font-size: 0.75rem;
  margin-left: 2rem;
}

.question-form {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.form-label {
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
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

/* Utility class */
.mt-4 {
  margin-top: 1.5rem;
}

.mt-3 {
  margin-top: 1rem;
}

.mt-2 {
  margin-top: 0.5rem;
}
</style> 