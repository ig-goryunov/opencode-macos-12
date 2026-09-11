import { DIFFS_TAG_NAME } from "@pierre/diffs"

/**
 * TypeScript declaration for the <diffs-container> custom element.
 * This tells TypeScript that <diffs-container> is a valid JSX element in SolidJS.
 * Required for using the @pierre/diffs web component in .tsx files.
 */

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      [DIFFS_TAG_NAME]: HTMLAttributes<HTMLElement>
      /**
       * Electron <webview> element (desktop only). Declared so the embedded
       * browser view can use it in JSX; it is never rendered on the web build.
       */
      webview: HTMLAttributes<HTMLElement> & {
        src?: string
        partition?: string
        allowpopups?: boolean
        nodeintegration?: boolean
        webpreferences?: string
      }
    }
  }
}

export {}
