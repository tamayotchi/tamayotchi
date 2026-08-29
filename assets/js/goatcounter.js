window.goatcounter = window.goatcounter || {}
window.goatcounter.endpoint = "https://tamayotchi.goatcounter.com/count"
window.goatcounter.path = (path) => `${window.location.host}${path}`

// Load the self-hosted GoatCounter client after configuring its endpoint.
void import("../vendor/goatcounter")
