module.exports = {
  i18n: {
    // all the locales supported in the application
    locales: ['en-GB', 'en-US'], 
    // the default locale to be used when visiting
    // a non-localized route (e.g. `/about`)   
    defaultLocale: 'en-GB',
  },

  fallbackLng: 'en-GB',

  ns: ['common', 'application', 'validation'],
  defaultNS: 'application',
  fallbackNS: 'common',

  // configure the path for localization (i18n) files based on the environment
  // if the code is running on server side it will use ./public/locales
  // if the code is running on client side it will use /locales
  localePath:
    typeof window === 'undefined'
      ? require('path').resolve('./public/locales')
      : '/locales',
}