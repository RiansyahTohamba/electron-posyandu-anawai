// renderer.js
const btn = document.getElementById('btn');
const out = document.getElementById('out');

btn.addEventListener('click', async () => {
  const res = await window.electronAPI.ping();
  out.textContent = res;
});
