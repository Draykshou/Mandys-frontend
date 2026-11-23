<script setup lang="ts">
defineProps<{
    image: string | null
}>()

const emit = defineEmits<{
    close: []
}>()

function closeModal() {
    emit('close')
}
</script>

<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        @click="closeModal">
        <div class="relative w-full max-w-lg" @click.stop>
            <!-- Imagen disponible -->
            <img v-if="image" :src="image" alt="Imagen ampliada" class="w-full rounded-2xl shadow-2xl" />

            <!-- Sin imagen -->
            <div v-else class="flex aspect-video w-full flex-col items-center justify-center gap-3
             rounded-2xl bg-neutral-200 text-neutral-500 shadow-2xl">
                <ImageOff :size="48" />
                <span class="text-lg font-medium">Sin imagen disponible</span>
            </div>

            <button type="button"
                class="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xl text-white hover:bg-black"
                @click="closeModal">
                x
            </button>
        </div>
    </div>
</template>
