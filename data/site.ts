/** Edit these for Patotsav dates and WhatsApp invite. */
export const SITE = {
  name: 'Bhaktiras',
  templeName: 'Shree KS Swaminarayan Temple Woolwich',
  /**
   * Canonical origin, no trailing slash. Used to build the absolute og:url and
   * og:image that link previews require — WhatsApp and iMessage will not
   * resolve a relative image, and the invite in this file is a WhatsApp link.
   * Change this here when the site moves to a custom domain.
   */
  url: 'https://sksswoolwich-bhaktiras--skssw-bhaktiras.europe-west4.hosted.app',
  /** One sentence, used as the default meta description and og:description. */
  description:
    'Bhaktiras celebrates ten years with Ghanshyam Maharaj at Shree KS Swaminarayan Temple Woolwich — our journey, events, seva, shared niyams and daily games, leading to the Patotsav in August 2027.',
  patotsavLabel: 'Bhaktiras Patotsav',
  /** Utsav: Saturday 14th August – Sunday 22nd August 2027 (UK). */
  patotsavStart: '2027-08-14T00:00:00+01:00',
  patotsavEnd: '2027-08-22T23:59:59+01:00',
  patotsavDateLabel: 'Saturday 14th August – Sunday 22nd August',
  journeyStartYear: 2017,
  journeyEndYear: 2027,
  whatsappInviteUrl: 'https://chat.whatsapp.com/JDfg56sbFGpCoPcUGecK39',
  whatsappLabel: 'Join our WhatsApp community',
  /**
   * GuestCam guest access link (Gallery Menu → QR Code & Link).
   * Leave empty to hide the Community photo section until the gallery is ready.
   */
  guestCamUrl: '',
  guestCamLabel: 'Open photo gallery',
  /** Canonical scriptures and learning resources (Bhuj / SKSS). */
  scripturesUrl: 'https://www.swaminarayan.faith/learning-resources/scriptures',
  scripturesHomeUrl: 'https://www.swaminarayan.faith/'
}

/** Mandir location for geofenced check-in. */
export const MANDIR_LOCATION = {
  name: 'Shree Kutch Satsang Swaminarayan Temple - Woolwich',
  address: 'St. Margarets Grove, London, SE18 7RL',
  lat: 51.482415,
  lng: 0.074412,
  /** Radius in metres within which a visit is recognised. */
  radiusMeters: 100
}
