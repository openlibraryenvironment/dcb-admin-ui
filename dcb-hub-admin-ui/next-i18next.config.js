module.exports = {
  i18n: {
    // all the locales supported in the application
    locales: ['en-GB', 'en-US'], 
    // the default locale to be used when visiting
    // a non-localized route (e.g. `/about`)   
    defaultLocale: 'en-GB',
  },
  //configure the path for localization (i18n) files based on the environment
  localePath:
    typeof window === 'undefined'
      ? require('path').resolve('./public/locales')
      : '/locales',
}