import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en'
import ta from './locales/ta'
import hi from './locales/hi'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
] as const

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code']

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ta: { translation: ta },
      hi: { translation: hi },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ta', 'hi'],
    interpolation: {
      // React already protects against XSS
      escapeValue: false,
    },
    detection: {
      // Check localStorage first, then browser language
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'agripulse_language',
      caches: ['localStorage'],
    },
  })

export default i18n
