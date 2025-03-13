const counters = document.querySelectorAll('.counter');
if (counters.length > 0) {
  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5 
  };
  
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = +entry.target.textContent;
        startCounting(entry.target, target);
        observer.unobserve(entry.target);
      }
    });
  }, options);
  
  counters.forEach(counter => {
    observer.observe(counter);
  });
  
  function startCounting(element, target) {
    let current = 0;
    const duration = 1500; 
    const increment = target / 100; 
  
    const timer = setInterval(() => {
      current += increment;
      element.textContent = Math.floor(current);
  
      if (current >= target) {
        clearInterval(timer);
        element.textContent = target;
      }
    }, duration / 100);
  }
}