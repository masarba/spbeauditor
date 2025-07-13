<template>
  <div class="example-container">
    <h2 class="page-title">Contoh Penggunaan Komponen Riwayat Q&A</h2>
    
    <!-- Menggunakan komponen QuestionAnswerHistory -->
    <QuestionAnswerHistory 
      :questionAnswers="currentQuestions" 
      :historyData="questionHistory"
      :editMode="isAuditor"
      :enableQuestionForm="isClient"
      title="Pertanyaan & Jawaban Audit"
      @submit-answers="handleSubmitAnswers"
      @submit-question="handleSubmitQuestion"
    />
  </div>
</template>

<script>
import QuestionAnswerHistory from './QuestionAnswerHistory.vue';

export default {
  components: {
    QuestionAnswerHistory
  },
  data() {
    return {
      // Mode untuk contoh
      isAuditor: true,
      isClient: true,
      
      // Data pertanyaan saat ini
      currentQuestions: [
        {
          id: 1,
          question_number: 1,
          question: "Apakah perusahaan memiliki kebijakan keamanan informasi yang terdokumentasi?",
          created_at: "2023-05-15T09:30:00",
          answer: "Ya, perusahaan memiliki kebijakan keamanan informasi yang diperbarui setiap tahun.",
          answered_at: "2023-05-16T14:20:00"
        },
        {
          id: 2,
          question_number: 2,
          question: "Bagaimana proses backup data dilakukan dan berapa frekuensinya?",
          created_at: "2023-05-15T09:35:00",
          // Tidak ada jawaban untuk contoh input
        },
        {
          id: 3,
          question_number: 3,
          question: "Apakah ada pengendalian akses fisik ke ruang server?",
          created_at: "2023-05-15T09:40:00",
          answer: "Ya, ruang server dilengkapi dengan sistem kartu akses dan CCTV 24 jam.",
          answered_at: "2023-05-16T15:10:00"
        }
      ],
      
      // Data riwayat pertanyaan & jawaban
      questionHistory: [
        {
          timestamp: "2023-04-10T10:00:00",
          questions: [
            {
              id: 101,
              question: "Siapa yang bertanggung jawab atas keamanan informasi?",
              answer: "Kepala Departemen IT - Bapak Surya Wijaya"
            },
            {
              id: 102,
              question: "Berapa sering pelatihan keamanan informasi diadakan?",
              answer: "Setiap 6 bulan sekali untuk seluruh karyawan"
            }
          ]
        },
        {
          timestamp: "2023-03-05T14:30:00",
          questions: [
            {
              id: 201,
              question: "Apa strategi disaster recovery yang diterapkan?",
              answer: "Perusahaan memiliki data center sekunder dengan replikasi data real-time"
            },
            {
              id: 202,
              question: "Berapa lama retensi log sistem?",
              answer: "Minimal 1 tahun untuk semua sistem kritis"
            },
            {
              id: 203,
              question: "Apakah ada pengujian penetrasi rutin?",
              // Tidak ada jawaban untuk menunjukkan handling pertanyaan tanpa jawaban
            }
          ]
        }
      ]
    };
  },
  methods: {
    handleSubmitAnswers(answers) {
      console.log('Jawaban yang disubmit:', answers);
      
      // Contoh implementasi: Update pertanyaan dengan jawaban baru
      this.currentQuestions = this.currentQuestions.map(question => {
        if (answers[question.id]) {
          return {
            ...question,
            answer: answers[question.id],
            answered_at: new Date().toISOString()
          };
        }
        return question;
      });
      
      // Di sini Anda akan melakukan request API untuk menyimpan jawaban
      // axios.post('/api/answers', { answers });
      
      // Tampilkan notifikasi
      alert('Jawaban berhasil dikirim!');
    },
    
    handleSubmitQuestion(questionText) {
      console.log('Pertanyaan yang disubmit:', questionText);
      
      // Contoh implementasi: Tambahkan pertanyaan baru
      const newQuestion = {
        id: Date.now(), // Penggunaan timestamp sebagai ID sementara
        question_number: this.currentQuestions.length + 1,
        question: questionText,
        created_at: new Date().toISOString()
        // Belum ada answer dan answered_at
      };
      
      this.currentQuestions.push(newQuestion);
      
      // Di sini Anda akan melakukan request API untuk menyimpan pertanyaan
      // axios.post('/api/questions', { question: questionText });
      
      // Tampilkan notifikasi
      alert('Pertanyaan berhasil dikirim!');
    }
  }
};
</script>

<style scoped>
.example-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.page-title {
  color: #1e293b;
  margin-bottom: 2rem;
  font-size: 1.75rem;
  text-align: center;
  font-weight: 700;
}

/* Toggle controls untuk contoh */
.toggle-controls {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.toggle-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-label {
  font-weight: 500;
  color: #475569;
}
</style> 