class VariantElementHandler {
  constructor (title, h1Title, desc, url) {
    this.title = title
    this.h1Title = h1Title
    this.desc = desc
    this.url = url
  }

  element(element) {
    if (element.tagName === "title") {
      element.setInnerContent(this.title)
    }
    if (element.tagName === "h1" && element.getAttribute("id") === "title") {
      element.setInnerContent(this.h1Title)
    }
    if (element.tagName === "p" && element.getAttribute("id") === "description") {
      element.setInnerContent(this.desc)
    }
    if (element.tagName === "a" && element.getAttribute("id") === "url") {
      element.setAttribute("href", this.url)
      element.setInnerContent("Return to " + this.url.substring(8))
    }
  }
}

class Variant {
  constructor (id, url, handler) {
    this.id = id
    this.url = url
    this.handler = handler
  }
}

const API_URL = 'https://cfw-takehome.developers.workers.dev/api/variants'
const VARIANT1 = new VariantElementHandler("My Variant 1!", 
                                     "Customized Variant 1", 
                                     "Hello, World!", 
                                     "https://youtu.be/rNsgHMklBW0")
const VARIANT2 = new VariantElementHandler("My Website (Variant 2)", 
                                     "Visit my Website", 
                                     "Click below for cool plays!", 
                                     "https://jvogit.github.io")

/**
 * Respond based on Variant
 * @param {Request} request
 */
async function handleRequest(request) {
  const value = getVariantCookie(request.headers)
  const variant = await getVariant(value)
  console.log(value + ' ' + variant.url)
  const urlRes = await fetch(variant.url)
  const response = new HTMLRewriter().on('*', variant.handler).transform(urlRes)

  if (value < 0) {
    setCookie(response.headers, variant.id)
  }

  return response
}

/**
 * Get Variant object with given index from url
 * @param {int} index 
 */
async function getVariant(index = -1) {
  const response = await fetch(API_URL)
  const obj = await response.json()
  
  return _pickVariant(obj.variants, index)
}

/**
 * Pick variant from given array of urls given index
 * Currently either const VARIANT1 or VARIANT2 object
 * @param {Array} arr 
 * @param {int} index
 */
function _pickVariant(arr, index = -1) {
  index = index < 0 ? _pickIndex(arr) : index
  url = arr[index]
  handler = index == 0 ? VARIANT1 : VARIANT2
  return new Variant(index, url, handler)
}

/**
 * Pick an index, given array. Currently 50% weight for two objects
 * @param {Array} arr 
 */
function _pickIndex(arr) {
  return Math.random() >= 0.5 ? 1 : 0
}

/**
 * Get variant index from cookie if it exists
 * @param {Header} headers 
 */
function getVariantCookie(headers) {
  cookie = headers.get('cookie')
  if (cookie && cookie.includes('exp_variant=0')) {
    return 0
  } else if (cookie && cookie.includes('exp_variant=1')) {
    return 1
  }

  return -1
}

/**
 * Set cookie with given index and expiry (default 24 hours)
 * @param {Header} headers 
 * @param {index} index
 * @param expiresInSeconds 
 */
function setCookie(headers, index, expiresInSeconds=24*3600) {
  headers.append('Set-Cookie', `exp_variant=${index}; Max-Age=${expiresInSeconds}`)
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
