<script setup>
import Chart from 'chart.js/auto';
import { onMounted } from 'vue';
const data = {
  labels: [
    'Red',
    'Blue',
    'Yellow'
  ],
  datasets: [{
    label: 'My First Dataset',
    data: [300, 50, 100],
    backgroundColor: [
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 205, 86)'
    ],
    hoverOffset: 4
  }]
};
const config = {
  type: 'doughnut',
  data: data,
};
onMounted(()=> {
    new Chart(document.getElementById('ChartSeverity'),config);
})
</script>
<template>
    <div>
        <canvas id="ChartSeverity" width="auto" height="auto"></canvas>
    </div>
</template>


