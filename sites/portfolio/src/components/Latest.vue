<script setup>
import { posts } from '@/lib/posts' // or '../lib/posts' if you don't use the @ alias
</script>

<template>
  <section class="mx-auto max-w-[1120px] px-4">
    <h2 class="sr-only">Latest</h2>

    <div class="relative">
      <!-- vertical separator (only when 2 columns) -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 hidden md:block
               [background:linear-gradient(to_right,
                 transparent,transparent_calc(50%-0.5px),
                 rgba(0,0,0,.14)_calc(50%-0.5px),rgba(0,0,0,.14)_calc(50%+0.5px),
                 transparent_calc(50%+0.5px)
               )]">
      </div>

      <!-- 1 col on small, 2 cols on md+ -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <RouterLink
          v-for="p in posts"
          :key="p.route"
          :to="p.route"
          class="block group"
          :aria-label="p.title"
        >
          <article
            class="rounded-sm border border-black/10 bg-[rgba(246,236,213,.94)] p-5
                  shadow-[inset_0_1px_0_rgba(0,0,0,.04)] transition-shadow
                  group-hover:shadow-md"
          >
            <h3 class="font-serif text-xl leading-snug">{{ p.title }}</h3>
            <time v-if="p.dateISO" :datetime="p.dateISO" class="block text-xs opacity-70 mt-1">
              {{ p.date.toLocaleDateString() }}
            </time>
            <p class="mt-3 text-[15px] leading-7 opacity-90">
              {{ p.preview }}
            </p>
            <span class="mt-3 inline-block text-sm underline opacity-80">Read more →</span>
          </article>
        </RouterLink>
      </div>
    </div>

    <p v-if="!posts.length" class="mt-10 text-center opacity-70">
      No articles found in <code>src/articles/</code>.
    </p>
  </section>
</template>
