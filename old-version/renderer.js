const form = document.getElementById("baby-form");
const namaInput = document.getElementById("nama");
const tglInput = document.getElementById("tgl");
const list = document.getElementById("baby-list");

async function loadBabies() {
  const babies = await window.api.getBabies();
  list.innerHTML = "";
  babies.forEach(baby => {
    const li = document.createElement("li");
    li.textContent = `${baby.nama} (lahir: ${baby.tanggal_lahir})`;
    list.appendChild(li);
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  await window.api.addBaby({
    nama: namaInput.value,
    tanggal_lahir: tglInput.value,
    berat_badan: [],
    tinggi_badan: []
  });
  namaInput.value = "";
  tglInput.value = "";
  loadBabies();
});

loadBabies();
