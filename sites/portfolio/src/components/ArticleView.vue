<script setup>
import { useRoute } from 'vue-router'
import { getPost } from '../lib/posts' // use '@/lib/posts' if you prefer the alias

const route = useRoute()
const post = getPost(route.params.category, route.params.slug)
</script>

<template>
  <section class="mx-auto max-w-[800px] px-4">
    <article v-if="post">
      <header class="mb-6">
        <h1 class="font-serif text-2xl leading-tight">{{ post.title }}</h1>
        <time v-if="post.dateISO" :datetime="post.dateISO" class="block text-lg opacity-70 mt-1">
          {{ post.date.toLocaleDateString() }}
        </time>
      </header>

      <!-- Render the markdown as HTML -->
      <div class="mt-6 content" v-html="post.html"></div>
    </article>

    <p v-else class="opacity-70">Not found.</p>
  </section>
</template>

<style scoped>
.content p { margin: 0.75rem 0; line-height: 1.8; }
.content h2, .content h3 { margin: 1.25rem 0 0.5rem; font-weight: 600; }
.content ul, .content ol { margin: 0.75rem 0 0.75rem 1.25rem; }
code { padding: 0.1rem 0.25rem; background: rgba(0,0,0,.06); border-radius: 2px; }
pre { padding: 0.8rem; background: rgba(0,0,0,.06); border-radius: 4px; overflow:auto; }
</style>
