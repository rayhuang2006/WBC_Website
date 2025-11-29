// static/js/card_effect.js

document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".interactive-card");

  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 計算中心點位移 (-1 到 1 之間)
      const xPct = (x / rect.width - 0.5) * 2;
      const yPct = (y / rect.height - 0.5) * 2;

      // 設定旋轉幅度 (Pokemon 卡片大約是 15-20deg)
      const rotateX = yPct * -10; // 滑鼠往下，卡片往後仰
      const rotateY = xPct * 10;  // 滑鼠往右，卡片往右轉

      // 應用 CSS Transform
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      
      // 移動光澤 (Sheen) 位置
      // 我們稍微移動 background-position 來模擬光影
      card.style.background = `radial-gradient(circle at ${x}px ${y}px, #334155, #1e293b)`;
    });

    // 滑鼠離開時復原
    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";
      card.style.background = "linear-gradient(145deg, #253147, #1e293b)"; // 復原背景
    });
  });
});