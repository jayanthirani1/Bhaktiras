import type { OnePercentQuestion } from '~/types'

/** Rungs on every daily climb — easy (high %) → hard (1%). */
export const ONE_PERCENT_RUNGS = [90, 80, 70, 50, 20, 10, 5, 1] as const

export interface OnePercentPack {
  id: string
  section: string
  sectionLabel: string
  title: string
  questions: OnePercentQuestion[]
}

type PackItem = [question: string, options: string[], correctAnswer: string, source: string]

function makePack(
  id: string,
  section: string,
  sectionLabel: string,
  title: string,
  items: PackItem[]
): OnePercentPack {
  const questions = items.slice(0, ONE_PERCENT_RUNGS.length).map((item, index) => {
    const [question, options, correctAnswer, source] = item
    return {
      id: `${id}-r${ONE_PERCENT_RUNGS[index]}`,
      percent: ONE_PERCENT_RUNGS[index],
      question,
      options,
      correctAnswer,
      source,
      section,
      packId: id,
      order: index + 1
    } satisfies OnePercentQuestion
  })
  return { id, section, sectionLabel, title, questions }
}

/**
 * Daily 1% Club ladders drawn from the English Vachanamrut published by
 * Shree Swaminarayan Mandir Bhuj (authenticated Bhuj edition).
 * A few packs per prakaran so the climb refreshes each UK day.
 */
export const VACHANAMRUT_ONE_PERCENT_PACKS: OnePercentPack[] = [
  makePack('partharo', 'partharo', 'Partharo', 'Before the sabhas', [
    ['What does the word “Vachanamrut” mean?', ['A festival calendar', 'Nectar in the form of words', 'A type of aarti', 'A mandir rulebook'], 'Nectar in the form of words', 'Introduction'],
    ['The Bhuj edition says the Vachanamrut gathers how many sabhas?', ['108', '151', '273', '501'], '273', 'Introduction'],
    ['The talks were delivered in Vikram Samvat years…', ['1876 to 1886', '1900 to 1910', '1760 to 1770', '2000 to 2010'], '1876 to 1886', 'Introduction'],
    ['The Vachanamrut is described as a shastra of…', ['Agna only', 'Upasana', 'Cooking', 'Temple accounts'], 'Upasana', 'Introduction'],
    ['Which shastra is called the shastra of agna alongside it?', ['Bhagavad Gita only', 'Ramayan only', 'Shikshapatri', 'Panchatantra'], 'Shikshapatri', 'Introduction'],
    ['Partharo, which comes before the numbered sabhas, mainly describes…', ['Temple building costs', 'Maharaj’s daily life, appearance and association with bhaktas', 'Only the Shikshapatri vows', 'A list of mandir towns in England'], 'Maharaj’s daily life, appearance and association with bhaktas', 'Partharo'],
    ['In Partharo, Akshardham is also called…', ['Kutch only', 'Brahmpur / Parampad', 'Vadtal sabha hall', 'A kitchen store'], 'Brahmpur / Parampad', 'Partharo'],
    ['The English translation used here is from the authenticated edition published by…', ['A London newspaper', 'Shree Swaminarayan Mandir, Bhuj', 'A school textbook board', 'An anonymous blog'], 'Shree Swaminarayan Mandir, Bhuj', 'English preface']
  ]),

  makePack('gadhada-i-a', 'gadhada-i', 'Gadhada Pratham', 'Gadhada I · early sabhas', [
    ['Gadhada I sabhas were held in whose darbār?', ['Jiva Khachar’s', 'Dada Khachar’s', 'Joban Pagi’s only', 'A forest ashram in Badrikashram'], 'Dada Khachar’s', 'Gadhada I – 1'],
    ['Gadhada I – 1 is titled around constantly engaging the mind on…', ['Temple accounts', 'The svarup of Bhagvan', 'Cooking thal', 'A travel map of Kutch'], 'The svarup of Bhagvan', 'Gadhada I – 1'],
    ['Gadhada I – 2 discusses three levels of vairagya named…', ['Uttam, madhyam and kanishth', 'Gold, silver and bronze', 'Fast, slow and stop', 'Past, present and future'], 'Uttam, madhyam and kanishth', 'Gadhada I – 2'],
    ['Gadhada I – 3 emphasises remembering…', ['Only festival dates', 'The leelas of Bhagvan', 'A shopping list', 'English grammar'], 'The leelas of Bhagvan', 'Gadhada I – 3'],
    ['How many Vachanamruts are in Gadhada Pratham (Gadhada I)?', ['12', '18', '39', '78'], '78', 'Gadhada Pratham'],
    ['Gadhada I – 12 is concerned with…', ['Temple fundraising', 'Creation and destruction', 'A cricket score', 'Only the names of months'], 'Creation and destruction', 'Gadhada I – 12'],
    ['Gadhada I – 21 speaks of svadharma and two forms of…', ['Akshar', 'Kutch', 'A dhol', 'A train'], 'Akshar', 'Gadhada I – 21'],
    ['Gadhada I – 43 discusses how many types of mukti?', ['Two', 'Three', 'Four', 'Ten'], 'Four', 'Gadhada I – 43']
  ]),

  makePack('gadhada-i-b', 'gadhada-i', 'Gadhada Pratham', 'Gadhada I · later sabhas', [
    ['Gadhada I – 45 teaches that Bhagvan is sakar while the light is…', ['Nirakar', 'A lamp oil', 'Only a dream', 'A painting frame'], 'Nirakar', 'Gadhada I – 45'],
    ['Gadhada I – 48 warns of protection against how many types of kusangis?', ['Two', 'Four', 'Nine', 'Twelve'], 'Four', 'Gadhada I – 48'],
    ['Gadhada I – 63 is about perfect nishchay and…', ['The greatness of Bhagvan', 'Temple parking', 'A wedding menu', 'Only Gujarati grammar'], 'The greatness of Bhagvan', 'Gadhada I – 63'],
    ['Gadhada I – 71 states that Bhagvan incarnates with…', ['His Akshardham', 'A trading company', 'A school board', 'A mandir bank account'], 'His Akshardham', 'Gadhada I – 71'],
    ['Gadhada I – 73 is titled around conquering…', ['Lust', 'Hunger only', 'Sleep only', 'Rain'], 'Lust', 'Gadhada I – 73'],
    ['Gadhada I – 74 says satsang flourishes or declines by the wish of…', ['Nar-Narayan', 'A village panchayat', 'The British Raj', 'A cricket captain'], 'Nar-Narayan', 'Gadhada I – 74'],
    ['Gadhada I – 75 speaks of redeeming how many generations?', ['Seven', 'Twenty-one', 'Seventy-one', 'One hundred eight'], 'Seventy-one', 'Gadhada I – 75'],
    ['Gadhada I – 78 discusses the effect of desh, kal, kriya and…', ['Sang', 'Salt', 'Silk', 'Sand'], 'Sang', 'Gadhada I – 78']
  ]),

  makePack('sarangpur-a', 'sarangpur', 'Sarangpur', 'Sarangpur · conquering the mind', [
    ['Sarangpur sabhas were held in whose darbār?', ['Dada Khachar’s', 'Jiva Khachar’s', 'Joban Pagi’s only', 'A London hall'], 'Jiva Khachar’s', 'Sarangpur – 1'],
    ['How many Vachanamruts are in the Sarangpur prakaran?', ['7', '12', '18', '78'], '18', 'Sarangpur'],
    ['Sarangpur – 1 is titled…', ['Conquering the mind', 'Building a well', 'Writing a census', 'A travel diary'], 'Conquering the mind', 'Sarangpur – 1'],
    ['The panch-vishays include shabda, sparsh, rup, ras and…', ['Gandh', 'Gold', 'Grain', 'Ghee only'], 'Gandh', 'Sarangpur – 1'],
    ['Sarangpur – 1 says the mind is conquered when the indriyas withdraw from…', ['The panch-vishays', 'Temple seva', 'Kathas of Maharaj', 'Mala only'], 'The panch-vishays', 'Sarangpur – 1'],
    ['Besides atma-nishtha, Sarangpur – 1 says vishays are defeated by realising Bhagvan coupled with…', ['His greatness', 'A loud voice', 'Temple wealth', 'A long journey'], 'His greatness', 'Sarangpur – 1'],
    ['Sarangpur – 2 says lasting love develops due to the other person’s…', ['Qualities', 'Clothes only', 'Hometown only', 'Age only'], 'Qualities', 'Sarangpur – 2'],
    ['Sarangpur – 3 lists shravan, manan, nididhyas and sakshatkar, and also discusses…', ['Mansi puja', 'Temple accounts', 'A boat race', 'English spelling'], 'Mansi puja', 'Sarangpur – 3']
  ]),

  makePack('sarangpur-b', 'sarangpur', 'Sarangpur', 'Sarangpur · later sabhas', [
    ['Sarangpur – 4 distinguishes atma and…', ['Non-atma', 'A dhol', 'A village tax', 'A train ticket'], 'Non-atma', 'Sarangpur – 4'],
    ['Sarangpur – 5 teaches that worldly desires are defeated by…', ['Bhakti', 'Anger', 'Gossip', 'Sleep'], 'Bhakti', 'Sarangpur – 5'],
    ['Sarangpur – 7 mentions which kshetra?', ['Naimisharanya', 'Kutch only', 'London', 'Ayodhya market'], 'Naimisharanya', 'Sarangpur – 7'],
    ['Sarangpur – 10 is titled around dharma and…', ['Adharma', 'Agriculture', 'Astronomy only', 'Arithmetic'], 'Adharma', 'Sarangpur – 10'],
    ['Sarangpur – 11 emphasises…', ['Personal effort', 'Giving up all effort', 'Temple shopping', 'A holiday'], 'Personal effort', 'Sarangpur – 11'],
    ['Sarangpur – 16 recalls Nar-Narayan Dev’s tap in…', ['Badrikashram', 'Bhuj fort', 'Vadtal kitchen', 'A London park'], 'Badrikashram', 'Sarangpur – 16'],
    ['Sarangpur – 17 discusses differences among…', ['Muktas', 'Mangoes', 'Months of the year', 'Temple bricks'], 'Muktas', 'Sarangpur – 17'],
    ['The last Sarangpur Vachanamrut is titled…', ['Saline land', 'Golden land', 'Empty land', 'Forest land'], 'Saline land', 'Sarangpur – 18']
  ]),

  makePack('kariyani', 'kariyani', 'Kariyani', 'Kariyani prakaran', [
    ['How many Vachanamruts are in Kariyani?', ['6', '12', '18', '39'], '12', 'Kariyani'],
    ['Kariyani is one of the village prakarans because Maharaj delivered sabhas…', ['In Kariyani', 'Only in London', 'Only in Bhuj fort', 'Only after 1900'], 'In Kariyani', 'Introduction'],
    ['The Vachanamrut sections are arranged mainly by…', ['The village where the talk was delivered', 'Alphabetical English titles', 'Word count', 'The printer’s whim'], 'The village where the talk was delivered', 'Introduction'],
    ['Within a prakaran, individual Vachanamruts are numbered…', ['Chronologically', 'At random', 'By difficulty', 'By the number of pages'], 'Chronologically', 'Introduction'],
    ['Maharaj often taught in the form of a…', ['Question-and-answer sabha', 'Silent march only', 'Written exam only', 'Temple invoice'], 'Question-and-answer sabha', 'Introduction'],
    ['The five compiler sants include Muktanand Swami, Gopalanand Swami, Nityanand Swami, Brahmanand Swami and…', ['Shukanand Swami', 'A British officer', 'A village potter', 'A London editor'], 'Shukanand Swami', 'Introduction'],
    ['Kariyani sits in the Bhuj edition between Sarangpur and…', ['Loya', 'Partharo', 'Bhugol-Khugol', 'The glossary only'], 'Loya', 'Contents'],
    ['A person studying Kariyani should keep the mind on…', ['Swaminarayan Bhagvan Himself', 'Only the village map', 'Temple fundraising', 'English poetry'], 'Swaminarayan Bhagvan Himself', 'Preface']
  ]),

  makePack('loya-a', 'loya', 'Loya', 'Loya · early sabhas', [
    ['How many Vachanamruts are in the Loya prakaran?', ['7', '12', '18', '67'], '18', 'Loya'],
    ['Loya – 1 discusses anger and developing complete…', ['Satsang', 'Silence only', 'A census', 'A market stall'], 'Satsang', 'Loya – 1'],
    ['Loya – 2 lists faith, gnan, courage or…', ['Love', 'Gold', 'Speed', 'Height'], 'Love', 'Loya – 2'],
    ['Loya – 3 is about nishchay in Bhagvan and knowledge of His…', ['Greatness', 'Handwriting', 'Hometown only', 'Festival dates only'], 'Greatness', 'Loya – 3'],
    ['Loya – 4 warns about a person with…', ['Doubts', 'A loud dhol', 'A long mala only', 'A new pagh only'], 'Doubts', 'Loya – 4'],
    ['Loya – 5 is about controlling the indriyas and the…', ['Antahkarans', 'Temple bells', 'Village wells', 'Cart wheels'], 'Antahkarans', 'Loya – 5'],
    ['Loya – 6 speaks of purifying the company a person keeps and the difficulties of becoming…', ['An ekantik bhakta', 'A merchant', 'A soldier', 'A poet only'], 'An ekantik bhakta', 'Loya – 6'],
    ['Loya – 8 mentions hyperactive…', ['Indriyas', 'Clouds', 'Markets', 'Trains'], 'Indriyas', 'Loya – 8']
  ]),

  makePack('loya-b', 'loya', 'Loya', 'Loya · later sabhas', [
    ['Loya – 9 is about the development of dharma, gnan, vairagya and…', ['Bhakti', 'Business', 'Anger', 'Gossip'], 'Bhakti', 'Loya – 9'],
    ['Loya – 10 is titled remaining without…', ['Moh', 'Mala', 'Mandir', 'Milk'], 'Moh', 'Loya – 10'],
    ['Loya – 12 discusses savikalp and nirvikalp…', ['Nishchay', 'Navratri', 'Numbers', 'Newspapers'], 'Nishchay', 'Loya – 12'],
    ['Loya – 13 teaches not being overcome by…', ['Unpleasant circumstances', 'Temple seva', 'Kathas of Maharaj', 'Aarti'], 'Unpleasant circumstances', 'Loya – 13'],
    ['Loya – 14 records a personal preference of…', ['Shreeji Maharaj', 'A British collector', 'A village potter', 'A London editor'], 'Shreeji Maharaj', 'Loya – 14'],
    ['Loya – 15 is titled…', ['Atma-darshan', 'Temple-darshan only', 'River-darshan', 'Market-darshan'], 'Atma-darshan', 'Loya – 15'],
    ['Loya – 17 teaches not perceiving…', ['Avgun', 'Aarti', 'Akshar', 'Amrut'], 'Avgun', 'Loya – 17'],
    ['Loya – 18, the last of the prakaran, is about nishchay in…', ['Bhagvan', 'Bhuj fort only', 'A census', 'A ship'], 'Bhagvan', 'Loya – 18']
  ]),

  makePack('panchala', 'panchala', 'Panchala', 'Panchala prakaran', [
    ['In the Bhuj edition, Panchala follows which prakaran?', ['Loya', 'Partharo', 'Gadhada Antya', 'Jetalpur'], 'Loya', 'Contents'],
    ['Panchala – 1 is titled the happiness of…', ['Akshardham', 'A marketplace', 'A fortress', 'A library'], 'Akshardham', 'Panchala – 1'],
    ['Panchala – 2 discusses Sankhya and…', ['Yog', 'Yoga mats only', 'A tax', 'A river'], 'Yog', 'Panchala – 2'],
    ['Panchala – 3 says intelligence is instrumental in attaining kalyān, and that love is…', ['Maya', 'Mukti', 'Mala', 'Mandir'], 'Maya', 'Panchala – 3'],
    ['Panchala – 4 is about perceiving divinity in the human traits of…', ['Bhagvan', 'A merchant', 'A soldier', 'A printer'], 'Bhagvan', 'Panchala – 4'],
    ['Panchala – 5 contrasts pride and…', ['Humility', 'Hunger', 'Height', 'Harvest'], 'Humility', 'Panchala – 5'],
    ['Panchala – 6 teaches that those with firm upasana attain…', ['Kalyan', 'A title deed', 'A festival stall', 'A cricket trophy'], 'Kalyan', 'Panchala – 6'],
    ['Panchala – 7 uses the example of the “maya” of a…', ['Magician', 'Mason', 'Miller', 'Miner'], 'Magician', 'Panchala – 7']
  ]),

  makePack('gadhada-ii-a', 'gadhada-ii', 'Gadhada Madhya', 'Gadhada II · early sabhas', [
    ['How many Vachanamruts are in Gadhada Madhya (Gadhada II)?', ['18', '39', '67', '78'], '67', 'Gadhada Madhya'],
    ['Gadhada II – 1 is titled the elimination of…', ['Moh', 'Mala', 'Mandir', 'Milk'], 'Moh', 'Gadhada II – 1'],
    ['Gadhada II – 2 is about overcoming the…', ['Panch-vishays', 'Panch-pranas only', 'Five rivers of Kutch', 'Five temple gates'], 'Panch-vishays', 'Gadhada II – 2'],
    ['Gadhada II – 8 mentions Ekadashi, gnan-yagna and…', ['Antar-drashti', 'A boat race', 'A census', 'A market tax'], 'Antar-drashti', 'Gadhada II – 8'],
    ['Gadhada II – 9 says never insult the svarup of…', ['Bhagvan', 'A village well', 'A printed book', 'A cart'], 'Bhagvan', 'Gadhada II – 9'],
    ['Gadhada II – 22 recalls the installation of…', ['Nar-Narayan Dev', 'A British statue', 'A village well', 'A school bell'], 'Nar-Narayan Dev', 'Gadhada II – 22'],
    ['Gadhada II – 27 says mandirs are built for bhakti and…', ['Upasana', 'Trade only', 'Sport only', 'Tax only'], 'Upasana', 'Gadhada II – 27'],
    ['In Gadhada II – 28 Maharaj says He extracted the essence from the Vedas, shastras, Puranas and all words relating to…', ['Moksh', 'Markets', 'Medicine only', 'Mathematics only'], 'Moksh', 'Gadhada II – 28']
  ]),

  makePack('gadhada-ii-b', 'gadhada-ii', 'Gadhada Madhya', 'Gadhada II · later sabhas', [
    ['Gadhada II – 31 lists jeev, ishvar, maya, Brahm and…', ['Parbrahm', 'Panchayat', 'Prasad only', 'Paper'], 'Parbrahm', 'Gadhada II – 31'],
    ['Those five are taught as distinct tattvas in…', ['Gadhada II – 31', 'Partharo only', 'Sarangpur – 18 only', 'The Shikshapatri index'], 'Gadhada II – 31', 'Gadhada II – 31'],
    ['Gadhada II – 32 is about detaching from…', ['The body', 'The mandir', 'The mala', 'The aarti'], 'The body', 'Gadhada II – 32'],
    ['Gadhada II – 33 discusses the vow of…', ['Nishkam', 'Navratri only', 'A new name', 'A night fast only'], 'Nishkam', 'Gadhada II – 33'],
    ['Gadhada II – 35 teaches that upasana is required to attain…', ['Kalyan', 'A plot of land', 'A festival stall', 'A title'], 'Kalyan', 'Gadhada II – 35'],
    ['Gadhada II – 38 mentions Mancha bhakta and…', ['The alchemist', 'The astronomer', 'The athlete', 'The auctioneer'], 'The alchemist', 'Gadhada II – 38'],
    ['Gadhada II – 18 discusses nastik and…', ['Shushka-vedanti', 'Shikshapatri only', 'Shabda only', 'Shankh only'], 'Shushka-vedanti', 'Gadhada II – 18'],
    ['Gadhada II – 13 speaks of the svarup within the…', ['Divine light', 'Kitchen fire only', 'Village lamp oil', 'A printing press'], 'Divine light', 'Gadhada II – 13']
  ]),

  makePack('vadtal', 'vadtal', 'Vadtal', 'Vadtal prakaran', [
    ['How many Vachanamruts are in Vadtal in the Bhuj edition?', ['8', '12', '20', '67'], '20', 'Vadtal'],
    ['Vadtal is included because Maharaj delivered sabhas there, just as in Gadhada and…', ['Sarangpur', 'Paris', 'Delhi only', 'Ayodhya market'], 'Sarangpur', 'Introduction'],
    ['The Shikshapatri is the companion shastra of agna; many associate its giving with…', ['Vadtal', 'London', 'Kashi only', 'A printing house in 2010'], 'Vadtal', 'Tradition / Vadtal'],
    ['Serving a bhakta as a way of pleasing Bhagvan is taught in…', ['Gadhada II – 28', 'A cricket rulebook', 'A census form', 'A train timetable'], 'Gadhada II – 28', 'Gadhada II – 28'],
    ['Maharaj often sat in a sabha of munis and haribhaktas from…', ['Various places', 'Only one family', 'Only England', 'Only the printer’s staff'], 'Various places', 'Opening paragraphs'],
    ['Each Vachanamrut usually begins with the date, place, Maharaj’s dress and…', ['The gathered sabha', 'A shopping list', 'A tax receipt', 'A cricket score'], 'The gathered sabha', 'Preface'],
    ['Those opening details help a reader imagine themselves…', ['Sitting in His sabha', 'Running a shop', 'Writing English verse', 'Building a railway'], 'Sitting in His sabha', 'Preface'],
    ['Maharaj says in Gadhada III – 39 that He speaks in accordance with what He…', ['Practices', 'Imagines only', 'Reads in newspapers', 'Hears in the market'], 'Practices', 'Gadhada III – 39']
  ]),

  makePack('gadhada-iii', 'gadhada-iii', 'Gadhada Antya', 'Gadhada III (Antya)', [
    ['How many Vachanamruts are in Gadhada Antya (Gadhada III)?', ['18', '20', '39', '78'], '39', 'Gadhada Antya'],
    ['Gadhada Antya is the last Gadhada prakaran in the Bhuj edition contents, listed as…', ['Antya', 'Pratham only', 'Madhya only', 'Partharo'], 'Antya', 'Contents'],
    ['In Gadhada III – 39 Maharaj says He has delivered these talks not from imagination, nor to display skill, but because He has…', ['Experienced all that He has spoken about', 'Copied a newspaper', 'Guessed the answers', 'Asked a printer to invent them'], 'Experienced all that He has spoken about', 'Gadhada III – 39'],
    ['He adds that He speaks in accordance to what He…', ['Practices', 'Postpones', 'Forgets', 'Sells'], 'Practices', 'Gadhada III – 39'],
    ['The Vachanamrut is not meant to be read once like fiction, but…', ['Lived with and read over and over', 'Used only as a doorstop', 'Kept unopened', 'Read only on Diwali'], 'Lived with and read over and over', 'Preface'],
    ['True knowledge of the Vachanamrut is revealed by the grace of…', ['Swaminarayan Bhagvan', 'A school examiner', 'A newspaper editor', 'A village accountant'], 'Swaminarayan Bhagvan', 'Preface'],
    ['Like amrut, the words of Bhagvan grant freedom from the cycle of…', ['Births and deaths', 'Temple seva', 'Festival dates', 'English exams'], 'Births and deaths', 'Preface'],
    ['The last numbered Gadhada I Vachanamrut is number…', ['18', '39', '67', '78'], '78', 'Gadhada I colophon']
  ]),

  makePack('ahmedabad-jetalpur', 'ahmedabad', 'Ahmedabad · Ashlali · Jetalpur', 'Bhuj edition extra prakarans', [
    ['The Bhuj edition contents include an Ahmedabad prakaran of how many Vachanamruts?', ['1', '5', '8', '78'], '8', 'Contents'],
    ['Ashlali appears in the Bhuj edition with how many Vachanamruts?', ['1', '12', '18', '39'], '1', 'Contents'],
    ['Jetalpur appears in the Bhuj edition with how many Vachanamruts?', ['1', '5', '20', '67'], '5', 'Contents'],
    ['These extra prakarans are part of the authenticated edition published from…', ['Bhuj', 'Paris', 'New York', 'Ayodhya market'], 'Bhuj', 'Title page'],
    ['Gadhada II – 22 recalls Maharaj installing Nar-Narayan Dev in…', ['Amdavad (Ahmedabad)', 'London', 'Kashi only', 'A forest without a mandir'], 'Amdavad (Ahmedabad)', 'Gadhada II – 22'],
    ['After that installation, Maharaj spent a night in…', ['Jetalpur', 'Paris', 'Bhuj fort only', 'A London hotel'], 'Jetalpur', 'Gadhada II – 22'],
    ['Bhugol-Khugol appears in the Bhuj edition contents as how many items?', ['1', '12', '78', '273'], '1', 'Contents'],
    ['Together, the Bhuj edition arranges the talks into sections based on…', ['Villages where they were delivered', 'The printer’s favourite colours', 'English alphabetical order only', 'Modern train lines'], 'Villages where they were delivered', 'Introduction']
  ])
]

export function hashDateId(dateId: string): number {
  return [...dateId].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 2166136261)
}

export function onePercentPackForDate(dateId: string): OnePercentPack {
  const packs = VACHANAMRUT_ONE_PERCENT_PACKS
  return packs[hashDateId(dateId) % packs.length]
}

export function allOnePercentQuestions(): OnePercentQuestion[] {
  return VACHANAMRUT_ONE_PERCENT_PACKS.flatMap(pack => pack.questions)
}

/** @deprecated Use onePercentPackForDate — kept so admin import still has a default list. */
export const DEFAULT_ONE_PERCENT: OnePercentQuestion[] = allOnePercentQuestions()

function seededShuffle<T>(items: T[], seed: number): T[] {
  const next = [...items]
  let s = seed || 1
  for (let i = next.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647
    const j = s % (i + 1)
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
  }
  return next
}

export function withShuffledOptions(question: OnePercentQuestion, dateId: string): OnePercentQuestion {
  return {
    ...question,
    options: seededShuffle(question.options, hashDateId(`${dateId}:${question.id}`))
  }
}
