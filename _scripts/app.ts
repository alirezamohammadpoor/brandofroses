import '../_styles/app.css'

import { Core as TaxiCore } from '@unseenco/taxi'
import type {
  TaxiNavigateOutProps,
  TaxiNavigateInProps,
  TaxiNavigateEndProps
} from '@/types/taxi'

import BreakpointsController from '@/core/breakpointsController'

import {
  isThemeEditor,
  targetBlankExternalLinks
} from '@/core/utils'
import { dispatch } from '@/core/utils/event'

// Renderers
import BaseRenderer from '@/renderers/base'

// Transitions
import PageTransition from '@/transitions/page'

// Sections
import SectionManager from '@/core/sectionManager'
import HeaderSection from '@/sections/header'
import FooterSection from '@/sections/footer'
import MobileMenuSection from '@/sections/mobileMenu'
import AJAXCartSection from '@/sections/ajaxCart'
import CollectionSection from '@/sections/collection'

// Standalone components (not tied to sections)
import AnnouncementRotator from '@/components/announcementRotator'
import CurrencySelector from '@/components/currencySelector'
import ScrollSection from '@/components/scrollSection'
import PillDropdown from '@/components/pillDropdown'
import CustomerLoginInline from '@/components/customerLoginInline'
import CollectionToolbar from '@/components/collectionToolbar'

// Use this to expose anything needed throughout the rest of the app
window.app = window.app || {};
window.app.taxi = null;

function init() {
  const viewContainer = document.querySelector<HTMLElement>('main#view-container')
  const TEMPLATE_REGEX = /\btemplate-\w*/

  // Initialize all global controllers before starting Taxi and registering sections
  window.app.breakpointsController = new BreakpointsController()

  const sectionManager = new SectionManager()

  sectionManager.register(HeaderSection)
  sectionManager.register(FooterSection)
  sectionManager.register(MobileMenuSection)
  sectionManager.register(AJAXCartSection)
  sectionManager.register(CollectionSection)

  // --- Standalone components lifecycle ---
  //
  // Components mounted OUTSIDE the Taxi view container (header, footer,
  // mobile menu, ajax-cart) live for the full session. Their section's
  // SectionManager handles them.
  //
  // Components mounted INSIDE `main#view-container` get orphaned on every
  // Taxi SPA navigation: the view's HTML is swapped out, so the instances
  // hold dead DOM references and their document-level event listeners leak.
  // We track the view-local instances so we can destroy them on nav-out and
  // re-mount on nav-end.
  //
  // Header-level standalones (e.g. the pill-dropdowns in the utility pill
  // and the customer-login-inline inside it) live outside the view container
  // and are mounted once here at init.

  type Standalone = { destroy?: () => void }

  // Single registry of standalone component classes. Each entry exposes a
  // `SELECTOR` static and constructable-from-element shape. Adding a new
  // session-wide or view-scoped standalone = one line here.
  type StandaloneClass = { SELECTOR: string; new (el: HTMLElement): Standalone }
  const standaloneClasses: StandaloneClass[] = [
    AnnouncementRotator,
    CurrencySelector,
    ScrollSection,
    PillDropdown,
    CustomerLoginInline,
    CollectionToolbar,
  ]

  const mountInRoot = (
    root: ParentNode,
    filter?: (el: HTMLElement) => boolean,
  ): Standalone[] => {
    const instances: Standalone[] = []
    for (const Cls of standaloneClasses) {
      for (const el of root.querySelectorAll<HTMLElement>(Cls.SELECTOR)) {
        if (filter && !filter(el)) continue
        instances.push(new Cls(el))
      }
    }
    return instances
  }

  const destroyInstances = (instances: Standalone[]) => {
    for (const c of instances) {
      try {
        c.destroy?.()
      }
      catch (e) {
        console.warn('standalone teardown failed', e)
      }
    }
  }

  let viewStandalones: Standalone[] = []

  const remountViewStandalones = (action: 'destroy' | 'mount' | 'remount' = 'remount') => {
    if (!viewContainer) return
    if (action === 'destroy' || action === 'remount') {
      destroyInstances(viewStandalones)
      viewStandalones = []
    }
    if (action === 'mount' || action === 'remount') {
      viewStandalones = mountInRoot(viewContainer)
    }
  }

  // Exposed for in-section AJAX swaps (e.g. CollectionSection swaps its grid
  // without a Taxi navigation, and needs to rebind pill-dropdowns / toolbar
  // on the new DOM).
  window.app.remountViewStandalones = remountViewStandalones

  if (viewContainer) {
    // View-scoped: inside `main#view-container`, re-mounted on every Taxi nav.
    viewStandalones = mountInRoot(viewContainer)

    // Session-scoped: the rest of the document (header, footer, mobile menu,
    // etc.). Mounted once and freed when the tab closes — not tracked.
    mountInRoot(document, el => !viewContainer.contains(el))
  }
  else {
    // No SPA: mount everything once on the document.
    mountInRoot(document)
  }

  // START Taxi
  if (isThemeEditor()) {
    // Prevent taxi js from running
    for (const a of Array.from(document.getElementsByTagName('a'))) {
      a.setAttribute('data-taxi-ignore', 'true')
    }
  }

  const taxi = new TaxiCore({
    renderers: {
      default: BaseRenderer
    },
    transitions: {
      default: PageTransition
    },
    reloadJsFilter: (element) => {
      // Whitelist any scripts here that need to be reloaded on page change
      return element.dataset.taxiReload !== undefined || viewContainer.contains(element)
    },
    allowInterruption: true,
    enablePrefetch: true
  })

  // This event is sent before the `onLeave()` method of a transition is run to hide a `data-router-view`
  taxi.on('NAVIGATE_OUT', (e: TaxiNavigateOutProps) => {
    // Tear down view-container standalones before the DOM they point at gets
    // swapped — otherwise their document-level event listeners leak and
    // reference dead nodes.
    destroyInstances(viewStandalones)
    viewStandalones = []

    dispatch('taxi.navigateOut', e)
  })
    
  // This event is sent everytime a `data-taxi-view` is added to the DOM
  taxi.on('NAVIGATE_IN', (e: TaxiNavigateInProps) => {
    const toPage = e.to.page as Document
    const body = document.body

    // Remove any body classes that match the template regex
    for (const cn of Array.from(body.classList)) {
      if (TEMPLATE_REGEX.test(cn)) {
        body.classList.remove(cn)
      }
    }

    // Add any body classes for the *new* page that match the template regex
    for (const cn of Array.from(toPage.body.classList as DOMTokenList)) {
      if (TEMPLATE_REGEX.test(cn)) {
        body.classList.add(cn)
      }
    }

    dispatch('taxi.navigateIn', e)
  })

  // This event is sent everytime the `done()` method is called in the `onEnter()` method of a transition
  taxi.on('NAVIGATE_END', (e: TaxiNavigateEndProps) => {
    taxi.clearCache('/cart')
    taxi.cache.forEach((_, key) => {
      if (key.includes('products') || key.includes('account') || key.includes('cart')) {
        taxi.cache.delete(key)
      }
    })

    targetBlankExternalLinks()

    // Re-mount standalones on the freshly swapped view DOM so the new
    // pill-dropdowns, collection toolbar, etc. become interactive again.
    if (viewContainer) {
      viewStandalones = mountInRoot(viewContainer)
    }

    dispatch('taxi.navigateEnd', e)
  })

  window.app.taxi = taxi
  // END Taxi

  targetBlankExternalLinks(); // All external links open in a new tab  

  if (window.history && window.history.scrollRestoration) {
    // Prevents browser from restoring scroll position when hitting the back button
    window.history.scrollRestoration = 'manual'
  }

  document.body.classList.add('is-loaded')

  if (isThemeEditor()) {
    document.documentElement.classList.add('is-theme-editor')
  }  
}

document.addEventListener('DOMContentLoaded', init)