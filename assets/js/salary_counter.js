const SECONDS_PER_MONTH = 30 * 24 * 60 * 60

const formatCurrency = (amount) => {
  if (!Number.isFinite(amount)) {
    return "0"
  }

  if (amount < 1) {
    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount)
  }

  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatElapsed = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  }

  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }

  return `${secs}s`
}

const initSalaryCounter = () => {
  const board = document.getElementById("salary-counter")

  if (!board) {
    return
  }

  const monthlySalary = Number(board.dataset.monthlySalary)

  if (!Number.isFinite(monthlySalary) || monthlySalary <= 0) {
    return
  }

  const salaryPerSecond = monthlySalary / SECONDS_PER_MONTH
  const startedAt = Date.now()
  const timeElement = document.getElementById("salary-time-elapsed")
  const earnedElement = document.getElementById("salary-earned-cop")

  const tick = () => {
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000)
    const totalEarned = elapsedSeconds * salaryPerSecond

    if (timeElement) {
      timeElement.textContent = formatElapsed(elapsedSeconds)
    }

    if (earnedElement) {
      earnedElement.textContent = `${formatCurrency(totalEarned)} COP`
    }
  }

  tick()
  window.setInterval(tick, 100)
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSalaryCounter)
} else {
  initSalaryCounter()
}
