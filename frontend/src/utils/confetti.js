// Simple confetti animation
const confetti = () => {
  const colors = ['#608A1C', '#FF7F2A', '#A0D940', '#FFD700'];
  const confettiCount = 100;
  
  for (let i = 0; i < confettiCount; i++) {
    const confettiPiece = document.createElement('div');
    confettiPiece.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background-color: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}vw;
      top: -10px;
      opacity: 1;
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      z-index: 9999;
      pointer-events: none;
    `;
    
    document.body.appendChild(confettiPiece);
    
    const animation = confettiPiece.animate([
      { 
        transform: 'translateY(0) rotate(0deg)', 
        opacity: 1 
      },
      { 
        transform: `translateY(100vh) rotate(${Math.random() * 720}deg)`, 
        opacity: 0 
      }
    ], {
      duration: 2000 + Math.random() * 2000,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
    
    animation.onfinish = () => confettiPiece.remove();
  }
};

export default confetti;
