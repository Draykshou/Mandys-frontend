<script setup lang="ts">

import { CircleUser } from 'lucide-vue-next'
</script>

<template>
    <header class="flex justify-between items-center p-4 bg-(--color-primary-600) shadow-md text-white">
      <span>Mandy's</span>
      <div class="flex items-center gap-8">
        <div>
          <span>Carlos Medina</span>
          <p>Gerente de operaciones</p>
        </div>
        <CircleUser :size="68" class="text-white" />
      </div>
    </header>
</template>