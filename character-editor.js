// Character Editor JavaScript

// Initialize spell lists on page load
document.addEventListener('DOMContentLoaded', () => {
  // Add initial spells
  for (let i = 0; i < 3; i++) {
    addStudySpell();
  }
  for (let i = 0; i < 2; i++) {
    addSignatureSpell();
  }
  
  // Setup level change listener
  document.getElementById('level').addEventListener('input', updateCalculations);
  
  // Initial calculations
  updateCalculations();
  
  // Try to load last character from localStorage
  loadLastCharacter();
});

/**
 * Update all automatic calculations based on level
 */
function updateCalculations() {
  const level = parseInt(document.getElementById('level').value) || 1;
  const stats = calculateStatsByLevel(level);
  
  document.getElementById('calc-arcana').textContent = `+${stats.arcana}`;
  document.getElementById('calc-evasion').textContent = stats.evasion;
  document.getElementById('calc-crafting').textContent = `+${stats.crafting}`;
  document.getElementById('calc-spell-slots').textContent = stats.spellSlots;
  document.getElementById('calc-fort-low').textContent = stats.fortitudeLow;
  document.getElementById('calc-fort-mid').textContent = stats.fortitudeMid;
  document.getElementById('calc-fort-high').textContent = stats.fortitudeHigh;
}

/**
 * Add a study spell input field
 */
function addStudySpell() {
  const list = document.getElementById('study-spells-list');
  const index = list.children.length;
  
  const spellItem = document.createElement('div');
  spellItem.className = 'spell-item';
  spellItem.innerHTML = `
    <input type="text" placeholder="Название учебного заклинания" data-spell-type="study" data-spell-index="${index}">
    <button type="button" onclick="removeSpell(this)">Удалить</button>
  `;
  
  list.appendChild(spellItem);
}

/**
 * Add a signature spell input field
 */
function addSignatureSpell() {
  const list = document.getElementById('signature-spells-list');
  const index = list.children.length;
  
  const spellItem = document.createElement('div');
  spellItem.className = 'spell-item';
  spellItem.innerHTML = `
    <input type="text" placeholder="Название фирменного заклинания" data-spell-type="signature" data-spell-index="${index}">
    <button type="button" onclick="removeSpell(this)">Удалить</button>
  `;
  
  list.appendChild(spellItem);
}

/**
 * Remove a spell from the list
 */
function removeSpell(button) {
  button.parentElement.remove();
}

/**
 * Collect all form data into an object
 */
function collectFormData() {
  const level = parseInt(document.getElementById('level').value);
  const stats = calculateStatsByLevel(level);
  
  // Collect study spells
  const studySpells = [];
  document.querySelectorAll('[data-spell-type="study"]').forEach(input => {
    if (input.value.trim()) {
      studySpells.push(input.value.trim());
    }
  });
  
  // Collect signature spells
  const signatureSpells = [];
  document.querySelectorAll('[data-spell-type="signature"]').forEach(input => {
    if (input.value.trim()) {
      signatureSpells.push(input.value.trim());
    }
  });
  
  return {
    version: "1.0",
    name: document.getElementById('name').value,
    level: level,
    
    // Calculated stats
    calculated: {
      arcana: stats.arcana,
      evasion: stats.evasion,
      crafting: stats.crafting,
      spellSlots: stats.spellSlots,
      fortitude: {
        low: stats.fortitudeLow,
        mid: stats.fortitudeMid,
        high: stats.fortitudeHigh
      }
    },
    
    // Combat stats
    combat: {
      health: {
        current: parseInt(document.getElementById('health-current').value),
        max: parseInt(document.getElementById('health-max').value)
      },
      will: {
        current: parseInt(document.getElementById('will-current').value),
        max: parseInt(document.getElementById('will-max').value)
      },
      spellPower: parseInt(document.getElementById('spell-power').value) || 0
    },
    
    // Magic Mastery
    magicMastery: {
      construction: parseInt(document.getElementById('construction').value) || 0,
      spontaneity: parseInt(document.getElementById('spontaneity').value) || 0,
      metamagic: parseInt(document.getElementById('metamagic').value) || 0,
      creation: parseInt(document.getElementById('creation').value) || 0,
      ritualism: parseInt(document.getElementById('ritualism').value) || 0,
      versatility: parseInt(document.getElementById('versatility').value) || 0
    },
    
    // Support Magic
    supportMagic: {
      protection: parseInt(document.getElementById('protection').value) || 0,
      blessing: parseInt(document.getElementById('blessing').value) || 0,
      illusion: parseInt(document.getElementById('illusion').value) || 0,
      divination: parseInt(document.getElementById('divination').value) || 0,
      telepathy: parseInt(document.getElementById('telepathy').value) || 0,
      concealment: parseInt(document.getElementById('concealment').value) || 0,
      detection: parseInt(document.getElementById('detection').value) || 0,
      summoning: parseInt(document.getElementById('summoning').value) || 0
    },
    
    // Personality Skills
    personalitySkills: {
      communication: parseInt(document.getElementById('communication').value) || 0,
      contacts: parseInt(document.getElementById('contacts').value) || 0,
      knowledge: parseInt(document.getElementById('knowledge').value) || 0,
      perception: parseInt(document.getElementById('perception').value) || 0,
      stealth: parseInt(document.getElementById('stealth').value) || 0,
      physique: parseInt(document.getElementById('physique').value) || 0
    },
    
    // Spells
    spells: {
      study: studySpells,
      signature: signatureSpells
    },
    
    // Description
    description: document.getElementById('description').value,
    
    // Metadata
    lastModified: new Date().toISOString()
  };
}

/**
 * Fill the form with character data
 */
function fillForm(data) {
  // Basic info
  document.getElementById('name').value = data.name || '';
  document.getElementById('level').value = data.level || 1;
  
  // Combat stats
  if (data.combat) {
    document.getElementById('health-current').value = data.combat.health.current;
    document.getElementById('health-max').value = data.combat.health.max;
    document.getElementById('will-current').value = data.combat.will.current;
    document.getElementById('will-max').value = data.combat.will.max;
    document.getElementById('spell-power').value = data.combat.spellPower || 0;
  }
  
  // Magic Mastery
  if (data.magicMastery) {
    document.getElementById('construction').value = data.magicMastery.construction || 0;
    document.getElementById('spontaneity').value = data.magicMastery.spontaneity || 0;
    document.getElementById('metamagic').value = data.magicMastery.metamagic || 0;
    document.getElementById('creation').value = data.magicMastery.creation || 0;
    document.getElementById('ritualism').value = data.magicMastery.ritualism || 0;
    document.getElementById('versatility').value = data.magicMastery.versatility || 0;
  }
  
  // Support Magic
  if (data.supportMagic) {
    document.getElementById('protection').value = data.supportMagic.protection || 0;
    document.getElementById('blessing').value = data.supportMagic.blessing || 0;
    document.getElementById('illusion').value = data.supportMagic.illusion || 0;
    document.getElementById('divination').value = data.supportMagic.divination || 0;
    document.getElementById('telepathy').value = data.supportMagic.telepathy || 0;
    document.getElementById('concealment').value = data.supportMagic.concealment || 0;
    document.getElementById('detection').value = data.supportMagic.detection || 0;
    document.getElementById('summoning').value = data.supportMagic.summoning || 0;
  }
  
  // Personality Skills
  if (data.personalitySkills) {
    document.getElementById('communication').value = data.personalitySkills.communication || 0;
    document.getElementById('contacts').value = data.personalitySkills.contacts || 0;
    document.getElementById('knowledge').value = data.personalitySkills.knowledge || 0;
    document.getElementById('perception').value = data.personalitySkills.perception || 0;
    document.getElementById('stealth').value = data.personalitySkills.stealth || 0;
    document.getElementById('physique').value = data.personalitySkills.physique || 0;
  }
  
  // Spells
  if (data.spells) {
    // Clear existing spells
    document.getElementById('study-spells-list').innerHTML = '';
    document.getElementById('signature-spells-list').innerHTML = '';
    
    // Add study spells
    data.spells.study.forEach(spell => {
      addStudySpell();
      const inputs = document.querySelectorAll('[data-spell-type="study"]');
      inputs[inputs.length - 1].value = spell;
    });
    
    // Add signature spells
    data.spells.signature.forEach(spell => {
      addSignatureSpell();
      const inputs = document.querySelectorAll('[data-spell-type="signature"]');
      inputs[inputs.length - 1].value = spell;
    });
  }
  
  // Description
  document.getElementById('description').value = data.description || '';
  
  // Recalculate stats
  updateCalculations();
}

/**
 * Save character to JSON file
 */
function saveCharacter() {
  const data = collectFormData();
  
  if (!data.name) {
    alert('Пожалуйста, введите имя персонажа перед сохранением.');
    return;
  }
  
  const json = JSON.stringify(data, null, 2);
  const filename = `${data.name.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.json`;
  
  // Save to localStorage as last character
  localStorage.setItem('lastCharacter', json);
  
  // Download file
  downloadJSON(json, filename);
  
  alert(`Персонаж "${data.name}" сохранён!`);
}

/**
 * Load character from JSON file
 */
function loadCharacter(file) {
  if (!file) return;
  
  loadJSONFile(file, (data) => {
    fillForm(data);
    alert(`Персонаж "${data.name}" загружен!`);
  });
}

/**
 * Load last character from localStorage
 */
function loadLastCharacter() {
  const lastChar = localStorage.getItem('lastCharacter');
  if (lastChar) {
    try {
      const data = JSON.parse(lastChar);
      // Only auto-load if it's recent (within 7 days)
      const lastModified = new Date(data.lastModified);
      const daysSince = (new Date() - lastModified) / (1000 * 60 * 60 * 24);
      
      if (daysSince < 7) {
        const shouldLoad = confirm(`Найден сохранённый персонаж "${data.name}". Загрузить его?`);
        if (shouldLoad) {
          fillForm(data);
        }
      }
    } catch (e) {
      console.error('Error loading last character:', e);
    }
  }
}

/**
 * Clear the form
 */
function clearForm() {
  if (!confirm('Вы уверены, что хотите очистить форму? Несохранённые данные будут потеряны.')) {
    return;
  }
  
  document.getElementById('character-form').reset();
  document.getElementById('level').value = 1;
  
  // Clear spells
  document.getElementById('study-spells-list').innerHTML = '';
  document.getElementById('signature-spells-list').innerHTML = '';
  
  // Re-add initial spells
  for (let i = 0; i < 3; i++) {
    addStudySpell();
  }
  for (let i = 0; i < 2; i++) {
    addSignatureSpell();
  }
  
  updateCalculations();
}

