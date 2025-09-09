// === RANDOMIZER FUNCTIONS ===
function getRandomItem(arr) {
  const item = arr[Math.floor(Math.random() * arr.length)];
  return item;
}

function getSkinData(skin) {
  if (typeof skin === "string") {
    return { name: skin, img: skin.replace(/\s+/g, "_") + ".webp" };
  }
  return skin;
}

function generateCardHTML(toon, skin, twinkets, showSkinName) {
  return `
    <div class="card">
      <div><strong>Toon:</strong> <span id="toonName">${toon.name}</span></div>
      ${showSkinName ? `<div><strong>Skin:</strong> <span id="skinName">${skin.name}</span></div>` : ""}
      <img class="toon-img" src="Images/${skin.img}" alt="${skin.name}"><br>
      <strong>Twinkets:</strong>
      <div class="twinkets">
        ${twinkets.map(t => `
          <div class="twinket">
            <img src="Images/${t.img}" alt="${t.name}">
            <div class="twinket-name">${t.name}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// === CONFETTI ===
function launchConfetti(duration = 3000) {
  const confettiContainer = document.createElement('div');
  confettiContainer.id = 'confettiContainer';
  confettiContainer.style.position = 'fixed';
  confettiContainer.style.top = '0';
  confettiContainer.style.left = '0';
  confettiContainer.style.width = '100%';
  confettiContainer.style.height = '100%';
  confettiContainer.style.pointerEvents = 'none';
  document.body.appendChild(confettiContainer);

  const colors = ['#FF0000','#FF7F00','#FFFF00','#00FF00','#0000FF','#4B0082','#8B00FF'];
  const pieces = 100;

  for (let i = 0; i < pieces; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'absolute';
    confetti.style.width = '8px';
    confetti.style.height = '8px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * window.innerWidth + 'px';
    confetti.style.top = '-10px';
    confetti.style.opacity = Math.random();
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    confettiContainer.appendChild(confetti);

    let fallingSpeed = Math.random() * 5 + 2;
    let horizontalDrift = (Math.random() - 0.5) * 2;

    const animate = () => {
      const top = parseFloat(confetti.style.top);
      const left = parseFloat(confetti.style.left);
      if (top < window.innerHeight) {
        confetti.style.top = top + fallingSpeed + 'px';
        confetti.style.left = left + horizontalDrift + 'px';
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  setTimeout(() => { 
    document.body.removeChild(confettiContainer);
  }, duration);
}

// === DISABLED ITEMS STORAGE ===
let disabledItems = { toons: new Set(), skins: new Set(), twinkets: new Set() };

// === POPULATE DISABLE MODAL ===
async function populateDisableModal() {
  try {
    const response = await fetch('data.json');
    const data = await response.json();

    const toonsContainer = document.getElementById('disableToons');
    const skinsContainer = document.getElementById('disableSkins');
    const twinketsContainer = document.getElementById('disableTrinkets');

    [toonsContainer, skinsContainer, twinketsContainer].forEach(c => {
      c.style.maxHeight = '300px';
      c.style.overflowY = 'auto';
      c.innerHTML = '';
    });

    // Toons
    data.toons.forEach(toon => {
      const id = `toon-${toon.name.replace(/[^a-zA-Z0-9_-]/g,'-')}`;
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" id="${id}" ${disabledItems.toons.has(toon.name) ? 'checked' : ''}> ${toon.name}`;
      label.querySelector('input').addEventListener('change', e => {
        e.target.checked ? disabledItems.toons.add(toon.name) : disabledItems.toons.delete(toon.name);
      });
      toonsContainer.appendChild(label);
      toonsContainer.appendChild(document.createElement('br'));
    });

    // Skins
    data.toons.forEach(toon => {
      toon.skins.forEach(skin => {
        const id = `skin-${skin.name.replace(/[^a-zA-Z0-9_-]/g,'-')}`;
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" id="${id}" ${disabledItems.skins.has(skin.name) ? 'checked' : ''}> ${skin.name}`;
        label.querySelector('input').addEventListener('change', e => {
          e.target.checked ? disabledItems.skins.add(skin.name) : disabledItems.skins.delete(skin.name);
        });
        skinsContainer.appendChild(label);
        skinsContainer.appendChild(document.createElement('br'));
      });
    });

    // Twinkets
    data.twinkets.forEach(t => {
      const id = `twinket-${t.name.replace(/[^a-zA-Z0-9_-]/g,'-')}`;
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" id="${id}" ${disabledItems.twinkets.has(t.name) ? 'checked' : ''}> ${t.name}`;
      label.querySelector('input').addEventListener('change', e => {
        e.target.checked ? disabledItems.twinkets.add(t.name) : disabledItems.twinkets.delete(t.name);
      });
      twinketsContainer.appendChild(label);
      twinketsContainer.appendChild(document.createElement('br'));
    });

  } catch (error) {
    console.error('Error loading data for disable modal:', error);
  }
}

// === GET RANDOM FILTERED ===
function getRandomItemFiltered(arr, type) {
  if(type === 'toons'){
    const filteredToons = arr.filter(t => !disabledItems.toons.has(t.name));
    return filteredToons.length ? getRandomItem(filteredToons) : getRandomItem(arr);
  } else {
    const filtered = arr.filter(item => !disabledItems[type].has(item.name));
    return filtered.length ? getRandomItem(filtered) : getRandomItem(arr);
  }
}

// === ROLL FUNCTION ===
async function roll() {
  const rollBtn = document.getElementById('rollBtn');
  rollBtn.style.display = 'none';

  try {
    const response = await fetch('data.json');
    const data = await response.json();
    const enableSkins = document.getElementById('enableSkins').checked;

    let steps = 25;
    let delay = 40;
    let toon, skin, twinkets;

    for (let i = 0; i < steps; i++) {
      // Select toon (skip disabled)
      const availableToons = data.toons.filter(t => !disabledItems.toons.has(t.name));
      toon = availableToons.length ? getRandomItem(availableToons) : getRandomItem(data.toons);

      // Select skin (skip disabled)
      if (enableSkins) {
        const availableSkins = toon.skins.map(getSkinData)
          .filter(s => !disabledItems.skins.has(s.name));
        skin = availableSkins.length ? getRandomItem(availableSkins) : getSkinData(toon.skins[0]);
      } else {
        skin = getSkinData(toon.skins[0]);
      }

      // Select two unique twinkets
      const availableTwinkets = data.twinkets.filter(t => !disabledItems.twinkets.has(t.name));
      twinkets = [];
      while(twinkets.length < 2){
        const t = getRandomItem(availableTwinkets);
        if(!twinkets.find(x => x.name === t.name)) twinkets.push(t);
      }

      document.getElementById('result').innerHTML = generateCardHTML(toon, skin, twinkets, enableSkins);
      await new Promise(r => setTimeout(r, delay));
      delay *= 1.08;
    }

    launchConfetti(3000);
    addRerollListeners(data);
    setTimeout(() => { rollBtn.style.display = 'inline-block'; }, 3000);

  } catch (error) {
    console.error('Error loading data:', error);
    document.getElementById('result').innerHTML = 'Error loading data.json';
    rollBtn.style.display = 'inline-block';
  }
}

// === REROLL LISTENERS ===
function addRerollListeners(data) {
  const toonImg = document.querySelector('.toon-img');
  const toonNameEl = document.getElementById('toonName');
  const skinNameEl = document.getElementById('skinName');
  const enableSkins = document.getElementById('enableSkins').checked;

  // Reroll toon on click
  if(toonImg){
    toonImg.addEventListener('click', () => {
      const availableToons = data.toons.filter(t => !disabledItems.toons.has(t.name));
      const newToon = availableToons.length ? getRandomItem(availableToons) : getRandomItem(data.toons);

      let newSkin;
      if(enableSkins){
        const availableSkins = newToon.skins.map(getSkinData)
          .filter(s => !disabledItems.skins.has(s.name));
        newSkin = availableSkins.length ? getRandomItem(availableSkins) : getSkinData(newToon.skins[0]);
      } else {
        newSkin = getSkinData(newToon.skins[0]);
      }

      toonImg.src = `Images/${newSkin.img}`;
      toonImg.alt = newSkin.name;
      toonNameEl.innerText = newToon.name;
      if(skinNameEl) skinNameEl.innerText = enableSkins ? newSkin.name : "";
    });
  }

  // Reroll twinkets on click
  const twinketImgs = document.querySelectorAll('.twinket img');
  twinketImgs.forEach(img => {
    img.addEventListener('click', () => {
      const availableTwinkets = data.twinkets.filter(t => !disabledItems.twinkets.has(t.name));
      let newTwinket;
      do { newTwinket = getRandomItem(availableTwinkets); }
      while(img.src.includes(newTwinket.img) && availableTwinkets.length > 1);

      img.src = `Images/${newTwinket.img}`;
      img.alt = newTwinket.name;
      if(img.nextElementSibling) img.nextElementSibling.innerText = newTwinket.name;
    });
  });
}

// === SETTINGS MODAL ===
const modal = document.getElementById("settingsModal");
document.getElementById("settingsBtn").addEventListener("click", () => modal.style.display = "flex");
document.getElementById("closeSettings").addEventListener("click", () => modal.style.display = "none");

// === DISABLE MODAL ===
const disableModal = document.getElementById("disableModal");
document.getElementById("openDisable").addEventListener("click", () => {
  populateDisableModal();
  disableModal.style.display = "flex";
});
document.getElementById("closeDisable").addEventListener("click", () => disableModal.style.display = "none");

// === ROLL BUTTON ===
document.getElementById('rollBtn').addEventListener('click', roll);

// Automatically reroll skins if toggle changes
document.getElementById('enableSkins').addEventListener('change', roll);
