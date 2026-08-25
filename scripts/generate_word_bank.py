#!/usr/bin/env python3
"""Generate the shared game vocabulary.

Only curated Swaminarayan, Gujarati and basic Hinduism terms are included —
no Sahasranama or obscure Sanskrit name dumps.

The generated JSON is committed so the games do not need network access.
Run this script only when intentionally refreshing the bank.

After regenerating, bump WORD_BANK_VERSION in utils/gameStorageReset.ts so
browsers clear cached daily Wordle / Crossword / 1% Club progress.
"""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "satsangWordBank.json"

# Familiar everyday vocabulary only. Format: display|clue|category
CURATED = """
Aarti|Worship ceremony performed with lighted lamps|worship
Abhishek|Ritual bathing of a sacred murti|worship
Acharya|A spiritual teacher or guide|satsang
Agna|A spiritual command or instruction|satsang
Ahmedabad|Gujarat city home to the first Swaminarayan mandir|place
Ahinsa|The principle of non-violence|value
Akshar|The eternal abode and ideal devotee of Purushottam|swaminarayan
Akshardham|The divine abode of Bhagvan Swaminarayan|swaminarayan
Amrut|Nectar or that which is immortal|satsang
Anand|Spiritual bliss or joy|hinduism
Anjali|A gesture of reverence with joined palms|worship
Anuvrutti|Following the inner wish of the guru|satsang
Arjun|Warrior taught by Krishna in the Bhagavad Gita|hinduism
Arti|Lamp ceremony, spelled this way in the Vachnamrut|worship
Ashirwad|A blessing|worship
Ashram|A place for spiritual practice and community|community
Atladra|Swaminarayan pilgrimage centre near Vadodara|place
Atma|The eternal self or soul|hinduism
Atmabuddhi|Deep identification and oneness with the Satpurush|swaminarayan
Avatar|A divine manifestation on earth|hinduism
Ayodhya|Sacred birthplace of Bhagvan Ram|place
Badrinath|Himalayan pilgrimage shrine dedicated to Vishnu|place
Balak|A child|community
Balika|A young girl in satsang|community
Bal Mandal|A satsang group for children|community
Bapa|Gujarati word for father, also a warm address for an elderly man|gujarati
Bapu|Affectionate Gujarati address for a respected elder|gujarati
Barfi|A milk-based Indian sweet often offered as prasad|food
Shreemad Bhagvat|Puran the Vachnamrut quotes on Bhagvan's true form|scripture
Bhagvan|The supreme Lord|hinduism
Bhajan|A devotional song or act of worship|worship
Bhajiya|Deep-fried Gujarati snack often shared after sabha|food
Bhakta|A devotee of God|devotion
Bhakti|Loving devotion to God|devotion
Bhasma|Sacred ash used in worship|worship
Bhima|One of the Pandava brothers known for strength|hinduism
Bhog|Food prepared as an offering to God|worship
Bhumi|The earth, revered as a divine mother|hinduism
Bhuj|Town in Kutch with a historic Swaminarayan mandir|place
Bochasan|Swaminarayan pilgrimage town in Gujarat|place
Brahma|The deity associated with creation|hinduism
Brahm-charya|Self-restraint and purity|hinduism
Chaas|Gujarati buttermilk drink|food
Chaitra|A month in the Hindu lunar calendar|festival
Chakra|A wheel or sacred discus symbol|hinduism
Chandan|Sandalwood paste used in worship|worship
Chandlo|The round red mark worn on the forehead|swaminarayan
Charan|The feet, especially of God or the guru|devotion
Charanarvind|The lotus feet of God|devotion
Chaturmas|Four holy monsoon months of added observance|festival
Chesta|Verses describing Bhagvan Swaminarayan's divine form|swaminarayan
Chhapaiya|Birthplace of Bhagvan Swaminarayan|place
Chutney|Spiced accompaniment served with Indian food|food
Dal|Lentil dish common in Gujarati meals|food
Damaru|The small drum associated with Shiv|worship
Darshan|Reverent sight of God, a murti, or a holy person|worship
Dasbhav|The humble attitude of being God's servant|devotion
Daya|Compassion|value
Deep|A lighted lamp used in worship|worship
Deepavali|The festival of lights|festival
Dev|A deity or divine being|hinduism
Devaki|Mother of Krishna|hinduism
Devotee|One who is devoted to God|devotion
Dhanteras|Festival day welcoming auspicious prosperity|festival
Dharma|Righteous conduct and sacred duty|hinduism
Dhokla|Steamed Gujarati snack made from fermented batter|food
Dholak|A hand drum used in devotional music|worship
Dhoti|Traditional lower garment worn by men|gujarati
Dhun|Repetitive chanting of God's name|worship
Dhyan|Meditation and focused remembrance|worship
Diksha|Formal spiritual initiation|satsang
Divyabhav|Seeing the divine qualities of God and the Satpurush|swaminarayan
Diwali|The Hindu festival of lights|festival
Draupadi|Wife of the Pandavs in the Mahabharat|hinduism
Durga|The powerful mother goddess|hinduism
Dussehra|Festival celebrating the victory of dharma|festival
Dvarika|Krishna's sacred coastal city in Gujarat|place
Ekadashi|A sacred fasting day on the eleventh lunar day|festival
Ekantik Dharma|Dharma, jnan, vairagya and bhakti together|swaminarayan
Fafda|Crispy Gujarati snack often eaten with jalebi|food
Gadhada|Town where many Vachnamrut discourses were delivered|place
Ganesh|The elephant-headed remover of obstacles|hinduism
Ganga|India's sacred river|place
Garbhagruh|The innermost shrine of a mandir|worship
Garud|The eagle-like vehicle of Vishnu|hinduism
Gayatri|A revered Vedic mantra|worship
Ghanthi|A knot, often referring to a spiritual resolve|gujarati
Ghanshyam|Childhood name of Bhagvan Swaminarayan|swaminarayan
Ghanta|A temple bell rung during worship|worship
Ghar Sabha|A regular spiritual assembly held at home|community
Ghee|Clarified butter used in food and rituals|food
Girnar|Sacred mountain in Gujarat|place
Geeta|Sacred dialogue between Shree Krishna Bhagvan and Arjun|scripture
Gnan|Spiritual knowledge|hinduism
Gokul|Village associated with Krishna's childhood|place
Golok|The divine abode associated with Krishna|place
Gondal|Gujarat town with a Swaminarayan mandir|place
Gopi|A devotee remembered for pure love of Krishna|hinduism
Gopuram|Monumental gateway of a Hindu temple|worship
Govardhan|The sacred hill lifted by Krishna|place
Govinda|A beloved name of Krishna|hinduism
Grahastha|A householder devotee, as distinct from a tyagi|hinduism
Gujarat|Western Indian state of Swaminarayan origins|place
Gunatit|Beyond the three gunas|swaminarayan
Gunatitanand|The first spiritual successor of Bhagvan Swaminarayan|swaminarayan
Guru|A spiritual teacher who dispels ignorance|satsang
Guru Bhakti|Devotion to the spiritual guru|swaminarayan
Guru Purnima|Festival honouring the spiritual teacher|festival
Gurukul|A traditional place of learning with a guru|community
Hanuman|Ram's devoted servant, known for strength and bhakti|hinduism
Hari|A beloved name of God|hinduism
Haribol|A joyful call to chant God's name|hinduism
Havan|A sacred fire ceremony|worship
Holi|Spring festival of colour|festival
Jagannath|A celebrated form of Krishna|hinduism
Jay|An exclamation of victory or praise|worship
Jalaram|Gujarati saint renowned for service and hospitality|gujarati
Jalebi|Spiral sweet often paired with fafda|food
Janmashtami|Festival celebrating Krishna's birth|festival
Japa|Repetition of a divine name or mantra|worship
Japmala|Rosary used for repeating God's name|worship
Jayanti|A sacred birth anniversary celebration|festival
Jetpur|Gujarat town linked with Swaminarayan history|place
Jeev|An individual eternal soul|hinduism
Jeevatma|The individual soul dwelling in the body|hinduism
Junagadh|Gujarat city near Girnar|place
Jyot|A sacred flame or lamp|worship
Kadhi|Yogurt-based Gujarati curry|food
Kailas|Sacred mountain abode associated with Shiv|place
Kalash|A sacred water vessel used in rituals|worship
Kali-Yug|The present age in the cycle of time|hinduism
Kanthi|Double-stranded necklace worn by Swaminarayan devotees|swaminarayan
Karma|Action and its moral consequence|hinduism
Karyakar|A volunteer worker in satsang|community
Katha|A spiritual discourse on scripture|satsang
Kedarnath|Himalayan pilgrimage shrine dedicated to Shiv|place
Khes|A shawl or wrap worn in Gujarati tradition|gujarati
Khichdi|Simple rice and lentil dish|food
Kirtan|A devotional hymn or song|worship
Kishore|A teenage boy in satsang|community
Kishori|A teenage girl in satsang|community
Krishna|The divine teacher of the Bhagavad Gita|hinduism
Krupa|Grace|value
Kumkum|Red powder used for auspicious forehead marks|worship
Kurukshetra|Field where the Bhagavad Gita was taught|place
Kutch|Region of Gujarat with deep Swaminarayan roots|place
Ladoo|A round Indian sweet commonly offered as prasad|food
Lakshmi|Goddess associated with prosperity|hinduism
Lassi|Sweet or salty yogurt drink|food
Leela|A divine act or sacred episode|hinduism
Loj|Village where Nilkanth Varni met Ramanand Swami|place
Mahabharat|Epic containing the Geeta|scripture
Mahadev|A revered name of Shiv meaning great God|hinduism
Mahant|A senior sadhu or spiritual leader|satsang
Mahapuja|An extended communal form of worship|worship
Maharaj|A respectful title for a spiritual leader|satsang
Mahashivratri|Festival night devoted to Shiv|festival
Mahila|A woman; also a satsang group for women|community
Mahima|Understanding divine glory and greatness|devotion
Makar Sankranti|Harvest festival also known as Uttarayan|festival
Mala|Rosary beads used for mantra repetition|worship
Mandal|A local satsang group or centre|community
Mandir|A Hindu temple|worship
Mantra|Sacred words repeated in prayer or meditation|worship
Mathura|Sacred birthplace of Krishna|place
Maya|That which causes attachment and spiritual ignorance|hinduism
Modak|Sweet traditionally offered to Ganesh|food
Moksh|Liberation from rebirth and maya|hinduism
Mridang|A double-headed drum used in devotional music|worship
Murti|A sacred image or embodied form of a deity|worship
Narayan|A name of the supreme Lord|hinduism
Nar-Narayan|The divine pair Maharaj installed at Amdavad|swaminarayan
Navratri|Nine-night festival honouring the divine mother|festival
Nilkanth|Youthful name of Bhagvan Swaminarayan during his travels|swaminarayan
Nishchay|Firm conviction in Bhagvan|devotion
Nitya Puja|Daily personal worship|worship
Niyam|A spiritual rule or daily observance|satsang
Omkar|The sacred sound Om|worship
Pagh|A traditional turban worn in Gujarat|gujarati
Palitana|Jain and Hindu pilgrimage town in Gujarat|place
Panchamrut|Fivefold sacred mixture used in abhishek|worship
Pandav|One of the five righteous brothers in the Mahabharat|hinduism
Parbrahm|The supreme God, Purushottam|swaminarayan
Paramatma|The supreme self or God|hinduism
Paramhans|A sadhu of the highest renounced order|swaminarayan
Parikrama|Walking reverently around a sacred object or shrine|worship
Parshad|An initiated renunciant dressed in white|swaminarayan
Pedha|A milk sweet often offered as prasad|food
Pradakshina|Clockwise circumambulation during worship|worship
Pragat|Manifest and present|swaminarayan
Pramukh|One who leads or presides|swaminarayan
Pramukh Swami|Fifth spiritual successor of Bhagvan Swaminarayan|swaminarayan
Prarthana|A heartfelt prayer|worship
Prasad|Food sanctified by offering it to God|worship
Prasadi|Something sanctified through association with God|swaminarayan
Prem|Selfless spiritual love|value
Puja|Ritual and personal worship|worship
Punya|Spiritual merit from righteous action|hinduism
Puri|Deep-fried flatbread|food
Purushottam|The supreme person, beyond all other realities|swaminarayan
Radha|Beloved devotee associated with Krishna|hinduism
Rajkot|Major Gujarat city with a large Swaminarayan presence|place
Raksha Bandhan|Festival celebrating a protective bond|festival
Ram|The righteous king and avatar celebrated in the Ramayan|hinduism
Ramanavami|Festival celebrating the birth of Bhagvan Ram|festival
Ramayan|Valmiki's epic recounting the life of Ram Bhagvan|scripture
Rangoli|Decorative floor art made for auspicious occasions|festival
Rushi|An inspired sage or seer|hinduism
Rotli|Soft Gujarati flatbread|food
Rudraksha|Sacred seed beads associated with Shiv|worship
Sabha|A spiritual assembly|community
Sadachar|Moral and disciplined conduct|value
Sadhak|An aspirant following a spiritual path|satsang
Sadhana|Disciplined spiritual practice|satsang
Sadhu|A holy renunciant|satsang
Sadhvi|A female renunciant|satsang
Saffron|Colour associated with renunciation and holiness|satsang
Samadhi|A state of deep spiritual absorption|hinduism
Samagam|Spiritual association with saints and devotees|satsang
Sampraday|A religious tradition or fellowship|community
Samsara|The cycle of worldly birth and death|hinduism
Sanchalak|A coordinator or organiser in satsang|community
Sankalp|A solemn spiritual resolve|worship
Sant|A saint or holy person|satsang
Sanstha|An organised religious fellowship|community
Sarangpur|Major Swaminarayan pilgrimage centre in Gujarat|place
Saraswati|Goddess associated with learning and the arts|hinduism
Sarovar|A sacred lake or reservoir|place
Satpurush|The God-realised saint who guides seekers|swaminarayan
Satsang|Holy fellowship and association with truth|swaminarayan
Satsangi|A member of the satsang fellowship|community
Satya|Truth|value
Sev|Crispy chickpea noodle snack|food
Seva|Selfless voluntary service|devotion
Sevak|One who serves|devotion
Shaak|Gujarati vegetable curry|food
Shakti|Divine power, often personified as the goddess|hinduism
Shangar|Adornment of a murti|worship
Shankh|A conch shell sounded during worship|worship
Shanti|Peace|value
Sharad Purnima|Autumn full-moon festival|festival
Shastra|A sacred or authoritative scripture|scripture
Shikhar|The towering spire of a mandir|worship
Shikshapatri|Bhagvan Swaminarayan's code of conduct|swaminarayan
Shirdi|Pilgrimage town associated with Sai Baba|place
Shiv|The deity associated with transformation|hinduism
Shivling|Sacred symbol worshipped as Shiv|worship
Shlok|A verse from a sacred scripture|scripture
Shraddha|Faith and reverence|devotion
Magshar|Winter month in which many Vachnamruts were spoken|festival
Shreeji Maharaj|A loving name for Bhagvan Swaminarayan|swaminarayan
Sinhasan|The throne or seat for a murti|worship
Sita|Ram's devoted consort in the Ramayan|hinduism
Somnath|Ancient jyotirlinga pilgrimage shrine in Gujarat|place
Sukhdi|Sweet Gujarati prasad made with wheat flour and ghee|food
Surya|The sun deity|hinduism
Svabhav|One's ingrained nature or habit|hinduism
Svadharma|Living according to one's righteous duty|hinduism
Swami|A title for a spiritual master or renunciant|satsang
Swaminarayan|Bhagvan Swaminarayan and his sacred mantra|swaminarayan
Svarup|Divine form or essential nature|hinduism
Swastik|Ancient auspicious Hindu symbol of wellbeing|worship
Tap|Religious austerity endured for Bhagvan|satsang
Tapasya|Spiritual austerity and disciplined effort|satsang
Tej|Divine radiance|hinduism
Thal|A plate of food offered to God with devotion|worship
Thepla|Spiced Gujarati flatbread|food
Tilak|The U-shaped sacred mark worn on the forehead|swaminarayan
Tilak Chandlo|The forehead marks worn by Swaminarayan devotees|swaminarayan
Tirth|A sacred pilgrimage place|place
Tithal|Coastal Swaminarayan pilgrimage place in Gujarat|place
Torana|Decorative gateway or auspicious door hanging|festival
Tridev|The divine triad of Brahma, Vishnu and Shiv|hinduism
Trishul|The trident associated with Shiv|hinduism
Tulsi|Holy basil revered in Hindu worship|worship
Undhiyu|Traditional Gujarati mixed-vegetable dish|food
Upanishad|A philosophical scripture of the Vedas|scripture
Upasana|The doctrine and practice of worship|swaminarayan
Utsav|A sacred celebration or festival|festival
Uttarayan|Gujarati kite festival marking the sun's northward path|festival
Vachnamrut|Principal collection of Bhagvan Swaminarayan's discourses|swaminarayan
Vadtal|Town where Lakshmi-Narayan was installed; a Vachnamrut prakaran of 20 verses|place
Vaikunth|The divine abode associated with Vishnu|place
Vairagya|Detachment from worldly pleasures|hinduism
Varanasi|Ancient sacred city on the Ganga|place
Vasant|The spring season|festival
Loya|Village prakaran of the Vachnamrut, with 18 verses|place
Vato|Spiritual talks or discourses|swaminarayan
Ved|Ancient revealed Hindu scripture|scripture
Veds|The four foundational revealed scriptures|scripture
Vishnu|The all-pervading preserver|hinduism
Vivek|Spiritual discrimination between right and wrong|value
Vrat|A religious vow or fast|worship
Vrundavan|Sacred place of Krishna's childhood leelas|place
Yagna|A sacred offering or sacrifice|worship
Yamuna|Sacred river associated with Krishna|place
Yashoda|Krishna's loving foster mother|hinduism
Yatra|A sacred pilgrimage journey|worship
Yog|A disciplined path toward spiritual union|hinduism
Yogi|One who practises yog and spiritual discipline|satsang
Yogiji Maharaj|Fourth spiritual successor of Bhagvan Swaminarayan|swaminarayan
Yug|A great age in the Hindu cycle of time|hinduism
Yuvak|A young man in satsang|community
Yuvati|A young woman in satsang|community
Aasan|A seat or posture used in worship and yoga|worship
Ambaji|Popular mother-goddess pilgrimage place in Gujarat|place
Ashtak|A set of eight verses in praise of God|scripture
Bhaktiyoga|The path of loving devotion|hinduism
Bhajanmandali|A group that sings bhajans together|community
Brahmanand|A celebrated poet-sant of the Swaminarayan tradition|swaminarayan
Chaitanya|Spiritual awareness or divine consciousness|hinduism
Chorasi|A traditional gathering or group of eighty-four|community
Dandvat|Full-body prostration before God or a murti|worship
Divo|A small oil lamp used in Gujarati homes and mandirs|gujarati
Gadi|The spiritual seat or throne of a tradition|satsang
Ghee lamp|A lamp fuelled by clarified butter for aarti|worship
Harijan|A loving servant of God|devotion
Harikrishna|A beloved name of Bhagvan Swaminarayan|swaminarayan
Jay Swaminarayan|The greeting used among Swaminarayan devotees|swaminarayan
Katha varta|Spiritual storytelling and discourse|satsang
Kirtankars|Devotees who lead kirtan singing|community
Mahaprasad|Food that has been offered and shared as blessing|worship
Manan|Quiet reflection on spiritual teaching|satsang
Mangal aarti|Early-morning aarti performed at the mandir|worship
Mukta|A liberated soul|hinduism
Mukti|Liberation|hinduism
Nitya|Eternal or daily|hinduism
Panchang|The Hindu calendar used for festivals and observances|hinduism
Prarthana sabha|A prayer assembly|community
Rajbhog|The midday food offering to God|worship
Ramanand Swami|Guru of Bhagvan Swaminarayan|swaminarayan
Sadhuta|The quality of saintliness|satsang
Sahajanand|A sacred name of Bhagvan Swaminarayan|swaminarayan
Sandhya aarti|Evening aarti performed at dusk|worship
Sant samagam|Gathering in the company of saints|satsang
Sarva|All or everything, as in all-pervading God|hinduism
Sharanagati|Complete surrender to God|devotion
Shayan aarti|Night-time aarti before resting the murti|worship
Shravan|Listening attentively to spiritual discourses|satsang
Siddhanta|Core doctrine of a spiritual tradition|satsang
Smruti|Sacred remembrance or remembered tradition|hinduism
Sneha|Affectionate spiritual love|value
Stotra|A hymn of praise|scripture
Thakorji|Affectionate name for the murti of God|swaminarayan
Tyag|Renunciation|hinduism
Tyagi|One who has renounced worldly life|satsang
Utsahi|An enthusiastic devotee|community
Vandan|Respectful salutation|worship
Vidya|Knowledge or learning|hinduism
Vishay|Worldly sense-object|hinduism
Vrutti|The mind's inclination, fixed on Bhagvan's murti|hinduism
Yagna kund|Fire pit used for a havan|worship
Yuva Mandal|Satsang group for young adults|community
""".strip()


# Terms taken from the English Vachnamrut published by Shree Swaminarayan
# Mandir Bhuj (swaminarayan.faith/scriptures/en/vachnamrut) and its chapter
# pages. Spellings follow that translation, minus its long-vowel diacritics,
# so the display form stays keyboard-friendly for the games.
VACHNAMRUT = """
Ahankar|The ego, one of the four antah-karans|hinduism
Akash|Space or ether, one of the five bhuts|hinduism
Amas|The no-moon day of the lunar month|festival
Amdavad|Gujarati name for Ahmedabad, where Nar-Narayan was installed|place
Antah-karan|The inner faculty of mind, buddhi, chitt and ahankar|hinduism
Antaryami|The all-knowing indweller of every heart|swaminarayan
Ashadh|Monsoon month of the Gujarati calendar|festival
Ashlali|Vachnamrut prakaran holding a single verse|place
Aso|Autumn month of the Gujarati calendar|festival
Atma-nishtha|Firm conviction that one is the atma, not the body|swaminarayan
Avgun|Fault-finding — seeing flaws in a sant or devotee|satsang
Badrikashram|Himalayan ashram of Nar-Narayan Dev|place
Bhadarva|The month in which Jal-jhilani and Ganesh Chaturthi fall|festival
Bharat-Khand|The land in which human birth and kalyan are possible|place
Brahm|The eternal, all-pervading abode and ideal devotee|swaminarayan
Brahm-Chari|A celibate attendant who serves the murti|satsang
Brahmand|One of the countless cosmic spheres of creation|hinduism
Bhugol Khugol|Vachnamrut chapter on the structure of the cosmos|scripture
Buddhi|The discerning intellect|hinduism
Chadar|The shawl Maharaj wore over His shoulders|swaminarayan
Chitt|The faculty that recollects and dwells on things|hinduism
Chofal|The patterned cloth Maharaj often wore|swaminarayan
Dada Khachar|The devotee of Gadhada in whose darbar Maharaj stayed|swaminarayan
Darbar|The residential courtyard where Maharaj held sabha|place
Das|A servant; the attitude of dasbhav towards Bhagvan|devotion
Desh|Place or country, one of the four influences on a person|satsang
Sang|The company one keeps, alongside desh, kal and kriya|satsang
Dham|A divine abode of Bhagvan|swaminarayan
Drashta|The seer, the atma that witnesses the body|hinduism
Durvasa|The rushi whose curse features in many katha episodes|hinduism
Ekantik|A devotee complete in dharma, gnan, vairagya and bhakti|swaminarayan
Fagan|The month in which Holi falls|festival
Gadhada Antya|The final Gadhada prakaran, of 39 verses|scripture
Gadhada Madhyam|The middle Gadhada prakaran, of 67 verses|scripture
Gadhada Pratham|The first Gadhada prakaran, of 78 verses|scripture
Gopalanand Swami|Senior sadhu who questions Maharaj in the Vachnamrut|swaminarayan
Gun|A quality or virtue, the opposite of avgun|satsang
Haribhakta|A devotee of Hari, gathered in Maharaj's sabha|community
Indriya|One of the ten senses of perception and action|hinduism
Irshya|Jealousy, named as an obstacle on the path|value
Ishvar|A being higher than the jeev but below Bhagvan|hinduism
Jagrat|The waking state, alongside svapna and sushupti|hinduism
Jetalpur|Vachnamrut prakaran of five verses|place
Kal|Time, one of the causes of creation and dissolution|hinduism
Kalyan|Ultimate liberation, the goal of the Vachnamrut|swaminarayan
Kam|Lust, the inner enemy Maharaj repeatedly warns against|value
Kariyani|Village prakaran of the Vachnamrut, with 12 verses|place
Kartik|The month in which Diwali and Annakut fall|festival
Krodh|Anger, an inner enemy to be eradicated|value
Lakshmi-Narayan|The divine pair installed at Vadtal|swaminarayan
Lok|A realm or world within the brahmand|hinduism
Mahatmya|The realised greatness of Bhagvan and His sant|devotion
Mayik|Anything belonging to or produced by maya|hinduism
Mogra|The fragrant flower used in Maharaj's garlands|worship
Mrutyu-Lok|The mortal realm in which humans are born|place
Muktanand Swami|The sadhu who asks the most questions in the Vachnamrut|swaminarayan
Mumukshu|One who genuinely longs for kalyan|satsang
Muni|A contemplative sadhu|satsang
Narad|The rushi-devotee famed for singing Bhagvan's glory|hinduism
Narak|The realms of suffering described in the shastras|place
Nididhyas|Deep, sustained contemplation of what has been heard|satsang
Nirakar|Formless, a view Maharaj corrects in Gadhada II 10|hinduism
Nirgun|Beyond the three guns of maya|hinduism
Nishkam|Free of lust, one of the panch-vartman|value
Nishkulanand Swami|Sadhu-poet who questions Maharaj in the Vachnamrut|swaminarayan
Nityanand Swami|Learned sadhu who questions Maharaj in the Vachnamrut|swaminarayan
Panchala|Village prakaran of the Vachnamrut, with six verses|place
Panch-vartman|The five vows kept by every satsangi|satsang
Panch-vishay|The five sense pleasures the indriyas chase|satsang
Partharo|Opening Vachnamrut chapter describing Maharaj's daily life|scripture
Pati-vrata|The devotion of a faithful wife, a model for bhakti|devotion
Posh|Winter month of the Gujarati calendar|festival
Pradhan-Purush|A cosmic principle from which brahmands arise|hinduism
Prakruti|The primordial cause of the material creation|hinduism
Prarabdha|The fruits of past karmas carried into this life|hinduism
Pratyaksha|Manifest before the eyes, the form of Bhagvan on earth|swaminarayan
Puran|One of the eighteen ancient narrative shastras|scripture
Purush|The cosmic person paired with Prakruti in creation|hinduism
Radhikaji|The consort of Shree Krishna Bhagvan|hinduism
Ramchandraji|Ram Bhagvan, whose faith the Ramayan praises|hinduism
Sachidanand|Existence, consciousness and bliss, a nature of Brahm|hinduism
Sakar|Possessing a divine form, as Bhagvan eternally is|swaminarayan
Samvat|The Vikram era year that dates every Vachnamrut|scripture
Sanakadik|The four eternally youthful rushi-brothers|hinduism
Sankhya|The philosophy of discriminating the atma from the body|hinduism
Sanskar|An impression left on the jeev by past actions|hinduism
Shreemad Bhagvat|Puran the Vachnamrut quotes on Bhagvan's true form|scripture
Shukji|The sage who narrated the Shreemad Bhagvat|hinduism
Shvet-Dvip|The white island, an abode of muktas|place
Siddh-dasha|The perfected state of a realised devotee|swaminarayan
Sud|The bright fortnight of the lunar month|festival
Survals|The loose trousers Maharaj is often described wearing|swaminarayan
Sushupti|The deep-sleep state|hinduism
Svapna|The dream state|hinduism
Tattva|One of the twenty-four elements of creation|hinduism
Uddhav|The devotee of Shree Krishna Bhagvan honoured in the shastras|hinduism
Upvas|A fast, especially on Ekadashi|worship
Vad|The dark fortnight of the lunar month|festival
Vaishakh|Summer month of the Gujarati calendar|festival
Varah|The boar avatar who lifted the earth|hinduism
Vartman|The vows a person accepts on entering satsang|satsang
Vasudev-Narayan|The form of Bhagvan worshipped with Sankhya understanding|swaminarayan
Vayu|Wind, one of the five bhuts|hinduism
Vedant|The philosophy of the Upanishads|scripture
Virat-Purush|The cosmic body from which the loks are formed|hinduism
Vyasji|The sage who compiled the Veds and Purans|hinduism
Yampuri|The city of Yam, where sinners are taken|place
Abhiman|Egotism, the pride that obstructs bhakti|value
Adhyatma|The realm of the self and its faculties|hinduism
Ashtang-Yog|The eight-limbed path of yog|hinduism
Astik|One who believes in Bhagvan and the shastras|satsang
Atma-Gnan|Knowledge of oneself as the atma, not the body|swaminarayan
Atyantik-Pralay|The final and total dissolution of creation|hinduism
Avidya|Ignorance that veils the jeev|hinduism
Bhagvat-Dharma|The dharma of loving devotion to Bhagvan|swaminarayan
Bokani|The cloth Maharaj tied around His head|swaminarayan
Brahm-Gnan|Realisation of Brahm|swaminarayan
Chidakash|The conscious space that is Brahm|hinduism
Chintamani|The wish-fulfilling jewel Bhagvan's murti is likened to|swaminarayan
Dattatrey|An avatar honoured as a teacher of detachment|hinduism
Dholka|Gujarat town named in the Vachnamrut|place
Dvapar-Yug|The age preceding Kali-Yug|hinduism
Gajara|A garland of flowers worn at the wrist|worship
Gnan-Indriya|One of the five senses of perception|hinduism
Gopinathji|The murti Maharaj installed at Gadhada|swaminarayan
Guldavadi|The chrysanthemum used in Maharaj's garlands|worship
Hanumanji|The devoted servant of Ram Bhagvan|hinduism
Hruday-Akash|The space within the heart where Bhagvan resides|hinduism
Jeeva Khachar|The Sarangpur devotee in whose darbar Maharaj held sabha|swaminarayan
Jhanjh|Hand cymbals played during kirtan|worship
Kam-Dev|The dev of desire, conquered by a true tyagi|hinduism
Kashi|Ancient city of pilgrimage on the Ganga|place
Kinkhab|The brocade Maharaj is described wearing|swaminarayan
Loka-Lok|The mountain ringing the edge of the brahmand|place
Maha-Bhut|One of the five gross elements|hinduism
Maha-Maya|The great maya from which creation unfolds|hinduism
Mansi|Worship offered mentally, within the mind|worship
Nadi|A channel of the subtle body|hinduism
Naimisharanya|The forest where the Purans were narrated|place
Nastik|One who denies Bhagvan and the shastras|satsang
Pakhvaj|The two-headed drum played during kirtan|worship
Paramanand Swami|Sadhu-poet present in the Vachnamrut sabhas|swaminarayan
Parvati|The consort of Shiv|hinduism
Patal|The nether realms below the earth|place
Patit-Pavan|Purifier of the fallen, a name of Bhagvan|devotion
Piplana|Village named in the Vachnamrut|place
Prahlad|The child bhakta protected by Nrusinh|hinduism
Prakrut-Pralay|The dissolution of prakruti's creation|hinduism
Pranayam|Regulation of the breath in yog|hinduism
Prayshchit|Atonement prescribed for a lapse in vartman|satsang
Premanand Swami|Sadhu-poet celebrated for his kirtans|swaminarayan
Rajai|The quilt Maharaj is described resting on|swaminarayan
Rajasi|Of the quality of rajas, restless and passionate|hinduism
Ramanuj|The acharya of the Vishishtadvait tradition|hinduism
Ras-Leela|Shree Krishna Bhagvan's divine dance with the gopis|hinduism
Sahajanandji|The reverent form of Maharaj's sadhu name|swaminarayan
Sakshatkar|Direct vision of Bhagvan|devotion
Sandhya|The junction of day and night kept for worship|worship
Sattvik|Of the quality of sattva, pure and calm|hinduism
Shaligram|The sacred stone worshipped as Bhagvan|worship
Shankar-Acharya|The acharya of the Advait tradition|hinduism
Shivanand Swami|A sadhu who questions Maharaj in the Vachnamrut|swaminarayan
Sitaji|The consort of Ram Bhagvan|hinduism
Sthavar|Immovable, as trees and mountains are|hinduism
Sushumna|The central channel of the subtle body|hinduism
Sutratma|The thread-soul pervading the brahmand|hinduism
Svad|Taste, the sense pleasure of the tongue|satsang
Svayamprakashanand|A learned sadhu of the Vachnamrut sabhas|swaminarayan
Tamasi|Of the quality of tamas, dull and inert|hinduism
Treta-Yug|The age of Ram Bhagvan|hinduism
Trushna|Craving that keeps the jeev bound|value
Tulsidas|The poet-saint of the Ram tradition|hinduism
Vadodara|Gujarat city near Atladra|place
Vadvanal|The submarine fire burning in the ocean|hinduism
Valmiki|The rushi who composed the Ramayan|hinduism
Vaman|The dwarf avatar of Vishnu|hinduism
Vardan|A boon granted by Bhagvan or a dev|hinduism
Vasna|Deep-seated worldly desire|value
Yagnavalkya|The rushi of the Upanishads|hinduism
Yam-Raj|The dev who judges the departed|hinduism
"""


# Terms taken from Shreemad Satsangi Jeevan on the same site
# (swaminarayan.faith/scriptures/en/satsangi-jeevan). That translation uses a
# Sanskrit-leaning transliteration (Vedas, Yoga, Shiva, Dwarika); where it and
# the Vachnamrut disagree the Vachnamrut wins, so these are normalised to the
# house style above and cover names, places and observances the Vachnamrut
# does not carry.
SATSANGI_JEEVAN = """
Agnihotra|The daily fire offering kept by brahmins|worship
Ambarish|The king whose vrat and bhakti the shastras praise|hinduism
Annakut|The mountain of food offered to Bhagvan after Diwali|festival
Arghya|Water offered in respect during worship|worship
Ashtami|The eighth tithi, on which Janmashtami falls|festival
Ayodhyaprasad|The acharya Maharaj appointed to the Amdavad gadi|swaminarayan
Bhakti-Mata|The mother of Bhagvan Swaminarayan|swaminarayan
Brahmin|The varna devoted to study and ritual|community
Chandrayan|A vrat whose food reduces and grows with the moon|worship
Danda|The staff carried by a brahmchari or sanyasi|satsang
Darbha|The sacred grass used in ritual worship|worship
Dashami|The tenth tithi, kept before Ekadashi|festival
Devsharma|A brahmin whose story is told in the Satsangi Jeevan|scripture
Dharma-Dev|The father of Bhagvan Swaminarayan|swaminarayan
Durgapur|The other name of Gadhada, King Uttam's town|place
Dvadashi|The twelfth tithi, on which an Ekadashi fast is broken|festival
Gomati|The sacred river at Dvarika|place
Gulal|The coloured powder thrown at Holi|festival
Hemantsinh|A king whose story is told in the Satsangi Jeevan|scripture
Ichharam|A younger brother of Bhagvan Swaminarayan|swaminarayan
Khatvang|The king who won kalyan in a single muhurt|hinduism
Krucchra|A rigorous vrat of restricted food|worship
Kush|The sacred grass used with darbha in worship|worship
Lojpur|The village of Loj, where Nilkanth met Muktanand Swami|place
Mahadiksha|The great initiation into the renounced order|satsang
Mandap|The canopy raised for a yagna or wedding|worship
Mukundanand|A brahmchari named among Maharaj's followers|swaminarayan
Naivedya|Food consecrated by offering it to Bhagvan|worship
Narayan Muni|A name for Maharaj as the young ascetic|swaminarayan
Navami|The ninth tithi, on which Ramnavami falls|festival
Nirvikalp|Doubt-free — the highest samadhi and nishchay|swaminarayan
Nrusinh|The man-lion avatar who protected Prahlad|hinduism
Parana|Breaking a fast at the prescribed time|worship
Pavitra|The ring of grass worn during ritual worship|worship
Prabodhini|The Ekadashi that ends Chaturmas|festival
Prakaran|A section of a scripture, as in the Vachnamrut|scripture
Premavati|A devotee whose story is told in the Satsangi Jeevan|scripture
Pundra|The upright tilak mark worn on the forehead|worship
Purascharan|A sustained repetition of a mantra as a vow|worship
Raghuvirji|The acharya Maharaj appointed to the Vadtal gadi|swaminarayan
Ramapratap|The elder brother of Bhagvan Swaminarayan|swaminarayan
Sanyasi|One who has taken the fourth and final ashram|satsang
Saptami|The seventh tithi of the lunar fortnight|festival
Sarayu|The river at Ayodhya|place
Sarvatobhadra|The auspicious diagram drawn for a yagna|worship
Satsangi Jeevan|Shatanand Swami's scripture on Maharaj's life|scripture
Shatanand|The sadhu Maharaj asked to write the Satsangi Jeevan|swaminarayan
Shudra|The varna devoted to service|community
Sura Khachar|The Loya devotee and brother of Dada Khachar|swaminarayan
Suvrat|The muni who narrates the Satsangi Jeevan|scripture
Tarpan|Water offered to the devs and ancestors|worship
Tithi|A lunar day of the Gujarati calendar|festival
Uttam|The king of Durgapur, honoured as Dada Khachar|swaminarayan
Vanprasth|The forest-dweller stage of life|hinduism
Varna|One of the four orders of traditional society|community
Varni|A young brahmchari under vows|satsang
"""


def answer_for(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Za-z]", "", ascii_value).upper()


def game_flags(answer: str) -> list[str]:
    games = []
    if len(answer) == 5:
        games.append("wordle")
    if 3 <= len(answer) <= 15:
        games.append("crossword")
    return games


def add_entry(
    rows: list[dict],
    seen: set[str],
    display: str,
    clue: str,
    category: str,
    source: str,
) -> None:
    answer = answer_for(display)
    clue = re.sub(r"\s+", " ", clue).strip().rstrip(".")
    if len(answer) < 3 or len(answer) > 24 or not clue:
        return
    if answer in seen:
        return
    seen.add(answer)
    rows.append(
        {
            "id": f"word-{len(rows) + 1:04d}",
            "answer": answer,
            "display": re.sub(r"\s+", " ", display).strip(),
            "clue": clue,
            "category": category,
            "source": source,
            "games": game_flags(answer),
        }
    )


def main() -> None:
    rows: list[dict] = []
    seen: set[str] = set()

    for line in CURATED.splitlines():
        display, clue, category = line.split("|", 2)
        add_entry(rows, seen, display, clue, category, "Bhaktiras curated")

    for line in VACHNAMRUT.splitlines():
        if not line.strip():
            continue
        display, clue, category = line.split("|", 2)
        add_entry(rows, seen, display, clue, category, "Vachnamrut (Bhuj edition)")

    for line in SATSANGI_JEEVAN.splitlines():
        if not line.strip():
            continue
        display, clue, category = line.split("|", 2)
        add_entry(rows, seen, display, clue, category, "Satsangi Jeevan (Bhuj edition)")

    for index, row in enumerate(rows, 1):
        row["id"] = f"word-{index:04d}"

    OUTPUT.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    unique_answers = len({row["answer"] for row in rows})
    by_game = {
        game: sum(1 for row in rows if game in row["games"])
        for game in ("wordle", "crossword")
    }
    print(f"Wrote {len(rows)} entries ({unique_answers} unique answers) to {OUTPUT}")
    print(f"Game coverage: {by_game}")


if __name__ == "__main__":
    main()
