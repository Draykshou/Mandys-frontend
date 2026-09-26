import { onMounted } from 'vue'
import { animate } from 'animejs'
import type { JSAnimation } from 'animejs'

export function useAnime(targets: any, params: any, autoPlay: boolean = true) {
  let animation: JSAnimation | null = null

  onMounted(() => {
    if (autoPlay) {
      animation = animate(targets, params)
    }
  })

  return {
    play: () => {
      if (!animation) {
        animation = animate(targets, params)
      } else {
        animation.restart()
      }
    },
    getInstance: () => animation
  }
}
