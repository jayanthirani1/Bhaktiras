/**
 * The Sundar Kand episodes behind Lanka Leap's obstacles. Retold from the
 * Valmiki Ramayana, Sundar Kand: sarga 1 for the flight across the ocean and
 * sarga 3 for the guardian of Lanka.
 */
export interface LankaLeapStory {
  id: 'mainak' | 'surasa' | 'simhika' | 'lankini'
  name: string
  role: string
  inGame: string
  paragraphs: string[]
}

export const LANKA_LEAP_STORY_SOURCE = 'Valmiki Ramayana, Sundar Kand (sargas 1 and 3)'

export const LANKA_LEAP_STORIES: LankaLeapStory[] = [
  {
    id: 'mainak',
    name: 'Mainak',
    role: 'The golden mountain under the sea',
    inGame: 'Take Mainak’s golden orb and your next hit is forgiven.',
    paragraphs: [
      'As Hanumanji leapt from Mount Mahendra and flew out over the ocean in search of Sita, the Ocean remembered that he owed his existence to King Sagar, an ancestor of Shri Ram. Wishing to honour Shri Ram’s messenger, the Ocean asked Mount Mainak, who lay hidden beneath the waves, to rise up and give Hanumanji a place to rest.',
      'Mainak rose from the water, his golden peaks shining like the sun. At first Hanumanji took the mountain for an obstacle and pushed it aside with his chest. Mainak then took a human form on his own summit and explained: long ago, when Indra cut the wings of the flying mountains, Vayu, Hanumanji’s father, had carried Mainak to safety in the ocean. Repaying that kindness, he begged Hanumanji to rest a while.',
      'Hanumanji was touched, but he had resolved not to stop until Shri Ram’s work was done. He touched the mountain lovingly with his hand to accept the welcome, and flew on.'
    ]
  },
  {
    id: 'surasa',
    name: 'Surasa',
    role: 'The mother of serpents who tested Hanumanji',
    inGame: 'Surasa’s mouth is narrow. Take the blue Laghima orb just before her so Hanumanji becomes tiny and slips through.',
    paragraphs: [
      'The devas and sages wanted to see Hanumanji’s strength and wisdom for themselves, so they asked Surasa, the mother of the nagas, to block his way. She rose from the sea in a fearsome form and declared that, by a boon from Brahma, no one could pass her without entering her mouth.',
      'Hanumanji asked her to let him go, promising to return once he had found Sita, but she would not give way. So he made his body grow larger and larger, and each time Surasa opened her mouth wider still.',
      'Then, in an instant, Hanumanji made himself as small as a thumb, darted into her mouth and came straight out again. “I have entered your mouth,” he said with folded hands, “so your boon is honoured.” Surasa returned to her own gentle form and blessed him to succeed in his mission.'
    ]
  },
  {
    id: 'simhika',
    name: 'Simhika',
    role: 'The demoness who seized shadows',
    inGame: 'Over Simhika’s dark water, stay high. If she catches your shadow she drags you down.',
    paragraphs: [
      'Deep in the ocean lived Simhika, a rakshasi who caught creatures flying overhead by seizing their shadows on the water. As Hanumanji flew on, he suddenly felt himself held back, as if something were dragging him down.',
      'Looking down, he saw the huge demoness rising from the sea and remembered that he had been warned about a creature who grabs shadows. Simhika opened her vast mouth to swallow him.',
      'Hanumanji made himself tiny once more, dived inside and, with his strength, destroyed her from within before flying out again. The beings of the sky praised his courage and quick wit, and he continued towards Lanka.'
    ]
  },
  {
    id: 'lankini',
    name: 'Lankini',
    role: 'The guardian of the city of Lanka',
    inGame: 'Lankini’s gate marks the moment you reach Lanka. Pass it and keep flying for a higher score.',
    paragraphs: [
      'Hanumanji reached the shore of Lanka in the evening and waited for night to slip into the city unseen. At the gate he was stopped by the city’s guardian, a fierce rakshasi called Lankini in later tellings, who challenged him and struck him.',
      'Hanumanji struck back with his left fist, holding back his full strength. Lankini fell, and as she rose she remembered what Brahma had once told her: on the day a monkey overpowered her, the end of the rakshasas’ rule over Lanka would be near.',
      'Recognising the sign, she let Hanumanji enter. He went on into the city to search for Sita.'
    ]
  }
]
