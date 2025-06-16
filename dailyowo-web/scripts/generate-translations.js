const fs = require('fs');
const path = require('path');

// Read the English base file
const enMessages = require('../messages/en.json');

// Languages to generate
const languages = [
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'de', name: 'German' },
  { code: 'nl', name: 'Dutch' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'sw', name: 'Swahili' },
  { code: 'ar', name: 'Arabic' }
];

// Basic translations for common words (to be expanded)
const commonTranslations = {
  it: { // Italian
    "loading": "Caricamento...",
    "save": "Salva",
    "cancel": "Annulla",
    "delete": "Elimina",
    "edit": "Modifica",
    "add": "Aggiungi",
    "back": "Indietro",
    "next": "Avanti",
    "continue": "Continua",
    "yes": "Sì",
    "no": "No"
  },
  pt: { // Portuguese
    "loading": "Carregando...",
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Excluir",
    "edit": "Editar",
    "add": "Adicionar",
    "back": "Voltar",
    "next": "Próximo",
    "continue": "Continuar",
    "yes": "Sim",
    "no": "Não"
  },
  de: { // German
    "loading": "Laden...",
    "save": "Speichern",
    "cancel": "Abbrechen",
    "delete": "Löschen",
    "edit": "Bearbeiten",
    "add": "Hinzufügen",
    "back": "Zurück",
    "next": "Weiter",
    "continue": "Fortfahren",
    "yes": "Ja",
    "no": "Nein"
  },
  nl: { // Dutch
    "loading": "Laden...",
    "save": "Opslaan",
    "cancel": "Annuleren",
    "delete": "Verwijderen",
    "edit": "Bewerken",
    "add": "Toevoegen",
    "back": "Terug",
    "next": "Volgende",
    "continue": "Doorgaan",
    "yes": "Ja",
    "no": "Nee"
  },
  yo: { // Yoruba
    "loading": "Nígbàtí...",
    "save": "Fipamọ́",
    "cancel": "Fagile",
    "delete": "Paare",
    "edit": "Ṣatunkọ",
    "add": "Ṣafikun",
    "back": "Pada",
    "next": "Itele",
    "continue": "Tẹsiwaju",
    "yes": "Bẹẹni",
    "no": "Rara"
  },
  sw: { // Swahili
    "loading": "Inapakia...",
    "save": "Hifadhi",
    "cancel": "Ghairi",
    "delete": "Futa",
    "edit": "Hariri",
    "add": "Ongeza",
    "back": "Rudi",
    "next": "Ifuatayo",
    "continue": "Endelea",
    "yes": "Ndiyo",
    "no": "Hapana"
  },
  ar: { // Arabic
    "loading": "جاري التحميل...",
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "add": "إضافة",
    "back": "رجوع",
    "next": "التالي",
    "continue": "متابعة",
    "yes": "نعم",
    "no": "لا"
  }
};

// Function to create a deep copy of an object
function deepCopy(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Array) return obj.map(item => deepCopy(item));
  
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepCopy(obj[key]);
    }
  }
  return clonedObj;
}

// Function to apply basic translations
function applyBasicTranslations(messages, langCode) {
  const translated = deepCopy(messages);
  
  // Apply common translations
  if (commonTranslations[langCode] && translated.common) {
    Object.keys(commonTranslations[langCode]).forEach(key => {
      if (translated.common[key]) {
        translated.common[key] = commonTranslations[langCode][key];
      }
    });
  }
  
  // Add translation markers for untranslated strings
  function markForTranslation(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string' && !commonTranslations[langCode]?.[key]) {
          // Keep some strings as-is (like appName)
          if (key !== 'appName' && !key.includes('email') && !key.includes('password')) {
            obj[key] = `[${langCode.toUpperCase()}] ${obj[key]}`;
          }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          markForTranslation(obj[key]);
        }
      }
    }
  }
  
  // Comment out for production - this adds markers to show what needs translation
  // markForTranslation(translated);
  
  return translated;
}

// Generate translation files
languages.forEach(({ code, name }) => {
  const existingFile = path.join(__dirname, '..', 'messages', `${code}.json`);
  
  // Skip if file already exists
  if (fs.existsSync(existingFile)) {
    console.log(`✓ ${name} (${code}) translation already exists`);
    return;
  }
  
  const translatedMessages = applyBasicTranslations(enMessages, code);
  
  fs.writeFileSync(
    existingFile,
    JSON.stringify(translatedMessages, null, 2),
    'utf8'
  );
  
  console.log(`✓ Generated ${name} (${code}) translation template`);
});

console.log('\n📝 Translation files generated!');
console.log('Note: These are template files with basic translations.');
console.log('You should have them professionally translated for production use.'); 