function getCorrectOutput(formula) {
  return String(Math.trunc(formula)).padStart(2, 0);
}

if (!customElements.get("timer-element")) {
  customElements.define("timer-element", class Timer extends HTMLElement {
    constructor() {
      super();

      this.timerType = window.timer.type;

      if (Shopify.designMode) {
        clearInterval(this.intervalId);
        sessionStorage.removeItem("timer");
      }
      
      if (this.timerType == "automatic") {
        this.storedTimer = sessionStorage.getItem("timer");
        this.storedTimer !== null
          ? this.storedTimer = parseInt(this.storedTimer)
          : this.storeTimer();
      } else {
        const targetDate = new Date(+window.timer.year, (+window.timer.month - 1), +window.timer.day, +window.timer.hours, +window.timer.minutes, +window.timer.seconds);
        const currentDate = new Date();
        const targetDateInSeconds = Math.floor(targetDate.getTime() / 1000);
        const currentDateInSeconds = Math.floor(currentDate.getTime() / 1000);
        const secondsRemaining = targetDateInSeconds - currentDateInSeconds;
        this.storedTimer = secondsRemaining;
      }

      this.numbers = this.querySelector('.timer__numbers');
      this.initTimer();
      
      document.addEventListener("shopify:section:load", () => this.resetData());
      document.addEventListener("shopify:section:unload", () => this.resetData());
    }

    initTimer() {
      this.tick();
      this.intervalId = setInterval(() => this.tick(), 1000);
    }

    tick() {
      const remainingDays = this.storedTimer / (24 * 60 * 60);
      if (this.numbers.querySelector('.timer__days')) {
        remainingDays < 1
          ? this.numbers.querySelector('.timer__days').style.display = "none"
          : this.numbers.querySelector('.timer__days .timer__change').textContent = getCorrectOutput(this.storedTimer / (24 * 60 * 60));
      }

      const remainingHours = (this.storedTimer / 3600) % 24;
      if (this.numbers.querySelector('.timer__hours')) {
        remainingHours < 1 && remainingDays < 1
          ? this.numbers.querySelector('.timer__hours').style.display = "none"
          : this.numbers.querySelector('.timer__hours .timer__change').textContent = getCorrectOutput((this.storedTimer / 3600) % 24);
      }   
      
      this.numbers.querySelector('.timer__minutes .timer__change').textContent = getCorrectOutput((this.storedTimer / 60) % 60);
      this.numbers.querySelector('.timer__seconds .timer__change').textContent = getCorrectOutput(this.storedTimer % 60);
  
      if (this.storedTimer <= 0) {
        this.style.display = "none";
        
        if (window.timer.link !== null) window.location.href = window.timer.link;

        this.resetData();
        return;
      }
  
      this.storedTimer--;
      if (this.timerType == "automatic") sessionStorage.setItem("timer", this.storedTimer);
    }

    storeTimer() {
      const calcSec = +window.timer.seconds;
      const calcMin = 60 * +window.timer.minutes;
      const calcHour = 60 * 60 * +window.timer.hours;
      const calcDay = 24 * 60 * 60 * +window.timer.days;
      const totalTime = calcSec + calcMin + calcHour + calcDay;
      
      sessionStorage.setItem("timer", totalTime);
      this.storedTimer = parseInt(totalTime)
    }

    resetData() {
      clearInterval(this.intervalId);
      
      if (this.timerType == "automatic") {
        sessionStorage.removeItem("timer");
        this.storeTimer();
      }
      
      this.initTimer();
    }
  })
}